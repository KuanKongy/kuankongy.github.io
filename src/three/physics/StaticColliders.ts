import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";
import { ARENA } from "../constants";
import { PhysicsWorld } from "./PhysicsWorld";
import type { CastleHandle } from "../scene/Castle";
import type { MountainsHandle } from "../scene/Mountains";
import { getCastleParapetRailXZ } from "../scene/parapetRails";

export interface StaticHandles {
  body: RAPIER.Collider;
  spire: RAPIER.Collider;
  rails: RAPIER.Collider[];
  /**
   * Optional wider floor that catches pieces falling outside the castle.
   * We deliberately skip building one so off-castle pieces drop into the
   * void; kept on the type as `null` for future use.
   */
  deck: RAPIER.Collider | null;
  mountainBodies: RAPIER.RigidBody[];
  mountainCols: RAPIER.Collider[];
}

/**
 * Build all fixed colliders:
 *   - The castle body cuboid (single solid block; pieces stack on the top
 *     face, side falls slide off the walls)
 *   - The spire column descending into the void
 *   - One cuboid per parapet rail block (1×1 cubes one cell above the top)
 *   - A wide thin "deck" collider extending past the castle in X so the
 *     playfield is wider than the castle body
 *   - Convex-hull colliders for each mid-ground side mountain
 *
 * Friction is high and restitution is zero so blocks sit instead of bouncing.
 */
export function buildStaticColliders(
  pw: PhysicsWorld,
  castle: CastleHandle,
  mountains: MountainsHandle,
): StaticHandles {
  const b = castle.bodyCollider;
  const bodyDesc = RAPIER.ColliderDesc.cuboid(
    b.halfExtents[0],
    b.halfExtents[1],
    b.halfExtents[2],
  )
    .setTranslation(b.center[0], b.center[1], b.center[2])
    .setFriction(1.5)
    .setRestitution(0);
  const body = pw.world.createCollider(bodyDesc);

  const spire = castle.spireCollider;
  const spireDesc = RAPIER.ColliderDesc.cuboid(
    spire.halfExtents[0],
    spire.halfExtents[1],
    spire.halfExtents[2],
  )
    .setTranslation(spire.center[0], spire.center[1], spire.center[2])
    .setFriction(0.5)
    .setRestitution(0);
  const spireCol = pw.world.createCollider(spireDesc);

  // ---- Parapet rail colliders: 1×1×1 cubes one cell above the castle top. ----
  const py = ARENA.platformY;
  const railY = py + 0.5;
  const rails: RAPIER.Collider[] = [];
  for (const [rx, rz] of getCastleParapetRailXZ()) {
    const railDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5)
      .setTranslation(rx, railY, rz)
      .setFriction(1.5)
      .setRestitution(0);
    rails.push(pw.world.createCollider(railDesc));
  }

  // The user wants pieces that drift past the 6-wide castle to fall straight
  // into the void, so we DELIBERATELY do NOT build any wider "deck" / floor
  // collider. The only horizontal landing surface is the castle's own top
  // face (its bodyCollider above) — anything beyond x = ±platformHalfWidth
  // misses everything and plummets to the void sensor.
  const deck: RAPIER.Collider | null = null;

  const mountainBodies: RAPIER.RigidBody[] = [];
  const mountainCols: RAPIER.Collider[] = [];

  for (const m of mountains.side) {
    if (m.hullVerts.length === 0) continue;
    const hull = RAPIER.ColliderDesc.convexHull(m.hullVerts);
    if (!hull) continue;
    hull.setFriction(0.45).setRestitution(0);

    const q = new THREE.Quaternion().setFromEuler(m.mesh.rotation);
    const bodyDesc = RAPIER.RigidBodyDesc.fixed()
      .setTranslation(m.mesh.position.x, m.mesh.position.y, m.mesh.position.z)
      .setRotation({ x: q.x, y: q.y, z: q.z, w: q.w });
    const body = pw.world.createRigidBody(bodyDesc);
    const col = pw.world.createCollider(hull, body);
    mountainBodies.push(body);
    mountainCols.push(col);
  }

  return {
    body,
    spire: spireCol,
    rails,
    deck,
    mountainBodies,
    mountainCols,
  };
}
