import * as THREE from "three";
import { PALETTE } from "../constants";

function makeGlowTexture(): THREE.Texture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  grad.addColorStop(0.0, "rgba(255, 245, 200, 0.45)");
  grad.addColorStop(0.4, "rgba(255, 225, 150, 0.18)");
  grad.addColorStop(0.7, "rgba(180, 130, 220, 0.05)");
  grad.addColorStop(1.0, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export interface MoonHandle {
  group: THREE.Group;
  update: (elapsed: number) => void;
  dispose: () => void;
}

/**
 * Crescent moon drawn as a shader on a square plane. The fragment shader
 * computes two circle SDFs — the moon's outer disc minus an offset disc that
 * carves out the inside — for a clean crescent silhouette regardless of the
 * tessellation.
 */
export function createMoon(): MoonHandle {
  const group = new THREE.Group();
  group.name = "Moon";

  const moonSize = 12; // diameter in world units

  const moonMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uColor: { value: PALETTE.moon },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        // vUv in [0, 1]; remap to [-1, 1].
        vec2 p = vUv * 2.0 - 1.0;
        float discR = 0.92;       // moon outer radius
        float holeR = 0.86;       // bite radius
        vec2 holeCenter = vec2(0.34, 0.06);
        float dDisc = length(p) - discR;
        float dHole = length(p - holeCenter) - holeR;
        // Crescent area = inside disc AND outside hole.
        if (dDisc > 0.0) discard;
        if (dHole < 0.0) discard;
        // Soft inner edge for a gentle highlight.
        float edge = smoothstep(0.0, 0.06, -dDisc) * smoothstep(0.0, 0.04, dHole);
        gl_FragColor = vec4(uColor * (0.85 + 0.15 * edge), 1.0);
      }
    `,
  });

  const moonGeo = new THREE.PlaneGeometry(moonSize, moonSize);
  const moonMesh = new THREE.Mesh(moonGeo, moonMat);
  moonMesh.renderOrder = 1;

  const glowTex = makeGlowTexture();
  const glowMat = new THREE.SpriteMaterial({
    map: glowTex,
    color: PALETTE.moonGlow,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.set(18, 18, 1);
  glow.position.z = -0.5;
  glow.renderOrder = 0;

  group.add(glow);
  group.add(moonMesh);
  group.position.set(-6, 22, -90);
  group.rotation.z = -0.18;

  const baseY = group.position.y;

  return {
    group,
    update: (t) => {
      group.position.y = baseY + Math.sin(t * 0.25) * 1.6;
    },
    dispose: () => {
      moonGeo.dispose();
      moonMat.dispose();
      glowMat.dispose();
      glowTex.dispose();
    },
  };
}
