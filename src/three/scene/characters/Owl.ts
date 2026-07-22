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
 * The site's owl mascot (formerly "the wizard") — cyan-robed owl wizard on a
 * cloud. Polish pass: goggle-style owl eyes (orange rim + dark lens), beak,
 * ear tufts, chest feathers, wing-arms with a held wand (the spinning star
 * rides the wand tip now), banded hat with a bent tip, and a soft robe glow
 * while casting. Original day colouring; night adds a subtle lift via the
 * toon rig.
 */
export function createOwl(): CharacterHandle {
  const group = new THREE.Group();
  group.name = "Character:Owl";

  group.add(buildCloud());

  const rig = makeToonRig();
  const robeMat = rig.toon(PALETTE.wizardRobe);
  const skinMat = rig.toon(PALETTE.wizardSkin);
  const hatMat = rig.toon(PALETTE.wizardHat);
  const wingMat = rig.toon(PALETTE.owlWing);
  const chestMat = rig.toon(PALETTE.owlChest);
  const beakMat = rig.toon(PALETTE.owlBeak);
  const bandMat = rig.toon(PALETTE.hatBand);

  // Robe body.
  const robe = new THREE.Mesh(
    new THREE.ConeGeometry(0.55, 1.2, 12, 1, true),
    robeMat,
  );
  robe.position.y = 0.6;
  group.add(robe);
  const robeBottom = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    robeMat,
  );
  group.add(robeBottom);

  // Feathery chest patch — pale ellipse tilted to hug the robe's slope.
  const chest = new THREE.Mesh(new THREE.CircleGeometry(0.24, 20), chestMat);
  chest.scale.y = 1.35;
  chest.position.set(0, 0.5, 0.42);
  chest.rotation.x = -0.28;
  group.add(chest);

  // Head.
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), skinMat);
  head.position.y = 1.35;
  group.add(head);

  // The owl's signature goggle eyes — orange rim + dark lens (no whites).
  const rimMat = new THREE.MeshBasicMaterial({ color: 0xff7733 });
  const lensMat = new THREE.MeshBasicMaterial({ color: 0x10081e });
  const ringGeo = new THREE.RingGeometry(0.12, 0.17, 16);
  const lensGeo = new THREE.CircleGeometry(0.12, 16);
  for (const x of [-0.14, 0.14]) {
    const ring = new THREE.Mesh(ringGeo, rimMat);
    ring.position.set(x, 1.38, 0.41);
    ring.renderOrder = 1;
    group.add(ring);

    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.set(x, 1.38, 0.415);
    lens.renderOrder = 2;
    group.add(lens);
  }

  // Beak — small cone pointing down-forward between the eyes.
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.18, 5), beakMat);
  beak.position.set(0, 1.26, 0.44);
  beak.rotation.x = Math.PI / 2 + 0.38;
  group.add(beak);

  // Hat — normal full cone + brim + contrast band.
  const hat = new THREE.Group();
  const hatCone = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.0, 14), hatMat);
  hatCone.position.y = 2.05;
  hat.add(hatCone);
  const brim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.55, 0.08, 18),
    hatMat,
  );
  brim.position.y = 1.58;
  hat.add(brim);
  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(0.41, 0.43, 0.1, 16),
    bandMat,
  );
  band.position.y = 1.67;
  hat.add(band);
  group.add(hat);

  // Wing-arms. Left rests on the robe; right holds the wand.
  const wingGeo = new THREE.SphereGeometry(0.22, 12, 10);
  const leftWing = new THREE.Mesh(wingGeo, wingMat);
  leftWing.scale.set(0.45, 1.0, 0.7);
  leftWing.position.set(-0.5, 0.72, 0.1);
  leftWing.rotation.z = 0.35;
  group.add(leftWing);

  const arm = new THREE.Group();
  arm.position.set(0.48, 0.75, 0.12);
  const rightWing = new THREE.Mesh(wingGeo, wingMat);
  rightWing.scale.set(0.45, 1.0, 0.7);
  rightWing.position.set(0.04, -0.12, 0);
  rightWing.rotation.z = -0.35;
  arm.add(rightWing);
  const wand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.65, 8),
    beakMat,
  );
  wand.position.set(0.18, 0.14, 0.15);
  wand.rotation.z = -0.55;
  arm.add(wand);
  const { mesh: star, texture: starTex } = buildStar();
  star.position.set(0.36, 0.46, 0.2);
  arm.add(star);
  group.add(arm);

  group.position.copy(CHARACTER.position);
  group.scale.setScalar(0.85);

  const flight = makeFlight(group);
  let castTarget = 0;
  let castMix = 0;
  let lastT = 0;

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
      group.rotation.z = sway - 0.2 * castMix;
      hat.rotation.z = sway * 0.5 - 0.04 * castMix;
      // Raise the wand arm while casting; star spins up.
      arm.rotation.z = 0.42 * castMix;
      star.rotation.z = -t * (0.6 + 1.4 * castMix);
      // Soft cast glow on robe + wings, on top of any night emissive.
      rig.glow(robeMat, 0.22 * castMix);
      rig.glow(wingMat, 0.22 * castMix);
    },
    dispose: () => {
      flight.kill();
      disposeGroup(group);
      starTex.dispose();
    },
  };
}
