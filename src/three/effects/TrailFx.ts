import * as THREE from "three";
import { TETROMINO_COLORS, type TetrominoKey } from "../constants";

export interface EmitArea {
  x: number;
  y: number;
  z: number;
  halfW: number;
  halfH: number;
  key: TetrominoKey;
}

export interface BeamSpec {
  x: number;
  /** World Y of the piece's top — the beam rises from here. */
  topY: number;
  z: number;
  width: number;
  /** Downward speed (positive number) — drives length + brightness. */
  speed: number;
  key: TetrominoKey;
}

/** Vertical light-column gradient: bright at the bottom, clear at the top. */
function makeBeamTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 32;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 256, 0, 0);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.75)");
  g.addColorStop(0.6, "rgba(255,255,255,0.32)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 32, 256);
  // Soften the vertical side edges so the column has no hard border.
  const side = ctx.createLinearGradient(0, 0, 32, 0);
  side.addColorStop(0, "rgba(0,0,0,1)");
  side.addColorStop(0.25, "rgba(0,0,0,0)");
  side.addColorStop(0.75, "rgba(0,0,0,0)");
  side.addColorStop(1, "rgba(0,0,0,1)");
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = side;
  ctx.fillRect(0, 0, 32, 256);
  ctx.globalCompositeOperation = "source-over";
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

interface BeamSlot {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  id: string | number | null;
  /** Seconds since the owner last refreshed this beam. */
  starved: number;
  target: number;
}

/**
 * Soft light columns above falling pieces — the image.png look: a CUBIC
 * volume (a real box matching the piece's depth), pure piece colour, no
 * hot core. Slots are claimed per piece id each frame via beam(); a slot
 * whose owner stops feeding it (piece locked/removed) fades out on its
 * own, so there is no acquire/release bookkeeping to leak.
 */
class BeamPool {
  group: THREE.Group;
  private slots: BeamSlot[] = [];
  private byId = new Map<string | number, BeamSlot>();
  private geo: THREE.CylinderGeometry;
  private tex: THREE.CanvasTexture;
  private tint = new THREE.Color();
  private white = new THREE.Color(0xffffff);

  constructor(count: number) {
    this.group = new THREE.Group();
    this.group.name = "BeamPool";
    this.tex = makeBeamTexture();
    // An OPEN-ENDED square tube (4-sided cylinder rotated 45°): cubic like
    // the pieces, but with no cap faces — so no square ever shows at the
    // top of the trail. Origin at the bottom so scale.y grows it upward;
    // the vertical gradient maps bottom-bright → top-clear on the walls.
    this.geo = new THREE.CylinderGeometry(
      Math.SQRT1_2,
      Math.SQRT1_2,
      1,
      4,
      1,
      true,
    );
    this.geo.rotateY(Math.PI / 4);
    this.geo.translate(0, 0.5, 0);
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshBasicMaterial({
        map: this.tex,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        fog: false,
      });
      const mesh = new THREE.Mesh(this.geo, mat);
      mesh.visible = false;
      mesh.renderOrder = 1;
      this.group.add(mesh);
      this.slots.push({
        mesh,
        mat,
        id: null,
        starved: Infinity,
        target: 0,
      });
    }
  }

  beam(id: string | number, spec: BeamSpec) {
    let slot = this.byId.get(id);
    if (!slot) {
      slot =
        this.slots.find((s) => s.id === null) ??
        // Steal the most-starved slot if everything is claimed.
        this.slots.reduce((a, b) => (a.starved >= b.starved ? a : b));
      if (slot.id !== null) this.byId.delete(slot.id);
      slot.id = id;
      this.byId.set(id, slot);
      // Pure piece colour — barely any white lift.
      this.tint.set(TETROMINO_COLORS[spec.key]).lerp(this.white, 0.05);
      slot.mat.color.copy(this.tint);
    }
    slot.starved = 0;

    // Soft image.png columns — present but never hot.
    const len = THREE.MathUtils.clamp(6 + spec.speed * 1.2, 6, 16);
    slot.target = THREE.MathUtils.clamp(0.1 + spec.speed * 0.03, 0.1, 0.26);
    slot.mesh.visible = true;
    slot.mesh.scale.set(spec.width, len, 0.9);
    slot.mesh.position.set(spec.x, spec.topY - 0.4, spec.z);
  }

  update(dt: number) {
    for (const slot of this.slots) {
      if (slot.id === null && slot.mat.opacity <= 0) continue;
      slot.starved += dt;
      const fading = slot.starved > 0.15;
      const to = fading ? 0 : slot.target;
      const k = Math.min(1, dt * (fading ? 6 : 10));
      slot.mat.opacity += (to - slot.mat.opacity) * k;
      if (fading && slot.mat.opacity < 0.01) {
        slot.mat.opacity = 0;
        slot.mesh.visible = false;
        if (slot.id !== null) {
          this.byId.delete(slot.id);
          slot.id = null;
        }
      }
    }
  }

  dispose() {
    this.geo.dispose();
    this.tex.dispose();
    for (const s of this.slots) s.mat.dispose();
    this.slots = [];
    this.byId.clear();
  }
}

function makeSoftDotTexture(): THREE.CanvasTexture {
  const size = 64;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.7)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeSparkleTexture(): THREE.CanvasTexture {
  const size = 64;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.translate(32, 32);
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.3, "rgba(255,255,255,0.4)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? 30 : 5;
    const a = (i * Math.PI) / 4;
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

/** One GPU Points cloud with CPU-simulated particles (single draw call). */
class ParticleCloud {
  points: THREE.Points;
  private geo: THREE.BufferGeometry;
  private mat: THREE.ShaderMaterial;
  private max: number;
  private pos: Float32Array;
  private col: Float32Array;
  private alpha: Float32Array;
  private size: Float32Array;
  private vel: Float32Array;
  private age: Float32Array;
  private ttl: Float32Array;
  private baseAlpha: Float32Array;
  private cursor = 0;
  private gravity: number;

  constructor(max: number, sprite: THREE.Texture, gravity: number) {
    this.max = max;
    this.gravity = gravity;
    this.pos = new Float32Array(max * 3);
    this.col = new Float32Array(max * 3);
    this.alpha = new Float32Array(max);
    this.size = new Float32Array(max);
    this.vel = new Float32Array(max * 3);
    this.age = new Float32Array(max);
    this.ttl = new Float32Array(max); // 0 = dead

    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
    this.geo.setAttribute("aColor", new THREE.BufferAttribute(this.col, 3));
    this.geo.setAttribute("aAlpha", new THREE.BufferAttribute(this.alpha, 1));
    this.geo.setAttribute("aSize", new THREE.BufferAttribute(this.size, 1));
    this.baseAlpha = new Float32Array(max);

    this.mat = new THREE.ShaderMaterial({
      uniforms: { uSprite: { value: sprite } },
      vertexShader: /* glsl */ `
        attribute vec3 aColor;
        attribute float aAlpha;
        attribute float aSize;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vColor = aColor;
          vAlpha = aAlpha;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (420.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uSprite;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec4 tex = texture2D(uSprite, gl_PointCoord);
          if (tex.a < 0.01) discard;
          gl_FragColor = vec4(tex.rgb * vColor, tex.a * vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(this.geo, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 2;
  }

  spawn(
    x: number,
    y: number,
    z: number,
    vx: number,
    vy: number,
    vz: number,
    color: THREE.Color,
    size: number,
    ttl: number,
    baseAlpha: number,
  ) {
    const i = this.cursor;
    this.cursor = (this.cursor + 1) % this.max;
    this.pos[i * 3] = x;
    this.pos[i * 3 + 1] = y;
    this.pos[i * 3 + 2] = z;
    this.vel[i * 3] = vx;
    this.vel[i * 3 + 1] = vy;
    this.vel[i * 3 + 2] = vz;
    this.col[i * 3] = color.r;
    this.col[i * 3 + 1] = color.g;
    this.col[i * 3 + 2] = color.b;
    this.size[i] = size;
    this.age[i] = 0;
    this.ttl[i] = ttl;
    this.baseAlpha[i] = baseAlpha;
    this.alpha[i] = baseAlpha;
  }

  update(dt: number) {
    let any = false;
    for (let i = 0; i < this.max; i++) {
      if (this.ttl[i] <= 0) continue;
      this.age[i] += dt;
      if (this.age[i] >= this.ttl[i]) {
        this.ttl[i] = 0;
        this.alpha[i] = 0;
        continue;
      }
      any = true;
      this.vel[i * 3 + 1] -= this.gravity * dt;
      this.pos[i * 3] += this.vel[i * 3] * dt;
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      const k = this.age[i] / this.ttl[i];
      this.alpha[i] = this.baseAlpha[i] * (1 - k);
    }
    this.geo.getAttribute("position").needsUpdate = true;
    this.geo.getAttribute("aColor").needsUpdate = true;
    this.geo.getAttribute("aAlpha").needsUpdate = true;
    this.geo.getAttribute("aSize").needsUpdate = true;
    this.points.visible = any;
  }

  dispose() {
    this.geo.dispose();
    this.mat.dispose();
  }
}

/**
 * Fall-trail effects: bright vertical light columns above falling pieces
 * (the image.png look, via BeamPool) + a light dusting of drifting
 * particles + lock-sparkle bursts. Particles are single pooled Points draw
 * calls; beams are a handful of additive quads.
 */
export class TrailFx {
  private group: THREE.Group;
  private dotTex: THREE.CanvasTexture;
  private sparkTex: THREE.CanvasTexture;
  private trail: ParticleCloud;
  private bursts: ParticleCloud;
  private beams: BeamPool;
  private tint = new THREE.Color();
  private white = new THREE.Color(0xffffff);

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    this.group.name = "TrailFx";
    scene.add(this.group);
    this.dotTex = makeSoftDotTexture();
    this.sparkTex = makeSparkleTexture();
    const isMobile = !window.matchMedia("(min-width: 768px)").matches;
    this.trail = new ParticleCloud(isMobile ? 90 : 180, this.dotTex, 1.8);
    this.bursts = new ParticleCloud(48, this.sparkTex, 3.0);
    this.beams = new BeamPool(isMobile ? 3 : 6);
    this.group.add(this.trail.points, this.bursts.points, this.beams.group);
  }

  /** Claim/refresh the glowing light column for piece `id` this frame. */
  beam(id: string | number, spec: BeamSpec) {
    this.beams.beam(id, spec);
  }

  /** Emit `n` trail particles across a falling piece's area. */
  emit(n: number, area: EmitArea) {
    this.tint.set(TETROMINO_COLORS[area.key]).lerp(this.white, 0.3);
    for (let i = 0; i < n; i++) {
      this.trail.spawn(
        area.x + THREE.MathUtils.randFloatSpread(area.halfW * 1.8),
        area.y + THREE.MathUtils.randFloatSpread(area.halfH * 2),
        area.z + THREE.MathUtils.randFloatSpread(0.6) + 0.05,
        THREE.MathUtils.randFloatSpread(0.7),
        -THREE.MathUtils.randFloat(0.3, 1.2),
        0,
        this.tint,
        THREE.MathUtils.randFloat(0.18, 0.35),
        THREE.MathUtils.randFloat(0.45, 0.9),
        0.85,
      );
    }
  }

  /** Sparkle burst at the given world positions (2 sparkles per position). */
  burst(positions: THREE.Vector3[], key: TetrominoKey) {
    this.tint.set(TETROMINO_COLORS[key]).lerp(this.white, 0.4);
    for (const p of positions) {
      for (let i = 0; i < 2; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = THREE.MathUtils.randFloat(1.5, 3);
        this.bursts.spawn(
          p.x,
          p.y,
          p.z + 0.1,
          Math.cos(a) * r,
          Math.abs(Math.sin(a)) * r * 0.7 + 1,
          0,
          this.tint,
          THREE.MathUtils.randFloat(0.45, 0.75),
          THREE.MathUtils.randFloat(0.35, 0.6),
          1,
        );
      }
    }
  }

  update(dt: number) {
    this.trail.update(dt);
    this.bursts.update(dt);
    this.beams.update(dt);
  }

  dispose() {
    if (this.group.parent) this.group.parent.remove(this.group);
    this.trail.dispose();
    this.bursts.dispose();
    this.beams.dispose();
    this.dotTex.dispose();
    this.sparkTex.dispose();
  }
}
