import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";
import {
  PHYSICS,
  PLAY_TUNING,
  TETROMINO_KEYS,
  type TetrominoKey,
} from "../constants";
import { PhysicsWorld } from "../physics/PhysicsWorld";
import { TetrominoFactory } from "./TetrominoFactory";

interface ActivePiece {
  group: THREE.Group;
  body: RAPIER.RigidBody;
  colliderHandles: number[];
  bornAt: number;
  /** True if this piece originated from the player (locked via PlayerPiece). */
  isPlayerOrigin: boolean;
  onVoid: ((p: ActivePiece) => void) | null;
}

export class TetrominoManager {
  private scene: THREE.Scene;
  private pw: PhysicsWorld;
  private factory: TetrominoFactory;

  private pieces: ActivePiece[] = [];
  private byHandle = new Map<number, ActivePiece>();
  private spawnTimer = 0;
  private nextSpawn = 1.5;
  private idleEnabled = true;
  private isMobile = false;

  private playerVoidListeners = new Set<() => void>();

  constructor(scene: THREE.Scene, pw: PhysicsWorld, factory: TetrominoFactory) {
    this.scene = scene;
    this.pw = pw;
    this.factory = factory;
    this.isMobile = !window.matchMedia("(min-width: 768px)").matches;
    pw.onVoidIntersect((_void, other) => {
      const piece = this.byHandle.get(other.handle);
      if (!piece) return;
      if (piece.isPlayerOrigin) {
        this.playerVoidListeners.forEach((fn) => fn());
      }
      this.removePiece(piece);
    });
  }

  setIdleEnabled(v: boolean) {
    this.idleEnabled = v;
  }

  onPlayerVoid(fn: () => void): () => void {
    this.playerVoidListeners.add(fn);
    return () => this.playerVoidListeners.delete(fn);
  }

  spawnIdle() {
    const key = TETROMINO_KEYS[Math.floor(Math.random() * TETROMINO_KEYS.length)];
    const x = THREE.MathUtils.randFloat(-18, 18);
    const y = THREE.MathUtils.randFloat(40, 60);
    const yaw = Math.random() * Math.PI * 2;
    this.spawnDynamic(key, x, y, 0, yaw, false);
  }

  /**
   * Used by PlayerPiece.lockNow(): the player piece destroys its kinematic
   * body and creates a fresh dynamic body, then hands ownership to the
   * spawner so this manager handles tracking/cleanup.
   */
  registerPlayerLocked(args: {
    group: THREE.Group;
    body: RAPIER.RigidBody;
    colliderHandles: number[];
  }) {
    const piece: ActivePiece = {
      group: args.group,
      body: args.body,
      colliderHandles: args.colliderHandles,
      bornAt: performance.now(),
      isPlayerOrigin: true,
      onVoid: null,
    };
    this.pieces.push(piece);
    args.colliderHandles.forEach((h) => this.byHandle.set(h, piece));
    this.enforceCap();
  }

  private spawnDynamic(
    key: TetrominoKey,
    x: number,
    y: number,
    z: number,
    yaw: number,
    isPlayerOrigin: boolean,
  ): ActivePiece {
    const built = this.factory.create(key);
    const group = built.group;

    group.position.set(x, y, z);
    group.rotation.y = yaw;
    this.scene.add(group);

    const q = new THREE.Quaternion().setFromEuler(group.rotation);
    const desc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(x, y, z)
      .setRotation({ x: q.x, y: q.y, z: q.z, w: q.w })
      .setLinearDamping(0.6)
      .setAngularDamping(1.6);
    const body = this.pw.world.createRigidBody(desc);

    const handles: number[] = [];
    for (const off of built.colliderOffsets) {
      const cd = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5)
        .setTranslation(off[0], off[1], off[2])
        .setFriction(1.6)
        .setRestitution(0)
        .setDensity(2.0);
      const col = this.pw.world.createCollider(cd, body);
      handles.push(col.handle);
    }

    const piece: ActivePiece = {
      group,
      body,
      colliderHandles: handles,
      bornAt: performance.now(),
      isPlayerOrigin,
      onVoid: null,
    };
    this.pieces.push(piece);
    handles.forEach((h) => this.byHandle.set(h, piece));
    this.enforceCap();
    return piece;
  }

  private enforceCap() {
    const cap = this.isMobile ? PLAY_TUNING.mobileBodyCap : PHYSICS.maxBodies;
    while (this.pieces.length > cap) {
      const oldest = this.pieces.shift();
      if (oldest) this.removePiece(oldest, true);
    }
  }

  private removePiece(p: ActivePiece, alreadyShifted = false) {
    if (!alreadyShifted) {
      const i = this.pieces.indexOf(p);
      if (i >= 0) this.pieces.splice(i, 1);
    }
    p.colliderHandles.forEach((h) => this.byHandle.delete(h));
    if (p.group.parent) p.group.parent.remove(p.group);
    try {
      this.pw.world.removeRigidBody(p.body);
    } catch {
      // already removed
    }
  }

  clearAll() {
    for (const p of [...this.pieces]) this.removePiece(p);
  }

  /**
   * Gently push idle (non-player) pieces away from a world-space point —
   * the cursor-reactive effect in PORTFOLIO. Impulses only, on existing
   * bodies; never spawns anything.
   */
  applyRepel(point: THREE.Vector3, radius: number, strength: number) {
    const r2 = radius * radius;
    for (const p of this.pieces) {
      if (p.isPlayerOrigin) continue;
      const t = p.body.translation();
      const dx = t.x - point.x;
      const dy = t.y - point.y;
      const dz = t.z - point.z;
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 > r2 || d2 < 1e-4) continue;
      const d = Math.sqrt(d2);
      const falloff = 1 - d / radius;
      const s = (strength * falloff) / d;
      // Damp the vertical component so pieces drift sideways, not upward.
      p.body.applyImpulse({ x: dx * s, y: dy * s * 0.35, z: dz * s }, true);
    }
  }

  topPlayerY(): number {
    let max = -Infinity;
    for (const p of this.pieces) {
      if (!p.isPlayerOrigin) continue;
      const t = p.body.translation();
      if (t.y > max) max = t.y;
    }
    return max === -Infinity ? 0 : max;
  }

  update(dt: number) {
    if (this.idleEnabled) {
      this.spawnTimer += dt;
      if (this.spawnTimer >= this.nextSpawn) {
        this.spawnTimer = 0;
        this.nextSpawn = this.isMobile
          ? THREE.MathUtils.randFloat(
              PLAY_TUNING.mobileSpawnMin,
              PLAY_TUNING.mobileSpawnMax,
            )
          : THREE.MathUtils.randFloat(
              PLAY_TUNING.idleSpawnMin,
              PLAY_TUNING.idleSpawnMax,
            );
        this.spawnIdle();
      }
    }
    for (const p of this.pieces) {
      const t = p.body.translation();
      const r = p.body.rotation();
      p.group.position.set(t.x, t.y, t.z);
      p.group.quaternion.set(r.x, r.y, r.z, r.w);
    }
  }

  dispose() {
    this.clearAll();
    this.playerVoidListeners.clear();
  }
}
