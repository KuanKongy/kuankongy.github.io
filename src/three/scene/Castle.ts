import * as THREE from "three";
import { ARENA, PALETTE } from "../constants";
import { getCastleParapetRailXZ } from "./parapetRails";

export interface CastleHandle {
  group: THREE.Group;
  /** Y of the platform's TOP face (where pieces land). */
  platformTopY: number;
  /**
   * The castle body is a single solid cuboid collider; pieces falling outside
   * the castle X bounds land on a wider thin "deck" collider built in
   * StaticColliders.ts so the playfield is wider than the castle body.
   */
  bodyCollider: {
    halfExtents: [number, number, number];
    center: [number, number, number];
  };
  spireCollider: {
    halfExtents: [number, number, number];
    center: [number, number, number];
  };
  update: (elapsed: number) => void;
  dispose: () => void;
}

function makeCobbleTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#9a9da6";
  ctx.fillRect(0, 0, 256, 256);
  const stoneA = "#b4b8c2";
  const stoneB = "#8c9099";
  const grout = "#6a6d76";
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const ox = col * 32 + (row % 2) * 16;
      const oy = row * 32;
      const w = 28 + ((col + row * 3) % 5);
      const h = 26 + ((col * 2 + row) % 7);
      ctx.fillStyle = (col + row) % 2 === 0 ? stoneA : stoneB;
      ctx.fillRect(ox + 2, oy + 3, w, h);
      ctx.strokeStyle = grout;
      ctx.lineWidth = 2;
      ctx.strokeRect(ox + 2, oy + 3, w, h);
    }
  }
  ctx.fillStyle = "rgba(0,0,0,0.06)";
  for (let i = 0; i < 40; i++) {
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2.2, 2.2);
  return tex;
}

/**
 * Square cobblestone castle with a clean front face: just a wood gate door,
 * no skull / arch / red trim. The roof has 1-cell parapet blocks on every
 * side (with two gaps in the front row so pieces can drop into the play
 * field). The visual platform on top of the castle is fully transparent —
 * the user wanted the playfield edge to be invisible.
 */
export function createCastle(): CastleHandle {
  const group = new THREE.Group();
  group.name = "Castle";

  const halfW = ARENA.platformHalfWidth; // 3 → 6 cells wide
  const halfD = ARENA.platformHalfDepth; // 3 → 6 cells deep
  const wallH = ARENA.castleWallHeight; // 4.5
  const platformY = ARENA.platformY; // 8

  const bodyTopY = platformY;
  const bodyBottomY = platformY - wallH;
  const bodyCenterY = (bodyTopY + bodyBottomY) / 2;

  const stoneMap = makeCobbleTexture();
  const stoneMat = new THREE.MeshToonMaterial({
    color: new THREE.Color("#c4c8d0"),
    map: stoneMap,
  });

  // ---- Castle body (solid cuboid). ----
  const bodyGeo = new THREE.BoxGeometry(halfW * 2, wallH, halfD * 2);
  const body = new THREE.Mesh(bodyGeo, stoneMat);
  body.position.y = bodyCenterY;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // ---- Slim red top cap on the very top face. ----
  const topGeo = new THREE.BoxGeometry(halfW * 2 + 0.18, 0.18, halfD * 2 + 0.18);
  const topCapMat = new THREE.MeshToonMaterial({
    color: PALETTE.castleAccent,
    emissive: PALETTE.castleAccent.clone().multiplyScalar(0.18),
  });
  const topCap = new THREE.Mesh(topGeo, topCapMat);
  topCap.position.y = bodyTopY + 0.09;
  topCap.castShadow = true;
  group.add(topCap);

  // ---- Front wooden gate door (centered, no decorations). ----
  const frontZ = halfD + 0.01;
  const doorWoodMat = new THREE.MeshToonMaterial({
    color: PALETTE.castleBase,
    emissive: new THREE.Color("#2a1c10"),
  });
  const doorW = 1.6;
  const doorH = 2.4;
  const doorY = bodyBottomY + 0.4 + doorH / 2;
  const doorGeo = new THREE.BoxGeometry(doorW, doorH, 0.18);
  const door = new THREE.Mesh(doorGeo, doorWoodMat);
  door.position.set(0, doorY, frontZ + 0.05);
  group.add(door);

  // Door frame trim — same stone as body, just a thin border.
  const doorFrameMat = new THREE.MeshToonMaterial({
    color: PALETTE.castleStoneDark,
  });
  const doorFrameTop = new THREE.Mesh(
    new THREE.BoxGeometry(doorW + 0.3, 0.15, 0.15),
    doorFrameMat,
  );
  doorFrameTop.position.set(0, doorY + doorH / 2 + 0.08, frontZ + 0.07);
  group.add(doorFrameTop);
  for (const x of [-(doorW / 2 + 0.08), doorW / 2 + 0.08]) {
    const post = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, doorH + 0.16, 0.15),
      doorFrameMat,
    );
    post.position.set(x, doorY, frontZ + 0.07);
    group.add(post);
  }

  // Door handles (two small studs).
  const studMat = new THREE.MeshToonMaterial({
    color: new THREE.Color("#c8a865"),
    emissive: new THREE.Color("#3a2a10"),
  });
  for (const dy of [-0.1, 0.5]) {
    const stud = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 10, 8),
      studMat,
    );
    stud.position.set(0.45, doorY + dy, frontZ + 0.16);
    group.add(stud);
  }

  // ---- Torches: a wood post + bronze cup + glowing flame on each side ----
  // ---- of the gate. Adds a warm point of light beside the door. ----
  const torchPostMat = new THREE.MeshToonMaterial({ color: 0x4a2f1c });
  const torchCupMat = new THREE.MeshToonMaterial({
    color: 0xa66a30,
    emissive: 0x2a160a,
  });
  const flameOuterMat = new THREE.MeshBasicMaterial({
    color: 0xff8a26,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  const flameInnerMat = new THREE.MeshBasicMaterial({
    color: 0xffe27a,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  const torches: { flameInner: THREE.Mesh; flameOuter: THREE.Mesh; light: THREE.PointLight }[] = [];
  for (const tx of [-doorW / 2 - 0.55, doorW / 2 + 0.55]) {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.07, doorH - 0.4, 8),
      torchPostMat,
    );
    post.position.set(tx, doorY - 0.05, frontZ + 0.12);
    group.add(post);

    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.1, 0.18, 12),
      torchCupMat,
    );
    cup.position.set(tx, doorY + (doorH - 0.4) / 2 + 0.04, frontZ + 0.12);
    group.add(cup);

    const flameOuter = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 10, 8),
      flameOuterMat,
    );
    flameOuter.scale.y = 1.6;
    flameOuter.position.set(tx, doorY + (doorH - 0.4) / 2 + 0.28, frontZ + 0.12);
    group.add(flameOuter);

    const flameInner = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 10, 8),
      flameInnerMat,
    );
    flameInner.scale.y = 1.4;
    flameInner.position.set(tx, doorY + (doorH - 0.4) / 2 + 0.26, frontZ + 0.12);
    group.add(flameInner);

    const light = new THREE.PointLight(0xffb060, 2.2, 10, 1.4);
    light.position.set(tx, doorY + (doorH - 0.4) / 2 + 0.3, frontZ + 0.4);
    group.add(light);

    torches.push({ flameInner, flameOuter, light });
  }

  // ---- Wall decorations: lit windows + horizontal trim + side banners. ----
  const winMat = new THREE.MeshBasicMaterial({
    color: PALETTE.castleWindow,
    transparent: true,
    opacity: 0.95,
    toneMapped: false,
  });
  const winGeo = new THREE.PlaneGeometry(0.45, 0.7);
  // Front: two flanking windows above the door.
  for (const x of [-1.7, 1.7]) {
    const w = new THREE.Mesh(winGeo, winMat);
    w.position.set(x, bodyCenterY + 0.4, frontZ + 0.04);
    group.add(w);
  }
  // Back wall: 2 windows.
  for (const x of [-1.4, 1.4]) {
    const w = new THREE.Mesh(winGeo, winMat);
    w.position.set(x, bodyCenterY + 0.2, -halfD - 0.01);
    w.rotation.y = Math.PI;
    group.add(w);
  }
  // Side walls: 2 windows on each, facing outward.
  for (const sideX of [halfW + 0.01, -halfW - 0.01]) {
    for (const z of [-1.4, 1.4]) {
      const w = new THREE.Mesh(winGeo, winMat);
      w.position.set(sideX, bodyCenterY + 0.2, z);
      w.rotation.y = sideX > 0 ? -Math.PI / 2 : Math.PI / 2;
      group.add(w);
    }
  }

  // Horizontal stone trim — a thin darker band roughly at floor level.
  const trimMat = new THREE.MeshToonMaterial({
    color: PALETTE.castleStoneDark,
  });
  const trimY = bodyBottomY + 0.55;
  const trimX = new THREE.Mesh(
    new THREE.BoxGeometry(halfW * 2 + 0.04, 0.18, halfD * 2 + 0.04),
    trimMat,
  );
  trimX.position.y = trimY;
  group.add(trimX);

  // Banners (red cloth) draping from the top cap on each non-front side.
  const bannerMat = new THREE.MeshToonMaterial({
    color: PALETTE.castleAccent,
    emissive: PALETTE.castleAccent.clone().multiplyScalar(0.15),
  });
  const bannerW = 0.65;
  const bannerH = 1.6;
  const bannerThick = 0.06;
  const bannerY = bodyTopY - bannerH / 2 - 0.05;
  const bannerOffsets: Array<[number, number, number, number]> = [
    // [x, z, rotY, faceOffset]
    [0, halfD + bannerThick / 2, 0, 0], // front (above door)
    [0, -halfD - bannerThick / 2, Math.PI, 0], // back
    [halfW + bannerThick / 2, 0, -Math.PI / 2, 0], // right
    [-halfW - bannerThick / 2, 0, Math.PI / 2, 0], // left
  ];
  for (const [bx, bz, ry] of bannerOffsets) {
    const banner = new THREE.Mesh(
      new THREE.BoxGeometry(bannerW, bannerH, bannerThick),
      bannerMat,
    );
    banner.position.set(bx, bannerY, bz);
    banner.rotation.y = ry;
    // For the front banner, push it up so it sits ABOVE the door, not over it.
    if (bz > 0 && Math.abs(ry) < 0.01) banner.position.y = bodyTopY - bannerH / 2;
    group.add(banner);
  }

  // ---- Front stairs descending toward the spire. ----
  const stairsMat = new THREE.MeshToonMaterial({
    color: PALETTE.castleStone,
    map: stoneMap,
  });
  const stairsGroup = new THREE.Group();
  const stepCount = 8;
  const stepH = 0.45;
  const stepD = 0.5;
  const stepW = 1.6;
  for (let i = 0; i < stepCount; i++) {
    const stepGeo = new THREE.BoxGeometry(stepW, stepH, stepD);
    const step = new THREE.Mesh(stepGeo, stairsMat);
    step.castShadow = true;
    step.receiveShadow = true;
    step.position.set(
      0,
      bodyBottomY - stepH / 2 - i * stepH,
      frontZ + stepD / 2 + i * stepD,
    );
    stairsGroup.add(step);
  }
  group.add(stairsGroup);

  // ---- Staircase torches: warm point lights along the stairs so the
  // ---- descent is well-lit. Two pairs of wall-mounted torches (top & mid).
  const stairTorchPositions: Array<[number, number, number]> = [
    [-stepW / 2 - 0.3, bodyBottomY - stepH, frontZ + stepD * 1.5],
    [stepW / 2 + 0.3, bodyBottomY - stepH, frontZ + stepD * 1.5],
    [-stepW / 2 - 0.3, bodyBottomY - stepH * 4.5, frontZ + stepD * 5],
    [stepW / 2 + 0.3, bodyBottomY - stepH * 4.5, frontZ + stepD * 5],
  ];
  for (const [sx, sy, sz] of stairTorchPositions) {
    const sPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.05, 0.5, 6),
      torchPostMat,
    );
    sPost.position.set(sx, sy, sz);
    group.add(sPost);

    const sCup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.06, 0.12, 8),
      torchCupMat,
    );
    sCup.position.set(sx, sy + 0.3, sz);
    group.add(sCup);

    const sFlameO = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 6),
      flameOuterMat,
    );
    sFlameO.scale.y = 1.5;
    sFlameO.position.set(sx, sy + 0.44, sz);
    group.add(sFlameO);

    const sFlameI = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 8, 6),
      flameInnerMat,
    );
    sFlameI.scale.y = 1.3;
    sFlameI.position.set(sx, sy + 0.42, sz);
    group.add(sFlameI);

    const sLight = new THREE.PointLight(0xffb060, 1.8, 8, 1.4);
    sLight.position.set(sx, sy + 0.5, sz + 0.2);
    group.add(sLight);

    torches.push({ flameInner: sFlameI, flameOuter: sFlameO, light: sLight });
  }

  // ---- Parapet: 1×1×1 stone cubes around the castle roof perimeter, ----
  // ---- one cell ABOVE the castle top, with two gaps in the front row. ----
  const railCubeGeo = new THREE.BoxGeometry(1, 1, 1);
  const railY = bodyTopY + 0.5; // cube center one cell above the castle top
  for (const [rx, rz] of getCastleParapetRailXZ()) {
    const b = new THREE.Mesh(railCubeGeo, stoneMat);
    b.position.set(rx, railY, rz);
    b.castShadow = true;
    b.receiveShadow = true;
    group.add(b);
  }

  // ---- Invisible platform plane. The user explicitly asked for the arena ----
  // ---- edge / glowing strip to be invisible. We keep the mesh so the same ----
  // ---- shader uniforms tick through update() without breaking, but we draw ----
  // ---- nothing (alpha=0). ----
  const platformGeo = new THREE.PlaneGeometry(halfW * 2, halfD * 2, 1, 1);
  const platformMat = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    visible: false,
    uniforms: {
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */ `
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      void main() { gl_FragColor = vec4(0.0); }
    `,
  });
  const platform = new THREE.Mesh(platformGeo, platformMat);
  platform.rotation.x = -Math.PI / 2;
  platform.position.y = bodyTopY + 0.2;
  platform.visible = false;
  group.add(platform);

  // ---- Below the castle: a rectangular dirt cuboid the FULL footprint of
  // ---- the castle (6×6) with a slim layer of grass on its very top.
  // ---- Replaces the previous tapered cylinder so the castle visually sits
  // ---- on a chunky dirt mountain block.
  const spireH = ARENA.spireHeight;
  const grassThick = 0.55;
  const dirtH = spireH - grassThick;

  const dirtMat = new THREE.MeshToonMaterial({
    color: new THREE.Color("#7a5840"),
    emissive: new THREE.Color("#231408"),
  });
  const dirt = new THREE.Mesh(
    new THREE.BoxGeometry(halfW * 2, dirtH, halfD * 2),
    dirtMat,
  );
  dirt.position.y = bodyBottomY - grassThick - dirtH / 2;
  dirt.castShadow = true;
  dirt.receiveShadow = true;
  group.add(dirt);

  const grassMat = new THREE.MeshToonMaterial({
    color: new THREE.Color("#5fb763"),
    emissive: new THREE.Color("#1d5a26"),
  });
  const grass = new THREE.Mesh(
    new THREE.BoxGeometry(halfW * 2 + 0.02, grassThick, halfD * 2 + 0.02),
    grassMat,
  );
  grass.position.y = bodyBottomY - grassThick / 2;
  grass.receiveShadow = true;
  group.add(grass);

  // A few grass tufts hanging over the front edge so the seam between dirt
  // and grass reads as overgrown rather than a clean stripe.
  const tuftCount = 6;
  for (let i = 0; i < tuftCount; i++) {
    const tx = -halfW + 0.5 + (i / (tuftCount - 1)) * (halfW * 2 - 1);
    const tuftR = 0.32 + Math.random() * 0.22;
    const tuft = new THREE.Mesh(
      new THREE.SphereGeometry(tuftR, 9, 6, 0, Math.PI * 2, 0, Math.PI / 2),
      grassMat,
    );
    tuft.position.set(
      tx,
      bodyBottomY - 0.05,
      halfD + tuftR * 0.3,
    );
    tuft.scale.y = 0.7;
    tuft.rotation.y = Math.random() * Math.PI * 2;
    tuft.receiveShadow = true;
    group.add(tuft);
  }

  return {
    group,
    platformTopY: bodyTopY,
    bodyCollider: {
      halfExtents: [halfW, wallH / 2, halfD],
      center: [0, bodyCenterY, 0],
    },
    spireCollider: {
      // Collider matches the new dirt cuboid: full castle footprint, full
      // dirt-mountain height. Grass sliver on top is purely visual and
      // already covered by the castle body collider above.
      halfExtents: [halfW, spireH / 2, halfD],
      center: [0, bodyBottomY - spireH / 2, 0],
    },
    update: (t) => {
      platformMat.uniforms.uTime.value = t;
      // Flicker each torch's flame: vertical scale, intensity, and a tiny
      // horizontal jitter so the flames feel alive.
      for (let i = 0; i < torches.length; i++) {
        const f = torches[i];
        const phase = i * 1.7;
        const flick = 0.85 + Math.sin(t * 9.3 + phase) * 0.1
          + Math.sin(t * 17 + phase * 2.1) * 0.05;
        f.flameInner.scale.y = 1.4 * flick;
        f.flameOuter.scale.y = 1.6 * flick;
        f.light.intensity = 1.05 + (flick - 1) * 0.6;
      }
    },
    dispose: () => {
      stoneMap.dispose();
      stoneMat.dispose();
      topCapMat.dispose();
      doorWoodMat.dispose();
      doorFrameMat.dispose();
      studMat.dispose();
      stairsMat.dispose();
      dirtMat.dispose();
      grassMat.dispose();
      platformMat.dispose();
      winMat.dispose();
      winGeo.dispose();
      trimMat.dispose();
      bannerMat.dispose();
      torchPostMat.dispose();
      torchCupMat.dispose();
      flameOuterMat.dispose();
      flameInnerMat.dispose();
      railCubeGeo.dispose();
      group.traverse((o) => {
        const g = (o as THREE.Mesh).geometry;
        if (g && g !== railCubeGeo) g.dispose();
      });
    },
  };
}
