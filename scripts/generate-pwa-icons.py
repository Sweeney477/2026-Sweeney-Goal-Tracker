#!/usr/bin/env python3
"""Regenerate GoalTracker PWA icons from the soft wellness brand mark.

Cream canvas (#f8f6f1) + soft teal disc with mint ring and cream check.
Requires: pip install pillow
Usage: python3 scripts/generate-pwa-icons.py
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

CREAM = (0xF8, 0xF6, 0xF1, 255)
# Soft seafoam teal (lighter at top → deeper brand teal at bottom)
TEAL_TOP = (0x3A, 0x9A, 0x8C, 255)
TEAL_MID = (0x2A, 0x86, 0x78, 255)
TEAL_BOT = (0x1F, 0x6F, 0x63, 255)
# Pale mint ring surrounding the disc
MINT = (0xC5, 0xE4, 0xD8, 255)
SHADOW = (0x1F, 0x6F, 0x63, 55)

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "icons"


def _lerp(a: tuple[int, ...], b: tuple[int, ...], t: float) -> tuple[int, int, int, int]:
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(4))  # type: ignore[return-value]


def _fill_teal_disc(img: Image.Image, bbox: tuple[int, int, int, int]) -> None:
    """Vertical-ish soft gradient fill clipped to an ellipse."""
    x0, y0, x1, y1 = bbox
    w, h = x1 - x0, y1 - y0
    cx = (x0 + x1) / 2
    cy = (y0 + y1) / 2
    rx = w / 2
    ry = h / 2
    px = img.load()
    assert px is not None
    for y in range(y0, y1):
        ty = (y - y0) / max(h - 1, 1)
        if ty < 0.5:
            color = _lerp(TEAL_TOP, TEAL_MID, ty * 2)
        else:
            color = _lerp(TEAL_MID, TEAL_BOT, (ty - 0.5) * 2)
        for x in range(x0, x1):
            nx = (x - cx) / rx
            ny = (y - cy) / ry
            if nx * nx + ny * ny <= 1.0:
                # Slight top-center highlight (radial lift)
                highlight = max(0.0, 1.0 - math.hypot(nx, ny + 0.25) / 1.15)
                c = _lerp(color, TEAL_TOP, highlight * 0.18)
                px[x, y] = c


def _thick_check(
    draw: ImageDraw.ImageDraw,
    cx: float,
    cy: float,
    scale: float,
    width: float,
    color: tuple[int, int, int, int],
) -> None:
    """Rounded cream checkmark centered in the disc."""
    s = scale
    p1 = (cx - s * 0.52, cy + s * 0.02)
    p2 = (cx - s * 0.10, cy + s * 0.40)
    p3 = (cx + s * 0.56, cy - s * 0.38)

    def segment(a: tuple[float, float], b: tuple[float, float]) -> None:
        ax, ay = a
        bx, by = b
        dx, dy = bx - ax, by - ay
        length = math.hypot(dx, dy) or 1.0
        nx, ny = -dy / length, dx / length
        hw = width / 2
        draw.polygon(
            [
                (ax + nx * hw, ay + ny * hw),
                (bx + nx * hw, by + ny * hw),
                (bx - nx * hw, by - ny * hw),
                (ax - nx * hw, ay - ny * hw),
            ],
            fill=color,
        )
        r = hw
        draw.ellipse([ax - r, ay - r, ax + r, ay + r], fill=color)
        draw.ellipse([bx - r, by - r, bx + r, by + r], fill=color)

    segment(p1, p2)
    segment(p2, p3)


def draw_mark(size: int, *, maskable: bool = False) -> Image.Image:
    """Opaque RGB icon: cream field + soft teal mark (mint ring + cream check)."""
    scale = 4
    S = size * scale
    canvas = Image.new("RGBA", (S, S), CREAM)

    # Safe-zone: maskable keeps ~20% padding from outer ring to canvas edge
    # (slightly more so the soft shadow still stays inside the safe zone).
    # "any" / apple-touch use a larger mark with a modest cream margin.
    pad_ratio = 0.24 if maskable else 0.10
    pad = int(S * pad_ratio)
    mark_box = S - 2 * pad

    # Soft drop shadow under the circular mark
    shadow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    shadow_offset = int(S * 0.014)
    sd.ellipse(
        [pad, pad + shadow_offset, pad + mark_box, pad + mark_box + shadow_offset],
        fill=SHADOW,
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=max(2, int(S * 0.028))))
    canvas = Image.alpha_composite(canvas, shadow)

    # Pale mint outer ring (double-border effect)
    ring = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    rd = ImageDraw.Draw(ring)
    rd.ellipse([pad, pad, pad + mark_box, pad + mark_box], fill=MINT)

    # Teal disc inset slightly inside the mint ring
    ring_width = max(2, int(S * 0.018))
    disc_inset = ring_width
    disc_bbox = (
        pad + disc_inset,
        pad + disc_inset,
        pad + mark_box - disc_inset,
        pad + mark_box - disc_inset,
    )
    disc = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    _fill_teal_disc(disc, disc_bbox)

    canvas = Image.alpha_composite(canvas, ring)
    canvas = Image.alpha_composite(canvas, disc)

    # Cream checkmark
    overlay = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    cx = cy = S / 2
    check_scale = mark_box * 0.28
    check_width = max(2.0, S * 0.055)
    _thick_check(od, cx, cy, check_scale, check_width, CREAM)
    canvas = Image.alpha_composite(canvas, overlay)

    rgb = Image.new("RGB", (S, S), CREAM[:3])
    rgb.paste(canvas, mask=canvas.split()[3])
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
