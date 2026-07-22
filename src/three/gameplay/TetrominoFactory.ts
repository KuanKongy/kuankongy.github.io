import * as THREE from "three";
import {
  mergeGeometries,
  mergeVertices,
} from "three/examples/jsm/utils/BufferGeometryUtils.js";
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
function makeCandyTexture(base: THREE.Color): THREE.CanvasTexture {
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

  // Thick dark outline at the cell edge.
  ctx.strokeStyle = css(dark);
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.roundRect(5, 5, s - 10, s - 10, 22);
  ctx.stroke();

  // Sparkle: small 4-point star near the table's top-left corner.
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.save();
  ctx.translate(i + 22, i + 22);
  ctx.beginPath();
  for (let k = 0; k < 8; k++) {
    const r = k % 2 === 0 ? 16 : 5;
    const a = (k * Math.PI) / 4 - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (k === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();

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

/**
 * The GEM piece texture — the gembricks key-art block, baked per SHAPE
 * (one texture per key, whole-piece): a mitred jewel frame following the
 * silhouette (lit top / mid left / shaded right / dark bottom trapezoids),
 * an inner face carrying diagonal light streaks, and a thick dark outline.
 * All drawn — the art's "rim" is a 2D effect, not 3D shading.
 */
function makeGemPieceTexture(
  outline: Array<[number, number]>,
  base: THREE.Color,
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

  const light = base.clone().offsetHSL(0, 0.03, 0.24);
  const midL = base.clone().offsetHSL(0, 0.02, 0.12);
  const midD = base.clone().offsetHSL(0, 0.04, -0.06);
  const darkF = base.clone().offsetHSL(0, 0.05, -0.16);
  const table = base.clone().offsetHSL(0, 0.04, 0.1);
  const stripe = base.clone().offsetHSL(0, 0.02, 0.24);
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

  // 2. Inner face + diagonal light streaks (clipped to the inset polygon).
  trace(inset);
  ctx.fillStyle = css(table);
  ctx.fill();
  ctx.save();
  trace(inset);
  ctx.clip();
  ctx.translate(c.width / 2, c.height / 2);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = css(stripe);
  ctx.globalAlpha = 0.85;
  const span = Math.max(c.width, c.height) * 1.5;
  const bandW = 0.42 * S;
  const gap = 1.15 * S;
  for (let x = -span; x < span; x += gap) {
    ctx.fillRect(x, -span, bandW, span * 2);
    // A thinner companion streak, like the art's paired shine lines.
    ctx.fillRect(x + bandW + 0.14 * S, -span, bandW * 0.35, span * 2);
  }
  ctx.restore();

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
  private candyMatByKey = new Map<TetrominoKey, THREE.MeshToonMaterial>();
  private candyTexByKey = new Map<TetrominoKey, THREE.CanvasTexture>();
  private jewelMatByKey = new Map<TetrominoKey, THREE.MeshToonMaterial>();
  private jewelTexByKey = new Map<TetrominoKey, THREE.CanvasTexture>();
  private gemFaceMatByKey = new Map<TetrominoKey, THREE.MeshToonMaterial>();
  private gemSideMatByKey = new Map<TetrominoKey, THREE.MeshToonMaterial>();
  private gemTexByKey = new Map<TetrominoKey, THREE.CanvasTexture>();
  private gemOutlineGeoByKey = new Map<TetrominoKey, THREE.BufferGeometry>();
  private gemOutlineMatByKey = new Map<TetrominoKey, THREE.MeshBasicMaterial>();
  private glossyMatByKey = new Map<TetrominoKey, THREE.MeshPhysicalMaterial>();

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

      const candyTex = makeCandyTexture(base);
      this.candyTexByKey.set(key, candyTex);
      this.candyMatByKey.set(key, this.makeStickerMaterial(candyTex));

      const jewelTex = makeJewelTexture(base);
      this.jewelTexByKey.set(key, jewelTex);
      this.jewelMatByKey.set(key, this.makeStickerMaterial(jewelTex));

      const gem = makeGemPieceTexture(outline, base);
      this.gemTexByKey.set(key, gem.tex);
      this.gemFaceMatByKey.set(key, this.makeStickerMaterial(gem.tex));
      this.gemSideMatByKey.set(
        key,
        new THREE.MeshToonMaterial({
          color: base.clone().offsetHSL(0, 0.04, -0.12),
          emissive: base
            .clone()
            .offsetHSL(0, 0.04, -0.12)
            .multiplyScalar(0.32),
        }),
      );

      // GEM's bold cartoon outline: an inverted hull — the silhouette
      // geometry puffed outward along SMOOTHED normals (weld the
      // flat-shaded duplicates first, or each face displaces as a separate
      // plate and the shell cracks open at every edge), drawn
      // back-face-only in a dark tone like the key art's black ring.
      const hullSrc = extruded.clone();
      // Weld by POSITION only — normals/uvs differ per flat-shaded face
      // and would block the weld.
      hullSrc.deleteAttribute("normal");
      hullSrc.deleteAttribute("uv");
      const hull = mergeVertices(hullSrc, 1e-4);
      hullSrc.dispose();
      hull.computeVertexNormals();
      {
        const pos = hull.getAttribute("position");
        const nrm = hull.getAttribute("normal");
        const OUT = 0.09;
        for (let vi = 0; vi < pos.count; vi++) {
          pos.setXYZ(
            vi,
            pos.getX(vi) + nrm.getX(vi) * OUT,
            pos.getY(vi) + nrm.getY(vi) * OUT,
            pos.getZ(vi) + nrm.getZ(vi) * OUT,
          );
        }
        pos.needsUpdate = true;
      }
      this.gemOutlineGeoByKey.set(key, hull);
      this.gemOutlineMatByKey.set(
        key,
        new THREE.MeshBasicMaterial({
          color: base.clone().multiplyScalar(0.16),
          side: THREE.BackSide,
        }),
      );

      this.glossyMatByKey.set(
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

  getMaterial(key: TetrominoKey): THREE.MeshToonMaterial {
    return this.classicMatByKey.get(key)!;
  }

  private geometryFor(key: TetrominoKey, skin: BlockSkin): THREE.BufferGeometry {
    return skin === "GEM" || skin === "GLOSSY"
      ? this.extrudedGeoByKey.get(key)!
      : this.classicGeoByKey.get(key)!;
  }

  private materialFor(
    key: TetrominoKey,
    skin: BlockSkin,
  ): THREE.Material | THREE.Material[] {
    switch (skin) {
      case "CANDY":
        return this.candyMatByKey.get(key)!;
      case "JEWEL":
        return this.jewelMatByKey.get(key)!;
      case "GEM":
        // Extrude group 0 = lids (baked gem art), group 1 = side walls.
        return [
          this.gemFaceMatByKey.get(key)!,
          this.gemSideMatByKey.get(key)!,
        ];
      case "GLOSSY":
        return this.glossyMatByKey.get(key)!;
      default:
        return this.classicMatByKey.get(key)!;
    }
  }

  /**
   * Swap an existing piece group between skins in place. Detaches/attaches
   * only — every geometry, material and texture here is factory-owned and
   * shared, so nothing is ever disposed from this path.
   */
  private makeGemOutline(key: TetrominoKey): THREE.Mesh {
    const outline = new THREE.Mesh(
      this.gemOutlineGeoByKey.get(key)!,
      this.gemOutlineMatByKey.get(key)!,
    );
    outline.userData.gemOutline = true;
    return outline;
  }

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
      const outlines = mesh.children.filter(
        (c) => (c as THREE.Mesh).userData?.gemOutline,
      );
      if (skin === "GEM") {
        if (outlines.length === 0) mesh.add(this.makeGemOutline(key));
      } else {
        for (const o of outlines) mesh.remove(o);
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
    } else if (skin === "GEM") {
      mesh.add(this.makeGemOutline(key));
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
      this.gemOutlineGeoByKey,
    ]) {
      m.forEach((g) => g.dispose());
      m.clear();
    }
    for (const m of [
      this.classicMatByKey,
      this.edgeMatByKey,
      this.candyMatByKey,
      this.jewelMatByKey,
      this.gemFaceMatByKey,
      this.gemSideMatByKey,
      this.gemOutlineMatByKey,
      this.glossyMatByKey,
    ]) {
      m.forEach((mat) => mat.dispose());
      m.clear();
    }
    this.candyTexByKey.forEach((t) => t.dispose());
    this.candyTexByKey.clear();
    this.jewelTexByKey.forEach((t) => t.dispose());
    this.jewelTexByKey.clear();
    this.gemTexByKey.forEach((t) => t.dispose());
    this.gemTexByKey.clear();
  }
}
