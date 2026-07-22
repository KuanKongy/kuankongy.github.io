import * as THREE from "three";
import gsap from "gsap";
import { CHARACTER, PALETTE } from "../../constants";

/** The 4-lobe cumulus cloud every character rides. */
export function buildCloud(): THREE.Group {
  const cloud = new THREE.Group();
  const cloudMat = new THREE.MeshLambertMaterial({
    color: PALETTE.wizardCloud,
    emissive: PALETTE.wizardCloud.clone().multiplyScalar(0.18),
    transparent: true,
    opacity: 0.95,
  });
  const lobeRadii = [1.1, 0.95, 0.85, 0.75];
  const lobePositions: Array<[number, number, number]> = [
    [0, -0.4, 0],
    [-0.9, -0.2, 0.05],
    [0.95, -0.3, -0.1],
    [-0.3, -0.5, 0.6],
  ];
  for (let i = 0; i < lobeRadii.length; i++) {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(lobeRadii[i], 16, 12),
      cloudMat,
    );
    m.position.set(...lobePositions[i]);
    cloud.add(m);
  }
  return cloud;
}

export function makeStarTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext("2d")!;
  ctx.translate(32, 32);
  const yellow = "#" + PALETTE.wizardStar.getHexString();
  ctx.fillStyle = yellow;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 22 : 9;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(180,140,0,0.9)";
  ctx.lineWidth = 2;
  ctx.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * The spinning wand/staff star. depthTest:false + renderOrder 3 keep it from
 * vanishing behind the cloud lobes.
 */
export function buildStar(size = 0.55): {
  mesh: THREE.Mesh;
  texture: THREE.Texture;
} {
  const texture = makeStarTexture();
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    toneMapped: false,
    depthTest: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
  mesh.renderOrder = 3;
  return { mesh, texture };
}

export interface FlightRig {
  flyTo: (point: THREE.Vector3, seconds?: number) => Promise<void>;
  flyHome: (seconds?: number) => Promise<void>;
  placeAt: (point: THREE.Vector3) => void;
  /** Apply the idle bob (skipped while a flight tween is active). */
  applyIdleBob: (elapsed: number) => void;
  kill: () => void;
}

/** GSAP flight + idle-bob baseline shared by all characters. */
export function makeFlight(group: THREE.Group): FlightRig {
  let baseY = group.position.y;
  let active: gsap.core.Tween | null = null;

  const fly = (point: THREE.Vector3, seconds: number) =>
    new Promise<void>((resolve) => {
      active?.kill();
      active = gsap.to(group.position, {
        x: point.x,
        y: point.y,
        z: point.z,
        duration: seconds,
        ease: "power2.inOut",
        onUpdate: () => {
          baseY = group.position.y;
        },
        onComplete: () => {
          active = null;
          baseY = group.position.y;
          resolve();
        },
      });
    });

  return {
    flyTo: (point, seconds = 0.7) => fly(point, seconds),
    flyHome: (seconds = 0.7) => fly(CHARACTER.position, seconds),
    placeAt: (point) => {
      active?.kill();
      active = null;
      group.position.copy(point);
      baseY = point.y;
    },
    applyIdleBob: (t) => {
      if (active) return;
      group.position.y =
        baseY +
        Math.sin((t * Math.PI * 2) / CHARACTER.bobPeriod) *
          CHARACTER.bobAmplitude;
    },
    kill: () => active?.kill(),
  };
}

/** Night-time self-glow strength — subtle, keeps the daytime hues intact. */
const NIGHT_EMISSIVE = 0.16;

export interface ToonRig {
  /** Create a tracked toon material with the character's original colours. */
  toon: (c: THREE.ColorRepresentation) => THREE.MeshToonMaterial;
  /** Apply the theme: night lifts every tracked material's emissive. */
  setNight: (isDark: boolean) => void;
  /** 1 at night, 0 in day — for cast-glow math in update(). */
  nightMix: () => number;
  /** Recompute a material's emissive with an extra glow term (cast effect). */
  glow: (mat: THREE.MeshToonMaterial, extra: number) => void;
}

/**
 * Tracks a character's toon materials so day/night can re-tint them all.
 * Materials carry NO base emissive in day mode (original colouring); night
 * adds a gentle lift so the character doesn't collapse into a silhouette.
 */
export function makeToonRig(): ToonRig {
  const mats: Array<[THREE.MeshToonMaterial, THREE.Color]> = [];
  let night = 0;
  return {
    toon: (c) => {
      const col = new THREE.Color(c);
      const mat = new THREE.MeshToonMaterial({ color: col });
      mats.push([mat, col]);
      return mat;
    },
    setNight: (isDark) => {
      night = isDark ? 1 : 0;
      for (const [m, c] of mats) {
        m.emissive.copy(c).multiplyScalar(NIGHT_EMISSIVE * night);
      }
    },
    nightMix: () => night,
    glow: (mat, extra) => {
      const entry = mats.find(([m]) => m === mat);
      if (!entry) return;
      mat.emissive
        .copy(entry[1])
        .multiplyScalar(NIGHT_EMISSIVE * night + extra);
    },
  };
}

/** Dispose every geometry/material in a character group (all self-owned). */
export function disposeGroup(group: THREE.Group) {
  group.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
    const mat = m.material;
    if (mat) {
      if (Array.isArray(mat)) mat.forEach((mm) => mm.dispose());
      else (mat as THREE.Material).dispose();
    }
  });
}
