"""Tiny MLP: hashed-BoW text embedding -> painter params.

Pure numpy — no torch required. Trains on train/data.jsonl (from build_dataset_coco.py).
Saves train/adapter.npz + train/adapter_meta.json.

Usage:
  python3 train/train.py               # default settings
  python3 train/train.py --epochs 800 --lr 0.03
  python3 train/train.py predict "stormy ocean at night"
"""
from __future__ import annotations
import argparse
import json
import os
import re
import sys
import time
import warnings
import numpy as np

# Suppress overflow/divide warnings that can fire during early Adam steps;
# the float64 forward/backward path is numerically stable but numpy still
# emits RuntimeWarnings on intermediate exp() / log() calls.
np.seterr(over="ignore", divide="ignore", invalid="ignore")
warnings.filterwarnings("ignore", category=RuntimeWarning, module="train")

DIM_EMB = 512
DIM_HID1 = 256
DIM_HID2 = 128
# Output layout:
#  [0:15]  palette 5×RGB  / 255          (15 dims)
#  [15]    noise_scale / 20              (1 dim)
#  [16]    grain / 0.2                   (1 dim)
#  [17:20] composition one-hot 3-way     (3 dims)
#  [20]    accent_count / 12             (1 dim)
DIM_OUT = 21
COMP = ["centered", "rule-of-thirds", "diagonal"]


# ── embedding ───────────────────────────────────────────────────────────────

# Prime-based double-hashing for fewer collisions
_PRIMES = [1000003, 999983]

def embed(text: str) -> np.ndarray:
    v = np.zeros(DIM_EMB, dtype=np.float32)
    toks = re.findall(r"[a-zA-Z']+", text.lower())
    for t in toks:
        for p in _PRIMES:
            v[hash(t) % DIM_EMB] += 1.0
            v[(hash(t) * p) % DIM_EMB] += 0.5
    # bigrams
    for a, b in zip(toks, toks[1:]):
        v[hash(a + "_" + b) % DIM_EMB] += 1.5
    n = np.linalg.norm(v) + 1e-6
    return v / n


# ── target encoding ─────────────────────────────────────────────────────────

def params_to_vec(p: dict) -> np.ndarray:
    v = np.zeros(DIM_OUT, dtype=np.float32)
    pal = np.array(p["palette"], dtype=np.float32).reshape(-1)
    v[:15] = pal[:15] / 255.0
    v[15] = float(p["noise_scale"]) / 20.0
    v[16] = float(p["grain"]) / 0.2
    comp = p.get("composition", "centered")
    if comp in COMP:
        v[17 + COMP.index(comp)] = 1.0
    v[20] = float(p.get("accent_count", 6)) / 12.0
    return np.clip(v, 0, 1)


def vec_to_params(v: np.ndarray) -> dict:
    v = np.clip(v, 0, 1)
    pal = (v[:15] * 255).astype(int).reshape(5, 3).tolist()
    comp = COMP[int(np.argmax(v[17:20]))]
    return {
        "palette": [tuple(int(x) for x in c) for c in pal],
        "noise_scale": float(v[15] * 20),
        "grain": float(v[16] * 0.2),
        "composition": comp,
        "accent_count": int(round(float(v[20] * 12))),
    }


# ── data ─────────────────────────────────────────────────────────────────────

def load_dataset(path: str) -> tuple[np.ndarray, np.ndarray]:
    X, Y = [], []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
                X.append(embed(rec["prompt"]))
                Y.append(params_to_vec(rec["params"]))
            except Exception:
                continue
    if not X:
        raise RuntimeError(f"No usable rows in {path}")
    return np.stack(X), np.stack(Y)


# ── model ─────────────────────────────────────────────────────────────────────

def init_weights(rng, fan_in, fan_out):
    """He init for ReLU layers."""
    scale = np.sqrt(2.0 / fan_in)
    return rng.normal(0, scale, (fan_in, fan_out)).astype(np.float32)


class MLP:
    def __init__(self, seed: int = 0):
        rng = np.random.default_rng(seed)
        self.W1 = init_weights(rng, DIM_EMB, DIM_HID1)
        self.b1 = np.zeros(DIM_HID1, np.float32)
        self.W2 = init_weights(rng, DIM_HID1, DIM_HID2)
        self.b2 = np.zeros(DIM_HID2, np.float32)
        self.W3 = init_weights(rng, DIM_HID2, DIM_OUT) * 0.1
        self.b3 = np.full(DIM_OUT, 0.5, np.float32)  # init near 0.5

    def forward(self, x):
        x = x.astype(np.float64)
        z1 = x @ self.W1.astype(np.float64) + self.b1;  h1 = np.maximum(0, z1)
        z2 = h1 @ self.W2.astype(np.float64) + self.b2; h2 = np.maximum(0, z2)
        z3 = h2 @ self.W3.astype(np.float64) + self.b3
        z3 = np.clip(z3, -30, 30)
        y  = (1.0 / (1.0 + np.exp(-z3))).astype(np.float32)
        return y, (z1.astype(np.float32), h1.astype(np.float32),
                   z2.astype(np.float32), h2.astype(np.float32))

    def backward(self, x, y_hat, y_true, cache):
        z1, h1, z2, h2 = cache
        n = len(x)
        # Use float64 throughout backward to avoid overflow
        x = x.astype(np.float64); h1 = h1.astype(np.float64)
        h2 = h2.astype(np.float64); z1 = z1.astype(np.float64); z2 = z2.astype(np.float64)
        y_hat = y_hat.astype(np.float64); y_true = y_true.astype(np.float64)
        dz3 = (y_hat - y_true) / n
        dW3 = h2.T @ dz3; db3 = dz3.sum(0)
        dh2 = dz3 @ self.W3.T.astype(np.float64)
        dz2 = dh2 * (z2 > 0)
        dW2 = h1.T @ dz2; db2 = dz2.sum(0)
        dh1 = dz2 @ self.W2.T.astype(np.float64)
        dz1 = dh1 * (z1 > 0)
        dW1 = x.T @ dz1; db1 = dz1.sum(0)
        grads = {"W1": dW1,"b1": db1,"W2": dW2,"b2": db2,"W3": dW3,"b3": db3}
        # Gradient clipping
        for k in grads:
            grads[k] = np.clip(grads[k], -1.0, 1.0).astype(np.float32)
        return grads

    def save(self, path: str):
        np.savez(path, W1=self.W1, b1=self.b1, W2=self.W2, b2=self.b2, W3=self.W3, b3=self.b3)

    @classmethod
    def load(cls, path: str) -> "MLP":
        m = cls.__new__(cls)
        w = np.load(path)
        m.W1, m.b1 = w["W1"], w["b1"]
        m.W2, m.b2 = w["W2"], w["b2"]
        m.W3, m.b3 = w["W3"], w["b3"]
        return m


# ── adam ─────────────────────────────────────────────────────────────────────

class Adam:
    def __init__(self, params, lr=1e-3, b1=0.9, b2=0.999, eps=1e-8, wd=1e-4):
        self.lr = lr; self.b1 = b1; self.b2 = b2; self.eps = eps; self.wd = wd
        self.ms = {k: np.zeros_like(v) for k, v in params.items()}
        self.vs = {k: np.zeros_like(v) for k, v in params.items()}
        self.t = 0
        self.params = params

    def step(self, grads):
        self.t += 1
        for k in self.params:
            g = grads[k].astype(np.float32) + self.wd * self.params[k]
            self.ms[k] = self.b1 * self.ms[k] + (1 - self.b1) * g
            self.vs[k] = self.b2 * self.vs[k] + (1 - self.b2) * g * g
            mh = self.ms[k] / (1 - self.b1 ** self.t)
            vh = self.vs[k] / (1 - self.b2 ** self.t)
            update = self.lr * mh / (np.sqrt(np.clip(vh, 0, None)) + self.eps)
            self.params[k] -= np.clip(update, -0.1, 0.1).astype(np.float32)

    def params_dict(self):
        return {k: getattr(self.model, k) for k in self.params}


def _model_params(m: MLP) -> dict:
    return {"W1": m.W1, "b1": m.b1, "W2": m.W2, "b2": m.b2, "W3": m.W3, "b3": m.b3}


# ── training loop ─────────────────────────────────────────────────────────────

def bce_loss(yhat, ytrue) -> float:
    eps = 1e-7
    return float(-np.mean(ytrue * np.log(yhat + eps) + (1 - ytrue) * np.log(1 - yhat + eps)))


def train(
    data_path: str = "train/data.jsonl",
    out_path: str = "train/adapter.npz",
    epochs: int = 600,
    lr: float = 3e-3,
    bs: int = 64,
    val_frac: float = 0.1,
    seed: int = 0,
    log_every: int = 50,
):
    t0 = time.time()
    X, Y = load_dataset(data_path)
    n = len(X)
    print(f"dataset: {n} examples  X={X.shape}  Y={Y.shape}")

    rng = np.random.default_rng(seed)
    idx = rng.permutation(n)
    split = max(1, int(n * val_frac))
    Xtr, Ytr = X[idx[split:]], Y[idx[split:]]
    Xv,  Yv  = X[idx[:split]], Y[idx[:split]]
    print(f"train={len(Xtr)} val={len(Xv)}")

    m = MLP(seed=seed)
    opt = Adam(_model_params(m), lr=lr)

    best_val = 1e9
    for ep in range(1, epochs + 1):
        perm = rng.permutation(len(Xtr))
        train_loss = 0.0
        for i in range(0, len(Xtr), bs):
            xb = Xtr[perm[i:i+bs]]; yb = Ytr[perm[i:i+bs]]
            yh, cache = m.forward(xb)
            train_loss += bce_loss(yh, yb) * len(xb)
            grads = m.backward(xb, yh, yb, cache)
            opt.step(grads)
        train_loss /= len(Xtr)

        if ep % log_every == 0 or ep == epochs:
            yv, _ = m.forward(Xv)
            val_loss = bce_loss(yv, Yv)
            # palette MSE in 0-255 space
            pal_mse = float(np.mean((yv[:, :15] - Yv[:, :15]) ** 2) * 255 ** 2)
            mark = " *" if val_loss < best_val else ""
            print(f"  ep {ep:4d}/{epochs}  train={train_loss:.4f}  val={val_loss:.4f}  palMSE={pal_mse:.1f}{mark}")
            if val_loss < best_val:
                best_val = val_loss
                m.save(out_path)

    elapsed = time.time() - t0
    meta = {
        "dim_emb": DIM_EMB, "dim_hid1": DIM_HID1, "dim_hid2": DIM_HID2, "dim_out": DIM_OUT,
        "composition_labels": COMP, "n_train": len(Xtr), "n_val": len(Xv),
        "best_val_loss": round(best_val, 6), "elapsed_s": round(elapsed, 1),
    }
    with open(out_path.replace(".npz", "_meta.json"), "w") as f:
        json.dump(meta, f, indent=2)
    print(f"\nBest val {best_val:.4f} — saved {out_path}  ({elapsed:.0f}s)")
    return meta


def predict(prompt: str, adapter_path: str = "train/adapter.npz") -> dict:
    m = MLP.load(adapter_path)
    x = embed(prompt)[None]
    y, _ = m.forward(x)
    return vec_to_params(y[0])


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", nargs="?", default="train", choices=["train", "predict"])
    ap.add_argument("prompt", nargs="?", default=None)
    ap.add_argument("--data", default="train/data.jsonl")
    ap.add_argument("--out", default="train/adapter.npz")
    ap.add_argument("--epochs", type=int, default=600)
    ap.add_argument("--lr", type=float, default=3e-3)
    ap.add_argument("--bs", type=int, default=64)
    ap.add_argument("--seed", type=int, default=0)
    a = ap.parse_args()

    if a.cmd == "predict":
        print(json.dumps(predict(a.prompt or "", a.out), indent=2))
    else:
        train(a.data, a.out, epochs=a.epochs, lr=a.lr, bs=a.bs, seed=a.seed)
