import * as THREE from "three";
import { PALETTE } from "../constants";

interface Cloud {
  group: THREE.Group;
  speed: number;
  baseY: number;
  bobPhase: number;
}

export interface CloudsHandle {
  group: THREE.Group;
  update: (elapsed: number) => void;
  setDayNight: (isDark: boolean) => void;
  dispose: () => void;
}

/** Day-mode cloud colour: bright, white with a hint of warm cream. */
const DAY_CLOUD = new THREE.Color("#f5f5f8");

/**
 * Stylized cumulus clusters at varying depths. Two color tiers per cloud
 * (lighter highlight + slightly darker body lobe) so they read as rounded,
 * cartoon-shaded clouds. Palette tuned to be brighter against the lighter
 * night-purple sky.
 */
export function createClouds(count = 28): CloudsHandle {
  const root = new THREE.Group();
  root.name = "Clouds";
  const clouds: Cloud[] = [];
  const disposers: (() => void)[] = [];

  // One material shared by every lobe of every cloud — the user wanted
  // clouds to read as a single fluid colour rather than the previous
  // dark + light two-tier shading.
  const cloudMat = new THREE.MeshLambertMaterial({
    color: PALETTE.cloudLight,
    emissive: PALETTE.cloudLight.clone().multiplyScalar(0.18),
    transparent: true,
    opacity: 0.95,
  });
  disposers.push(() => cloudMat.dispose());

  for (let i = 0; i < count; i++) {
    const g = new THREE.Group();
    const lobes = 4 + Math.floor(Math.random() * 3);
    for (let j = 0; j < lobes; j++) {
      const r = THREE.MathUtils.randFloat(1.4, 3.0);
      const geo = new THREE.SphereGeometry(r, 14, 10);
      const m = new THREE.Mesh(geo, cloudMat);
      m.position.set(
        j * THREE.MathUtils.randFloat(1.4, 2.2) - lobes,
        THREE.MathUtils.randFloat(-0.3, 0.5),
        THREE.MathUtils.randFloat(-0.4, 0.4) - j * 0.05,
      );
      m.scale.set(
        THREE.MathUtils.randFloat(1, 1.3),
        THREE.MathUtils.randFloat(0.5, 0.8),
        THREE.MathUtils.randFloat(0.9, 1.2),
      );
      g.add(m);
      disposers.push(() => geo.dispose());
    }

    const depth = THREE.MathUtils.randFloat(-110, -25);
    g.position.set(
      THREE.MathUtils.randFloatSpread(110),
      THREE.MathUtils.randFloat(14, 38),
      depth,
    );
    g.scale.setScalar(THREE.MathUtils.randFloat(0.7, 1.5));

    clouds.push({
      group: g,
      speed: THREE.MathUtils.randFloat(0.25, 0.7) * (Math.random() < 0.5 ? -1 : 1),
      baseY: g.position.y,
      bobPhase: Math.random() * Math.PI * 2,
    });
    root.add(g);
  }

  return {
    group: root,
    update: (t) => {
      for (const c of clouds) {
        c.group.position.x += c.speed * 0.016;
        if (c.group.position.x > 60) c.group.position.x = -60;
        if (c.group.position.x < -60) c.group.position.x = 60;
        c.group.position.y = c.baseY + Math.sin(t * 0.4 + c.bobPhase) * 0.5;
      }
    },
    setDayNight: (isDark) => {
      const target = isDark ? PALETTE.cloudLight : DAY_CLOUD;
      cloudMat.color.copy(target);
      cloudMat.emissive.copy(target).multiplyScalar(isDark ? 0.18 : 0.05);
      cloudMat.needsUpdate = true;
    },
    dispose: () => disposers.forEach((d) => d()),
  };
}
