#!/usr/bin/env python3
"""
Build a larger, category-bounded dataset:
- Primary: download from picsum (slow, rate-limit friendly).
- Fallback: synthetic PIL images with palette fixed per subtype (always succeeds).
"""

from __future__ import annotations

import argparse
import json
import random
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw

SUBTYPES = [
    "mountain vista",
    "forest path",
    "lake or river",
    "coastal shoreline",
    "open meadow or hills",
    "desert or arid plain",
]


def download_one(url: str, dest: Path, retries: int = 5) -> bool:
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "WittgensteinDatasetBot/1.0"},
        method="GET",
    )
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=45) as resp:
                data = resp.read()
            if len(data) < 500:
                time.sleep(0.4 * (attempt + 1))
                continue
            dest.write_bytes(data)
            return True
        except (urllib.error.URLError, OSError):
            time.sleep(0.5 * (attempt + 1))
    return False


def synth_natural(path: Path, subtype: str, seed: int) -> None:
    rng = random.Random(seed)
    w = h = 384
    base = Image.new("RGB", (w, h))
    px = base.load()
    if "mountain" in subtype:
        for y in range(h):
            for x in range(w):
                t = y / h
                r = int(80 + t * 60 + rng.randint(-8, 8))
                g = int(90 + t * 50 + rng.randint(-8, 8))
                b = int(120 + (1 - t) * 80 + rng.randint(-8, 8))
                px[x, y] = (min(255, r), min(255, g), min(255, b))
    elif "forest" in subtype:
        for y in range(h):
            for x in range(w):
                g = int(40 + (x + y) % 90 + rng.randint(-10, 10))
                r = int(20 + g // 4)
                b = int(25 + g // 5)
                px[x, y] = (min(255, r), min(255, g), min(255, b))
    elif "lake" in subtype or "river" in subtype:
        for y in range(h):
            for x in range(w):
                t = x / w
                r = int(30 + t * 40)
                g = int(70 + (1 - t) * 40)
                b = int(120 + t * 80 + rng.randint(-12, 12))
                px[x, y] = (min(255, r), min(255, g), min(255, b))
    elif "coastal" in subtype:
        for y in range(h):
            for x in range(w):
                t = y / h
                r = int(180 - t * 40 + rng.randint(-10, 10))
                g = int(190 - t * 30 + rng.randint(-10, 10))
                b = int(200 - t * 20 + rng.randint(-10, 10))
                px[x, y] = (min(255, r), min(255, g), min(255, b))
    elif "meadow" in subtype or "hills" in subtype:
        for y in range(h):
            for x in range(w):
                g = int(100 + (x * y) % 80 + rng.randint(-15, 15))
                r = int(60 + g // 3)
                b = int(40 + g // 4)
                px[x, y] = (min(255, r), min(255, g), min(255, b))
    else:  # desert
        for y in range(h):
            for x in range(w):
                r = int(200 + (x + y) % 40 + rng.randint(-8, 8))
                g = int(160 + (x + y) % 35 + rng.randint(-8, 8))
                b = int(90 + (x + y) % 30 + rng.randint(-8, 8))
                px[x, y] = (min(255, r), min(255, g), min(255, b))

    draw = ImageDraw.Draw(base)
    draw.ellipse([w // 4, h // 4, 3 * w // 4, 3 * h // 4], outline=(255, 255, 255), width=2)
    base.save(path, format="JPEG", quality=88)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=150)
    parser.add_argument(
        "--synthetic-only",
        action="store_true",
        help="Skip network; generate all images locally (fast, reliable).",
    )
    args = parser.parse_args()

    root = Path(__file__).resolve().parents[2] / "data" / "image_adapter" / "raw"
    img_dir = root / "images"
    img_dir.mkdir(parents=True, exist_ok=True)
    meta_path = root / "metadata.jsonl"

    n = max(40, min(800, args.count))
    lines: list[str] = []
    ok_dl = 0
    ok_syn = 0

    for i in range(1, n + 1):
        subtype = SUBTYPES[(i - 1) % len(SUBTYPES)]
        caption = (
            "Natural landscape photograph, "
            f"{subtype}; soft daylight, wide composition, no people, no text."
        )
        rel = f"images/nat_{i:04d}.jpg"
        dest = root / rel

        got = False
        if not args.synthetic_only:
            url = f"https://picsum.photos/seed/natland{i:04d}/384/384"
            time.sleep(0.35)
            got = download_one(url, dest)
            if got:
                ok_dl += 1

        if not got:
            synth_natural(dest, subtype, seed=10_000 + i)
            ok_syn += 1

        lines.append(
            json.dumps(
                {
                    "id": f"nat_{i:04d}",
                    "image_path": rel,
                    "caption": caption,
                    "subject": subtype,
                },
                ensure_ascii=False,
            )
        )

    meta_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {len(lines)} rows -> {meta_path} (download_ok={ok_dl}, synthetic_ok={ok_syn})")


if __name__ == "__main__":
    main()
