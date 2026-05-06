import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";
import type { PhysicsWorld } from "../physics/PhysicsWorld";
import { TETROMINO_COLORS, type TetrominoKey } from "../constants";

interface ColumnVisual {
  beam: THREE.Mesh;
  shadow: THREE.Mesh;
}

const HALF_W = 0.5;

interface ColumnSpec {
  /** Half-block grid key (x * 4 rounded to int). */
  key: number;
  /** World X centre of this half-block column. */
  wx: number;
  /** Lowest cell-bottom Y in this column. */
  cellBottom: number;
  /** Hit Y from raycast (= ground beneath the lowest cell in this column). */
  groundY: number;
}

/**
 * Drop-shadow preview that operates on HALF-BLOCK columns under the piece.
 *
 * For every cell of the piece we record TWO half-block columns (left and
 * right halves of the cell). When multiple cells stack vertically into the
 * same half-block X column we keep only the LOWEST cellBottom (no double
 * draws), and at render time we GREEDY-MERGE adjacent half-block columns
 * that share the same cellBottom + groundY into one wider beam so adjacent
 * columns never draw seams where their transparent edges meet.
 */
export class FallingRay {
  private scene: THREE.Scene;
  private group: THREE.Group;
  private cols: ColumnVisual[] = [];
  private color = new THREE.Color(0xffffff);
  private beamMat: THREE.MeshBasicMaterial;
  private shadowMat: THREE.MeshBasicMaterial;
  private beamGeo: THREE.BoxGeometry;
  private shadowGeo: THREE.PlaneGeometry;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = "FallingRay";
    this.group.visible = false;
    scene.add(this.group);

    // Unit primitives — scale.x sets the beam's actual width per render.
    this.beamGeo = new THREE.BoxGeometry(1, 1, 1);
    this.shadowGeo = new THREE.PlaneGeometry(1, 1);

    this.beamMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.13,
      depthWrite: false,
      blending: THREE.NormalBlending,
      toneMapped: false,
    });
    this.shadowMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.NormalBlending,
      toneMapped: false,
      side: THREE.DoubleSide,
    });

    // 8 visual slots — biggest case is 4-cell piece × 2 halves with no merge.
    for (let i = 0; i < 8; i++) {
      const beam = new THREE.Mesh(this.beamGeo, this.beamMat);
      beam.visible = false;
      const shadow = new THREE.Mesh(this.shadowGeo, this.shadowMat);
      shadow.rotation.x = -Math.PI / 2;
      shadow.visible = false;
      this.group.add(beam, shadow);
      this.cols.push({ beam, shadow });
    }
  }

  setKey(key: TetrominoKey) {
    this.color.set(TETROMINO_COLORS[key]);
    this.beamMat.color.copy(this.color);
    this.shadowMat.color.copy(this.color);
  }

  update(
    pw: PhysicsWorld,
    pieceCenter: THREE.Vector3,
    rollRad: number,
    cellOffsets: ReadonlyArray<[number, number, number]>,
    exclude: Set<number>,
  ) {
    const cosR = Math.cos(rollRad);
    const sinR = Math.sin(rollRad);
    const pz = pieceCenter.z;

    // Step 1: collect half-block columns. Multiple cells stacked in the same
    // half-X column → keep the LOWEST cellBottom (so we never render two
    // beams on top of each other in the same column).
    const colsByKey = new Map<
      number,
      { wx: number; cellBottom: number }
    >();
    for (const off of cellOffsets) {
      const wx = pieceCenter.x + off[0] * cosR - off[1] * sinR;
      const wy = pieceCenter.y + off[0] * sinR + off[1] * cosR;
      const cellBottom = wy - 0.5;
      for (const dx of [-0.25, 0.25]) {
        const halfX = wx + dx;
        const key = Math.round(halfX * 4);
        const existing = colsByKey.get(key);
        if (!existing || cellBottom < existing.cellBottom) {
          colsByKey.set(key, { wx: halfX, cellBottom });
        }
      }
    }

    // Step 2: raycast each column to its surface.
    const specs: ColumnSpec[] = [];
    for (const [key, v] of colsByKey) {
      const ray = new RAPIER.Ray(
        { x: v.wx, y: v.cellBottom, z: pz },
        { x: 0, y: -1, z: 0 },
      );
      const hit = pw.world.castRay(
        ray,
        80,
        true,
        undefined,
        undefined,
        undefined,
        undefined,
        (col) => !exclude.has(col.handle),
      );
      if (!hit || hit.timeOfImpact <= 0.05) continue;
      specs.push({
        key,
        wx: v.wx,
        cellBottom: v.cellBottom,
        groundY: v.cellBottom - hit.timeOfImpact,
      });
    }

    // Step 3: greedy-merge adjacent columns that share cellBottom + groundY
    // into one wider beam — adjacent transparent boxes can't form a darker
    // edge seam when they're rendered as a single mesh.
    specs.sort((a, b) => a.key - b.key);
    type Run = { x0: number; x1: number; cellBottom: number; groundY: number };
    const runs: Run[] = [];
    const EPS = 0.05;
    for (const s of specs) {
      const last = runs[runs.length - 1];
      const matches =
        last !== undefined &&
        Math.round((last.x1 + HALF_W / 2) * 4) === s.key &&
        Math.abs(last.cellBottom - s.cellBottom) < EPS &&
        Math.abs(last.groundY - s.groundY) < EPS;
      if (matches) {
        last.x1 = s.wx + HALF_W / 2;
      } else {
        runs.push({
          x0: s.wx - HALF_W / 2,
          x1: s.wx + HALF_W / 2,
          cellBottom: s.cellBottom,
          groundY: s.groundY,
        });
      }
    }

    // Step 4: render runs into the slot pool.
    let slotIdx = 0;
    let any = false;
    for (const r of runs) {
      if (slotIdx >= this.cols.length) break;
      const slot = this.cols[slotIdx++];
      const width = r.x1 - r.x0;
      const cx = (r.x0 + r.x1) / 2;
      const length = r.cellBottom - r.groundY;

      slot.beam.visible = true;
      slot.beam.scale.set(width, length, 1);
      slot.beam.position.set(cx, r.groundY + length / 2, pz);

      slot.shadow.visible = true;
      slot.shadow.scale.set(width, 1, 1);
      slot.shadow.position.set(cx, r.groundY + 0.02, pz);

      any = true;
    }
    for (; slotIdx < this.cols.length; slotIdx++) {
      this.cols[slotIdx].beam.visible = false;
      this.cols[slotIdx].shadow.visible = false;
    }

    this.group.visible = any;
  }

  hide() {
    this.group.visible = false;
  }

  dispose() {
    if (this.group.parent) this.group.parent.remove(this.group);
    this.beamGeo.dispose();
    this.shadowGeo.dispose();
    this.beamMat.dispose();
    this.shadowMat.dispose();
    void this.scene;
  }
}
