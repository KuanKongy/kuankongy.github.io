import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";
import {
  ARENA,
  PLAYER,
  type TetrominoKey,
} from "../constants";
import type { PhysicsWorld } from "../physics/PhysicsWorld";
import type { TetrominoFactory } from "./TetrominoFactory";
import type { InputAction } from "./InputController";
import { FallingRay } from "./FallingRay";
import type { TrailFx } from "../effects/TrailFx";

export interface PlayerPieceLockResult {
  body: RAPIER.RigidBody;
  group: THREE.Group;
  colliderHandles: number[];
  key: TetrominoKey;
  flat: boolean;
}

/**
 * 5 sample points on each cell's WORLD-axis-aligned BOTTOM face. We cast a
 * downward ray from each → if ANY of them hits a surface within the contact
 * threshold the piece locks immediately. This catches the "corner just kisses
 * another block" case the user kept hitting where a centered ray missed.
 */
const BOTTOM_SAMPLES_XZ: ReadonlyArray<[number, number]> = [
  [0, 0],
  [-0.45, -0.45],
  [0.45, -0.45],
  [-0.45, 0.45],
  [0.45, 0.45],
];

/**
 * The kinematic falling piece the player controls. Cells live in the X/Y
 * plane (z = 0). The piece rotates around Z so its silhouette flips between
 * horizontal and vertical orientations like classic Tetris.
 *
 * Spawn / movement use whole-cell columns — each piece is anchored to the
 * castle's column-center grid (x ∈ {-2.5, -1.5, …, 2.5}) by an X grid offset
 * computed from the piece's bbox-width parity. This guarantees every cell of
 * every piece lands on a full-block column regardless of width.
 */
export class PlayerPiece {
  private scene: THREE.Scene;
  private pw: PhysicsWorld;
  private factory: TetrominoFactory;
  key: TetrominoKey;
  private group: THREE.Group;
  /** Local cell offsets in piece-pivot space; X/Y vary, Z is always 0. */
  private colliderOffsets: Array<[number, number, number]>;

  /** X-grid anchor for this piece (0 for even-width, -0.5 for odd-width). */
  private gridX: number;
  /** Half-width of the piece (max |rotated X offset| extent). */
  private maxClampOffset = 0;

  private body: RAPIER.RigidBody;
  private colliderHandles: number[] = [];
  private spawnZ: number;

  private targetX: number;
  private targetY: number;
  private targetRoll: number;
  private currentX: number;
  private currentY: number;
  private currentRoll: number;
  private rotateAnim: { from: number; to: number; t: number; dur: number } | null = null;

  private locked = false;
  private excludeColliders = new Set<number>();
  private fallingRay: FallingRay;
  private trailFx: TrailFx | null;

  constructor(
    scene: THREE.Scene,
    pw: PhysicsWorld,
    factory: TetrominoFactory,
    key: TetrominoKey,
    fallingRay: FallingRay,
    trailFx: TrailFx | null,
    spawnX: number,
    spawnY: number,
    spawnZ: number,
  ) {
    this.scene = scene;
    this.pw = pw;
    this.factory = factory;
    this.key = key;
    this.fallingRay = fallingRay;
    this.fallingRay.setKey(key);
    this.trailFx = trailFx;

    const built = factory.create(key);
    this.group = built.group;
    this.colliderOffsets = built.colliderOffsets;

    // Spawn anchor: pieces snap to a half-block grid (moveStep = 0.5). For the
    // initial spawn we pick the position that puts the leftmost cell one cell
    // left of x=0, which is `-0.5` for odd-width pieces (J/L/T/S/Z) and `0`
    // for even-width pieces (I/O) — same parity rule as before, just for the
    // INITIAL placement; subsequent moves are unrestricted half-step columns.
    const off0x = this.colliderOffsets[0][0];
    const offsetsAreIntegers =
      Math.abs(off0x - Math.round(off0x)) < 1e-6;
    this.gridX = offsetsAreIntegers ? -0.5 : 0;

    // Snap requested spawnX onto the parity grid for the initial placement.
    const x = this.snapInitialX(spawnX);
    this.targetX = this.currentX = x;
    this.targetY = this.currentY = spawnY;
    this.targetRoll = this.currentRoll = 0;
    this.spawnZ = spawnZ;

    this.group.position.set(x, spawnY, spawnZ);
    scene.add(this.group);

    const desc = RAPIER.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(x, spawnY, spawnZ)
      .setRotation({ x: 0, y: 0, z: 0, w: 1 });
    this.body = pw.world.createRigidBody(desc);
    for (const off of this.colliderOffsets) {
      const cd = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5)
        .setTranslation(off[0], off[1], off[2])
        .setFriction(1.5)
        .setRestitution(0);
      const c = pw.world.createCollider(cd, this.body);
      this.colliderHandles.push(c.handle);
      this.excludeColliders.add(c.handle);
    }
  }

  isLocked(): boolean {
    return this.locked;
  }

  /** Compute min/max rotated-X offsets at the given roll. */
  private xExtents(roll: number): { min: number; max: number } {
    const cosR = Math.cos(roll);
    const sinR = Math.sin(roll);
    let minX = Infinity;
    let maxX = -Infinity;
    for (const off of this.colliderOffsets) {
      const rx = off[0] * cosR - off[1] * sinR;
      if (rx < minX) minX = rx;
      if (rx > maxX) maxX = rx;
    }
    return { min: minX, max: maxX };
  }

  /**
   * Snap a desired X to the half-block grid AND clamp it so every cell stays
   * within the playfield. roll lets us recompute the X bbox after a 90°
   * rotation.
   */
  private snapXToGrid(rawX: number, roll: number): number {
    const { min, max } = this.xExtents(roll);
    this.maxClampOffset = Math.max(-min, max);
    const halfW = ARENA.playfieldHalfWidth;
    const minX = -halfW + 0.5 - min;
    const maxX = halfW - 0.5 - max;
    // Quantize to half-block grid.
    const snapped = Math.round(rawX * 2) / 2;
    return THREE.MathUtils.clamp(snapped, minX, maxX);
  }

  /**
   * For the very first placement use the parity-aware anchor so the leftmost
   * cell lands on a column-center of the castle grid.
   */
  private snapInitialX(rawX: number): number {
    const { min, max } = this.xExtents(0);
    this.maxClampOffset = Math.max(-min, max);
    const halfW = ARENA.playfieldHalfWidth;
    const minX = -halfW + 0.5 - min;
    const maxX = halfW - 0.5 - max;
    const k = Math.round(rawX - this.gridX);
    const snapped = this.gridX + k;
    return THREE.MathUtils.clamp(snapped, minX, maxX);
  }

  applyAction(a: InputAction) {
    if (this.locked) return;
    const roll = this.rotateAnim ? this.currentRoll : this.targetRoll;
    switch (a) {
      case "moveLeft":
        this.targetX = this.snapXToGrid(this.targetX - PLAYER.moveStep, roll);
        break;
      case "moveRight":
        this.targetX = this.snapXToGrid(this.targetX + PLAYER.moveStep, roll);
        break;
      case "rotate":
        if (!this.rotateAnim) {
          this.rotateAnim = {
            from: this.currentRoll,
            to: this.targetRoll - Math.PI / 2,
            t: 0,
            dur: PLAYER.rotateMs / 1000,
          };
          this.targetRoll = this.rotateAnim.to;
        }
        break;
    }
  }

  /** Rotate a piece-local offset around Z and return its world (X, Y) delta. */
  private rotatedOffset(off: [number, number, number]): [number, number] {
    const cosR = Math.cos(this.currentRoll);
    const sinR = Math.sin(this.currentRoll);
    return [off[0] * cosR - off[1] * sinR, off[0] * sinR + off[1] * cosR];
  }

  update(dt: number, isSoftDrop: boolean): PlayerPieceLockResult | null {
    if (this.locked) return null;

    const fallSpeed =
      PLAYER.fallSpeed * (isSoftDrop ? PLAYER.softDropMultiplier : 1);
    this.targetY -= fallSpeed * dt;

    this.currentX = THREE.MathUtils.lerp(this.currentX, this.targetX, 0.45);
    this.currentY = THREE.MathUtils.lerp(this.currentY, this.targetY, 0.55);

    if (this.rotateAnim) {
      this.rotateAnim.t += dt;
      const k = THREE.MathUtils.clamp(this.rotateAnim.t / this.rotateAnim.dur, 0, 1);
      const eased = k * (2 - k);
      this.currentRoll =
        this.rotateAnim.from + (this.rotateAnim.to - this.rotateAnim.from) * eased;
      if (k >= 1) {
        this.currentRoll = this.rotateAnim.to;
        this.rotateAnim = null;
        // Re-snap target X for the new orientation.
        this.targetX = this.snapXToGrid(this.targetX, this.currentRoll);
      }
    } else {
      this.currentRoll = this.targetRoll;
    }

    this.body.setNextKinematicTranslation({
      x: this.currentX,
      y: this.currentY,
      z: this.spawnZ,
    });
    const q = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0, 0, this.currentRoll),
    );
    this.body.setNextKinematicRotation({
      x: q.x,
      y: q.y,
      z: q.z,
      w: q.w,
    });
    this.group.position.set(this.currentX, this.currentY, this.spawnZ);
    this.group.quaternion.copy(q);

    // No fall trail during gameplay (user call: trails are portfolio-only
    // ambience); the lock sparkle burst in lockNow() is the only piece FX.

    this.fallingRay.update(
      new THREE.Vector3(this.currentX, this.currentY, this.spawnZ),
      this.currentRoll,
      this.colliderOffsets,
    );

    // Skip the lock check during rotation animation (cell faces aren't world
    // axis-aligned mid-rotate).
    if (this.rotateAnim) return null;

    let touching = false;
    let bestSupportY = -Infinity;
    for (const off of this.colliderOffsets) {
      const [rx, ry] = this.rotatedOffset(off);
      const cellWX = this.currentX + rx;
      const cellWY = this.currentY + ry;
      const cellBottomY = cellWY - 0.5;
      for (const [dx, dz] of BOTTOM_SAMPLES_XZ) {
        const ray = new RAPIER.Ray(
          { x: cellWX + dx, y: cellBottomY, z: this.spawnZ + dz },
          { x: 0, y: -1, z: 0 },
        );
        const hit = this.pw.world.castRay(
          ray,
          PLAYER.contactThreshold + 0.04,
          true,
          undefined,
          undefined,
          undefined,
          undefined,
          (col) => !this.excludeColliders.has(col.handle),
        );
        if (hit && hit.timeOfImpact <= PLAYER.contactThreshold + 0.04) {
          touching = true;
          // Record the highest support so we can snap exactly onto the surface.
          const supportTopY = cellBottomY - hit.timeOfImpact;
          // The piece center Y that would put this cell exactly on its support.
          const requiredCenterY = supportTopY + 0.5 - ry;
          if (requiredCenterY > bestSupportY) bestSupportY = requiredCenterY;
        }
      }
    }

    if (!touching) return null;

    // Snap exactly onto the highest support surface so the piece never
    // overshoots into the block below.
    if (Number.isFinite(bestSupportY)) {
      this.currentY = bestSupportY;
      this.targetY = bestSupportY;
      this.body.setNextKinematicTranslation({
        x: this.currentX,
        y: this.currentY,
        z: this.spawnZ,
      });
      this.group.position.y = this.currentY;
    }
    return this.lockNow();
  }

  private lockNow(): PlayerPieceLockResult {
    this.locked = true;
    this.fallingRay.hide();
    if (this.trailFx) {
      const cells = this.colliderOffsets.map((off) => {
        const [rx, ry] = this.rotatedOffset(off);
        return new THREE.Vector3(
          this.currentX + rx,
          this.currentY + ry,
          this.spawnZ,
        );
      });
      this.trailFx.burst(cells, this.key);
    }

    const flat = true;
    const q = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0, 0, this.currentRoll),
    );
    const dynDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(this.currentX, this.currentY, this.spawnZ)
      .setRotation({ x: q.x, y: q.y, z: q.z, w: q.w })
      .setLinearDamping(1.4)
      .setAngularDamping(3.5)
      .setCcdEnabled(true)
      // Constrain to the X/Y play plane so blocks never wander in Z and
      // "merge" sideways. They still tumble freely around Z.
      .enabledTranslations(true, true, false)
      .enabledRotations(false, false, true);
    const newBody = this.pw.world.createRigidBody(dynDesc);
    const newHandles: number[] = [];
    for (const off of this.colliderOffsets) {
      const cd = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5)
        .setTranslation(off[0], off[1], off[2])
        .setFriction(1.8)
        .setRestitution(0)
        .setDensity(4.0);
      const col = this.pw.world.createCollider(cd, newBody);
      newHandles.push(col.handle);
    }
    try {
      this.pw.world.removeRigidBody(this.body);
    } catch {
      // already removed
    }
    void this.maxClampOffset;

    return {
      body: newBody,
      group: this.group,
      colliderHandles: newHandles,
      key: this.key,
      flat,
    };
  }

  abort() {
    if (this.locked) return;
    this.locked = true;
    this.fallingRay.hide();
    if (this.group.parent) this.group.parent.remove(this.group);
    try {
      this.pw.world.removeRigidBody(this.body);
    } catch {
      // gone
    }
    void this.scene;
    void this.factory;
  }
}
