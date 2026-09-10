#!/usr/bin/env python3
"""Swap the site favicon by rasterizing one of the public/favicon-vN.svg designs.

    python3 scripts/make-favicons.py v6

Writes the three shipped icons (Safari rasterizes SVG favicons poorly, so the
site links PNGs only):
  public/favicon-32.png       32x32  RGBA, rounded corners transparent
  public/favicon-512.png      512x512 RGBA, rounded corners transparent
  public/apple-touch-icon.png 180x180 RGB, full-bleed square (Safari rounds it)
and repoints the "Generated from favicon-vN.svg" comment in index.html.

Rendering is done in-process (numpy + PIL): supersampled at 4096x4096 and
box-downsampled, since no SVG rasterizer with transparency support is
installed. Supports the favicon family's SVG subset only: <rect> background,
<path> polygons with M/L/Z commands, solid or linear/radial gradient fills
(gradientUnits="userSpaceOnUse").
"""
import pathlib
import re
import sys
import xml.etree.ElementTree as ET

import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
PUB = ROOT / "public"
NS = "{http://www.w3.org/2000/svg}"


def hex_rgb(h):
    return np.array([int(h[i : i + 2], 16) for i in (1, 3, 5)], dtype=np.float64)


def parse_d(d):
    if re.search(r"[A-Za-yz]", d.replace("M", "").replace("L", "").replace("Z", "")):
        raise ValueError(f"unsupported path command in {d!r} (only M/L/Z handled)")
    tok = d.replace("M", "").replace("Z", "").split("L")
    return [tuple(map(float, t.split())) for t in tok]


def parse_svg(path):
    root = ET.parse(path).getroot()
    size = float(root.get("viewBox").split()[2])
    grads = {}
    for lg in root.iter(NS + "linearGradient"):
        stops = [(float(s.get("offset", 0)), s.get("stop-color")) for s in lg]
        geo = tuple(float(lg.get(k)) for k in ("x1", "y1", "x2", "y2"))
        grads[lg.get("id")] = ("linear", geo, stops)
    for rg in root.iter(NS + "radialGradient"):
        stops = [(float(s.get("offset", 0)), s.get("stop-color")) for s in rg]
        geo = tuple(float(rg.get(k)) for k in ("cx", "cy", "r"))
        grads[rg.get("id")] = ("radial", geo, stops)
    rect = root.find(NS + "rect")
    rect_info = (float(rect.get("rx", 0)), rect.get("fill"))
    paths = [(p.get("fill"), parse_d(p.get("d"))) for p in root.iter(NS + "path")]
    return size, grads, rect_info, paths


def poly_mask(pts, X, Y):
    inside = np.zeros(X.shape, dtype=bool)
    n = len(pts)
    for i in range(n):
        x1, y1 = pts[i]
        x2, y2 = pts[(i + 1) % n]
        if y1 == y2:
            continue
        inside ^= ((y1 > Y) != (y2 > Y)) & (X < (x2 - x1) * (Y - y1) / (y2 - y1) + x1)
    return inside


def eval_fill(fill, grads, xm, ym):
    if not fill.startswith("url("):
        return np.tile(hex_rgb(fill), (len(xm), 1))
    kind, geo, stops = grads[fill[5:-1]]
    if kind == "linear":
        x1, y1, x2, y2 = geo
        dx, dy = x2 - x1, y2 - y1
        t = ((xm - x1) * dx + (ym - y1) * dy) / (dx * dx + dy * dy)
    else:
        cx, cy, r = geo
        t = np.sqrt((xm - cx) ** 2 + (ym - cy) ** 2) / r
    t = np.clip(t, 0.0, 1.0)
    offs = np.array([o for o, _ in stops])
    cols = np.array([hex_rgb(c) for _, c in stops])
    return np.stack([np.interp(t, offs, cols[:, i]) for i in range(3)], axis=-1)


def render(svg, full_bleed=False, N=4096):
    size, grads, (rx, rect_fill), paths = svg
    scale = N / size
    ys, xs = np.mgrid[0:N, 0:N]
    X = (xs + 0.5) / scale
    Y = (ys + 0.5) / scale
    rgb = np.zeros(X.shape + (3,))
    alpha = np.zeros(X.shape)
    if full_bleed:
        bg = np.ones(X.shape, dtype=bool)
    else:
        hw = size / 2
        dx = np.maximum(np.abs(X - hw) - (hw - rx), 0)
        dy = np.maximum(np.abs(Y - hw) - (hw - rx), 0)
        bg = dx**2 + dy**2 <= rx**2
    rgb[bg] = hex_rgb(rect_fill)
    alpha[bg] = 255.0
    for fill, pts in paths:
        m = poly_mask(pts, X, Y)
        rgb[m] = eval_fill(fill, grads, X[m], Y[m])
        alpha[m] = 255.0
    # premultiplied alpha (transparent pixels already have RGB 0), so the box
    # downsample in save() averages coverage correctly
    out = np.dstack([rgb * (alpha[..., None] / 255.0), alpha])
    return Image.fromarray(np.round(out).astype(np.uint8), "RGBA")


def save(img, size_px, path, rgb_out=False):
    small = np.asarray(img.resize((size_px, size_px), Image.BOX)).astype(np.float64)
    a = small[..., 3:4]
    un = np.where(a > 0, small[..., :3] * 255.0 / np.maximum(a, 1e-9), 0)
    out = np.dstack([np.clip(np.round(un), 0, 255), small[..., 3]]).astype(np.uint8)
    im = Image.fromarray(out, "RGBA")
    if rgb_out:
        im = im.convert("RGB")
    im.save(path)
    print("wrote", path)


def main():
    ver = sys.argv[1] if len(sys.argv) > 1 else ""
    if not re.fullmatch(r"v\d+", ver):
        sys.exit(f"usage: {sys.argv[0]} vN   (e.g. v3, v6, v7)")
    src = PUB / f"favicon-{ver}.svg"
    if not src.exists():
        sys.exit(f"{src} not found")
    svg = parse_svg(src)
    rounded = render(svg)
    save(rounded, 512, PUB / "favicon-512.png")
    save(rounded, 32, PUB / "favicon-32.png")
    save(render(svg, full_bleed=True), 180, PUB / "apple-touch-icon.png", rgb_out=True)
    idx = ROOT / "index.html"
    text, n = re.subn(
        r"Generated from favicon-v\d+\.svg",
        f"Generated from favicon-{ver}.svg",
        idx.read_text(),
    )
    if n:
        idx.write_text(text)
        print(f"index.html comment now points at favicon-{ver}.svg")
    else:
        print("warning: 'Generated from favicon-vN.svg' marker not found in index.html")


if __name__ == "__main__":
    main()
