import * as THREE from "three";
import { PALETTE } from "../constants";
import { prefersReducedMotion } from "../../lib/motion";

export interface MistHandle {
  group: THREE.Group;
  update: (elapsed: number) => void;
  setDayNight: (isDark: boolean) => void;
  dispose: () => void;
}

/** Day-mode mist: cool white-blue so it reads as morning haze. */
const DAY_MIST = new THREE.Color("#dce8f6");

interface Puff {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  baseX: number;
  baseOpacity: number;
  tintScale: number;
  driftAmp: number;
  driftSpeed: number;
  phase: number;
}

/** One shared radial soft dot — every puff is this texture, scaled. */
function makePuffTexture(): THREE.CanvasTexture {
  const size = 128;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,0.9)");
  g.addColorStop(0.45, "rgba(255,255,255,0.45)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Low fog around the mountain bases, built from INDIVIDUAL soft round
 * puffs (radial gradient quads) — there is no band or rectangular plane
 * anywhere, so no straight edge can ever show. Puffs drift on slow
 * sine paths and breathe slightly; night/day tinting via setDayNight.
 */
export function createMist(): MistHandle {
  const group = new THREE.Group();
  group.name = "Mist";

  const tex = makePuffTexture();
  const geo = new THREE.PlaneGeometry(1, 1);
  const reduced = prefersReducedMotion();
  const isMobile = !window.matchMedia("(min-width: 768px)").matches;

  const count = isMobile ? 7 : 12;
  const puffs: Puff[] = [];
  for (let i = 0; i < count; i++) {
    // Spread puffs across the horizon at varying depth; deeper = larger,
    // fainter, slower.
    const z = THREE.MathUtils.randFloat(-75, -20);
    const depthK = THREE.MathUtils.mapLinear(z, -20, -75, 0, 1);
    const w = THREE.MathUtils.randFloat(8, 13) * (1 + depthK * 1.2);
    const h = THREE.MathUtils.randFloat(3, 4.5) * (1 + depthK * 0.8);
    const opacity = THREE.MathUtils.randFloat(0.1, 0.2) * (1 - depthK * 0.35);
    const tintScale = THREE.MathUtils.randFloat(0.9, 1.1);

    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity,
      depthWrite: false,
      fog: false,
      color: PALETTE.mistColor.clone().multiplyScalar(tintScale),
    });
    const mesh = new THREE.Mesh(geo, mat);
    const baseX = THREE.MathUtils.randFloatSpread(160);
    mesh.position.set(baseX, THREE.MathUtils.randFloat(1.5, 5), z);
    mesh.scale.set(w, h, 1);
    group.add(mesh);
    puffs.push({
      mesh,
      mat,
      baseX,
      baseOpacity: opacity,
      tintScale,
      driftAmp: THREE.MathUtils.randFloat(3, 9) * (1 - depthK * 0.5),
      driftSpeed: THREE.MathUtils.randFloat(0.02, 0.05),
      phase: Math.random() * Math.PI * 2,
    });
  }

  return {
    group,
    update: (t) => {
      for (const p of puffs) {
        if (!reduced) {
          p.mesh.position.x =
            p.baseX + Math.sin(t * p.driftSpeed * Math.PI * 2 + p.phase) * p.driftAmp;
        }
        p.mat.opacity =
          p.baseOpacity * (1 + 0.15 * Math.sin(t * 0.18 + p.phase * 2));
      }
    },
    setDayNight: (isDark) => {
      const base = isDark ? PALETTE.mistColor : DAY_MIST;
      for (const p of puffs) {
        p.mat.color.copy(base).multiplyScalar(p.tintScale);
      }
    },
    dispose: () => {
      if (group.parent) group.parent.remove(group);
      geo.dispose();
      puffs.forEach((p) => p.mat.dispose());
      tex.dispose();
    },
  };
}
