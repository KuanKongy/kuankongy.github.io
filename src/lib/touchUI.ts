/**
 * True on coarse-pointer (touch) devices; a `?touch` query param forces it
 * on for desktop testing. Shared by TouchControls, GameHUD, and the
 * lobby/game-over copy so every surface agrees on what "phone" means.
 */
export function touchUIEnabled(): boolean {
  return (
    typeof window !== "undefined" &&
    (window.matchMedia("(pointer: coarse)").matches ||
      new URLSearchParams(window.location.search).has("touch"))
  );
}
