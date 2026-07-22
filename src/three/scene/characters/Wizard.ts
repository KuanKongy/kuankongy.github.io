import * as THREE from "three";
import { CHARACTER, PALETTE } from "../../constants";
import type { CharacterHandle } from "./types";
import {
  buildCloud,
  buildStar,
  disposeGroup,
  makeFlight,
  makeStarTexture,
  makeToonRig,
} from "./base";

/**
 * Classic Tricky-Towers-style wizard — indigo robe with a buckled belt,
 * pointed hat decorated with stars, white beard, and a star-topped staff
 * held at his side. Raises the staff while casting. Original day colouring;
 * night adds a subtle lift via the toon rig.
 */
export function createWizard(): CharacterHandle {
  const group = new THREE.Group();
  group.name = "Character:Wizard";

  group.add(buildCloud());

  const rig = makeToonRig();
  const robeMat = rig.toon(PALETTE.wizClassicRobe);
  const skinMat = rig.toon(PALETTE.wizardSkin);
  const hatMat = rig.toon(PALETTE.wizClassicHat);
  const bandMat = rig.toon(PALETTE.hatBand);
  const beardMat = rig.toon(0xe8e4f0);
  const staffMat = rig.toon(0x8a6a48);
  const beltMat = rig.toon(0x2a1a5e);

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

  // Belt + gold buckle at the robe's waist.
  const belt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.38, 0.1, 14),
    beltMat,
  );
  belt.position.y = 0.52;
  group.add(belt);
  const buckle = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.1, 0.04),
    bandMat,
  );
  buckle.position.set(0, 0.52, 0.36);
  group.add(buckle);

  // Head + simple face.
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), skinMat);
  head.position.y = 1.35;
  group.add(head);

  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x10081e });
  const eyeGeo = new THREE.CircleGeometry(0.05, 12);
  for (const x of [-0.13, 0.13]) {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(x, 1.42, 0.4);
    eye.renderOrder = 1;
    group.add(eye);
  }

  // Big soft beard hugging the lower face.
  const beard = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), beardMat);
  beard.scale.set(1.05, 0.75, 0.75);
  beard.position.set(0, 1.16, 0.2);
  group.add(beard);

  // Hat — tall cone + brim + band.
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

  // Little star decals scattered on the hat cone.
  const decalTex = makeStarTexture();
  const decalMat = new THREE.MeshBasicMaterial({
    map: decalTex,
    transparent: true,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
  const decalGeo = new THREE.PlaneGeometry(0.14, 0.14);
  const decalSpots: Array<[number, number, number, number]> = [
    [-0.12, 1.82, 0.3, 0.3],
    [0.14, 1.98, 0.24, -0.4],
    [0.0, 2.16, 0.17, 0.1],
  ];
  for (const [dx, dy, dz, rot] of decalSpots) {
    const decal = new THREE.Mesh(decalGeo, decalMat);
    decal.position.set(dx, dy, dz);
    decal.rotation.z = rot;
    decal.rotation.x = -0.25;
    hat.add(decal);
  }
  group.add(hat);

  // Sleeve arm + staff with the spinning star on top.
  const arm = new THREE.Group();
  arm.position.set(0.5, 0.85, 0.12);
  const sleeve = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.45, 10), robeMat);
  sleeve.position.set(0.05, -0.05, 0);
  sleeve.rotation.z = -0.9;
  arm.add(sleeve);
  const staff = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.035, 1.15, 8),
    staffMat,
  );
  staff.position.set(0.24, 0.25, 0.1);
  staff.rotation.z = -0.15;
  arm.add(staff);
  const { mesh: star, texture: starTex } = buildStar();
  star.position.set(0.33, 0.9, 0.15);
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
      arm.rotation.z = 0.5 * castMix;
      star.rotation.z = -t * (0.6 + 1.4 * castMix);
      rig.glow(robeMat, 0.2 * castMix);
    },
    dispose: () => {
      flight.kill();
      disposeGroup(group);
      starTex.dispose();
      decalTex.dispose();
    },
  };
}
