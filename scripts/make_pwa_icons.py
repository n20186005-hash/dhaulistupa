"""Generate the PWA raster icons from the same vector brand mark as public/icons/favicon.svg.

The drawing is done on a 4x supersampled canvas and then downsampled with LANCZOS so the
edges stay smooth at 192px. Re-run after changing the mark geometry in favicon.svg:

    python scripts/make_pwa_icons.py

Outputs (all under public/icons/):
  icon-192.png       192x192  purpose "any"
  icon-512.png       512x512  purpose "any"
  maskable-512.png   512x512  purpose "maskable" (full-bleed background, artwork inside the 80% safe zone)
"""

from pathlib import Path

from PIL import Image, ImageDraw

# Brand palette, identical to favicon.svg / src/styles/global.css
BG = (23, 33, 31)        # #17211f
FG = (255, 253, 247)     # #fffdf7
GOLD = (217, 170, 81)    # #d9aa51

UNIT = 64                # favicon.svg viewBox
SUPERSAMPLE = 4
OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "icons"


def cubic(p0, p1, p2, p3, steps=96):
    pts = []
    for i in range(steps + 1):
        t = i / steps
        u = 1 - t
        x = u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0]
        y = u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1]
        pts.append((x, y))
    return pts


def mark_polygon():
    """Stupa dome: M16 46 c1-13 7-22 16-22 s15 9 16 22 H16 Z"""
    left = cubic((16, 46), (17, 33), (23, 24), (32, 24))
    right = cubic((32, 24), (41, 24), (47, 33), (48, 46))
    return left + right


SPIRE = [  # (x0, y0, x1, y1) in viewBox units, bottom tier first
    (29, 16, 35, 22),
    (24, 10, 40, 14),
    (28, 4, 36, 8),
]

SPOKES = [  # gold wheel lines inside the dome
    ((32, 28), (32, 38)),
    ((27, 33), (37, 33)),
    ((28.5, 29.5), (35.5, 35.5)),
    ((35.5, 29.5), (28.5, 35.5)),
]


def draw_mark(draw, k):
    """Draw the mark. k = pixels per viewBox unit."""
    draw.polygon([(x * k, y * k) for x, y in mark_polygon()], fill=FG)
    for x0, y0, x1, y1 in SPIRE:
        draw.rectangle([x0 * k, y0 * k, x1 * k, y1 * k], fill=FG)
    draw.ellipse([27 * k, 28 * k, 37 * k, 38 * k], outline=GOLD, width=max(1, round(2 * k)))
    for a, b in SPOKES:
        draw.line([a[0] * k, a[1] * k, b[0] * k, b[1] * k], fill=GOLD, width=max(1, round(1.25 * k)))


def build(size, maskable=False):
    big = size * SUPERSAMPLE
    img = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    k = big / UNIT

    if maskable:
        # Full-bleed background, artwork kept inside the central 80% safe zone.
        draw.rectangle([0, 0, big - 1, big - 1], fill=BG + (255,))
        art = Image.new("RGBA", (big, big), (0, 0, 0, 0))
        draw_mark(ImageDraw.Draw(art), k * 0.62)
        offset = round(big * (1 - 0.62) / 2)
        img.paste(art, (offset, offset), art)
    else:
        radius = round(14 * k)  # rx="14" in favicon.svg
        draw.rounded_rectangle([0, 0, big - 1, big - 1], radius=radius, fill=BG + (255,))
        draw_mark(draw, k)

    return img.resize((size, size), Image.LANCZOS)


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name, size, maskable in (
        ("icon-192.png", 192, False),
        ("icon-512.png", 512, False),
        ("maskable-512.png", 512, True),
    ):
        build(size, maskable).save(OUT_DIR / name, optimize=True)
        print("wrote", OUT_DIR / name)


if __name__ == "__main__":
    main()
