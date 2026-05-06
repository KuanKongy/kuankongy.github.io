import * as THREE from "three";
import { PALETTE } from "../constants";

export interface MountainGeometryInfo {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  scale: THREE.Vector3;
  rotation: THREE.Euler;
  /** Hull vertices in *local* mesh space, ready for Rapier ConvexHull. */
  hullVerts: Float32Array;
}

export interface MountainsHandle {
  group: THREE.Group;
  side: MountainGeometryInfo[];
  setDayNight: (isDark: boolean) => void;
  dispose: () => void;
}

/** Day-mode mountain greys (stone). */
const DAY_MOUNTAIN_FRONT = new THREE.Color("#9098a8");
const DAY_MOUNTAIN_MID = new THREE.Color("#7a8094");
const DAY_MOUNTAIN_DARK = new THREE.Color("#5e6478");

/**
 * One pine tree: trunk + exactly 2 stacked cones. `grayer=true` swaps the
 * leaf colour for a cooler, duller pineGray.
 */
function pineTree(rng: () => number, grayer: boolean): THREE.Mesh {
  const trunkH = 1.0 + rng() * 0.7;
  const trunkR = 0.11;
  const trunkMat = new THREE.MeshToonMaterial({ color: 0x6b4a30 });
  const trunkGeo = new THREE.CylinderGeometry(trunkR * 0.85, trunkR, trunkH, 8);
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);

  const baseLeaf = grayer
    ? PALETTE.pineGray.clone()
    : PALETTE.pine.clone().offsetHSL(0, 0.05, 0.12);
  baseLeaf.offsetHSL(0, (rng() - 0.5) * 0.04, (rng() - 0.5) * 0.06);
  const leafMat = new THREE.MeshToonMaterial({
    color: baseLeaf,
    emissive: baseLeaf.clone().multiplyScalar(grayer ? 0.08 : 0.16),
  });

  const lowerR = 0.7 + rng() * 0.4;
  const lowerH = 1.4 + rng() * 0.5;
  const lowerSegs = 6 + Math.floor(rng() * 4);
  const lowerGeo = new THREE.ConeGeometry(lowerR, lowerH, lowerSegs, 1);
  const lower = new THREE.Mesh(lowerGeo, leafMat);
  lower.position.y = trunkH / 2 + lowerH / 2 - 0.05;

  const root = new THREE.Mesh();
  root.add(trunk);
  root.add(lower);

  const upperR = lowerR * (0.6 + rng() * 0.18);
  const upperH = lowerH * (0.65 + rng() * 0.2);
  const upperGeo = new THREE.ConeGeometry(upperR, upperH, lowerSegs, 1);
  const upper = new THREE.Mesh(upperGeo, leafMat);
  upper.position.y = trunkH / 2 + lowerH + upperH / 2 - 0.4;
  root.add(upper);

  root.castShadow = true;
  root.receiveShadow = true;
  return root;
}

function getHullVertices(geometry: THREE.BufferGeometry): Float32Array {
  const pos = geometry.attributes.position as THREE.BufferAttribute;
  const out = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    out[i * 3] = pos.getX(i);
    out[i * 3 + 1] = pos.getY(i);
    out[i * 3 + 2] = pos.getZ(i);
  }
  return out;
}

type MountainShape = "voluminous" | "pointy" | "roundy" | "shoulder";

type ColorTier = "front" | "mid" | "dark";

interface SideSpec {
  x: number;
  z: number;
  baseR: number;
  peakH: number;
  ry: number;
  color: THREE.Color;
  /** Which palette tier this mountain uses — drives day/night re-colour. */
  colorTier: ColorTier;
  decorOnly?: boolean;
  scaleY?: number;
  /** Z-axis stretch relative to baseR — under 1 = elongated horizontally. */
  zSquish: number;
  treeCount: number;
  rockCount: number;
  grayerTrees: boolean;
  shape: MountainShape;
}

interface ColoredMaterial {
  mat: THREE.MeshToonMaterial;
  tier: ColorTier;
}

/**
 * Profile sample for a given shape — returns radius at vertical fraction t
 * for a mountain of base radius `baseR`. Each shape gives a recognisably
 * different silhouette so the scene reads as a varied mountain range.
 */
function mountainRadius(
  shape: MountainShape,
  baseR: number,
  t: number,
): number {
  let r: number;
  switch (shape) {
    case "voluminous":
      // Beefy lower-mid section, taper concentrated near the top.
      r = baseR * Math.pow(1 - Math.pow(t, 1.65), 0.55);
      break;
    case "pointy":
      // Straight, gentle cone — most of the mountain is a clean linear
      // taper. Avoids razor-sharp tips and "impossible-angle" rims that
      // a sharp exponent profile produced.
      r = baseR * (1 - t * 0.92);
      break;
    case "roundy":
      // Smooth cosine dome — no clamp; the smooth-top close below carries
      // the silhouette cleanly to a soft rounded peak.
      r = baseR * Math.cos((t * Math.PI) / 2);
      break;
    case "shoulder":
      // Flat shelf around 60% height, then a softer slope above for a
      // chiseled ridge silhouette (no super-sharp tip).
      if (t < 0.6) r = baseR * (1 - t * 0.32);
      else
        r =
          baseR *
          (1 - 0.6 * 0.32) *
          Math.pow(1 - (t - 0.6) / 0.4, 1.05);
      break;
  }
  // SMOOTH-CLOSE the very top so the mountain always ends as a soft
  // rounded peak — never a flat disc (which read as a "neck"), never a
  // razor-sharp point. From t = 0.88 we multiply r by cos((tt * π) / 2)
  // so r → 0 with a vertical tangent at the very tip — a clean dome /
  // soft peak shape regardless of the base shape kind.
  const closeT = 0.88;
  if (t > closeT) {
    const tt = (t - closeT) / (1 - closeT);
    r *= Math.cos((tt * Math.PI) / 2);
  }
  return Math.max(r, 0);
}

function pickShape(rng: () => number): MountainShape {
  const r = rng();
  if (r < 0.4) return "voluminous";
  if (r < 0.65) return "pointy";
  if (r < 0.85) return "roundy";
  return "shoulder";
}

/**
 * Build the mountain silhouette via a lathe profile chosen from `spec.shape`
 * — voluminous, pointy, roundy or shoulder. Combined with the per-vertex
 * wobble this gives a visibly varied mountain range.
 */
function buildSideMountain(
  spec: SideSpec,
  seed: number,
  rng: () => number,
  matRefs: ColoredMaterial[],
): MountainGeometryInfo {
  const segs = 16;
  // Pre-roll a single random phase per mountain so the wobble is a smooth
  // single-frequency curve along height (instead of a different RNG per
  // sample, which used to produce sharp necks/pinches in the silhouette).
  const wobblePhase = rng() * Math.PI * 2;
  const points: THREE.Vector2[] = [];
  let prevR = Infinity;
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    let r = mountainRadius(spec.shape, spec.baseR, t);
    // Small, smooth single-frequency wobble for organic silhouette.
    r += Math.sin(t * 5.5 + wobblePhase) * 0.06;
    // Enforce monotonic non-increasing: each height's radius must be ≤ the
    // one directly below it. This guarantees no inward "necks" anywhere on
    // the mountain — the silhouette only ever stays the same or shrinks
    // going up, producing a continuous smooth surface.
    r = Math.min(r, prevR);
    prevR = r;
    points.push(new THREE.Vector2(Math.max(r, 0.04), t * spec.peakH));
  }
  const geo = new THREE.LatheGeometry(points, 22);
  const mat = new THREE.MeshToonMaterial({
    color: spec.color.clone(),
    emissive: spec.color.clone().multiplyScalar(0.06),
  });
  matRefs.push({ mat, tier: spec.colorTier });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = !spec.decorOnly;
  mesh.receiveShadow = true;
  mesh.name = `SideMountain${seed}`;
  if (spec.scaleY) mesh.scale.y = spec.scaleY;
  mesh.scale.z = spec.zSquish;

  // ---- Decorations: rocks at the foot, trees on the slope. ----
  const rockMat = new THREE.MeshToonMaterial({
    color: PALETTE.mountainDark.clone().offsetHSL(0, 0, 0.05),
    emissive: PALETTE.mountainDark.clone().multiplyScalar(0.04),
  });
  for (let i = 0; i < spec.rockCount; i++) {
    const rs = 0.35 + rng() * 0.5;
    const rockGeo = new THREE.SphereGeometry(rs, 7, 6);
    const rock = new THREE.Mesh(rockGeo, rockMat);
    const angle = rng() * Math.PI * 2;
    const rad = spec.baseR * (0.85 + rng() * 0.4);
    rock.position.set(
      Math.cos(angle) * rad,
      rs * 0.4,
      Math.sin(angle) * rad * spec.zSquish,
    );
    rock.scale.y = 0.65 + rng() * 0.25;
    rock.rotation.set(rng() * 0.6, rng() * Math.PI * 2, rng() * 0.6);
    rock.castShadow = !spec.decorOnly;
    rock.receiveShadow = true;
    mesh.add(rock);
  }

  // Trees: the FIRST tree always sits AT THE TOP of the mountain so every
  // mountain has a visible tree on the peak. Remaining trees scatter on
  // the mid-to-upper slope.
  const peakY = spec.peakH * (spec.scaleY ?? 1);
  for (let i = 0; i < spec.treeCount; i++) {
    const tree = pineTree(rng, spec.grayerTrees);
    let heightFrac: number;
    let radialBias: number;
    if (i === 0) {
      // Crown tree — right on the apex.
      heightFrac = 0.92;
      radialBias = rng() * 0.2; // small offset, mostly centered on the peak
    } else {
      heightFrac = 0.3 + rng() * 0.55;
      radialBias = 0.55 + rng() * 0.4;
    }
    const treeY = peakY * heightFrac;
    const slopeR = mountainRadius(spec.shape, spec.baseR, heightFrac);
    const angle = rng() * Math.PI * 2;
    tree.position.set(
      Math.cos(angle) * slopeR * radialBias,
      treeY - 0.05,
      Math.sin(angle) * slopeR * spec.zSquish * radialBias,
    );
    tree.scale.setScalar(
      i === 0 ? 0.95 + rng() * 0.4 : 0.85 + rng() * 0.55,
    );
    mesh.add(tree);
  }

  return {
    mesh,
    position: new THREE.Vector3(),
    scale: new THREE.Vector3(1, spec.scaleY ?? 1, spec.zSquish),
    rotation: new THREE.Euler(0, 0, 0),
    hullVerts: spec.decorOnly ? new Float32Array() : getHullVertices(geo),
  };
}

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createMountains(): MountainsHandle {
  const group = new THREE.Group();
  group.name = "Mountains";

  const seedBase =
    (Math.floor(Math.random() * 0x7fffffff) ^ 0x9e3779b9) >>> 0;
  const rng = mulberry32(seedBase);

  // ---- Mid-ground colliders: many floating elongated dome mountains. ----
  const midSpecs: SideSpec[] = [];
  const midCount = 10 + Math.floor(rng() * 4); // 10..13
  for (let i = 0; i < midCount; i++) {
    let x = (rng() - 0.5) * 70;
    if (Math.abs(x) < 11) x += x >= 0 ? 14 : -14;
    const z = -2 - rng() * 20;
    const baseR = 3.6 + rng() * 2.6;
    const peakH = baseR * (2.0 + rng() * 1.0);
    const ry = (rng() - 0.5) * 2.6;
    const zSquish = 0.55 + rng() * 0.7;
    const usesFront = rng() > 0.5;
    midSpecs.push({
      x,
      z,
      baseR,
      peakH,
      ry,
      color: usesFront ? PALETTE.mountainFront : PALETTE.mountainMid,
      colorTier: usesFront ? "front" : "mid",
      zSquish,
      grayerTrees: rng() > 0.55,
      treeCount: 3 + Math.floor(rng() * 3),
      rockCount: 3 + Math.floor(rng() * 4),
      shape: pickShape(rng),
    });
  }

  // ---- Far-background mountains: scattered, no colliders, deeper Z. ----
  const farSpecs: SideSpec[] = [];
  const farCount = 14;
  for (let i = 0; i < farCount; i++) {
    const baseR = 5 + rng() * 4.5;
    const peakH = baseR * (1.8 + rng() * 1.0);
    farSpecs.push({
      x: (rng() - 0.5) * 150,
      z: -22 - rng() * 50,
      baseR,
      peakH,
      ry: (rng() - 0.5) * 2.4,
      color: PALETTE.mountainDark,
      colorTier: "dark",
      zSquish: 0.6 + rng() * 0.7,
      // Far-background mountains use the cooler grayer palette and pick
      // up trees too — same crown tree + a couple of slope trees, so they
      // don't read as featureless silhouettes.
      grayerTrees: true,
      decorOnly: true,
      scaleY: 0.78 + rng() * 0.22,
      treeCount: 2 + Math.floor(rng() * 2),
      rockCount: 0,
      shape: pickShape(rng),
    });
  }

  const side: MountainGeometryInfo[] = [];
  const matRefs: ColoredMaterial[] = [];

  midSpecs.forEach((s, i) => {
    const m = buildSideMountain(s, i, rng, matRefs);
    m.mesh.position.set(s.x, 0, s.z);
    m.mesh.rotation.y = s.ry;
    m.position.copy(m.mesh.position);
    m.rotation.copy(m.mesh.rotation);
    group.add(m.mesh);
    side.push(m);
  });

  farSpecs.forEach((s, i) => {
    const m = buildSideMountain(s, i + 100, rng, matRefs);
    m.mesh.position.set(s.x, -1, s.z);
    m.mesh.rotation.y = s.ry;
    m.position.copy(m.mesh.position);
    m.rotation.copy(m.mesh.rotation);
    group.add(m.mesh);
  });

  const tierToNight: Record<ColorTier, THREE.Color> = {
    front: PALETTE.mountainFront,
    mid: PALETTE.mountainMid,
    dark: PALETTE.mountainDark,
  };
  const tierToDay: Record<ColorTier, THREE.Color> = {
    front: DAY_MOUNTAIN_FRONT,
    mid: DAY_MOUNTAIN_MID,
    dark: DAY_MOUNTAIN_DARK,
  };

  return {
    group,
    side,
    setDayNight: (isDark) => {
      const lookup = isDark ? tierToNight : tierToDay;
      for (const { mat, tier } of matRefs) {
        const c = lookup[tier];
        mat.color.copy(c);
        mat.emissive.copy(c).multiplyScalar(0.06);
        mat.needsUpdate = true;
      }
    },
    dispose: () => {
      group.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = m.material;
        if (mat) {
          if (Array.isArray(mat)) mat.forEach((mm) => mm.dispose());
          else (mat as THREE.Material).dispose();
        }
      });
    },
  };
}
