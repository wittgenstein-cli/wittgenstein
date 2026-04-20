"""Image codec — Code-as-Painter route.

LLM emits a complete Python painter program that uses PIL + numpy + scipy +
matplotlib to produce an image. Optional inline SVG/emoji via PIL font.
"""
from __future__ import annotations
import os
import sys
import time
from .llm import chat, extract_code_block
from .sandbox import run_painter, SandboxResult


PAINTER_SYSTEM = """You are a visual artist-programmer. You will be given a prompt and must output a complete Python painter program.

HARD RULES:
- Output ONE fenced ```python code block and nothing else.
- You DO NOT need imports — they are pre-injected: numpy as np, PIL (Image, ImageDraw, ImageFilter, ImageChops, ImageFont, ImageOps), scipy.ndimage, matplotlib.pyplot as plt.
- Pre-injected globals: W, H (canvas size), SEED, OUT_PATH, and save(img) which writes PNG.
- Your program MUST call save(...) exactly once at the end with a PIL Image or numpy uint8 array.
- Target canvas is W x H. Favor LAYERED composition: background (gradient / perlin-ish noise via gaussian-blurred normal), midground (shapes, masks, blurs), foreground (typography, accents).
- Use np.random (seeded), scipy.ndimage (gaussian_filter, zoom), PIL blend modes (ImageChops.screen/multiply), matplotlib colormaps (plt.get_cmap).
- You may draw text with ImageDraw + default font (no external files). Emojis: use unicode text; may fail silently — wrap in try/except.
- Be bold, graphic, composed. No stock-image literalism."""


PAINTER_USER_TMPL = """Prompt: {prompt}

Size: {w}x{h}. Seed: {seed}.

Produce the painter code now."""


def _load_adapter_params(prompt: str, adapter_path: str | None) -> dict | None:
    """Use trained MLP adapter to predict painter params from text."""
    if adapter_path is None:
        # auto-detect
        for p in ("train/adapter.npz", os.path.join(os.path.dirname(__file__), "../train/adapter.npz")):
            if os.path.exists(p):
                adapter_path = p
                break
    if adapter_path is None or not os.path.exists(adapter_path):
        return None
    try:
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
        from train.train import predict as adapter_predict
        return adapter_predict(prompt, adapter_path)
    except Exception:
        return None


def generate_image(
    prompt: str,
    out_path: str,
    *,
    width: int = 1024,
    height: int = 1024,
    seed: int = 0,
    max_retries: int = 2,
    timeout_s: float = 25.0,
    fallback_params: dict | None = None,
    adapter_path: str | None = None,
) -> dict:
    """Returns a run-result dict with artifact path + metadata."""
    if fallback_params is None:
        fallback_params = _load_adapter_params(prompt, adapter_path)
    started = time.time()
    last_err = ""
    last_code = ""
    llm_in = llm_out = 0

    for attempt in range(max_retries + 1):
        user = PAINTER_USER_TMPL.format(prompt=prompt, w=width, h=height, seed=seed)
        if attempt > 0 and last_err:
            user += f"\n\nPrevious attempt failed with stderr:\n{last_err[-1500:]}\nFix the bug and re-emit."
        try:
            r = chat(user, system=PAINTER_SYSTEM, temperature=0.6, max_tokens=3000, timeout=60)
            llm_in += r.input_tokens; llm_out += r.output_tokens
            code = extract_code_block(r.text, "python")
            last_code = code
        except Exception as e:
            last_err = f"LLM call failed: {e}"
            continue

        res: SandboxResult = run_painter(
            code, out_path, width=width, height=height, seed=seed, timeout_s=timeout_s,
        )
        if res.ok:
            return {
                "ok": True,
                "codec": "image:code-as-painter",
                "artifact_path": out_path,
                "bytes": os.path.getsize(out_path),
                "attempts": attempt + 1,
                "llm_tokens": {"input": llm_in, "output": llm_out},
                "duration_ms": int((time.time() - started) * 1000),
                "seed": seed,
                "code": code,
            }
        last_err = res.stderr or res.stdout

    # Fallback: procedural painter using trained adapter params (if provided)
    # or a deterministic no-LLM baseline so we ALWAYS produce a file.
    from .fallback_painter import paint_fallback
    paint_fallback(out_path, prompt=prompt, width=width, height=height, seed=seed,
                   params=fallback_params)
    return {
        "ok": True,
        "codec": "image:fallback-painter",
        "artifact_path": out_path,
        "bytes": os.path.getsize(out_path),
        "attempts": max_retries + 1,
        "llm_tokens": {"input": llm_in, "output": llm_out},
        "duration_ms": int((time.time() - started) * 1000),
        "seed": seed,
        "fallback_reason": last_err[-500:],
        "code": last_code,
    }
