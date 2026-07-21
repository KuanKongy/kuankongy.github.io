import * as THREE from "three";

interface Streak {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  vel: THREE.Vector3;
  life: number;
  ttl: number;
  delay: number;
  active: boolean;
}

export interface ShootingStarsHandle {
  group: THREE.Group;
  /** Fire up to `count` streaks (staggered). Internal cooldown between bursts. */
  burst: (count?: number) => void;
  update: (dt: number) => void;
  dispose: () => void;
}

/** White head fading into a fuchsia-tinted tail — matches the accent family. */
function makeStreakTexture(): THREE.Texture {
  const w = 128;
  const h = 16;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, "rgba(232,121,249,0)");
  g.addColorStop(0.55, "rgba(232,121,249,0.35)");
  g.addColorStop(0.85, "rgba(255,255,255,0.85)");
  g.addColorStop(1, "rgba(255,255,255,1)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const POOL_SIZE = 4;
const BURST_COOLDOWN_MS = 4000;

export function createShootingStars(): ShootingStarsHandle {
  const group = new THREE.Group();
  group.name = "ShootingStars";

  const texture = makeStreakTexture();
  const geo = new THREE.PlaneGeometry(10, 0.35);
  const pool: Streak[] = [];

  for (let i = 0; i < POOL_SIZE; i++) {
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.visible = false;
    mesh.frustumCulled = false;
    group.add(mesh);
    pool.push({
      mesh,
      mat,
      vel: new THREE.Vector3(),
      life: 0,
      ttl: 0,
      delay: 0,
      active: false,
    });
  }

  let lastBurst = -Infinity;

  function burst(count = 3) {
    const now = performance.now();
    if (now - lastBurst < BURST_COOLDOWN_MS) return;
    lastBurst = now;

    let launched = 0;
    for (const s of pool) {
      if (s.active || launched >= count) continue;
      s.active = true;
      s.life = 0;
      s.ttl = THREE.MathUtils.randFloat(1.1, 1.5);
      s.delay = launched * 0.35 + Math.random() * 0.2;
      s.mesh.position.set(
        THREE.MathUtils.randFloat(-70, 0),
        THREE.MathUtils.randFloat(35, 60),
        -70,
      );
      const speed = THREE.MathUtils.randFloat(32, 44);
      const dir = new THREE.Vector3(
        1,
        THREE.MathUtils.randFloat(-0.45, -0.3),
        0,
      ).normalize();
      s.vel.copy(dir).multiplyScalar(speed);
      s.mesh.rotation.z = Math.atan2(dir.y, dir.x);
      s.mesh.visible = false;
      launched++;
    }
  }

  function update(dt: number) {
    for (const s of pool) {
      if (!s.active) continue;
      if (s.delay > 0) {
        s.delay -= dt;
        continue;
      }
      s.life += dt;
      if (s.life >= s.ttl) {
        s.active = false;
        s.mesh.visible = false;
        s.mat.opacity = 0;
        continue;
      }
      s.mesh.visible = true;
      s.mesh.position.addScaledVector(s.vel, dt);
      s.mat.opacity = Math.sin(Math.PI * (s.life / s.ttl));
    }
  }

  return {
    group,
    burst,
    update,
    dispose: () => {
      geo.dispose();
      texture.dispose();
      for (const s of pool) s.mat.dispose();
    },
  };
}
