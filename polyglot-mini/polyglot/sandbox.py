"""Minimal subprocess sandbox for LLM-emitted Python painter code.

Runs the code in a fresh Python subprocess with a timeout. The code is expected
to write the final PNG to the path in the env var POLYGLOT_OUT_PATH.
"""
from __future__ import annotations
import os
import subprocess
import sys
import tempfile
from dataclasses import dataclass


PAINTER_PREAMBLE = '''\
# Auto-prepended painter preamble.
import os, math, io, json, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageChops, ImageFont, ImageOps
from scipy import ndimage
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

OUT_PATH = os.environ["POLYGLOT_OUT_PATH"]
W, H = int(os.environ.get("POLYGLOT_W", "1024")), int(os.environ.get("POLYGLOT_H", "1024"))
SEED = int(os.environ.get("POLYGLOT_SEED", "0"))
np.random.seed(SEED); random.seed(SEED)

def save(img):
    if isinstance(img, np.ndarray):
        img = Image.fromarray(np.clip(img, 0, 255).astype("uint8"))
    img.save(OUT_PATH, "PNG")
'''


@dataclass
class SandboxResult:
    ok: bool
    out_path: str
    stdout: str
    stderr: str
    exit_code: int


def run_painter(
    code: str,
    out_path: str,
    *,
    width: int = 1024,
    height: int = 1024,
    seed: int = 0,
    timeout_s: float = 20.0,
) -> SandboxResult:
    full = PAINTER_PREAMBLE + "\n# --- LLM code below ---\n" + code
    with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False) as f:
        f.write(full)
        tmp_path = f.name
    env = os.environ.copy()
    env.update({
        "POLYGLOT_OUT_PATH": out_path,
        "POLYGLOT_W": str(width),
        "POLYGLOT_H": str(height),
        "POLYGLOT_SEED": str(seed),
        "MPLBACKEND": "Agg",
    })
    try:
        proc = subprocess.run(
            [sys.executable, tmp_path],
            env=env,
            capture_output=True,
            text=True,
            timeout=timeout_s,
        )
        return SandboxResult(
            ok=(proc.returncode == 0 and os.path.exists(out_path)),
            out_path=out_path,
            stdout=proc.stdout,
            stderr=proc.stderr,
            exit_code=proc.returncode,
        )
    except subprocess.TimeoutExpired as e:
        return SandboxResult(False, out_path, e.stdout or "", (e.stderr or "") + "\nTIMEOUT", -1)
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
