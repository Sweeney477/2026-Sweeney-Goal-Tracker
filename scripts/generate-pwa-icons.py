#!/usr/bin/env python3
"""Regenerate branded PWA icons (teal #1f6f63 / cream #f8f6f1).

Requires: pip install pillow
Usage: python3 scripts/generate-pwa-icons.py
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw

TEAL = (0x1F, 0x6F, 0x63, 255)
CREAM = (0xF8, 0xF6, 0xF1, 255)
TEAL_DEEP = (0x16, 0x54, 0x4B, 255)

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "icons"


def draw_mark(size: int, *, maskable: bool = False) -> Image.Image:
    """Opaque RGB icon: teal field + cream ring + check (goal mark)."""
    scale = 4
    S = size * scale
    img = Image.new("RGBA", (S, S), TEAL)
    d = ImageDraw.Draw(img)

    pad = int(S * (0.18 if maskable else 0.12))
    inner = S - 2 * pad

    disc_pad = pad - int(S * 0.02)
    if disc_pad > 0:
        d.ellipse([disc_pad, disc_pad, S - disc_pad, S - disc_pad], fill=TEAL_DEEP)

    stroke = max(2, int(S * 0.055))
    ring_inset = pad + int(inner * 0.06)
    d.ellipse(
        [ring_inset, ring_inset, S - ring_inset, S - ring_inset],
        outline=CREAM,
        width=stroke,
    )

    fill_inset = pad + int(inner * 0.22)
    d.ellipse(
        [fill_inset, fill_inset, S - fill_inset, S - fill_inset],
        fill=CREAM,
    )

    cx, cy = S / 2, S / 2
    s = inner * 0.28
    w = max(2, int(S * 0.07))
    p1 = (cx - s * 0.55, cy + s * 0.05)
    p2 = (cx - s * 0.12, cy + s * 0.42)
    p3 = (cx + s * 0.58, cy - s * 0.38)

    def thick_segment(a: tuple[float, float], b: tuple[float, float], width: float, color: tuple) -> None:
        ax, ay = a
        bx, by = b
        dx, dy = bx - ax, by - ay
        length = math.hypot(dx, dy) or 1
        nx, ny = -dy / length, dx / length
        hw = width / 2
        d.polygon(
            [
                (ax + nx * hw, ay + ny * hw),
                (bx + nx * hw, by + ny * hw),
                (bx - nx * hw, by - ny * hw),
                (ax - nx * hw, ay - ny * hw),
            ],
            fill=color,
        )
        r = hw
        d.ellipse([ax - r, ay - r, ax + r, ay + r], fill=color)
        d.ellipse([bx - r, by - r, bx + r, by + r], fill=color)

    thick_segment(p1, p2, w, TEAL)
    thick_segment(p2, p3, w, TEAL)

    rgb = Image.new("RGB", (S, S), TEAL[:3])
    rgb.paste(img, mask=img.split()[3])
    return rgb.resize((size, size), Image.Resampling.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    specs = [
        (180, "apple-touch-icon.png", False),
        (192, "icon-192.png", False),
        (512, "icon-512.png", False),
        (512, "icon-512-maskable.png", True),
    ]
    for size, name, maskable in specs:
        path = OUT / name
        draw_mark(size, maskable=maskable).save(path, "PNG", optimize=True)
        print(f"{name}: {size}x{size} ({path.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
