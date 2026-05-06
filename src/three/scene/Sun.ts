import * as THREE from "three";

function makeSunGlowTexture(): THREE.Texture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2,
  );
  grad.addColorStop(0.0, "rgba(255, 250, 210, 0.95)");
  grad.addColorStop(0.4, "rgba(255, 220, 130, 0.5)");
  grad.addColorStop(0.7, "rgba(255, 180, 80, 0.16)");
  grad.addColorStop(1.0, "rgba(255, 120, 0, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export interface SunHandle {
  group: THREE.Group;
  update: (elapsed: number) => void;
  dispose: () => void;
}

/**
 * Solid yellow disc + warm halo for the day-mode sky. We hide it (and the
 * crescent moon) based on the dark/light theme.
 */
export function createSun(): SunHandle {
  const group = new THREE.Group();
  group.name = "Sun";

  const sunSize = 11;

  const sunMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uColor: { value: new THREE.Color("#fff1a8") },
      uEdge: { value: new THREE.Color("#ffc864") },
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
      uniform vec3 uEdge;
      varying vec2 vUv;
      void main() {
        vec2 p = vUv * 2.0 - 1.0;
        float d = length(p);
        if (d > 0.95) discard;
        float t = smoothstep(0.0, 0.92, d);
        vec3 col = mix(uColor, uEdge, t * t);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

  const sunGeo = new THREE.PlaneGeometry(sunSize, sunSize);
  const sunMesh = new THREE.Mesh(sunGeo, sunMat);
  sunMesh.renderOrder = 1;

  const glowTex = makeSunGlowTexture();
  const glowMat = new THREE.SpriteMaterial({
    map: glowTex,
    color: new THREE.Color("#ffe2a0"),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.set(34, 34, 1);
  glow.position.z = -0.5;
  glow.renderOrder = 0;

  group.add(glow);
  group.add(sunMesh);
  group.position.set(-6, 24, -90);

  const baseY = group.position.y;

  return {
    group,
    update: (t) => {
      group.position.y = baseY + Math.sin(t * 0.2) * 1.2;
    },
    dispose: () => {
      sunGeo.dispose();
      sunMat.dispose();
      glowMat.dispose();
      glowTex.dispose();
    },
  };
}
