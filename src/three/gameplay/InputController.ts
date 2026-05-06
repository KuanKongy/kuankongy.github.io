export type InputAction =
  | "moveLeft"
  | "moveRight"
  | "rotate"
  | "start"
  | "quit"
  | "playAgain";

/**
 * A small keyboard adapter that buffers discrete actions until the engine
 * drains them at the start of each frame, plus a `held` set for continuous
 * inputs (currently just soft-drop).
 *
 * Phase routing is the engine's responsibility — this layer is intentionally
 * dumb so we can swap it for gamepad/touch later. Hard-drop is intentionally
 * NOT bound (Space only starts the game from the lobby; pieces lock the
 * moment any cell touches a surface, so a manual hard-drop is unnecessary).
 */
export class InputController {
  private queue: InputAction[] = [];
  private held = new Set<string>();
  private repeatTimers = new Map<string, number>();

  private boundKeyDown = (e: KeyboardEvent) => this.onKeyDown(e);
  private boundKeyUp = (e: KeyboardEvent) => this.onKeyUp(e);

  constructor() {
    window.addEventListener("keydown", this.boundKeyDown);
    window.addEventListener("keyup", this.boundKeyUp);
  }

  private onKeyDown(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;

    const key = e.key;
    const code = e.code;
    const wasHeld = this.held.has(code);
    this.held.add(code);

    switch (key) {
      case "ArrowLeft":
        e.preventDefault();
        this.queue.push("moveLeft");
        this.scheduleRepeat(code, "moveLeft", wasHeld);
        break;
      case "ArrowRight":
        e.preventDefault();
        this.queue.push("moveRight");
        this.scheduleRepeat(code, "moveRight", wasHeld);
        break;
      case "ArrowUp":
        if (!wasHeld) {
          e.preventDefault();
          this.queue.push("rotate");
        }
        break;
      case "ArrowDown":
        e.preventDefault();
        // soft-drop is handled via held check
        break;
      case " ":
      case "Spacebar":
        if (!wasHeld) {
          e.preventDefault();
          this.queue.push("start");
        }
        break;
      case "q":
      case "Q":
      case "Escape":
        if (!wasHeld) this.queue.push("quit");
        break;
      case "r":
      case "R":
      case "Enter":
        if (!wasHeld) this.queue.push("playAgain");
        break;
    }
  }

  private scheduleRepeat(code: string, action: InputAction, alreadyHeld: boolean) {
    if (alreadyHeld) return;
    const delay = window.setTimeout(() => {
      const id = window.setInterval(() => {
        if (!this.held.has(code)) {
          window.clearInterval(id);
          return;
        }
        this.queue.push(action);
      }, 80);
      this.repeatTimers.set(code, id);
    }, 220);
    this.repeatTimers.set(code, delay);
  }

  private clearRepeat(code: string) {
    const t = this.repeatTimers.get(code);
    if (t !== undefined) {
      window.clearTimeout(t);
      window.clearInterval(t);
      this.repeatTimers.delete(code);
    }
  }

  private onKeyUp(e: KeyboardEvent) {
    this.held.delete(e.code);
    this.clearRepeat(e.code);
  }

  isSoftDrop(): boolean {
    return this.held.has("ArrowDown");
  }

  drain(): InputAction[] {
    const out = this.queue;
    this.queue = [];
    return out;
  }

  dispose() {
    window.removeEventListener("keydown", this.boundKeyDown);
    window.removeEventListener("keyup", this.boundKeyUp);
    this.repeatTimers.forEach((t) => {
      window.clearTimeout(t);
      window.clearInterval(t);
    });
    this.repeatTimers.clear();
    this.held.clear();
    this.queue.length = 0;
  }
}
