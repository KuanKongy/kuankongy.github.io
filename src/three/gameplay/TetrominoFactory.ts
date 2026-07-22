import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  TETROMINOES,
  TETROMINO_COLORS,
  type TetrominoKey,
} from "../constants";
import { useGameStore, type BlockSkin } from "../../store/gameStore";

export interface PieceMesh {
  group: THREE.Group;
  /**
   * Cell offsets in piece-local space, centered on the piece's BBOX (not on
   * the mean of indices) so for whole-cell index coords every cell sits on
   * the half-integer grid relative to the piece's pivot. This keeps cell
   * world-positions aligned with the castle's column centers regardless of
   * rotation.
   */
  colliderOffsets: Array<[number, number, number]>;
  centroid: [number, number, number];
}

/**
 * Hand-traced silhouette outlines per shape, in CORNER space (cell (x,y)
 * occupies the square [x, x+1]×[y, y+1]; TETROMINOES coords are cell
 * CENTERS, so corner space = center space + 0.5). Counter-clockwise.
 */
const OUTLINES: Record<TetrominoKey, Array<[number, number]>> = {
  I: [[0, 0], [4, 0], [4, 1], [0, 1]],
  O: [[0, 0], [2, 0], [2, 2], [0, 2]],
  T: [[0, 0], [3, 0], [3, 1], [2, 1], [2, 2], [1, 2], [1, 1], [0, 1]],
  S: [[1, 0], [3, 0], [3, 1], [2, 1], [2, 2], [0, 2], [0, 1], [1, 1]],
  Z: [[0, 0], [2, 0], [2, 1], [3, 1], [3, 2], [1, 2], [1, 1], [0, 1]],
  J: [[2, 0], [3, 0], [3, 2], [0, 2], [0, 1], [2, 1]],
  L: [[0, 0], [1, 0], [1, 1], [3, 1], [3, 2], [0, 2]],
};

const EXTRUDE_DEPTH = 0.86;
const BEVEL = 0.07; // depth + 2×bevel = exactly 1 cell deep

/** css colour string helper. */
function css(c: THREE.Color): string {
  return "#" + c.getHexString();
}

/**
 * The CANDY sticker — one cell face drawn like the survival reference's 2D
 * block art: thick dark outline, bright inner bevel ring, saturated body
 * with a vertical two-tone, white gloss blob. Applied per FACE of each
 * merged cube (box UVs span 0–1 per face), so the style reads from every
 * angle and the outline doubles as the cell divider.
 */
function makeGlossyStickerTexture(base: THREE.Color): THREE.CanvasTexture {
  const s = 256;
  const c = document.createElement("canvas");
  c.width = s;
  c.height = s;
  const ctx = c.getContext("2d")!;

  const light = base.clone().offsetHSL(0, 0.02, 0.13);
  const bottom = base.clone().offsetHSL(0, 0.03, -0.07);
  const dark = base.clone().offsetHSL(0, 0.06, -0.24);

  // Body: vertical two-tone (three flips canvas textures, so canvas top
  // row = UV v=1 = cell top).
  const grad = ctx.createLinearGradient(0, 0, 0, s);
  grad.addColorStop(0, css(light));
  grad.addColorStop(0.45, css(base));
  grad.addColorStop(1, css(bottom));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, s, s);

  // Bright inner bevel ring.
  ctx.strokeStyle = css(light);
  ctx.globalAlpha = 0.95;
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.roundRect(24, 24, s - 48, s - 48, 26);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Thick dark outline at the very edge (meets the neighbouring face's
  // outline → continuous divider grid across the piece).
  ctx.strokeStyle = css(dark);
  ctx.lineWidth = 26;
  ctx.beginPath();
  ctx.roundRect(6, 6, s - 12, s - 12, 30);
  ctx.stroke();

  // Gloss: rounded blob + small companion dot in the top-left.
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.beginPath();
  ctx.roundRect(52, 46, 64, 40, 20);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(134, 62, 12, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/**
 * The JEWEL sticker — faceted brick: a thick dark outline around four
 * bevel-facet trapezoids (lit top, mid left, shaded right, dark bottom)
 * framing a bright centre table, plus a small white sparkle. Per cube
 * face, like CANDY.
 */
function makeJewelTexture(base: THREE.Color): THREE.CanvasTexture {
  const s = 256;
  const c = document.createElement("canvas");
  c.width = s;
  c.height = s;
  const ctx = c.getContext("2d")!;

  const top = base.clone().offsetHSL(0, 0.03, 0.2);
  const left = base.clone().offsetHSL(0, 0.02, 0.08);
  const right = base.clone().offsetHSL(0, 0.04, -0.08);
  const bottom = base.clone().offsetHSL(0, 0.05, -0.18);
  const table = base.clone().offsetHSL(0, 0.04, 0.05);
  const dark = base.clone().offsetHSL(0, 0.06, -0.26);

  // Facet trapezoids toward the inner table square.
  const i = 68; // facet depth
  const quad = (pts: Array<[number, number]>, fill: THREE.Color) => {
    ctx.fillStyle = css(fill);
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k][0], pts[k][1]);
    ctx.closePath();
    ctx.fill();
  };
  quad([[0, 0], [s, 0], [s - i, i], [i, i]], top);
  quad([[0, 0], [i, i], [i, s - i], [0, s]], left);
  quad([[s, 0], [s, s], [s - i, s - i], [s - i, i]], right);
  quad([[0, s], [i, s - i], [s - i, s - i], [s, s]], bottom);

  // Centre table with a soft inner glow.
  ctx.fillStyle = css(table);
  ctx.fillRect(i, i, s - 2 * i, s - 2 * i);
  const glow = ctx.createRadialGradient(
    s / 2,
    s / 2,
    0,
    s / 2,
    s / 2,
    s / 2 - i,
  );
  glow.addColorStop(0, "rgba(255,255,255,0.22)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(i, i, s - 2 * i, s - 2 * i);

  // Thick dark outline at the cell edge. (No star sparkle — removed per
  // user request.)
  ctx.strokeStyle = css(dark);
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.roundRect(5, 5, s - 10, s - 10, 22);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/**
 * Inward offset of a rectilinear CCW polygon (axis-aligned edges only).
 * Each vertex joins one horizontal and one vertical edge; the inset vertex
 * takes its x from the vertical edge's inward-shifted line and its y from
 * the horizontal edge's — mitred corners for free.
 */
function insetRectilinear(
  outline: Array<[number, number]>,
  d: number,
): Array<[number, number]> {
  const n = outline.length;
  const out: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) {
    const prev = outline[(i - 1 + n) % n];
    const v = outline[i];
    const next = outline[(i + 1) % n];
    // Edge directions (axis-aligned unit-ish).
    const dirs: Array<[number, number, number, number]> = [
      [v[0] - prev[0], v[1] - prev[1], prev[0], prev[1]],
      [next[0] - v[0], next[1] - v[1], v[0], v[1]],
    ];
    let x = v[0];
    let y = v[1];
    for (const [dx, dy] of dirs) {
      // CCW interior is to the LEFT: inward normal = (-dy, dx) normalized.
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      if (Math.abs(dx) < 1e-6) x = v[0] + nx * d; // vertical edge fixes x
      if (Math.abs(dy) < 1e-6) y = v[1] + ny * d; // horizontal edge fixes y
    }
    out.push([x, y]);
  }
  return out;
}

type GemVariant = "front" | "back" | "top" | "bottom" | "left" | "right";

/**
 * Per-side table tone: each side is a distinct facet, shaded as if lit
 * consistently from the top (top brightest → bottom darkest). The white
 * light streaks are NOT baked here — they're a single shader band function
 * over piece-local (x + y), so a streak crossing the front continues onto
 * whichever wall it meets (see makeGemStickerMaterial).
 */
const GEM_VARIANTS: Record<GemVariant, { table: number }> = {
  front: { table: 0.1 },
  back: { table: 0.02 },
  top: { table: 0.16 },
  bottom: { table: -0.08 },
  left: { table: 0.06 },
  right: { table: -0.02 },
};

/**
 * A GEM face texture — the gembricks key-art recipe fitted to a WHOLE
 * rectangle/silhouette: mitred jewel frame following the outline (lit top
 * / mid left / shaded right / dark bottom trapezoids), an inner face
 * carrying the side's own shine treatment, and a thick dark outline. The
 * `variant` makes each of the piece's six sides a distinct facet: front
 * ↗ streak pair, back mirrored ↖, top a bright horizontal sheen, bottom
 * plain dark, left/right thin opposing streaks. All drawn — the art's
 * "rim" is a 2D effect, not 3D shading.
 */
function makeGemFaceTexture(
  outline: Array<[number, number]>,
  base: THREE.Color,
  variant: GemVariant,
): { tex: THREE.CanvasTexture; w: number; h: number } {
  const S = 96; // px per cell
  let w = 0;
  let h = 0;
  for (const [x, y] of outline) {
    if (x > w) w = x;
    if (y > h) h = y;
  }
  const c = document.createElement("canvas");
  c.width = w * S;
  c.height = h * S;
  const ctx = c.getContext("2d")!;

  // Shape-space → canvas (three flips canvas textures, so flip y here).
  const px = (x: number) => x * S;
  const py = (y: number) => (h - y) * S;
  const trace = (pts: Array<[number, number]>) => {
    ctx.beginPath();
    ctx.moveTo(px(pts[0][0]), py(pts[0][1]));
    for (let i = 1; i < pts.length; i++) ctx.lineTo(px(pts[i][0]), py(pts[i][1]));
    ctx.closePath();
  };

  const spec = GEM_VARIANTS[variant];
  const light = base.clone().offsetHSL(0, 0.03, 0.24);
  const midL = base.clone().offsetHSL(0, 0.02, 0.12);
  const midD = base.clone().offsetHSL(0, 0.04, -0.06);
  const darkF = base.clone().offsetHSL(0, 0.05, -0.16);
  const table = base.clone().offsetHSL(0, 0.04, spec.table);
  const outlineCol = base.clone().offsetHSL(0, 0.06, -0.27);

  const inset = insetRectilinear(outline, 0.2);

  // 1. Frame trapezoids: outer edge → inset edge, coloured by which way
  // the edge faces (light from the top-left, like the jewel facets).
  const n = outline.length;
  for (let i = 0; i < n; i++) {
    const a = outline[i];
    const b = outline[(i + 1) % n];
    const ai = inset[i];
    const bi = inset[(i + 1) % n];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    // Inward normal (CCW interior left): (-dy, dx).
    let fill: THREE.Color;
    if (Math.abs(dy) < 1e-6) {
      fill = dx < 0 ? light : darkF; // CCW: top edges run -x (light), bottom +x (dark)
    } else {
      fill = dy < 0 ? midL : midD; // CCW: left edges run -y (mid-light), right +y (mid-dark)
    }
    ctx.fillStyle = css(fill);
    ctx.beginPath();
    ctx.moveTo(px(a[0]), py(a[1]));
    ctx.lineTo(px(b[0]), py(b[1]));
    ctx.lineTo(px(bi[0]), py(bi[1]));
    ctx.lineTo(px(ai[0]), py(ai[1]));
    ctx.closePath();
    ctx.fill();
  }

  // 2. Inner face — flat table tone; the light streaks come from the
  // shared shader band (makeGemStickerMaterial), not the bake.
  trace(inset);
  ctx.fillStyle = css(table);
  ctx.fill();

  // 3. Thick dark outline around the silhouette.
  trace(outline);
  ctx.strokeStyle = css(outlineCol);
  ctx.lineWidth = 0.1 * S;
  ctx.lineJoin = "miter";
  ctx.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  // Extrude lid UVs are raw shape coords (0..w, 0..h) — map to [0,1].
  tex.repeat.set(1 / w, 1 / h);
  return { tex, w, h };
}

/**
 * A NEON face texture — the GEM silhouette treatment reimagined as a neon
 * sign: near-black body tinted by the piece colour, a glowing tube running
 * along the frame inset (bright piece colour with a white-hot core), and a
 * thin dark silhouette edge so pieces still separate against bright skies.
 * The glow is uniform on every side on purpose — neon tubes light evenly,
 * unlike the gem's per-side facet tables.
 */
function makeNeonFaceTexture(
  outline: Array<[number, number]>,
  base: THREE.Color,
): THREE.CanvasTexture {
  const S = 96;
  let w = 0;
  let h = 0;
  for (const [x, y] of outline) {
    if (x > w) w = x;
    if (y > h) h = y;
  }
  const c = document.createElement("canvas");
  c.width = w * S;
  c.height = h * S;
  const ctx = c.getContext("2d")!;
  const px = (x: number) => x * S;
  const py = (y: number) => (h - y) * S;
  const trace = (pts: Array<[number, number]>) => {
    ctx.beginPath();
    ctx.moveTo(px(pts[0][0]), py(pts[0][1]));
    for (let i = 1; i < pts.length; i++) ctx.lineTo(px(pts[i][0]), py(pts[i][1]));
    ctx.closePath();
  };

  const bodyEdge = base.clone().multiplyScalar(0.16);
  const body = base.clone().multiplyScalar(0.09);
  const tube = base.clone().offsetHSL(0, 0.12, 0.16);
  const core = base.clone().lerp(new THREE.Color(1, 1, 1), 0.72);

  // Dark body — the frame band sits a notch lighter than the inner face
  // so the silhouette keeps a hint of the gem's depth.
  trace(outline);
  ctx.fillStyle = css(bodyEdge);
  ctx.fill();
  const inset = insetRectilinear(outline, 0.2);
  trace(inset);
  ctx.fillStyle = css(body);
  ctx.fill();

  // Neon tube on the frame line: soft glow pass (twice, to accumulate),
  // then the white-hot core.
  ctx.lineJoin = "miter";
  trace(inset);
  ctx.strokeStyle = css(tube);
  ctx.lineWidth = 0.09 * S;
  ctx.shadowColor = css(tube);
  ctx.shadowBlur = 0.24 * S;
  ctx.stroke();
  ctx.stroke();
  ctx.shadowBlur = 0;
  trace(inset);
  ctx.strokeStyle = css(core);
  ctx.lineWidth = 0.035 * S;
  ctx.stroke();

  // Thin dark silhouette edge.
  trace(outline);
  ctx.strokeStyle = css(base.clone().multiplyScalar(0.05));
  ctx.lineWidth = 0.07 * S;
  ctx.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.repeat.set(1 / w, 1 / h);
  return tex;
}

type CandyKind = "stripe" | "swirl" | "donut" | "choc" | "gummy" | "biscuit";

/**
 * Per-piece candy treatments — one per piece TYPE in the candy.png key
 * art: the white/pink/blue marshmallow stick, the green-pink peppermint
 * swirl square, the chocolate-cake donut with white icing + sprinkles +
 * a pink heart, teal and magenta glossy gummies, the maroon segmented
 * chocolate bar, and the iced wafer biscuit. Deliberately NOT colour-coded
 * by piece — like the Tricky Towers candy pack, the theme replaces the
 * palette.
 */
const CANDY_SPECS: Record<
  TetrominoKey,
  { kind: CandyKind; a: string; b: string; c?: string }
> = {
  I: { kind: "stripe", a: "#fdfbf7", b: "#f26a9a", c: "#86c8ec" },
  O: { kind: "donut", a: "#8a5636", b: "#fff6f8", c: "#f491b2" },
  T: { kind: "swirl", a: "#faf3e0", b: "#e75d7a", c: "#7cc98f" },
  S: { kind: "gummy", a: "#e8447c", b: "#ffffff" },
  Z: { kind: "biscuit", a: "#d9ae7e", b: "#f2e2c8", c: "#f4a0bc" },
  J: { kind: "gummy", a: "#35c4b5", b: "#ffffff" },
  L: { kind: "choc", a: "#66323a", b: "#8a4a54" },
};

/**
 * Which face of the piece a bake is for. Directional details (icing caps,
 * gloss, wafer layers) only make sense where the texture's axes match the
 * world: the LIDS and the up-facing TOP walls. On side walls u runs along
 * the outline edge and v along the depth, so anything directional would
 * render sideways — sides and bottoms stay plain body colour, which also
 * keeps every wall consistent with the lid material it meets at the edge.
 */
type CandyFace = "lid" | "top" | "bottom" | "side";

/**
 * One wall of the extruded piece: the outline edge it was built from, in
 * piece corner space. u runs a→b along the edge (CCW: left walls travel
 * downward, right walls upward), v across the depth.
 */
interface WallEdge {
  dir: "top" | "bottom" | "left" | "right";
  len: number;
  a: [number, number];
  b: [number, number];
}

const SPRINKLE_COLORS = ["#f2789f", "#54c8c0", "#f7c948", "#8e6cf1", "#ffffff"];

/** Tiny deterministic hash → [0,1) so bakes are stable across reloads. */
function hash01(...ns: number[]): number {
  let h = 2166136261;
  for (const n of ns) {
    h ^= Math.imul(n + 1, 2654435761);
    h = Math.imul(h ^ (h >>> 13), 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

/**
 * A CANDY brick face — whole-silhouette bake in one of four treatments
 * (see CANDY_SPECS). Swirl only makes sense on the lids; walls of the
 * swirl piece fall back to stripes.
 */
function makeCandyBrickTexture(
  outline: Array<[number, number]>,
  key: TetrominoKey,
  face: CandyFace,
  edge?: WallEdge,
): THREE.CanvasTexture {
  const spec = CANDY_SPECS[key];
  const S = 96;
  let w = 0;
  let h = 0;
  for (const [x, y] of outline) {
    if (x > w) w = x;
    if (y > h) h = y;
  }
  const c = document.createElement("canvas");
  c.width = w * S;
  c.height = h * S;
  const ctx = c.getContext("2d")!;
  const px = (x: number) => x * S;
  const py = (y: number) => (h - y) * S;
  const trace = (pts: Array<[number, number]>) => {
    ctx.beginPath();
    ctx.moveTo(px(pts[0][0]), py(pts[0][1]));
    for (let i = 1; i < pts.length; i++) ctx.lineTo(px(pts[i][0]), py(pts[i][1]));
    ctx.closePath();
  };
  const base = new THREE.Color(spec.a);

  ctx.save();
  trace(outline);
  ctx.clip();
  ctx.fillStyle = spec.a;
  ctx.fillRect(0, 0, c.width, c.height);

  const isLid = face === "lid";
  // Cell list: real cells on lids, a 1-high row for walls. Used to find
  // "top-exposed" cells (no neighbour above) for icing/gloss placement.
  const cells: Array<[number, number]> = isLid
    ? TETROMINOES[key].map((cc) => [cc[0], cc[1]])
    : Array.from({ length: Math.round(w) }, (_, i) => [i, 0]);
  const hasCell = (x: number, y: number) =>
    cells.some(([cx2, cy2]) => cx2 === x && cy2 === y);
  const topExposed = cells.filter(([cx2, cy2]) => !hasCell(cx2, cy2 + 1));
  const kk = key.charCodeAt(0);
  // Real piece dimensions (walls' own outline is just a len×1 rect).
  const pieceCells = TETROMINOES[key];
  const pieceW = Math.max(...pieceCells.map((c2) => c2[0])) + 1;
  const pieceH = Math.max(...pieceCells.map((c2) => c2[1])) + 1;
  // World y → wall u (CCW: right walls travel upward, left walls down).
  const uOf = (y: number) => (edge!.dir === "right" ? y - edge!.a[1] : edge!.a[1] - y);
  const wallSpan = (yA: number, yB: number, color: string) => {
    const u0 = Math.min(uOf(yA), uOf(yB));
    const u1 = Math.max(uOf(yA), uOf(yB));
    ctx.fillStyle = color;
    ctx.fillRect(u0 * S, 0, (u1 - u0) * S, c.height);
  };

  const kind = spec.kind;

  if (kind === "stripe") {
    // Diagonal marshmallow-stick bands along x+y, alternating b / c.
    const bandW = 0.34;
    const period = 0.95;
    let i = 0;
    for (let t = -h - period; t < w + h + period; t += period, i++) {
      ctx.fillStyle = i % 2 === 0 || !spec.c ? spec.b : spec.c;
      ctx.beginPath();
      ctx.moveTo(px(t), py(0));
      ctx.lineTo(px(t + bandW), py(0));
      ctx.lineTo(px(t + bandW - h), py(h));
      ctx.lineTo(px(t - h), py(h));
      ctx.closePath();
      ctx.fill();
    }
  } else if (kind === "swirl") {
    // Peppermint pinwheel on the lids only (green + pink-red arms); every
    // wall is the plain cream candy body so edges meet cleanly.
    if (isLid) {
      const cx = px(w / 2);
      const cy = py(h / 2);
      const R = Math.hypot(c.width, c.height);
      const wedges = 10;
      for (let i = 0; i < wedges; i++) {
        if (i % 2 === 0) continue;
        const a0 = (i / wedges) * Math.PI * 2;
        const a1 = ((i + 1) / wedges) * Math.PI * 2;
        // Slight angular skew makes it read as a swirl, not a starburst.
        const skew = 0.35;
        ctx.fillStyle = i % 4 === 1 ? spec.b : spec.c ?? spec.b;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, R, a0 + skew, a1 + skew);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = spec.a;
      ctx.beginPath();
      ctx.arc(cx, cy, 0.16 * S, 0, Math.PI * 2);
      ctx.fill();
    } else if (edge) {
      // Walls: the pinwheel colours continue straight through the depth —
      // sample the lid pattern along this edge, one strip per step, so the
      // wall colour always matches the lid colour it touches.
      const skew = 0.35;
      const wedges = 10;
      const ux = (edge.b[0] - edge.a[0]) / edge.len;
      const uy = (edge.b[1] - edge.a[1]) / edge.len;
      const steps = Math.max(8, Math.round(edge.len * 24));
      for (let i = 0; i < steps; i++) {
        const t = ((i + 0.5) / steps) * edge.len;
        const sx2 = edge.a[0] + ux * t;
        const sy2 = edge.a[1] + uy * t;
        // Same angle convention as the lid draw (canvas y is flipped).
        const theta = Math.atan2(pieceH / 2 - sy2, sx2 - pieceW / 2);
        const ang =
          (((theta - skew) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const ii = Math.floor(ang / ((Math.PI * 2) / wedges));
        ctx.fillStyle =
          ii % 2 === 0 ? spec.a : ii % 4 === 1 ? spec.b : spec.c ?? spec.b;
        ctx.fillRect(
          (i / steps) * edge.len * S - 0.5,
          0,
          (edge.len / steps) * S + 1,
          c.height,
        );
      }
    }
  } else if (kind === "donut") {
    // The donut cube: chocolate cake base (already filled with spec.a).
    // Lid: icing cap with scalloped drips + sprinkles + heart. Top wall:
    // solid icing + sprinkles (that IS the icing surface seen from above).
    // Side/bottom walls: plain cake, meeting the lid's cake at the edges.
    const icingY = face === "top" ? -0.3 : h * 0.48;
    if (face === "lid" || face === "top") {
      ctx.fillStyle = spec.b;
      ctx.beginPath();
      ctx.moveTo(px(-0.2), py(h + 0.2));
      ctx.lineTo(px(w + 0.2), py(h + 0.2));
      ctx.lineTo(px(w + 0.2), py(icingY));
      if (face === "lid") {
        const steps = Math.max(3, Math.round(w * 3));
        for (let i = steps; i >= 0; i--) {
          const x = (i / steps) * w;
          const depth = 0.1 + hash01(kk, i) * 0.2;
          const yy = icingY - (i % 2 === 0 ? depth : -0.04);
          ctx.quadraticCurveTo(
            px(x + w / steps / 2),
            py(icingY - (i % 2 === 0 ? -0.06 : depth)),
            px(x),
            py(yy),
          );
        }
      } else {
        ctx.lineTo(px(-0.2), py(icingY));
      }
      ctx.closePath();
      ctx.fill();
      const count = Math.round(w * 6);
      for (let i = 0; i < count; i++) {
        const sx = hash01(i, 3) * w;
        const sy =
          face === "top"
            ? 0.08 + hash01(i, 7) * (h - 0.16)
            : icingY + hash01(i, 7) * (h - icingY) * 0.85 + 0.08;
        const ang = hash01(i, 11) * Math.PI;
        ctx.save();
        ctx.translate(px(sx), py(sy));
        ctx.rotate(ang);
        ctx.fillStyle =
          SPRINKLE_COLORS[Math.floor(hash01(i, 13) * SPRINKLE_COLORS.length)];
        ctx.beginPath();
        ctx.roundRect(-0.055 * S, -0.018 * S, 0.11 * S, 0.036 * S, 0.018 * S);
        ctx.fill();
        ctx.restore();
      }
    } else if (face === "side" && edge) {
      // Side walls: icing exactly where the lid has it (above the piece's
      // icing line), cake below — so the wall matches the lid at the edge.
      const yLo = Math.min(edge.a[1], edge.b[1]);
      const yHi = Math.max(edge.a[1], edge.b[1]);
      const icingWY = pieceH * 0.48;
      if (yHi > icingWY) {
        const y0 = Math.max(icingWY, yLo);
        wallSpan(y0, yHi, spec.b);
        const u0 = Math.min(uOf(y0), uOf(yHi));
        const u1 = Math.max(uOf(y0), uOf(yHi));
        const count = Math.round((u1 - u0) * 4) + 1;
        for (let i = 0; i < count; i++) {
          const sx2 = u0 + hash01(kk, i, 41) * (u1 - u0);
          const sy2 = 0.12 + hash01(kk, i, 43) * 0.76;
          const ang = hash01(kk, i, 45) * Math.PI;
          ctx.save();
          ctx.translate(sx2 * S, sy2 * S);
          ctx.rotate(ang);
          ctx.fillStyle =
            SPRINKLE_COLORS[
              Math.floor(hash01(kk, i, 47) * SPRINKLE_COLORS.length)
            ];
          ctx.beginPath();
          ctx.roundRect(-0.055 * S, -0.018 * S, 0.11 * S, 0.036 * S, 0.018 * S);
          ctx.fill();
          ctx.restore();
        }
      }
    }
    if (isLid && spec.c) {
      // Pink heart(s) on the cake below the icing.
      const heart = (hx: number, hy: number, r: number) => {
        ctx.fillStyle = spec.c!;
        ctx.beginPath();
        ctx.moveTo(hx, hy + r * 0.9);
        ctx.bezierCurveTo(hx - r * 1.15, hy, hx - r * 0.6, hy - r * 0.85, hx, hy - r * 0.25);
        ctx.bezierCurveTo(hx + r * 0.6, hy - r * 0.85, hx + r * 1.15, hy, hx, hy + r * 0.9);
        ctx.fill();
      };
      const nHearts = Math.max(1, Math.round(w / 2.5));
      for (let i = 0; i < nHearts; i++) {
        const hx = Math.min(
          w - 0.3,
          Math.max(0.3, (0.4 + i * 1.9 + hash01(kk, i, 21) * 0.6) % w),
        );
        heart(px(hx), py(icingY * (0.28 + hash01(kk, i, 23) * 0.35)), 0.14 * S);
      }
    }
  } else if (kind === "gummy") {
    // Solid glossy jelly: lighter inner rim on every face; white gloss
    // streaks only where they read as "up" — the lids' top-exposed cells
    // and the up-facing top walls.
    ctx.strokeStyle = css(base.clone().offsetHSL(0, 0.02, 0.14));
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = 0.07 * S;
    ctx.lineJoin = "miter";
    trace(insetRectilinear(outline, 0.12));
    ctx.stroke();
    ctx.globalAlpha = 1;
    const glossCells =
      face === "lid" || face === "top" ? topExposed : [];
    for (const [gx, gy] of glossCells) {
      ctx.fillStyle = spec.b;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.roundRect(
        px(gx + 0.14),
        py(gy + 0.88),
        0.52 * S,
        0.14 * S,
        0.07 * S,
      );
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px(gx + 0.78), py(gy + 0.81), 0.045 * S, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  } else if (kind === "biscuit") {
    // Iced wafer. Lid: cream layer through each cell row + pink icing on
    // top-exposed cells. Top wall: solid icing + dashes (the icing surface
    // from above). Side/bottom walls: plain biscuit, meeting the lid's tan.
    if (face === "top") {
      ctx.fillStyle = spec.c ?? "#f4a0bc";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 0.028 * S;
      ctx.lineCap = "round";
      const dashes = Math.round(w * 5);
      for (let i = 0; i < dashes; i++) {
        const sx = hash01(kk, i, 31) * w;
        const sy = 0.15 + hash01(kk, i, 33) * (h - 0.3);
        const ang = hash01(kk, i, 35) * Math.PI;
        ctx.beginPath();
        ctx.moveTo(px(sx) - Math.cos(ang) * 0.05 * S, py(sy) - Math.sin(ang) * 0.05 * S);
        ctx.lineTo(px(sx) + Math.cos(ang) * 0.05 * S, py(sy) + Math.sin(ang) * 0.05 * S);
        ctx.stroke();
      }
    }
    if (face === "side" && edge) {
      // Side walls: cream layers and icing caps at their true world
      // heights, so they line up with the lid's layers at the edge.
      const yLo = Math.min(edge.a[1], edge.b[1]);
      const yHi = Math.max(edge.a[1], edge.b[1]);
      for (let r = Math.floor(yLo); r < yHi; r++) {
        const s0 = Math.max(yLo, r + 0.4);
        const s1 = Math.min(yHi, r + 0.56);
        if (s1 > s0) wallSpan(s0, s1, spec.b);
      }
      // Icing lip where the adjacent top cell is exposed.
      const inX = edge.dir === "left" ? edge.a[0] : edge.a[0] - 1;
      const capped =
        pieceCells.some((c2) => c2[0] === inX && c2[1] === yHi - 1) &&
        !pieceCells.some((c2) => c2[0] === inX && c2[1] === yHi);
      if (capped) wallSpan(yHi - 0.3, yHi, spec.c ?? "#f4a0bc");
    }
    const rows = isLid ? new Set(cells.map(([, cy2]) => cy2)) : new Set<number>();
    ctx.fillStyle = spec.b;
    for (const gy of rows) {
      ctx.fillRect(px(-0.2), py(gy + 0.56), (w + 0.4) * S, 0.16 * S);
    }
    const icedCells = isLid ? topExposed : [];
    for (const [gx, gy] of icedCells) {
      // Icing cap with a softly wavy bottom edge.
      ctx.fillStyle = spec.c ?? "#f4a0bc";
      ctx.beginPath();
      ctx.moveTo(px(gx - 0.02), py(gy + 1));
      ctx.lineTo(px(gx + 1.02), py(gy + 1));
      ctx.lineTo(px(gx + 1.02), py(gy + 0.78));
      ctx.quadraticCurveTo(px(gx + 0.75), py(gy + 0.62), px(gx + 0.5), py(gy + 0.74));
      ctx.quadraticCurveTo(px(gx + 0.25), py(gy + 0.86), px(gx - 0.02), py(gy + 0.7));
      ctx.closePath();
      ctx.fill();
      // White sprinkle dashes on the icing.
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 0.028 * S;
      ctx.lineCap = "round";
      for (let i = 0; i < 5; i++) {
        const sx = gx + 0.12 + hash01(kk, gx, gy, i) * 0.75;
        const sy = gy + 0.78 + hash01(kk, gx, gy, i + 9) * 0.16;
        const ang = hash01(kk, gx, gy, i + 17) * Math.PI;
        ctx.beginPath();
        ctx.moveTo(px(sx) - Math.cos(ang) * 0.05 * S, py(sy) - Math.sin(ang) * 0.05 * S);
        ctx.lineTo(px(sx) + Math.cos(ang) * 0.05 * S, py(sy) + Math.sin(ang) * 0.05 * S);
        ctx.stroke();
      }
    }
  } else {
    // Chocolate bar: maroon per-cell segments with a soft bevel and a
    // faint diagonal sheen inside each segment (no drizzle — the key art
    // chocolate is plain).
    const light = base.clone().offsetHSL(0, 0.02, 0.09);
    const dark = base.clone().offsetHSL(0, 0.02, -0.12);
    for (let gx = 0; gx < w; gx++) {
      for (let gy = 0; gy < h; gy++) {
        const m = 0.09;
        ctx.fillStyle = css(dark);
        ctx.fillRect(px(gx), py(gy + 1), S, S);
        ctx.fillStyle = css(base);
        ctx.beginPath();
        ctx.roundRect(
          px(gx + m),
          py(gy + 1 - m),
          (1 - 2 * m) * S,
          (1 - 2 * m) * S,
          0.08 * S,
        );
        ctx.fill();
        // Faint diagonal sheen lines, clipped to the segment.
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(
          px(gx + m),
          py(gy + 1 - m),
          (1 - 2 * m) * S,
          (1 - 2 * m) * S,
          0.08 * S,
        );
        ctx.clip();
        ctx.strokeStyle = css(light);
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 0.05 * S;
        for (let i = 0; i < 3; i++) {
          const off = 0.2 + i * 0.3;
          ctx.beginPath();
          ctx.moveTo(px(gx + off - 0.3), py(gy));
          ctx.lineTo(px(gx + off + 0.3), py(gy + 1));
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.restore();
      }
    }
  }

  // Soft gloss sheen across the top-left, shared by every treatment.
  const sheen = ctx.createLinearGradient(0, 0, c.width, c.height);
  sheen.addColorStop(0, "rgba(255,255,255,0.30)");
  sheen.addColorStop(0.35, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.restore();

  // Outline in a darkened base tone.
  trace(outline);
  ctx.strokeStyle = css(base.clone().offsetHSL(0, 0.05, -0.3));
  ctx.lineWidth = 0.08 * S;
  ctx.lineJoin = "miter";
  ctx.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.repeat.set(1 / w, 1 / h);
  return tex;
}

/**
 * Per-piece galaxy tones (galaxy.png key art): the whole pack lives in a
 * violet↔magenta family rather than the gameplay palette.
 */
const GALAXY_TONES: Record<TetrominoKey, string> = {
  I: "#c437b9",
  O: "#8a4fd0",
  T: "#6d35b8",
  S: "#d4589e",
  Z: "#7b3fbf",
  J: "#5b2fa8",
  L: "#b04ad2",
};

/**
 * A GALAXY brick face — vertical light→dark purple gradient, a beveled
 * frame following the silhouette (lit top / dark bottom, like the key
 * art's rim), and white four-point star sparkles with a few dust dots.
 */
function makeGalaxyFaceTexture(
  outline: Array<[number, number]>,
  key: TetrominoKey,
): THREE.CanvasTexture {
  const S = 96;
  let w = 0;
  let h = 0;
  for (const [x, y] of outline) {
    if (x > w) w = x;
    if (y > h) h = y;
  }
  const c = document.createElement("canvas");
  c.width = w * S;
  c.height = h * S;
  const ctx = c.getContext("2d")!;
  const px = (x: number) => x * S;
  const py = (y: number) => (h - y) * S;
  const trace = (pts: Array<[number, number]>) => {
    ctx.beginPath();
    ctx.moveTo(px(pts[0][0]), py(pts[0][1]));
    for (let i = 1; i < pts.length; i++) ctx.lineTo(px(pts[i][0]), py(pts[i][1]));
    ctx.closePath();
  };
  const base = new THREE.Color(GALAXY_TONES[key]);
  const top = base.clone().offsetHSL(0, 0.04, 0.16);
  const bottom = base.clone().offsetHSL(0, 0.04, -0.15);

  ctx.save();
  trace(outline);
  ctx.clip();
  const grad = ctx.createLinearGradient(0, 0, 0, c.height);
  grad.addColorStop(0, css(top));
  grad.addColorStop(1, css(bottom));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.restore();

  // Beveled frame: outer edge → inset, lit by edge direction like the gem.
  const inset = insetRectilinear(outline, 0.14);
  const n = outline.length;
  for (let i = 0; i < n; i++) {
    const a = outline[i];
    const b = outline[(i + 1) % n];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    let fill: THREE.Color;
    if (Math.abs(dy) < 1e-6) {
      fill =
        dx < 0
          ? base.clone().offsetHSL(0, 0.02, 0.26)
          : base.clone().offsetHSL(0, 0.04, -0.24);
    } else {
      fill =
        dy < 0
          ? base.clone().offsetHSL(0, 0.02, 0.1)
          : base.clone().offsetHSL(0, 0.03, -0.1);
    }
    ctx.fillStyle = css(fill);
    ctx.beginPath();
    ctx.moveTo(px(a[0]), py(a[1]));
    ctx.lineTo(px(b[0]), py(b[1]));
    ctx.lineTo(px(inset[(i + 1) % n][0]), py(inset[(i + 1) % n][1]));
    ctx.lineTo(px(inset[i][0]), py(inset[i][1]));
    ctx.closePath();
    ctx.fill();
  }

  // Star sparkles: a couple per cell, deterministic positions.
  const drawStar = (cx: number, cy: number, r: number, alpha: number) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(255,255,255,0.9)";
    ctx.shadowBlur = r * 0.9;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.quadraticCurveTo(cx, cy, cx + r, cy);
    ctx.quadraticCurveTo(cx, cy, cx, cy + r);
    ctx.quadraticCurveTo(cx, cy, cx - r, cy);
    ctx.quadraticCurveTo(cx, cy, cx, cy - r);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
  const k = key.charCodeAt(0);
  for (let gx = 0; gx < w; gx++) {
    for (let gy = 0; gy < h; gy++) {
      const r1 = hash01(k, gx, gy, 1);
      if (r1 > 0.35) {
        drawStar(
          px(gx + 0.25 + hash01(k, gx, gy, 2) * 0.5),
          py(gy + 0.25 + hash01(k, gx, gy, 3) * 0.5),
          (0.07 + hash01(k, gx, gy, 4) * 0.08) * S,
          0.95,
        );
      }
      // Dust dot.
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(
        px(gx + hash01(k, gx, gy, 5)),
        py(gy + hash01(k, gx, gy, 6)),
        0.018 * S,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  // Dark outline.
  trace(outline);
  ctx.strokeStyle = css(base.clone().offsetHSL(0, 0.05, -0.3));
  ctx.lineWidth = 0.07 * S;
  ctx.lineJoin = "miter";
  ctx.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.repeat.set(1 / w, 1 / h);
  return tex;
}

/**
 * Custom GEM geometry: front/back lids (ShapeGeometry, UV = shape coords)
 * plus one explicit quad per outline edge, each its OWN material group.
 * Group order = [front, back, ...edges]; skins build their material array
 * to match, sharing material instances across edges when the bake doesn't
 * depend on the edge's position.
 */
function buildGemGeometry(
  outline: Array<[number, number]>,
  cx: number,
  cy: number,
): { geo: THREE.BufferGeometry; edges: WallEdge[] } {
  const shape = new THREE.Shape();
  shape.moveTo(outline[0][0], outline[0][1]);
  for (let i = 1; i < outline.length; i++) {
    shape.lineTo(outline[i][0], outline[i][1]);
  }
  shape.closePath();

  const front = new THREE.ShapeGeometry(shape);
  front.translate(0, 0, 0.5);

  // Back lid: same triangulation, reversed winding, flipped normals.
  const back = new THREE.ShapeGeometry(shape);
  const bIdx = back.getIndex()!;
  for (let i = 0; i < bIdx.count; i += 3) {
    const a = bIdx.getX(i);
    const cc = bIdx.getX(i + 2);
    bIdx.setX(i, cc);
    bIdx.setX(i + 2, a);
  }
  const bN = back.getAttribute("normal");
  for (let i = 0; i < bN.count; i++) bN.setXYZ(i, 0, 0, -1);
  back.translate(0, 0, -0.5);

  // One group PER EDGE (no merging) so position-aware skins (candy icing
  // heights, swirl continuation) can bake each wall exactly; skins that
  // don't need position share materials across edges instead.
  const inputs: THREE.BufferGeometry[] = [front, back];
  const edges: WallEdge[] = [];
  const n = outline.length;
  for (let i = 0; i < n; i++) {
    const a = outline[i];
    const b = outline[(i + 1) % n];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.abs(dx) + Math.abs(dy);
    // Outward normal for a CCW outline = the edge's RIGHT normal (dy, -dx).
    const nx = Math.sign(dy);
    const ny = -Math.sign(dx);
    const dir: WallEdge["dir"] =
      ny < 0 ? "bottom" : ny > 0 ? "top" : nx < 0 ? "left" : "right";

    const quad = new THREE.BufferGeometry();
    quad.setAttribute(
      "position",
      new THREE.BufferAttribute(
        new Float32Array([
          a[0], a[1], -0.5,
          b[0], b[1], -0.5,
          b[0], b[1], 0.5,
          a[0], a[1], 0.5,
        ]),
        3,
      ),
    );
    quad.setAttribute(
      "normal",
      new THREE.BufferAttribute(
        new Float32Array([nx, ny, 0, nx, ny, 0, nx, ny, 0, nx, ny, 0]),
        3,
      ),
    );
    // u runs 0..len along the wall (cell units), v 0..1 across the depth —
    // the wall texture spans the WHOLE rectangle, no per-cell tiling.
    quad.setAttribute(
      "uv",
      new THREE.BufferAttribute(new Float32Array([0, 0, len, 0, len, 1, 0, 1]), 2),
    );
    quad.setIndex([0, 1, 2, 0, 2, 3]);
    inputs.push(quad);
    edges.push({ dir, len, a: [a[0], a[1]], b: [b[0], b[1]] });
  }

  const geo = mergeGeometries(inputs, true)!;
  geo.translate(-(cx + 0.5), -(cy + 0.5), 0);
  inputs.forEach((g) => g.dispose());
  return { geo, edges };
}

/**
 * Tetromino mesh factory with five selectable skins. A live piece is a
 * Group holding a single Mesh:
 *
 * - CLASSIC — merged touching cubes + thin dark cell-separator edge lines.
 * - CANDY / JEWEL — merged cubes whose every face carries a baked sticker
 *   (candy gloss / faceted jewel brick) — readable from all angles.
 * - GEM — ONE whole extruded silhouette shaded like the gembricks key art:
 *   mitred bevel frame following the outline + diagonal light streaks.
 * - GLOSSY — the extruded silhouette in clearcoat physical material.
 *
 * Physics is per-cell 1×1×1 cuboids via colliderOffsets in every skin.
 */
export class TetrominoFactory {
  private classicGeoByKey = new Map<TetrominoKey, THREE.BufferGeometry>();
  private extrudedGeoByKey = new Map<TetrominoKey, THREE.BufferGeometry>();
  private edgesGeoByKey = new Map<TetrominoKey, THREE.BufferGeometry>();
  private offsetsByKey = new Map<
    TetrominoKey,
    Array<[number, number, number]>
  >();
  private centroidByKey = new Map<TetrominoKey, [number, number, number]>();

  private classicMatByKey = new Map<TetrominoKey, THREE.MeshToonMaterial>();
  private edgeMatByKey = new Map<TetrominoKey, THREE.LineBasicMaterial>();
  private glossyMatByKey = new Map<TetrominoKey, THREE.MeshToonMaterial>();
  private glossyTexByKey = new Map<TetrominoKey, THREE.CanvasTexture>();
  private jewelMatByKey = new Map<TetrominoKey, THREE.MeshToonMaterial>();
  private jewelTexByKey = new Map<TetrominoKey, THREE.CanvasTexture>();
  private gemGeoByKey = new Map<TetrominoKey, THREE.BufferGeometry>();
  private gemMatsByKey = new Map<TetrominoKey, THREE.Material[]>();
  private gemTexByKey = new Map<TetrominoKey, THREE.CanvasTexture[]>();
  private neonMatsByKey = new Map<TetrominoKey, THREE.Material[]>();
  private neonTexByKey = new Map<TetrominoKey, THREE.CanvasTexture[]>();
  private candyMatsByKey = new Map<TetrominoKey, THREE.Material[]>();
  private candyBrickTexByKey = new Map<TetrominoKey, THREE.CanvasTexture[]>();
  private galaxyMatsByKey = new Map<TetrominoKey, THREE.Material[]>();
  private galaxyTexByKey = new Map<TetrominoKey, THREE.CanvasTexture[]>();
  private smoothMatByKey = new Map<TetrominoKey, THREE.MeshPhysicalMaterial>();

  constructor(envMap: THREE.Texture | null = null) {
    const unitBox = new THREE.BoxGeometry(1, 1, 1);
    const unitEdges = new THREE.EdgesGeometry(unitBox);

    for (const key of Object.keys(TETROMINOES) as TetrominoKey[]) {
      const cells = TETROMINOES[key];
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      let minZ = Infinity, maxZ = -Infinity;
      for (const cc of cells) {
        if (cc[0] < minX) minX = cc[0];
        if (cc[0] > maxX) maxX = cc[0];
        if (cc[1] < minY) minY = cc[1];
        if (cc[1] > maxY) maxY = cc[1];
        if (cc[2] < minZ) minZ = cc[2];
        if (cc[2] > maxZ) maxZ = cc[2];
      }
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      const cz = (minZ + maxZ) / 2;

      const offsets: Array<[number, number, number]> = cells.map((cc) => [
        cc[0] - cx,
        cc[1] - cy,
        cc[2] - cz,
      ]);
      this.offsetsByKey.set(key, offsets);
      this.centroidByKey.set(key, [cx, cy, cz]);

      // Merged cubes (CLASSIC/CANDY/JEWEL) + merged per-cell edge lines.
      const boxParts = offsets.map((o) =>
        unitBox.clone().translate(o[0], o[1], o[2]),
      );
      const edgeParts = offsets.map((o) =>
        unitEdges.clone().translate(o[0], o[1], o[2]),
      );
      this.classicGeoByKey.set(key, mergeGeometries(boxParts, false)!);
      this.edgesGeoByKey.set(key, mergeGeometries(edgeParts, false)!);
      [...boxParts, ...edgeParts].forEach((g) => g.dispose());

      // ONE whole extruded silhouette (GEM/GLOSSY).
      const outline = OUTLINES[key];
      const shape = new THREE.Shape();
      shape.moveTo(outline[0][0], outline[0][1]);
      for (let i = 1; i < outline.length; i++) {
        shape.lineTo(outline[i][0], outline[i][1]);
      }
      shape.closePath();
      const extruded = new THREE.ExtrudeGeometry(shape, {
        depth: EXTRUDE_DEPTH,
        bevelEnabled: true,
        bevelThickness: BEVEL,
        bevelSize: BEVEL,
        bevelOffset: -BEVEL, // cut inward — outer bounds stay cell-exact
        bevelSegments: 2,
        curveSegments: 4,
      });
      // Corner space → piece-local center space (matches colliderOffsets),
      // and center the 1-unit total depth on z=0.
      extruded.translate(-(cx + 0.5), -(cy + 0.5), -EXTRUDE_DEPTH / 2);
      this.extrudedGeoByKey.set(key, extruded);

      // Materials.
      const base = new THREE.Color(TETROMINO_COLORS[key]);
      this.classicMatByKey.set(
        key,
        new THREE.MeshToonMaterial({
          color: base,
          emissive: base.clone().multiplyScalar(0.32),
        }),
      );
      this.edgeMatByKey.set(
        key,
        new THREE.LineBasicMaterial({
          color: base.clone().multiplyScalar(0.25),
          transparent: true,
          opacity: 0.95,
        }),
      );

      const glossyTex = makeGlossyStickerTexture(base);
      this.glossyTexByKey.set(key, glossyTex);
      this.glossyMatByKey.set(key, this.makeStickerMaterial(glossyTex));

      const jewelTex = makeJewelTexture(base);
      this.jewelTexByKey.set(key, jewelTex);
      this.jewelMatByKey.set(key, this.makeStickerMaterial(jewelTex));

      // GEM: custom lids+walls geometry with a UNIQUE facet texture per
      // side, material array aligned with the geometry's group order.
      const gemBuild = buildGemGeometry(outline, cx, cy);
      this.gemGeoByKey.set(key, gemBuild.geo);
      const gemTexes: THREE.CanvasTexture[] = [];
      const gemMats: THREE.Material[] = [];
      for (const variant of ["front", "back"] as GemVariant[]) {
        const t = makeGemFaceTexture(outline, base, variant).tex;
        gemTexes.push(t);
        gemMats.push(this.makeGemStickerMaterial(t));
      }
      const gemWallByKey = new Map<string, THREE.Material>();
      for (const e of gemBuild.edges) {
        const k = `${e.dir}:${e.len}`;
        let m = gemWallByKey.get(k);
        if (!m) {
          const rect: Array<[number, number]> = [
            [0, 0],
            [e.len, 0],
            [e.len, 1],
            [0, 1],
          ];
          const t = makeGemFaceTexture(rect, base, e.dir).tex;
          gemTexes.push(t);
          m = this.makeGemStickerMaterial(t);
          gemWallByKey.set(k, m);
        }
        gemMats.push(m);
      }
      this.gemTexByKey.set(key, gemTexes);
      this.gemMatsByKey.set(key, gemMats);

      // NEON: shares the GEM lids+walls geometry; the tube glow is uniform
      // per side, so front/back share one texture and walls dedupe by
      // length (the variant-driven facets don't apply here).
      const neonTexes: THREE.CanvasTexture[] = [];
      const neonMats: THREE.Material[] = [];
      const neonLid = makeNeonFaceTexture(outline, base);
      const neonLidMat = this.makeNeonMaterial(neonLid);
      neonTexes.push(neonLid);
      neonMats.push(neonLidMat, neonLidMat);
      const neonWallByLen = new Map<number, THREE.Material>();
      for (const e of gemBuild.edges) {
        let m = neonWallByLen.get(e.len);
        if (!m) {
          const t = makeNeonFaceTexture(
            [
              [0, 0],
              [e.len, 0],
              [e.len, 1],
              [0, 1],
            ],
            base,
          );
          neonTexes.push(t);
          m = this.makeNeonMaterial(t);
          neonWallByLen.set(e.len, m);
        }
        neonMats.push(m);
      }
      this.neonTexByKey.set(key, neonTexes);
      this.neonMatsByKey.set(key, neonMats);

      // CANDY / GALAXY bricks: same lids+walls geometry as GEM; lids share
      // one texture front/back, walls dedupe by length (their treatments
      // don't depend on wall direction).
      const candyTexes: THREE.CanvasTexture[] = [];
      const candyMats: THREE.Material[] = [];
      const candyLid = makeCandyBrickTexture(outline, key, "lid");
      const candyLidMat = this.makeStickerMaterial(candyLid);
      candyTexes.push(candyLid);
      candyMats.push(candyLidMat, candyLidMat);
      const galaxyTexes: THREE.CanvasTexture[] = [];
      const galaxyMats: THREE.Material[] = [];
      const galaxyLid = makeGalaxyFaceTexture(outline, key);
      const galaxyLidMat = this.makeStickerMaterial(galaxyLid);
      galaxyTexes.push(galaxyLid);
      galaxyMats.push(galaxyLidMat, galaxyLidMat);
      // Candy walls are position-aware: donut/biscuit sides bake icing at
      // their true world heights and swirl walls continue the pinwheel, so
      // those bake per edge; uniform treatments share by face + length.
      const candyWallByKey = new Map<string, THREE.Material>();
      const galaxyWallByLen = new Map<number, THREE.Material>();
      const candyKind = CANDY_SPECS[key].kind;
      for (const e of gemBuild.edges) {
        const rect: Array<[number, number]> = [
          [0, 0],
          [e.len, 0],
          [e.len, 1],
          [0, 1],
        ];
        const candyFace: CandyFace =
          e.dir === "top" ? "top" : e.dir === "bottom" ? "bottom" : "side";
        const positional =
          candyKind === "swirl" ||
          (candyFace === "side" &&
            (candyKind === "donut" || candyKind === "biscuit"));
        const ck = positional
          ? `${e.dir}:${e.len}@${e.a[0]},${e.a[1]}`
          : `${candyFace}:${e.len}`;
        let cm = candyWallByKey.get(ck);
        if (!cm) {
          const t = makeCandyBrickTexture(rect, key, candyFace, e);
          candyTexes.push(t);
          cm = this.makeStickerMaterial(t);
          candyWallByKey.set(ck, cm);
        }
        candyMats.push(cm);
        let gm = galaxyWallByLen.get(e.len);
        if (!gm) {
          const t = makeGalaxyFaceTexture(rect, key);
          galaxyTexes.push(t);
          gm = this.makeStickerMaterial(t);
          galaxyWallByLen.set(e.len, gm);
        }
        galaxyMats.push(gm);
      }
      this.candyBrickTexByKey.set(key, candyTexes);
      this.candyMatsByKey.set(key, candyMats);
      this.galaxyTexByKey.set(key, galaxyTexes);
      this.galaxyMatsByKey.set(key, galaxyMats);

      this.smoothMatByKey.set(
        key,
        new THREE.MeshPhysicalMaterial({
          color: base,
          roughness: 0.35,
          metalness: 0,
          clearcoat: 1,
          clearcoatRoughness: 0.15,
          envMap: envMap ?? undefined,
          envMapIntensity: 0.8,
          emissive: base.clone().multiplyScalar(0.12),
        }),
      );
    }

    unitBox.dispose();
    unitEdges.dispose();
  }

  /** Sticker skins: baked face texture + matching night glow. */
  private makeStickerMaterial(tex: THREE.CanvasTexture): THREE.MeshToonMaterial {
    return new THREE.MeshToonMaterial({
      map: tex,
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveMap: tex,
      emissiveIntensity: 0.32,
    });
  }

  /**
   * NEON material: the bake is mostly near-black, so a strong emissive
   * leaves the body dark while the tube lines self-illuminate — bright
   * enough for the bloom pass to catch the white-hot cores at night.
   */
  private makeNeonMaterial(tex: THREE.CanvasTexture): THREE.MeshToonMaterial {
    return new THREE.MeshToonMaterial({
      map: tex,
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveMap: tex,
      emissiveIntensity: 0.95,
    });
  }

  /**
   * GEM sticker material: the bake carries frame/table/outline; the white
   * light streaks are ONE band function over piece-local (x + y) applied to
   * every face — a slab of light cutting through the whole gem, so a band
   * crossing the front edge continues down that wall and out the back.
   * (This is what makes the lighting read consistent from all sides.)
   */
  private makeGemStickerMaterial(
    tex: THREE.CanvasTexture,
  ): THREE.MeshToonMaterial {
    const mat = this.makeStickerMaterial(tex);
    mat.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          "#include <common>\nvarying vec3 vGemPos;",
        )
        .replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\nvGemPos = position;",
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          "#include <common>\nvarying vec3 vGemPos;",
        )
        .replace(
          "#include <color_fragment>",
          [
            "#include <color_fragment>",
            "{",
            // Same density as the old front bake: 1.15-cell period along
            // the ↗ diagonal → 1.6 in (x+y); wide band + thin companion.
            "  float sB = fract((vGemPos.x + vGemPos.y) / 1.6);",
            "  float m = (1.0 - step(0.37, sB)) + step(0.45, sB) * (1.0 - step(0.58, sB));",
            "  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 1.45 + vec3(0.10), clamp(m, 0.0, 1.0) * 0.8);",
            "}",
          ].join("\n"),
        );
    };
    mat.customProgramCacheKey = () => "gem-streak";
    return mat;
  }

  getMaterial(key: TetrominoKey): THREE.MeshToonMaterial {
    return this.classicMatByKey.get(key)!;
  }

  private geometryFor(key: TetrominoKey, skin: BlockSkin): THREE.BufferGeometry {
    if (
      skin === "GEM" ||
      skin === "NEON" ||
      skin === "CANDY" ||
      skin === "GALAXY"
    ) {
      return this.gemGeoByKey.get(key)!;
    }
    if (skin === "SMOOTH") return this.extrudedGeoByKey.get(key)!;
    return this.classicGeoByKey.get(key)!; // CLASSIC, GLOSSY, JEWEL
  }

  private materialFor(
    key: TetrominoKey,
    skin: BlockSkin,
  ): THREE.Material | THREE.Material[] {
    switch (skin) {
      case "GLOSSY":
        // The old candy-sticker look, renamed per user.
        return this.glossyMatByKey.get(key)!;
      case "JEWEL":
        return this.jewelMatByKey.get(key)!;
      case "GEM":
        // Group order [front, back, ...walls] — built alongside the
        // geometry in the constructor.
        return this.gemMatsByKey.get(key)!;
      case "NEON":
        return this.neonMatsByKey.get(key)!;
      case "CANDY":
        return this.candyMatsByKey.get(key)!;
      case "GALAXY":
        return this.galaxyMatsByKey.get(key)!;
      case "SMOOTH":
        // The old clearcoat "glossy", renamed per user.
        return this.smoothMatByKey.get(key)!;
      default:
        return this.classicMatByKey.get(key)!;
    }
  }

  /**
   * Swap an existing piece group between skins in place. Detaches/attaches
   * only — every geometry, material and texture here is factory-owned and
   * shared, so nothing is ever disposed from this path.
   */
  applySkin(group: THREE.Group, skin: BlockSkin) {
    for (const child of group.children) {
      const mesh = child as THREE.Mesh;
      const key = mesh.userData.tetKey as TetrominoKey | undefined;
      if (!key || !(mesh as Partial<THREE.Mesh>).isMesh) continue;
      mesh.geometry = this.geometryFor(key, skin);
      mesh.material = this.materialFor(key, skin);
      const lines = mesh.children.filter(
        (c) => (c as THREE.LineSegments).isLineSegments,
      );
      if (skin === "CLASSIC") {
        if (lines.length === 0) {
          mesh.add(
            new THREE.LineSegments(
              this.edgesGeoByKey.get(key)!,
              this.edgeMatByKey.get(key)!,
            ),
          );
        }
      } else {
        for (const line of lines) mesh.remove(line);
      }
      // The GEM hull outline was removed (user: reads as a "coating") —
      // detach any stale one left on long-lived pieces.
      for (const o of mesh.children.filter(
        (c) => (c as THREE.Mesh).userData?.gemOutline,
      )) {
        mesh.remove(o);
      }
    }
  }

  /** Build a piece: a Group holding ONE mesh (+ edge lines when classic). */
  create(key: TetrominoKey): PieceMesh {
    const skin = useGameStore.getState().blockSkin;
    const group = new THREE.Group();
    const mesh = new THREE.Mesh(
      this.geometryFor(key, skin),
      this.materialFor(key, skin),
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.tetKey = key;
    if (skin === "CLASSIC") {
      mesh.add(
        new THREE.LineSegments(
          this.edgesGeoByKey.get(key)!,
          this.edgeMatByKey.get(key)!,
        ),
      );
    }
    group.add(mesh);

    return {
      group,
      colliderOffsets: this.offsetsByKey.get(key)!,
      centroid: this.centroidByKey.get(key)!,
    };
  }

  dispose() {
    for (const m of [
      this.classicGeoByKey,
      this.extrudedGeoByKey,
      this.edgesGeoByKey,
      this.gemGeoByKey,
    ]) {
      m.forEach((g) => g.dispose());
      m.clear();
    }
    for (const m of [
      this.classicMatByKey,
      this.edgeMatByKey,
      this.glossyMatByKey,
      this.jewelMatByKey,
      this.smoothMatByKey,
    ]) {
      m.forEach((mat) => mat.dispose());
      m.clear();
    }
    this.gemMatsByKey.forEach((mats) => mats.forEach((m) => m.dispose()));
    this.gemMatsByKey.clear();
    // Neon/candy/galaxy material arrays intentionally repeat shared
    // instances (front/back lid, walls deduped by length) — dedupe first.
    for (const m of [
      this.neonMatsByKey,
      this.candyMatsByKey,
      this.galaxyMatsByKey,
    ]) {
      m.forEach((mats) => [...new Set(mats)].forEach((mat) => mat.dispose()));
      m.clear();
    }
    for (const t of [this.glossyTexByKey, this.jewelTexByKey]) {
      t.forEach((tex) => tex.dispose());
      t.clear();
    }
    for (const t of [
      this.gemTexByKey,
      this.neonTexByKey,
      this.candyBrickTexByKey,
      this.galaxyTexByKey,
    ]) {
      t.forEach((texes) => texes.forEach((tex) => tex.dispose()));
      t.clear();
    }
  }
}
