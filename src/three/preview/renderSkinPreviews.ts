import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { TetrominoFactory } from "../gameplay/TetrominoFactory";
import { BLOCK_SKINS, type BlockSkin } from "../../store/gameStore";

let cached: Promise<Record<BlockSkin, string>> | null = null;

/**
 * Render one thumbnail per block skin (a posed T piece) with a throwaway
 * offscreen renderer, so the lobby carousel shows the EXACT in-game look.
 * Runs once per page load (module-cached promise); all GPU resources are
 * released after the data URLs are captured.
 */
export function renderSkinPreviews(): Promise<Record<BlockSkin, string>> {
  if (cached) return cached;
  cached = (async () => {
    const size = 160;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(1);
    renderer.setSize(size, size, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const factory = new TetrominoFactory(env);
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xbcaaff, 0x40306a, 0.9));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(-3, 5, 6);
    scene.add(keyLight);

    const cam = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
    cam.position.set(0, 1.5, 5.4);
    cam.lookAt(0, 0, 0);

    const out = {} as Record<BlockSkin, string>;
    const piece = factory.create("T");
    piece.group.rotation.set(0.35, -0.5, 0.06);
    piece.group.scale.setScalar(0.85);
    scene.add(piece.group);
    for (const skin of BLOCK_SKINS) {
      factory.applySkin(piece.group, skin);
      renderer.render(scene, cam);
      out[skin] = canvas.toDataURL("image/png");
    }
    scene.remove(piece.group);

    factory.dispose();
    env.dispose();
    renderer.dispose();
    renderer.forceContextLoss?.();
    return out;
  })();
  return cached;
}
