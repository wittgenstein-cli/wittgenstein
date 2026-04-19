#!/usr/bin/env python3

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageEnhance, ImageOps


def tint_for_mode(mode: str) -> tuple[int, int, int, int]:
    mapping = {
        "coast": (112, 164, 196, 18),
        "forest": (90, 132, 88, 22),
        "lake": (94, 142, 182, 20),
        "mountain": (120, 128, 150, 16),
        "meadow": (182, 164, 102, 16),
    }
    return mapping.get(mode, (128, 128, 128, 0))


def main() -> int:
    if len(sys.argv) < 4:
        print("usage: reference_image_to_png.py <input> <output> <mode>", file=sys.stderr)
        return 2

    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    mode = sys.argv[3]

    image = Image.open(input_path).convert("RGB")
    image = ImageOps.fit(image, (512, 512), method=Image.Resampling.LANCZOS, centering=(0.5, 0.45))
    image = ImageOps.autocontrast(image, cutoff=1)
    image = ImageEnhance.Contrast(image).enhance(1.06)
    image = ImageEnhance.Color(image).enhance(1.08)
    image = ImageEnhance.Sharpness(image).enhance(1.04)

    r, g, b, alpha = tint_for_mode(mode)
    if alpha > 0:
        overlay = Image.new("RGBA", image.size, (r, g, b, alpha))
        image = Image.alpha_composite(image.convert("RGBA"), overlay).convert("RGB")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    image.save(output_path, format="PNG", optimize=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
