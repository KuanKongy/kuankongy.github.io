import * as THREE from "three";
import { CHARACTER, PALETTE } from "../../constants";
import type { CharacterHandle } from "./types";
import {
  buildCloud,
  buildStar,
  disposeGroup,
  makeFlight,
  makeToonRig,
} from "./base";

/**
 * Dapper octopus — big orange head, buttoned blue suit, red tie, curling
 * tentacle arms (half-torus arcs), one of which holds the spinning star. A
 * homage to the Tricky Towers rival on his cloud. Original day colouring;
 * night adds a subtle lift via the toon rig.
 */
export function createOctopus(): CharacterHandle {
  const group = new THREE.Group();
  group.name = "Character:Octopus";

  group.add(buildCloud());

  const rig = makeToonRig();
  const skinMat = rig.toon(PALETTE.octoSkin);
  const suitMat = rig.toon(PALETTE.octoSuit);
  const tieMat = rig.toon(PALETTE.octoTie);
  const goldMat = rig.toon(PALETTE.hatBand);

  // Suit torso.
  const torso = new THREE.Mesh(
    new THREE.CylinderGeometry(0.36, 0.52, 0.7, 14),
    suitMat,
  );
  torso.position.y = 0.5;
  group.add(torso);

  // Collar — thin pale ring at the neckline.
  const collarMat = rig.toon(0xe8ecf4);
  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.37, 0.4, 0.08, 14),
    collarMat,
  );
  collar.position.y = 0.82;
  group.add(collar);

  // Gold suit buttons beside the tie.
  const buttonGeo = new THREE.CircleGeometry(0.035, 10);
  for (const [bx, by] of [
    [0.16, 0.55],
    [0.18, 0.38],
  ]) {
    const btn = new THREE.Mesh(buttonGeo, goldMat);
    btn.position.set(bx, by, 0.47);
    group.add(btn);
  }

  // Tie — knot + hanging blade.
  const knot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.05), tieMat);
  knot.position.set(0, 0.78, 0.4);
  group.add(knot);
  const blade = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.3, 4), tieMat);
  blade.position.set(0, 0.6, 0.43);
  blade.rotation.x = -0.12;
  group.add(blade);

  // Big squashed head.
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 18, 14), skinMat);
  head.scale.set(1, 0.9, 0.95);
  head.position.y = 1.32;
  group.add(head);

  // Eyes — white sclera + pupil.
  const scleraMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x10081e });
  const scleraGeo = new THREE.CircleGeometry(0.13, 16);
  const pupilGeo = new THREE.CircleGeometry(0.06, 12);
  for (const x of [-0.18, 0.18]) {
    const sclera = new THREE.Mesh(scleraGeo, scleraMat);
    sclera.position.set(x, 1.4, 0.5);
    sclera.renderOrder = 1;
    group.add(sclera);
    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
    pupil.position.set(x, 1.39, 0.505);
    pupil.renderOrder = 2;
    group.add(pupil);
  }

  // Tentacle arms — each is a half-torus arc curling out from the suit,
  // with a smaller child arc continuing the curl.
  const armSpecs: Array<{
    pos: [number, number, number];
    rotZ: number;
    phase: number;
    holdsStar?: boolean;
  }> = [
    { pos: [-0.48, 0.35, 0.12], rotZ: 2.4, phase: 0 },
    { pos: [0.5, 0.4, 0.1], rotZ: -2.4, phase: 1.8, holdsStar: true },
    { pos: [0.1, 0.22, 0.42], rotZ: -2.9, phase: 3.4 },
  ];
  const arms: THREE.Group[] = [];
  let star: THREE.Mesh | null = null;
  let starTex: THREE.Texture | null = null;
  const bigArcGeo = new THREE.TorusGeometry(0.24, 0.065, 6, 10, Math.PI);
  const smallArcGeo = new THREE.TorusGeometry(0.13, 0.05, 6, 8, Math.PI);
  for (const spec of armSpecs) {
    const arm = new THREE.Group();
    arm.position.set(...spec.pos);
    arm.rotation.z = spec.rotZ;
    const arc = new THREE.Mesh(bigArcGeo, skinMat);
    arm.add(arc);
    const tip = new THREE.Mesh(smallArcGeo, skinMat);
    tip.position.set(-0.37, 0, 0.02);
    tip.rotation.z = Math.PI;
    arm.add(tip);
    if (spec.holdsStar) {
      const built = buildStar();
      star = built.mesh;
      starTex = built.texture;
      star.position.set(-0.5, 0.16, 0.1);
      arm.add(star);
    }
    group.add(arm);
    arms.push(arm);
  }

  group.position.copy(CHARACTER.position);
  group.scale.setScalar(0.85);

  const flight = makeFlight(group);
  let castTarget = 0;
  let castMix = 0;
  let lastT = 0;
  const baseRotZ = armSpecs.map((s) => s.rotZ);

  return {
    group,
    homePosition: CHARACTER.position.clone(),
    setCasting: (c) => {
      castTarget = c ? 1 : 0;
    },
    flyTo: flight.flyTo,
    flyHome: flight.flyHome,
    placeAt: flight.placeAt,
    setDayNight: rig.setNight,
    update: (t) => {
      const dt = Math.max(0, Math.min(t - lastT, 0.1));
      lastT = t;
      castMix += (castTarget - castMix) * Math.min(1, dt * 6);

      flight.applyIdleBob(t);
      const sway = Math.sin(t * 0.9) * 0.08;
      group.rotation.z = sway - 0.15 * castMix;
      for (let i = 0; i < arms.length; i++) {
        const wiggle = Math.sin(t * 1.3 + armSpecs[i].phase) * 0.12;
        // The star arm curls upward while casting.
        const raise = armSpecs[i].holdsStar ? -0.5 * castMix : 0;
        arms[i].rotation.z = baseRotZ[i] + wiggle + raise;
      }
      if (star) star.rotation.z = -t * (0.6 + 1.4 * castMix);
      rig.glow(suitMat, 0.2 * castMix);
    },
    dispose: () => {
      flight.kill();
      disposeGroup(group);
      starTex?.dispose();
    },
  };
}
