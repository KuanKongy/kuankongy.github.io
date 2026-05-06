import * as THREE from "three";
import { PALETTE } from "../constants";

/**
 * Inverted sphere with a vertical violet → lavender gradient that matches
 * the reference image: most of the visible sky is a saturated mid-violet
 * with a lavender lower band that meets the pink ground fog.
 */
export function createSky(): THREE.Mesh {
  const radius = 800;
  const geometry = new THREE.SphereGeometry(radius, 32, 32);

  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    // IMPORTANT: clone the palette colors. `applyVisualTheme` mutates these
    // via `.copy(...)` to switch between night/day; if we passed the shared
    // palette references the FIRST switch would also overwrite PALETTE itself
    // and any subsequent switch back would no longer find the original
    // values. Cloning makes the uniforms own their own Color instances.
    uniforms: {
      uColorTop: { value: PALETTE.skyTop.clone() },
      uColorMid: { value: PALETTE.skyMid.clone() },
      uColorLow: { value: PALETTE.skyLow.clone() },
      uColorFog: { value: PALETTE.groundFog.clone() },
      uRadius: { value: radius },
    },
    vertexShader: /* glsl */ `
      varying float vY;
      uniform float uRadius;
      void main() {
        vY = position.y / uRadius;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColorTop;
      uniform vec3 uColorMid;
      uniform vec3 uColorLow;
      uniform vec3 uColorFog;
      varying float vY;
      void main() {
        // Tighter horizon band so the deep mid-violet dominates the visible
        // sky; the lower fog tier only kisses the very bottom edge.
        vec3 col = mix(uColorFog, uColorLow, smoothstep(-0.5, -0.18, vY));
        col = mix(col, uColorMid, smoothstep(-0.15, 0.25, vY));
        col = mix(col, uColorTop, smoothstep(0.3, 0.9, vY));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  mesh.name = "Sky";
  return mesh;
}
