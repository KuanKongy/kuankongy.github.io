import type * as THREE from "three";

/**
 * Shared interface for every cloud-riding mascot (owl / wizard / octopus).
 * GameEngine only talks to this — swapping characters is create + placeAt.
 */
export interface CharacterHandle {
  group: THREE.Group;
  /** The character's "home" perch position; it returns here after casting. */
  homePosition: THREE.Vector3;
  setCasting: (casting: boolean) => void;
  /** Animate the character to a world point (with gsap). */
  flyTo: (point: THREE.Vector3, seconds?: number) => Promise<void>;
  flyHome: (seconds?: number) => Promise<void>;
  /**
   * Teleport without a tween AND sync the idle-bob baseline — used by the
   * live character swap so the new rider doesn't snap back to the home perch
   * on its first bob frame.
   */
  placeAt: (point: THREE.Vector3) => void;
  /**
   * Theme hook — at night the character gets a subtle self-glow (the moon
   * key light comes from behind the scene, so unlit toon surfaces would
   * read as a black silhouette); in day mode colours are fully light-driven.
   */
  setDayNight: (isDark: boolean) => void;
  update: (elapsed: number) => void;
  dispose: () => void;
}
