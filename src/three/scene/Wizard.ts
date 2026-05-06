import * as THREE from "three";
import gsap from "gsap";
import { PALETTE, WIZARD } from "../constants";

export interface WizardHandle {
  group: THREE.Group;
  /** The wizard's "home" perch position; he returns here after casting. */
  homePosition: THREE.Vector3;
  setCasting: (casting: boolean) => void;
  /** Animate the wizard to a world point (with gsap). */
  flyTo: (point: THREE.Vector3, seconds?: number) => Promise<void>;
  flyHome: (seconds?: number) => Promise<void>;
  update: (elapsed: number) => void;
  dispose: () => void;
}

function makeStarTexture(): THREE.Texture {
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

export function createWizard(): WizardHandle {
  const group = new THREE.Group();
  group.name = "Wizard";

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
    group.add(m);
  }

  const robeMat = new THREE.MeshToonMaterial({ color: PALETTE.wizardRobe });
  const skinMat = new THREE.MeshToonMaterial({ color: PALETTE.wizardSkin });
  const hatMat = new THREE.MeshToonMaterial({ color: PALETTE.wizardHat });

  const robe = new THREE.Mesh(
    new THREE.ConeGeometry(0.55, 1.2, 12, 1, true),
    robeMat,
  );
  robe.position.y = 0.6;
  group.add(robe);
  const robeBottom = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    robeMat,
  );
  group.add(robeBottom);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), skinMat);
  head.position.y = 1.35;
  group.add(head);

  const goggleMat = new THREE.MeshBasicMaterial({ color: 0x10081e });
  const goggleRing = new THREE.MeshBasicMaterial({ color: 0xff7733 });
  const lensGeo = new THREE.CircleGeometry(0.12, 16);
  const ringGeo = new THREE.RingGeometry(0.12, 0.17, 16);
  for (const x of [-0.14, 0.14]) {
    const ring = new THREE.Mesh(ringGeo, goggleRing);
    ring.position.set(x, 1.38, 0.41);
    ring.renderOrder = 1;
    group.add(ring);

    const lens = new THREE.Mesh(lensGeo, goggleMat);
    lens.position.set(x, 1.38, 0.415);
    lens.renderOrder = 2;
    group.add(lens);
  }

  const bridgeMat = new THREE.MeshBasicMaterial({ color: 0xff7733 });
  const bridge = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.04, 0.04),
    bridgeMat,
  );
  bridge.position.set(0, 1.38, 0.41);
  bridge.renderOrder = 1;
  group.add(bridge);

  const hat = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.0, 14), hatMat);
  hat.position.y = 2.05;
  hat.renderOrder = 0;
  group.add(hat);
  const brim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.55, 0.08, 18),
    hatMat,
  );
  brim.position.y = 1.58;
  brim.renderOrder = 0;
  group.add(brim);

  const starTex = makeStarTexture();
  const starMat = new THREE.MeshBasicMaterial({
    map: starTex,
    transparent: true,
    toneMapped: false,
    depthTest: false,
  });
  const starGeo = new THREE.PlaneGeometry(0.55, 0.55);
  const star = new THREE.Mesh(starGeo, starMat);
  star.position.set(0, 2.15, 0.48);
  star.renderOrder = 3;
  group.add(star);

  group.position.copy(WIZARD.position);
  group.scale.setScalar(0.85);

  let casting = 0; // 0..1 mix toward casting pose
  let baseY = group.position.y;
  let active: gsap.core.Tween | null = null;

  return {
    group,
    homePosition: WIZARD.position.clone(),
    setCasting: (c) => {
      casting = c ? 1 : 0;
    },
    flyTo: (point, seconds = 0.7) =>
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
      }),
    flyHome: (seconds = 0.7) =>
      new Promise<void>((resolve) => {
        active?.kill();
        active = gsap.to(group.position, {
          x: WIZARD.position.x,
          y: WIZARD.position.y,
          z: WIZARD.position.z,
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
      }),
    update: (t) => {
      if (!active) {
        // Idle bob applies only when not in a flight tween.
        group.position.y = baseY + Math.sin((t * Math.PI * 2) / WIZARD.bobPeriod) * WIZARD.bobAmplitude;
      }
      const sway = Math.sin(t * 0.9) * 0.08;
      group.rotation.z = sway - 0.2 * casting;
      hat.rotation.z = sway * 0.5 - 0.04 * casting;
      star.rotation.z = -t * (0.6 + 1.4 * casting);
    },
    dispose: () => {
      active?.kill();
      group.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = m.material;
        if (mat) {
          if (Array.isArray(mat)) mat.forEach((mm) => mm.dispose());
          else (mat as THREE.Material).dispose();
        }
      });
      starTex.dispose();
    },
  };
}
