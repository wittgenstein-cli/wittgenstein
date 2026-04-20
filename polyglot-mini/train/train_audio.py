"""Ambient audio classifier: text prompt → (category, volume).

Pure numpy, no torch. Same hashed-BoW embedding as image adapter.
Trains in <5 seconds on CPU with keyword-seeded synthetic dataset.

Categories: silence, rain, wind, city, forest, electronic, white_noise

Usage:
  python3 train/train_audio.py           # train
  python3 train/train_audio.py predict "a quiet rainy office"
"""
from __future__ import annotations
import argparse
import json
import math
import os
import re
import sys
import warnings
import numpy as np

np.seterr(over="ignore", divide="ignore", invalid="ignore")
warnings.filterwarnings("ignore", category=RuntimeWarning, module="train")

DIM_EMB = 256
DIM_HID = 96
# Output: [0:7] category softmax logits, [7] volume in [0,1]
CATEGORIES = ["silence", "rain", "wind", "city", "forest", "electronic", "white_noise"]
DIM_OUT = len(CATEGORIES) + 1


# ── seed dataset ────────────────────────────────────────────────────────────

SEED_DATA: list[tuple[str, str, float]] = [
    # (prompt_fragment, category, volume)
    ("silent meditation empty room", "silence", 0.0),
    ("quiet library", "silence", 0.05),
    ("nothing ambient", "silence", 0.0),
    ("raining outside window", "rain", 0.5),
    ("heavy downpour storm", "rain", 0.7),
    ("soft drizzle patter rooftop", "rain", 0.35),
    ("rain on glass", "rain", 0.4),
    ("monsoon rainfall", "rain", 0.65),
    ("windy hilltop breeze", "wind", 0.45),
    ("gusty stormy wind howling", "wind", 0.65),
    ("gentle breeze outdoor", "wind", 0.3),
    ("open field wind", "wind", 0.4),
    ("city traffic downtown street", "city", 0.45),
    ("urban noise busy intersection", "city", 0.5),
    ("cafe coffee shop background", "city", 0.3),
    ("nighttime city ambience", "city", 0.35),
    ("busy market crowd noise", "city", 0.55),
    ("forest birds chirping trees", "forest", 0.4),
    ("woodland nature sounds", "forest", 0.4),
    ("morning birds jungle", "forest", 0.45),
    ("peaceful nature outdoor", "forest", 0.35),
    ("server room data center hum", "electronic", 0.4),
    ("electrical hum machinery buzz", "electronic", 0.45),
    ("industrial factory machines", "electronic", 0.55),
    ("lab equipment hospital", "electronic", 0.3),
    ("50hz power line hum", "electronic", 0.4),
    ("white noise sleep masking", "white_noise", 0.3),
    ("static background hiss", "white_noise", 0.2),
    ("neutral flat noise", "white_noise", 0.25),
    # Composite/mood prompts
    ("cozy reading nook rainy day", "rain", 0.3),
    ("focus work concentration", "white_noise", 0.2),
    ("outdoor hiking trail", "forest", 0.4),
    ("coffee meeting podcast studio", "city", 0.25),
    ("night ocean breeze", "wind", 0.4),
    ("tech startup office", "electronic", 0.25),
    ("zen garden peaceful", "silence", 0.02),
    ("thunderstorm heavy rain dark", "rain", 0.75),
    ("mountain summit windy", "wind", 0.6),
    ("train station busy commute", "city", 0.55),
    ("deep forest night", "forest", 0.45),
    ("power plant turbine", "electronic", 0.6),
]

# Augmentation: vary phrasing
_SUFFIXES = [
    "", " ambient", " background", " sound", " audio", " soundscape",
    " atmosphere", " environment", " noise",
]


def _build_dataset(seed: int = 0) -> tuple[list[str], list[str], list[float]]:
    rng = np.random.default_rng(seed)
    prompts, cats, vols = [], [], []
    for prompt, cat, vol in SEED_DATA:
        for suf in _SUFFIXES:
            # mild volume jitter
            v = float(np.clip(vol + rng.uniform(-0.08, 0.08), 0, 1))
            prompts.append(prompt + suf)
            cats.append(cat)
            vols.append(v)
    return prompts, cats, vols


# ── embedding ────────────────────────────────────────────────────────────────

def embed(text: str) -> np.ndarray:
    v = np.zeros(DIM_EMB, dtype=np.float32)
    toks = re.findall(r"[a-zA-Z']+", text.lower())
    for t in toks:
        v[hash(t) % DIM_EMB] += 1.0
        v[(hash(t) * 1000003) % DIM_EMB] += 0.5
    for a, b in zip(toks, toks[1:]):
        v[hash(a + "_" + b) % DIM_EMB] += 1.5
    n = np.linalg.norm(v) + 1e-6
    return v / n


def encode_target(cat: str, vol: float) -> np.ndarray:
    v = np.zeros(DIM_OUT, dtype=np.float32)
    if cat in CATEGORIES:
        v[CATEGORIES.index(cat)] = 1.0
    v[len(CATEGORIES)] = vol
    return v


# ── model ────────────────────────────────────────────────────────────────────

class AudioMLP:
    def __init__(self, seed: int = 0):
        rng = np.random.default_rng(seed)
        sc = math.sqrt(2.0 / DIM_EMB)
        self.W1 = rng.normal(0, sc, (DIM_EMB, DIM_HID)).astype(np.float32)
        self.b1 = np.zeros(DIM_HID, np.float32)
        sc2 = math.sqrt(2.0 / DIM_HID)
        self.W2 = rng.normal(0, sc2, (DIM_HID, DIM_OUT)).astype(np.float32) * 0.1
        self.b2 = np.zeros(DIM_OUT, np.float32)
        # init category logits to 0, volume to 0.5
        self.b2[len(CATEGORIES)] = 0.0

    def _params(self) -> dict:
        return {"W1": self.W1, "b1": self.b1, "W2": self.W2, "b2": self.b2}

    def forward(self, x: np.ndarray):
        x = x.astype(np.float64)
        z1 = x @ self.W1.astype(np.float64) + self.b1
        h = np.maximum(0, z1)
        z2 = h @ self.W2.astype(np.float64) + self.b2
        # Softmax for categories, sigmoid for volume
        logits = z2[..., :len(CATEGORIES)]
        vol_raw = z2[..., len(CATEGORIES):]
        logits = logits - logits.max(axis=-1, keepdims=True)
        exp_l = np.exp(np.clip(logits, -30, 30))
        cat_prob = (exp_l / (exp_l.sum(axis=-1, keepdims=True) + 1e-8)).astype(np.float32)
        vol = (1.0 / (1.0 + np.exp(-np.clip(vol_raw, -30, 30)))).astype(np.float32)
        return np.concatenate([cat_prob, vol], axis=-1), (z1.astype(np.float32), h.astype(np.float32))

    def save(self, path: str):
        np.savez(path, **self._params())

    @classmethod
    def load(cls, path: str) -> "AudioMLP":
        m = cls.__new__(cls)
        w = np.load(path)
        m.W1, m.b1, m.W2, m.b2 = w["W1"], w["b1"], w["W2"], w["b2"]
        return m


def _loss(yhat: np.ndarray, ytrue: np.ndarray) -> float:
    eps = 1e-7
    # CE for category + BCE for volume
    cat_loss = -np.mean(np.sum(ytrue[..., :len(CATEGORIES)] * np.log(yhat[..., :len(CATEGORIES)] + eps), axis=-1))
    vol_loss = -np.mean(
        ytrue[..., len(CATEGORIES):] * np.log(yhat[..., len(CATEGORIES):] + eps)
        + (1 - ytrue[..., len(CATEGORIES):]) * np.log(1 - yhat[..., len(CATEGORIES):] + eps)
    )
    return float(cat_loss + vol_loss)


def train(
    out_path: str = "train/audio_adapter.npz",
    epochs: int = 300,
    lr: float = 4e-3,
    seed: int = 0,
) -> dict:
    import time
    t0 = time.time()
    prompts, cats, vols = _build_dataset(seed)
    X = np.stack([embed(p) for p in prompts])
    Y = np.stack([encode_target(c, v) for c, v in zip(cats, vols)])
    n = len(X)
    print(f"dataset: {n} examples")

    rng = np.random.default_rng(seed)
    val_mask = rng.random(n) < 0.1
    Xtr, Ytr = X[~val_mask], Y[~val_mask]
    Xv, Yv = X[val_mask], Y[val_mask]

    m = AudioMLP(seed=seed)
    # Adam
    ms = {k: np.zeros_like(v) for k, v in m._params().items()}
    vs = {k: np.zeros_like(v) for k, v in m._params().items()}
    t_step = 0; b1, b2_adam, eps_adam, wd = 0.9, 0.999, 1e-8, 1e-4

    best_val = 1e9
    for ep in range(1, epochs + 1):
        idx = rng.permutation(len(Xtr))
        for i in range(0, len(Xtr), 64):
            xb = Xtr[idx[i:i+64]]; yb = Ytr[idx[i:i+64]]
            yh, (z1, h) = m.forward(xb)

            # grads (cat CE + vol BCE)
            dc = yh[..., :len(CATEGORIES)] - yb[..., :len(CATEGORIES)]
            dv = yh[..., len(CATEGORIES):] - yb[..., len(CATEGORIES):]
            dz2 = np.concatenate([dc, dv], axis=-1).astype(np.float32) / len(xb)
            dW2 = h.astype(np.float64).T @ dz2.astype(np.float64)
            db2 = dz2.sum(0)
            dh = dz2 @ m.W2.T
            dz1 = dh * (z1 > 0)
            dW1 = xb.astype(np.float64).T @ dz1.astype(np.float64)
            db1 = dz1.sum(0)
            grads = {"W1": np.clip(dW1, -1, 1).astype(np.float32),
                     "b1": np.clip(db1, -1, 1).astype(np.float32),
                     "W2": np.clip(dW2, -1, 1).astype(np.float32),
                     "b2": np.clip(db2, -1, 1).astype(np.float32)}

            t_step += 1
            params = m._params()
            for k in params:
                g = grads[k] + wd * params[k]
                ms[k] = b1 * ms[k] + (1 - b1) * g
                vs[k] = b2_adam * vs[k] + (1 - b2_adam) * g * g
                mh = ms[k] / (1 - b1 ** t_step)
                vh = vs[k] / (1 - b2_adam ** t_step)
                params[k] -= np.clip(lr * mh / (np.sqrt(np.abs(vh)) + eps_adam), -0.05, 0.05).astype(np.float32)

        if ep % 50 == 0 or ep == epochs:
            yv, _ = m.forward(Xv)
            vl = _loss(yv, Yv)
            acc = float((np.argmax(yv[..., :len(CATEGORIES)], axis=-1) ==
                         np.argmax(Yv[..., :len(CATEGORIES)], axis=-1)).mean())
            mark = " *" if vl < best_val else ""
            print(f"  ep {ep:3d}  val_loss={vl:.4f}  cat_acc={acc:.2%}{mark}")
            if vl < best_val:
                best_val = vl; m.save(out_path)

    meta = {
        "categories": CATEGORIES, "dim_emb": DIM_EMB, "dim_hid": DIM_HID,
        "n_train": int((~val_mask).sum()), "best_val_loss": round(best_val, 6),
        "elapsed_s": round(time.time() - t0, 1),
    }
    with open(out_path.replace(".npz", "_meta.json"), "w") as f:
        json.dump(meta, f, indent=2)
    print(f"saved {out_path}")
    return meta


_KEYWORD_RULES: list[tuple[list[str], str, float]] = [
    # (keywords, category, base_volume) — any keyword match wins if MLP conf < 0.6
    (["rain", "rainy", "drizzle", "downpour", "shower", "precipitation"], "rain", 0.4),
    (["wind", "windy", "breeze", "gusts", "gust", "breezy"], "wind", 0.4),
    (["forest", "woods", "birds", "nature", "jungle", "woodland", "chirp", "birdsong"], "forest", 0.38),
    (["city", "urban", "street", "traffic", "downtown", "cafe", "crowd", "market", "bus", "subway"], "city", 0.4),
    (["hum", "buzz", "electrical", "electric", "server", "machine", "industrial", "electronic", "motor"], "electronic", 0.4),
    (["white noise", "static", "hiss", "noise masking", "flat noise"], "white_noise", 0.25),
    (["silent", "silence", "quiet", "empty", "nothing", "meditation", "peaceful silent"], "silence", 0.0),
]


def predict(
    prompt: str,
    adapter_path: str = "train/audio_adapter.npz",
    keyword_boost: bool = True,
) -> dict:
    import warnings
    low = prompt.lower()
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        m = AudioMLP.load(adapter_path)
        x = embed(prompt)[None]
        y, _ = m.forward(x)
    cat_idx = int(np.argmax(y[0, :len(CATEGORIES)]))
    mlp_conf = float(y[0, cat_idx])
    mlp_vol = float(y[0, len(CATEGORIES)])
    mlp_cat = CATEGORIES[cat_idx]

    if keyword_boost and mlp_conf < 0.75:
        for keywords, cat, vol in _KEYWORD_RULES:
            if any(kw in low for kw in keywords):
                return {
                    "category": cat,
                    "volume": max(vol, mlp_vol * 0.5),
                    "confidence": 0.85,
                    "source": "keyword_override",
                }
    return {
        "category": mlp_cat,
        "volume": mlp_vol,
        "confidence": mlp_conf,
        "source": "mlp",
    }


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", nargs="?", default="train", choices=["train", "predict"])
    ap.add_argument("prompt", nargs="?")
    ap.add_argument("--out", default="train/audio_adapter.npz")
    ap.add_argument("--epochs", type=int, default=300)
    a = ap.parse_args()
    if a.cmd == "predict":
        print(json.dumps(predict(a.prompt or "", a.out), indent=2))
    else:
        train(a.out, epochs=a.epochs)
