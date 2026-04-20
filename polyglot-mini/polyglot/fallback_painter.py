"""Deterministic procedural painter used when LLM code fails OR when the
trained adapter model drives parameters directly (no LLM call).

Params:
  palette:  list of 3-5 RGB tuples
  noise_scale: float (1-20) — perlin-ish blob size
  grain: 0..1
  composition: "centered" | "rule-of-thirds" | "diagonal"
  accent_count: int
"""
from __future__ import annotations
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageChops
from scipy import ndimage


DEFAULT_PARAMS = {
    "palette": [(20, 24, 35), (80, 60, 140), (200, 90, 110), (240, 200, 100), (250, 250, 245)],
    "noise_scale": 6.0,
    "grain": 0.08,
    "composition": "rule-of-thirds",
    "accent_count": 6,
}


def _gradient_bg(w: int, h: int, palette, noise_scale: float, rng: np.random.Generator) -> np.ndarray:
    low = rng.normal(0, 1, (max(8, int(h / noise_scale)), max(8, int(w / noise_scale)), 3))
    big = ndimage.zoom(low, (h / low.shape[0], w / low.shape[1], 1), order=3)
    big = (big - big.min()) / (big.max() - big.min() + 1e-8)

    pal = np.array(palette, dtype=np.float32)
    # Sample palette colors by the scalar luminance of the noise.
    lum = big.mean(axis=2)
    idx = (lum * (len(pal) - 1)).clip(0, len(pal) - 1.001)
    i0 = idx.astype(int); i1 = (i0 + 1).clip(0, len(pal) - 1)
    t = (idx - i0)[..., None]
    img = pal[i0] * (1 - t) + pal[i1] * t
    return img


def paint_fallback(
    out_path: str,
    *,
    prompt: str = "",
    width: int = 1024,
    height: int = 1024,
    seed: int = 0,
    params: dict | None = None,
) -> None:
    p = {**DEFAULT_PARAMS, **(params or {})}
    rng = np.random.default_rng(seed)

    bg = _gradient_bg(width, height, p["palette"], p["noise_scale"], rng)
    bg = ndimage.gaussian_filter(bg, sigma=(6, 6, 0))

    # accents
    canvas = Image.fromarray(np.clip(bg, 0, 255).astype("uint8"))
    d = ImageDraw.Draw(canvas, "RGBA")
    for _ in range(p["accent_count"]):
        cx = int(rng.uniform(0.1, 0.9) * width)
        cy = int(rng.uniform(0.1, 0.9) * height)
        r = int(rng.uniform(0.05, 0.25) * min(width, height))
        col = tuple(int(c) for c in p["palette"][int(rng.integers(0, len(p["palette"])))])
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=col + (int(rng.uniform(60, 160)),))
    canvas = canvas.filter(ImageFilter.GaussianBlur(radius=4))

    # grain
    grain = rng.normal(0, 255 * p["grain"], (height, width, 3))
    arr = np.array(canvas, dtype=np.float32) + grain
    img = Image.fromarray(np.clip(arr, 0, 255).astype("uint8"))

    # caption strip
    if prompt:
        d2 = ImageDraw.Draw(img, "RGBA")
        d2.rectangle((0, height - 80, width, height), fill=(0, 0, 0, 140))
        d2.text((24, height - 56), prompt[:80], fill=(255, 255, 255, 230))

    img.save(out_path, "PNG")
