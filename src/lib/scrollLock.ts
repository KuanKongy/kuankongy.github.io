/**
 * Refcounted body-scroll lock. Multiple owners (game phases, modals) can hold
 * a lock at once; the body only scrolls again when every lock is released.
 * Always release via the returned function — never write
 * `document.body.style.overflow` directly.
 */
let locks = 0;

export function lockBodyScroll(): () => void {
  locks += 1;
  document.body.style.overflow = "hidden";

  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks = Math.max(0, locks - 1);
    if (locks === 0) {
      document.body.style.overflow = "";
    }
  };
}
