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
      // Subtle static nebula mottling — night only (0 in day theme).
      uNebulaAmt: { value: 1.0 },
      uNebulaColorA: { value: new THREE.Color("#b06ad8") },
      uNebulaColorB: { value: new THREE.Color("#3050a8") },
    },
    vertexShader: /* glsl */ `
      varying float vY;
      varying vec3 vDir;
      uniform float uRadius;
      void main() {
        vY = position.y / uRadius;
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColorTop;
      uniform vec3 uColorMid;
      uniform vec3 uColorLow;
      uniform vec3 uColorFog;
      uniform float uNebulaAmt;
      uniform vec3 uNebulaColorA;
      uniform vec3 uNebulaColorB;
      varying float vY;
      varying vec3 vDir;

      float hash(vec3 p) {
        return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
      }
      float vnoise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        vec3 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(mix(hash(i), hash(i + vec3(1.0, 0.0, 0.0)), u.x),
              mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), u.x), u.y),
          mix(mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), u.x),
              mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), u.x), u.y),
          u.z);
      }

      void main() {
        // Tighter horizon band so the deep mid-violet dominates the visible
        // sky; the lower fog tier only kisses the very bottom edge.
        vec3 col = mix(uColorFog, uColorLow, smoothstep(-0.5, -0.18, vY));
        col = mix(col, uColorMid, smoothstep(-0.15, 0.25, vY));
        col = mix(col, uColorTop, smoothstep(0.3, 0.9, vY));

        // 2-octave nebula mottling, masked to the mid band so the horizon
        // and zenith stay clean.
        float n = vnoise(vDir * 3.0) * 0.65 + vnoise(vDir * 7.0) * 0.35;
        vec3 nebCol = mix(uNebulaColorA, uNebulaColorB, vnoise(vDir * 1.5));
        float band = smoothstep(-0.05, 0.35, vY) * (1.0 - smoothstep(0.5, 0.9, vY));
        col += nebCol * smoothstep(0.35, 0.75, n) * band * uNebulaAmt * 0.09;

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
