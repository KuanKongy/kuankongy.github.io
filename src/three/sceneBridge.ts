/**
 * Framework-free bridge between the portfolio DOM and the 3D engine.
 * GameEngine registers itself on init and clears on teardown; the DOM side
 * (useSceneDirector) calls through null-safely, so ordering never matters.
 */
export interface SceneDirector {
  /** Pointer position in NDC (-1..1, y up). */
  setPointer(nx: number, ny: number): void;
  /** Page scroll progress 0..1. */
  setScrollProgress(t: number): void;
  /** One-shot scene moments fired as sections scroll into view. */
  triggerMoment(name: "projects" | "skills"): void;
}

let director: SceneDirector | null = null;

export function setDirector(d: SceneDirector | null): void {
  director = d;
}

export function getDirector(): SceneDirector | null {
  return director;
}
