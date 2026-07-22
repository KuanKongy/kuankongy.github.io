import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

const VignetteShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uStrength: { value: 1.0 },
    // How much of the vignette applies at all: 1 = full (night), lower
    // values fade it toward "no vignette" — the black corners that hide in
    // the night sky read as a dirty bezel over the bright day sky.
    uAmount: { value: 1.0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uStrength;
    uniform float uAmount;
    varying vec2 vUv;
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      vec2 uv = vUv * 2.0 - 1.0;
      float vignette = 1.0 - dot(uv * vec2(0.7, 0.9), uv * vec2(0.7, 0.9));
      vignette = pow(clamp(vignette, 0.0, 1.0), uStrength);
      vignette = mix(1.0, vignette, uAmount);
      gl_FragColor = vec4(color.rgb * vignette, color.a);
    }
  `,
};

export interface PostHandle {
  composer: EffectComposer;
  setSize: (w: number, h: number) => void;
  /** 1 = full night vignette, 0 = none. Day mode runs it faded. */
  setVignette: (amount: number) => void;
  dispose: () => void;
}

export function createPostProcessing(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  enableBloom: boolean,
): PostHandle {
  const size = renderer.getSize(new THREE.Vector2());
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(renderer.getPixelRatio());

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  let bloomPass: UnrealBloomPass | null = null;
  if (enableBloom) {
    // Strength / radius / threshold — keep the bloom subtle so the platform
    // border, moon, and tetromino emissives glow without saturating the frame.
    bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.x, size.y),
      0.35,
      0.55,
      0.92,
    );
    composer.addPass(bloomPass);
  }

  const vignettePass = new ShaderPass(VignetteShader);
  composer.addPass(vignettePass);

  composer.addPass(new OutputPass());

  return {
    composer,
    setSize: (w, h) => {
      composer.setSize(w, h);
      if (bloomPass) bloomPass.setSize(w, h);
    },
    setVignette: (amount) => {
      vignettePass.uniforms.uAmount.value = amount;
    },
    dispose: () => {
      composer.passes.forEach((p) => {
        const anyP = p as unknown as { dispose?: () => void };
        if (typeof anyP.dispose === "function") anyP.dispose();
      });
    },
  };
}
