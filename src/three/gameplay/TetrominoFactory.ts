import * as THREE from "three";
import {
  TETROMINOES,
  TETROMINO_COLORS,
  type TetrominoKey,
} from "../constants";

export interface PieceMesh {
  group: THREE.Group;
  /**
   * Cell offsets in piece-local space, centered on the piece's BBOX (not on
   * the mean of indices) so for whole-cell index coords every cell sits on
   * the half-integer grid relative to the piece's pivot. This keeps cell
   * world-positions aligned with the castle's column centers regardless of
   * rotation.
   */
  colliderOffsets: Array<[number, number, number]>;
  centroid: [number, number, number];
}

/**
 * Tetromino mesh factory.
 *
 * Cells are full 1×1×1 cubes that touch (no gap) so a piece reads as one
 * merged shape — matching the survival reference's 2D-cartoon look. Thin
 * dark cell-separator edges are drawn on each cube so the player can still
 * count the cells inside the merged silhouette.
 */
export class TetrominoFactory {
  private blockGeo: THREE.BoxGeometry;
  private edgesGeo: THREE.EdgesGeometry;
  private edgeMatByKey: Map<TetrominoKey, THREE.LineBasicMaterial> = new Map();
  private matByKey: Map<TetrominoKey, THREE.MeshToonMaterial> = new Map();

  constructor() {
    this.blockGeo = new THREE.BoxGeometry(1, 1, 1);
    this.edgesGeo = new THREE.EdgesGeometry(this.blockGeo);

    for (const key of Object.keys(TETROMINOES) as TetrominoKey[]) {
      const c = new THREE.Color(TETROMINO_COLORS[key]);
      this.matByKey.set(
        key,
        new THREE.MeshToonMaterial({
          color: c,
          emissive: c.clone().multiplyScalar(0.32),
        }),
      );
      const dark = c.clone().multiplyScalar(0.25);
      this.edgeMatByKey.set(
        key,
        new THREE.LineBasicMaterial({
          color: dark,
          transparent: true,
          opacity: 0.95,
        }),
      );
    }
  }

  getMaterial(key: TetrominoKey): THREE.MeshToonMaterial {
    return this.matByKey.get(key)!;
  }

  /**
   * Build a Group of cells centered on the piece's BBOX. For every piece in
   * TETROMINOES the indices are integers, so the BBOX center is on the
   * half-integer grid → cell offsets are always {-1.5, -0.5, 0.5, 1.5, ...}
   * etc. Spawning the piece at integer or half-integer X then guarantees
   * cell-on-grid placement.
   */
  create(key: TetrominoKey): PieceMesh {
    const cells = TETROMINOES[key];
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    for (const c of cells) {
      if (c[0] < minX) minX = c[0];
      if (c[0] > maxX) maxX = c[0];
      if (c[1] < minY) minY = c[1];
      if (c[1] > maxY) maxY = c[1];
      if (c[2] < minZ) minZ = c[2];
      if (c[2] > maxZ) maxZ = c[2];
    }
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const cz = (minZ + maxZ) / 2;

    const mat = this.getMaterial(key);
    const edgeMat = this.edgeMatByKey.get(key)!;
    const group = new THREE.Group();
    const colliderOffsets: Array<[number, number, number]> = [];

    for (const cell of cells) {
      const ox = cell[0] - cx;
      const oy = cell[1] - cy;
      const oz = cell[2] - cz;
      const block = new THREE.Mesh(this.blockGeo, mat);
      block.position.set(ox, oy, oz);
      block.castShadow = true;
      block.receiveShadow = true;
      block.add(new THREE.LineSegments(this.edgesGeo, edgeMat));
      group.add(block);
      colliderOffsets.push([ox, oy, oz]);
    }

    return { group, colliderOffsets, centroid: [cx, cy, cz] };
  }

  dispose() {
    this.matByKey.forEach((m) => m.dispose());
    this.matByKey.clear();
    this.edgeMatByKey.forEach((m) => m.dispose());
    this.edgeMatByKey.clear();
    this.blockGeo.dispose();
    this.edgesGeo.dispose();
  }
}
