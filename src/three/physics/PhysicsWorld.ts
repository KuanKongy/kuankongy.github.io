import RAPIER from "@dimforge/rapier3d-compat";
import { PHYSICS } from "../constants";

export type IntersectionListener = (
  voidCol: RAPIER.Collider,
  other: RAPIER.Collider,
) => void;

export class PhysicsWorld {
  world!: RAPIER.World;
  voidCollider!: RAPIER.Collider;
  private accumulator = 0;
  private listeners: IntersectionListener[] = [];

  static async create(): Promise<PhysicsWorld> {
    await RAPIER.init();
    const pw = new PhysicsWorld();
    pw.init();
    return pw;
  }

  private init() {
    const g = PHYSICS.gravity;
    this.world = new RAPIER.World({ x: g.x, y: g.y, z: g.z });
    this.world.timestep = PHYSICS.fixedStep;
    // More solver iterations + integration substeps so blocks settle solidly,
    // don't squish each other under load, and don't shoot off when stacks
    // collapse onto them.
    const ip = (this.world as unknown as {
      integrationParameters: {
        numSolverIterations?: number;
        numAdditionalFrictionIterations?: number;
        numInternalPgsIterations?: number;
      };
    }).integrationParameters;
    if (ip) {
      if ("numSolverIterations" in ip) ip.numSolverIterations = 16;
      if ("numAdditionalFrictionIterations" in ip)
        ip.numAdditionalFrictionIterations = 6;
      if ("numInternalPgsIterations" in ip) ip.numInternalPgsIterations = 3;
    }
    const voidDesc = RAPIER.ColliderDesc.cuboid(200, 1, 200)
      .setSensor(true)
      .setTranslation(0, PHYSICS.voidY, 0);
    this.voidCollider = this.world.createCollider(voidDesc);
  }

  onVoidIntersect(fn: IntersectionListener) {
    this.listeners.push(fn);
  }

  step(dt: number) {
    this.accumulator += Math.min(dt, 0.1);
    let steps = 0;
    while (this.accumulator >= PHYSICS.fixedStep && steps < 4) {
      this.world.step();
      this.accumulator -= PHYSICS.fixedStep;
      steps++;
    }
    this.world.intersectionPairsWith(this.voidCollider, (other) => {
      for (const fn of this.listeners) fn(this.voidCollider, other);
    });
  }

  dispose() {
    this.listeners.length = 0;
    this.world.free();
  }
}

export { RAPIER };
