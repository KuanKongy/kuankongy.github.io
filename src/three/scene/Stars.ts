import * as THREE from "three";

/** Soft circular twinkle (the bulk of the field). */
function makeRoundSprite(): THREE.Texture {
  const size = 64;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0.0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.85)");
  g.addColorStop(0.6, "rgba(255,255,255,0.25)");
  g.addColorStop(1.0, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Filled 5-pointed star with a soft glow halo. */
function makeFivePointStarSprite(): THREE.Texture {
  const size = 96;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.translate(size / 2, size / 2);
  // Soft halo first.
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, size / 2);
  g.addColorStop(0.0, "rgba(255,255,255,0.55)");
  g.addColorStop(0.4, "rgba(255,255,255,0.15)");
  g.addColorStop(1.0, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
  ctx.fill();
  // 5-pointed star body.
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  const outer = size * 0.4;
  const inner = outer * 0.45;
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 4-pointed sparkle (long thin cross). */
function makeFourPointSparkleSprite(): THREE.Texture {
  const size = 96;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.translate(size / 2, size / 2);
  // Halo
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, size / 2);
  g.addColorStop(0.0, "rgba(255,255,255,0.5)");
  g.addColorStop(0.4, "rgba(255,255,255,0.12)");
  g.addColorStop(1.0, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
  ctx.fill();
  // 4-pointed sparkle: two crossed thin diamonds.
  ctx.fillStyle = "#ffffff";
  const longArm = size * 0.45;
  const shortArm = size * 0.08;
  const drawDiamond = () => {
    ctx.beginPath();
    ctx.moveTo(0, -longArm);
    ctx.lineTo(shortArm, 0);
    ctx.lineTo(0, longArm);
    ctx.lineTo(-shortArm, 0);
    ctx.closePath();
    ctx.fill();
  };
  drawDiamond();
  ctx.rotate(Math.PI / 2);
  drawDiamond();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

interface StarLayer {
  points: THREE.Points;
  geo: THREE.BufferGeometry;
  mat: THREE.ShaderMaterial;
  sprite: THREE.Texture;
}

export interface StarsHandle {
  /** A Group containing all star sub-layers — added once to the scene. */
  points: THREE.Group;
  update: (elapsed: number) => void;
  /** Brightness multiplier (1 = normal) — scroll-linked scene moments. */
  setBoost: (v: number) => void;
  dispose: () => void;
}

interface LayerSpec {
  count: number;
  sprite: THREE.Texture;
  baseSize: number;
  scaleRange: [number, number];
  /** Higher = faster twinkle. */
  twinkleSpeed: number;
  /** Polar-angle band (fraction of π) the layer occupies on the shell. */
  phiRange?: [number, number];
}

function buildLayer(spec: LayerSpec): StarLayer {
  const { count, sprite, baseSize, scaleRange, twinkleSpeed } = spec;
  const [phiMin, phiMax] = spec.phiRange ?? [0.05, 0.7];
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const scales = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const r = THREE.MathUtils.randFloat(140, 320);
    const theta = Math.random() * Math.PI * 2;
    const phi = THREE.MathUtils.randFloat(Math.PI * phiMin, Math.PI * phiMax);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) - 30;
    phases[i] = Math.random() * Math.PI * 2;
    scales[i] = THREE.MathUtils.randFloat(scaleRange[0], scaleRange[1]);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
  geo.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSprite: { value: sprite },
      uSize: { value: baseSize },
      uTwinkleSpeed: { value: twinkleSpeed },
      uBoost: { value: 1 },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uSize;
      uniform float uTwinkleSpeed;
      attribute float aPhase;
      attribute float aScale;
      varying float vTwinkle;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float t = sin(uTime * uTwinkleSpeed + aPhase) * 0.5 + 0.5;
        float t2 = sin(uTime * uTwinkleSpeed * 2.4 + aPhase * 1.7) * 0.5 + 0.5;
        vTwinkle = mix(0.7, 1.4, t * 0.7 + t2 * 0.3);
        gl_PointSize = uSize * aScale * (0.7 + 0.7 * t) * (1.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uSprite;
      uniform float uBoost;
      varying float vTwinkle;
      void main() {
        vec4 tex = texture2D(uSprite, gl_PointCoord);
        if (tex.a < 0.01) discard;
        gl_FragColor = vec4(tex.rgb * uBoost, tex.a * vTwinkle);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return { points, geo, mat, sprite };
}

/**
 * Four star "flavors":
 *   - tiny round pinpoints (the bulk)
 *   - 5-pointed bright stars  (less common, larger)
 *   - 4-pointed sparkle crosses (the rarest, brightest, fastest twinkle)
 *   - a dense band of small fast twinkles hugging the horizon
 */
export function createStars(
  round = 800,
  fivePt = 90,
  sparkle = 50,
  horizon = 220,
): StarsHandle {
  const root = new THREE.Group();
  root.name = "Stars";

  const roundSprite = makeRoundSprite();
  const fiveSprite = makeFivePointStarSprite();
  const sparkSprite = makeFourPointSparkleSprite();

  const isMobile = !window.matchMedia("(min-width: 768px)").matches;

  const layers: StarLayer[] = [
    buildLayer({
      count: round,
      sprite: roundSprite,
      baseSize: 1100,
      scaleRange: [0.5, 1.7],
      twinkleSpeed: 1.6,
    }),
    buildLayer({
      count: fivePt,
      sprite: fiveSprite,
      baseSize: 1900,
      scaleRange: [1.0, 2.1],
      twinkleSpeed: 1.2,
    }),
    buildLayer({
      count: sparkle,
      sprite: sparkSprite,
      baseSize: 2200,
      scaleRange: [1.2, 2.6],
      twinkleSpeed: 2.4,
    }),
    buildLayer({
      count: isMobile ? Math.round(horizon * 0.55) : horizon,
      sprite: roundSprite,
      baseSize: 800,
      scaleRange: [0.4, 1.0],
      twinkleSpeed: 2.0,
      phiRange: [0.38, 0.52],
    }),
  ];
  for (const l of layers) root.add(l.points);

  return {
    points: root,
    update: (t) => {
      for (const l of layers) l.mat.uniforms.uTime.value = t;
    },
    setBoost: (v) => {
      for (const l of layers) l.mat.uniforms.uBoost.value = v;
    },
    dispose: () => {
      for (const l of layers) {
        l.geo.dispose();
        l.mat.dispose();
        l.sprite.dispose();
      }
    },
  };
}
