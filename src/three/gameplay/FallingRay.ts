import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { PhysicsWorld } from "../physics/PhysicsWorld";
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
  private sideWalls: THREE.Mesh[] = [];
  private markers: THREE.Mesh[] = [];
  private mat: THREE.MeshBasicMaterial;
  private markerMat: THREE.MeshBasicMaterial;
  private geo: THREE.BufferGeometry;
  private sideGeo: THREE.PlaneGeometry;
  private markerGeo: THREE.PlaneGeometry;
  private white = new THREE.Color(0xffffff);

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    this.group.name = "FallingRay";
    this.group.visible = false;
    scene.add(this.group);

    // Per column: front + back walls. Side walls are added separately and
    // ONLY along exposed segments (outermost boundaries + height steps) —
    // adjacent columns never stack coincident walls, so the fill stays
    // perfectly uniform while the volume hangs from EVERY bottom edge.
    // Origin at the TOP so scale.y grows the column downward.
    const front = new THREE.PlaneGeometry(1, 1);
    front.translate(0, -0.5, 0.5);
    const back = new THREE.PlaneGeometry(1, 1);
    back.rotateY(Math.PI);
    back.translate(0, -0.5, -0.5);
    this.geo = mergeGeometries([front, back], false)!;
    front.dispose();
    back.dispose();

    // Unit side wall facing ±x (DoubleSide serves both boundaries);
    // width axis along z, origin at the top edge.
    this.sideGeo = new THREE.PlaneGeometry(1, 1);
    this.sideGeo.rotateY(Math.PI / 2);
    this.sideGeo.translate(0, -0.5, 0);

    this.mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      toneMapped: false,
      side: THREE.DoubleSide,
    });

    // Bright landing markers — crisp untextured quads (hard square edges),
    // one per HALF cell so a cube straddling a block edge splits its
    // marker across the two surfaces it will touch.
    this.markerGeo = new THREE.PlaneGeometry(1, 1);
    this.markerMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      toneMapped: false,
      side: THREE.DoubleSide,
    });

    // One column per possible cell column (I piece = 4) + 2 potential
    // exposed side segments + 2 half-square landing markers each.
    for (let i = 0; i < 4; i++) {
      const col = new THREE.Mesh(this.geo, this.mat);
      col.visible = false;
      this.group.add(col);
      this.cols.push(col);
      for (let w = 0; w < 2; w++) {
        const wall = new THREE.Mesh(this.sideGeo, this.mat);
        wall.visible = false;
        this.group.add(wall);
        this.sideWalls.push(wall);
        const marker = new THREE.Mesh(this.markerGeo, this.markerMat);
        marker.rotation.x = -Math.PI / 2;
        marker.visible = false;
        this.group.add(marker);
        this.markers.push(marker);
      }
    }
  }

  setKey(key: TetrominoKey) {
    this.mat.color.set(TETROMINO_COLORS[key]);
    // The marker is the block's colour lifted toward white — brighter than
    // the column it caps.
    this.markerMat.color.set(TETROMINO_COLORS[key]).lerp(this.white, 0.35);
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

    // Contiguous partition: sort columns and give each one the span from
    // the midpoint to its left neighbour to the midpoint to its right
    // neighbour (outermost edges extend a half cell). Boxes then tile with
    // ZERO gap and ZERO overlap at ANY rotation angle — no seams, no
    // double-alpha strips.
    const sorted = [...colsByKey.values()].sort((a, b) => a.wx - b.wx);
    let slot = 0;
    let wallSlot = 0;
    let markerSlot = 0;
    const placeWall = (x: number, top: number, bottom: number) => {
      if (top - bottom < 0.02 || wallSlot >= this.sideWalls.length) return;
      const wall = this.sideWalls[wallSlot++];
      wall.visible = true;
      wall.scale.set(1, top - bottom, 0.9);
      wall.position.set(x, top, pz);
    };
    for (let i = 0; i < sorted.length; i++) {
      if (slot >= this.cols.length) break;
      const v = sorted[i];
      const leftB =
        i === 0 ? v.wx - 0.5 : (sorted[i - 1].wx + v.wx) / 2;
      const rightB =
        i === sorted.length - 1 ? v.wx + 0.5 : (v.wx + sorted[i + 1].wx) / 2;
      const col = this.cols[slot++];
      col.visible = true;
      col.scale.set(
        Math.max(rightB - leftB, 0.01),
        Math.max(v.cellBottom - BOTTOM_Y, 0.01),
        0.9,
      );
      col.position.set((leftB + rightB) / 2, v.cellBottom, pz);

      // Exposed side segments: full wall on the outer boundaries; at an
      // interior boundary only the step between the two columns' tops
      // (drawn by whichever column starts higher — the formula yields a
      // non-positive height for the lower one, so it's skipped).
      placeWall(
        leftB,
        v.cellBottom,
        i === 0 ? BOTTOM_Y : sorted[i - 1].cellBottom,
      );
      placeWall(
        rightB,
        v.cellBottom,
        i === sorted.length - 1 ? BOTTOM_Y : sorted[i + 1].cellBottom,
      );

      // Bright landing markers on the FIRST surface each HALF of this cube
      // will collide with (an addition on top of the column volume) — a
      // cube straddling a block edge shows one half on the block top and
      // the other half on the surface below. Halves use the partition
      // span, so same-height neighbours tile edge-to-edge.
      const mid = (leftB + rightB) / 2;
      for (const [h0, h1] of [
        [leftB, mid],
        [mid, rightB],
      ]) {
        let contact = Infinity;
        const hc = (h0 + h1) / 2;
        for (const dx of [-0.15, 0.15]) {
          const rc = new RAPIER.Ray(
            { x: hc + dx, y: v.cellBottom, z: pz },
            { x: 0, y: -1, z: 0 },
          );
          const hit = pw.world.castRay(
            rc,
            80,
            true,
            undefined,
            undefined,
            undefined,
            undefined,
            (col) => !exclude.has(col.handle) && !col.isSensor(),
          );
          if (hit && hit.timeOfImpact < contact) {
            contact = Math.max(hit.timeOfImpact, 0);
          }
        }
        if (Number.isFinite(contact) && markerSlot < this.markers.length) {
          const marker = this.markers[markerSlot++];
          marker.visible = true;
          marker.scale.set(Math.max(h1 - h0, 0.01), 1.0, 1);
          marker.position.set(
            hc,
            v.cellBottom - contact + 0.02 + markerSlot * 0.004,
            pz,
          );
        }
      }
    }
    for (; slot < this.cols.length; slot++) {
      this.cols[slot].visible = false;
    }
    for (; wallSlot < this.sideWalls.length; wallSlot++) {
      this.sideWalls[wallSlot].visible = false;
    }
    for (; markerSlot < this.markers.length; markerSlot++) {
      this.markers[markerSlot].visible = false;
    }

    this.group.visible = true;
  }

  hide() {
    this.group.visible = false;
  }

  dispose() {
    if (this.group.parent) this.group.parent.remove(this.group);
    this.geo.dispose();
    this.sideGeo.dispose();
    this.markerGeo.dispose();
    this.mat.dispose();
    this.markerMat.dispose();
  }
}
