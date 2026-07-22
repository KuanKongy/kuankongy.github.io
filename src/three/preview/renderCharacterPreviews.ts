import * as THREE from "three";
import { createCharacter } from "../scene/characters";
import { CHARACTERS, type CharacterId } from "../../store/gameStore";

let cached: Promise<Record<CharacterId, string>> | null = null;

/**
 * Render one thumbnail per lobby character (owl / wizard / octopus on their
 * cloud) with a throwaway offscreen renderer — same pattern as
 * renderSkinPreviews. Day colours (setDayNight(false)) so the toon rigs
 * read on both light and dark card glass. Module-cached; all GPU resources
 * are released after the data URLs are captured.
 */
export function renderCharacterPreviews(): Promise<Record<CharacterId, string>> {
  if (cached) return cached;
  cached = (async () => {
    const size = 200;
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
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7ab8, 1.0));
    const keyLight = new THREE.DirectionalLight(0xfff6e6, 1.25);
    keyLight.position.set(-3, 5, 6);
    scene.add(keyLight);

    const cam = new THREE.PerspectiveCamera(35, 1, 0.1, 100);

    const out = {} as Record<CharacterId, string>;
    const box = new THREE.Box3();
    const center = new THREE.Vector3();
    const dims = new THREE.Vector3();
    for (const id of CHARACTERS) {
      const handle = createCharacter(id);
      handle.setDayNight(false);
      handle.placeAt(new THREE.Vector3(0, 0, 0));
      scene.add(handle.group);
      // Frame automatically — rigs differ in size, so fit the camera to
      // each character's bounding box with a 3/4 front view.
      box.setFromObject(handle.group);
      box.getCenter(center);
      box.getSize(dims);
      const radius = Math.max(dims.x, dims.y, dims.z) * 0.62;
      const dist = radius / Math.tan((cam.fov * Math.PI) / 360);
      cam.position.set(
        center.x + dist * 0.28,
        center.y + dist * 0.24,
        center.z + dist * 0.92,
      );
      cam.lookAt(center);
      renderer.render(scene, cam);
      out[id] = canvas.toDataURL("image/png");
      scene.remove(handle.group);
      handle.dispose();
    }

    renderer.dispose();
    renderer.forceContextLoss?.();
    return out;
  })();
  return cached;
}
