import * as THREE from "three";
import { TETROMINO_COLORS, type TetrominoKey } from "../constants";

/** Columns extend to just below the void so they never visibly end. */
const BOTTOM_Y = -22;

/**
 * The falling piece's drop indicator, done as a true projection VOLUME:
 * one translucent vertical column under EACH cell column, running from
 * that column's lowest cube bottom ALL the way down (like the light band
 * beneath the falling piece in the survival reference). No raycasts and
 * no landing quads — the tower/castle geometry simply occludes whatever
 * part of a column it stands in front of, so a column that half-overlaps
 * a block keeps going below it while the covered half is hidden. Adjacent
 * columns are exactly 1 cell wide and share edges, so the shadow always
 * reads as one continuous whole.
 */
export class FallingRay {
  private group: THREE.Group;
  private cols: THREE.Mesh[] = [];
  private mat: THREE.MeshBasicMaterial;
  private geo: THREE.BoxGeometry;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    this.group.name = "FallingRay";
    this.group.visible = false;
    scene.add(this.group);

    // Origin at the TOP face so scale.y grows the column downward from
    // the cube's bottom.
    this.geo = new THREE.BoxGeometry(1, 1, 1);
    this.geo.translate(0, -0.5, 0);

    this.mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      toneMapped: false,
    });

    // One column per possible cell column (I piece = 4).
    for (let i = 0; i < 4; i++) {
      const col = new THREE.Mesh(this.geo, this.mat);
      col.visible = false;
      this.group.add(col);
      this.cols.push(col);
    }
  }

  setKey(key: TetrominoKey) {
    this.mat.color.set(TETROMINO_COLORS[key]);
  }

  update(
    pieceCenter: THREE.Vector3,
    rollRad: number,
    cellOffsets: ReadonlyArray<[number, number, number]>,
  ) {
    const cosR = Math.cos(rollRad);
    const sinR = Math.sin(rollRad);
    const pz = pieceCenter.z;

    // One column per cell column; stacked cells project from the LOWEST
    // cube bottom in that column.
    const colsByKey = new Map<number, { wx: number; cellBottom: number }>();
    for (const off of cellOffsets) {
      const wx = pieceCenter.x + off[0] * cosR - off[1] * sinR;
      const wy = pieceCenter.y + off[0] * sinR + off[1] * cosR;
      const cellBottom = wy - 0.5;
      const key = Math.round(wx * 2);
      const existing = colsByKey.get(key);
      if (!existing || cellBottom < existing.cellBottom) {
        colsByKey.set(key, { wx, cellBottom });
      }
    }

    let slot = 0;
    for (const v of colsByKey.values()) {
      if (slot >= this.cols.length) break;
      const col = this.cols[slot++];
      col.visible = true;
      col.scale.set(1, Math.max(v.cellBottom - BOTTOM_Y, 0.01), 0.9);
      col.position.set(v.wx, v.cellBottom, pz);
    }
    for (; slot < this.cols.length; slot++) {
      this.cols[slot].visible = false;
    }

    this.group.visible = true;
  }

  hide() {
    this.group.visible = false;
  }

  dispose() {
    if (this.group.parent) this.group.parent.remove(this.group);
    this.geo.dispose();
    this.mat.dispose();
  }
}
