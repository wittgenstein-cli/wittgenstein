"""Sensor codec — procedural signal spec → numpy array → JSON + CSV + PNG + loupe HTML.

LLM emits a compact JSON spec describing a composition of signal primitives.
Middleware expands it deterministically.
"""
from __future__ import annotations
import json
import os
import time
from typing import Any
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

import subprocess
import sys
from .llm import chat, extract_json_block


def _run_loupe(csv_path: str, html_path: str) -> bool:
    """Run loupe.py CSV → HTML. Returns True on success."""
    here = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(here, "..", "loupe.py"),
        os.path.join(here, "../..", "loupe.py"),
        os.path.join(os.getcwd(), "loupe.py"),
    ]
    loupe = next((p for p in candidates if os.path.exists(p)), None)
    if loupe is None:
        return False
    try:
        subprocess.run(
            [sys.executable, loupe, csv_path, "-o", html_path],
            check=True, capture_output=True, timeout=15,
        )
        return os.path.exists(html_path)
    except Exception:
        return False


SENSOR_SYSTEM = """You are a signal composer. Emit ONE fenced ```json block describing a sensor time series as a composition of primitives. No prose.

Schema:
{
  "signal": "ecg" | "accelerometer" | "temperature" | "respiration" | "custom",
  "sample_rate_hz": number,
  "duration_s": number,
  "components": [
    {"type": "sine", "freq_hz": number, "amp": number, "phase": number?},
    {"type": "noise", "kind": "gaussian"|"pink", "amp": number},
    {"type": "drift", "slope_per_s": number},
    {"type": "spike_train", "rate_hz": number, "amp": number, "width_s": number},
    {"type": "ecg_like", "bpm": number, "amp": number},
    {"type": "event", "at_s": number, "kind": "pulse"|"step", "amp": number, "width_s": number?}
  ],
  "unit": string,
  "notes": string
}

Components are summed. Be physically plausible for the named signal."""


def _expand(spec: dict[str, Any]) -> tuple[np.ndarray, np.ndarray]:
    fs = float(spec["sample_rate_hz"])
    dur = float(spec["duration_s"])
    n = int(fs * dur)
    t = np.arange(n) / fs
    y = np.zeros(n, dtype=np.float64)
    rng = np.random.default_rng(0)

    for c in spec.get("components", []):
        k = c["type"]
        if k == "sine":
            y += c["amp"] * np.sin(2 * np.pi * c["freq_hz"] * t + c.get("phase", 0.0))
        elif k == "noise":
            if c.get("kind") == "pink":
                w = rng.normal(0, 1, n)
                f = np.fft.rfftfreq(n, 1 / fs); f[0] = f[1] if len(f) > 1 else 1.0
                W = np.fft.rfft(w) / np.sqrt(f)
                y += c["amp"] * np.fft.irfft(W, n)
            else:
                y += c["amp"] * rng.normal(0, 1, n)
        elif k == "drift":
            y += c["slope_per_s"] * t
        elif k == "spike_train":
            mask = rng.random(n) < (c["rate_hz"] / fs)
            w = max(1, int(c.get("width_s", 0.01) * fs))
            impulses = mask.astype(float) * c["amp"]
            kernel = np.hanning(w)
            y += np.convolve(impulses, kernel, mode="same")
        elif k == "ecg_like":
            bpm = c["bpm"]; amp = c["amp"]
            period = 60.0 / bpm
            phases = (t % period) / period
            # simple PQRST-ish shape
            p = 0.1 * np.exp(-((phases - 0.15) * 25) ** 2)
            qrs = np.exp(-((phases - 0.35) * 40) ** 2) - 0.3 * np.exp(-((phases - 0.33) * 80) ** 2)
            tw = 0.2 * np.exp(-((phases - 0.55) * 15) ** 2)
            y += amp * (p + qrs + tw)
        elif k == "event":
            at = c["at_s"]; w = c.get("width_s", 0.05); amp = c["amp"]
            idx = int(at * fs)
            if c["kind"] == "pulse":
                span = max(1, int(w * fs))
                i0 = max(0, idx - span // 2); i1 = min(n, i0 + span)
                y[i0:i1] += amp * np.hanning(i1 - i0)
            else:  # step
                y[idx:] += amp
    return t, y


_DRY_RUN_SPECS: dict[str, dict] = {
    "ecg": {
        "signal": "ecg", "sample_rate_hz": 250, "duration_s": 10.0, "unit": "mV",
        "notes": "dry-run synthetic ECG",
        "components": [
            {"type": "ecg_like", "bpm": 72, "amp": 1.0},
            {"type": "noise", "kind": "gaussian", "amp": 0.02},
            {"type": "drift", "slope_per_s": 0.01},
        ],
    },
    "accelerometer": {
        "signal": "accelerometer", "sample_rate_hz": 100, "duration_s": 8.0, "unit": "g",
        "notes": "dry-run walking accelerometer",
        "components": [
            {"type": "sine", "freq_hz": 1.8, "amp": 0.6, "phase": 0.0},
            {"type": "sine", "freq_hz": 3.6, "amp": 0.2, "phase": 1.0},
            {"type": "noise", "kind": "pink", "amp": 0.05},
        ],
    },
    "temperature": {
        "signal": "temperature", "sample_rate_hz": 1, "duration_s": 120.0, "unit": "°C",
        "notes": "dry-run body temperature with fever event",
        "components": [
            {"type": "drift", "slope_per_s": 0.01},
            {"type": "noise", "kind": "gaussian", "amp": 0.05},
            {"type": "event", "at_s": 60.0, "kind": "step", "amp": 1.2, "width_s": 2.0},
        ],
    },
}


def generate_sensor(
    prompt: str,
    out_path: str,
    *,
    default_duration_s: float = 10.0,
    default_fs: float = 250.0,
    seed: int = 0,
    max_retries: int = 1,
    dry_run: bool = False,
) -> dict:
    started = time.time()
    llm_in = llm_out = 0

    if dry_run:
        # pick best matching dry-run spec by keyword
        key = "ecg"
        low = prompt.lower()
        for k in _DRY_RUN_SPECS:
            if k in low:
                key = k; break
        spec = _DRY_RUN_SPECS[key]
        t, y = _expand(spec)
    else:
        last_err = ""
        user = f"Prompt: {prompt}\nDefault duration {default_duration_s}s at {default_fs} Hz unless the prompt implies otherwise."
        for attempt in range(max_retries + 1):
            r = chat(user, system=SENSOR_SYSTEM, temperature=0.3, max_tokens=1200)
            llm_in += r.input_tokens; llm_out += r.output_tokens
            try:
                spec = json.loads(extract_json_block(r.text))
                t, y = _expand(spec)
                break
            except Exception as e:
                last_err = f"{e}"; spec = None
        else:
            raise RuntimeError(f"sensor spec parse/expand failed: {last_err}")

    base, _ = os.path.splitext(out_path)
    json_path = base + ".json"
    csv_path = base + ".csv"
    png_path = base + ".png"
    html_path = base + ".html"
    npy_path = base + ".npy"

    np.save(npy_path, y)
    with open(json_path, "w") as f:
        json.dump({"spec": spec, "shape": list(y.shape),
                   "sample_rate_hz": spec["sample_rate_hz"],
                   "duration_s": spec["duration_s"]}, f, indent=2)

    # CSV for loupe
    with open(csv_path, "w") as f:
        f.write("timeSec,value\n")
        for i, v in enumerate(y):
            f.write(f"{t[i]:.4f},{float(v):.6f}\n")

    # PNG chart (matplotlib)
    fig, ax = plt.subplots(figsize=(10, 3), dpi=140)
    ax.plot(t, y, linewidth=0.8)
    ax.set_xlabel("t (s)"); ax.set_ylabel(spec.get("unit", ""))
    ax.set_title(f'{spec.get("signal", "signal")} — {prompt[:60]}')
    ax.grid(alpha=0.3)
    fig.tight_layout()
    fig.savefig(png_path)
    plt.close(fig)

    # Loupe HTML dashboard
    loupe_ok = _run_loupe(csv_path, html_path)

    return {
        "ok": True,
        "codec": "sensor:procedural+loupe" if loupe_ok else "sensor:procedural",
        "artifact_path": html_path if loupe_ok else json_path,
        "json_path": json_path,
        "csv_path": csv_path,
        "chart_path": png_path,
        "loupe_html": html_path if loupe_ok else None,
        "samples_path": npy_path,
        "n_samples": int(y.size),
        "llm_tokens": {"input": llm_in, "output": llm_out},
        "duration_ms": int((time.time() - started) * 1000),
        "seed": seed,
        "spec": spec,
    }
