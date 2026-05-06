import { useGameStore } from "../../store/gameStore";
import { ARENA, SCORING } from "../constants";

/**
 * Reads / writes the gameStore in response to gameplay events. The engine
 * owns the authoritative numbers and pushes them here; React subscribes to
 * the store for HUD render.
 */
export class ScoreManager {
  /**
   * Cluster timer for life loss. Each void hit cancels any pending timer and
   * starts a new one — the life is only deducted after `voidClusterMs`
   * elapses with no further hits, so a clump of pieces falling together is
   * counted as a single tower-collapse event.
   */
  private clusterTimerId: number | null = null;

  /** Called when a player piece locks. */
  onLock(args: { flat: boolean; topY: number }) {
    const s = useGameStore.getState();
    s.addScore(10);
    if (args.flat) s.addScore(25);
    s.incLocked();
    if ((s.lockedCount + 1) % 5 === 0) s.addScore(50);

    const heightUnits = Math.max(0, args.topY - ARENA.platformY);
    if (heightUnits > s.height) s.setHeight(heightUnits);
  }

  /** A locked player piece fell into the void. */
  onPlayerVoid() {
    const s = useGameStore.getState();
    if (s.mode !== "SURVIVAL") return;
    if (this.clusterTimerId !== null) {
      window.clearTimeout(this.clusterTimerId);
    }
    this.clusterTimerId = window.setTimeout(() => {
      this.clusterTimerId = null;
      useGameStore.getState().loseLife();
    }, SCORING.voidClusterMs);
  }

  reset() {
    if (this.clusterTimerId !== null) {
      window.clearTimeout(this.clusterTimerId);
      this.clusterTimerId = null;
    }
    useGameStore.getState().resetGameplay();
  }

  dispose() {
    if (this.clusterTimerId !== null) {
      window.clearTimeout(this.clusterTimerId);
      this.clusterTimerId = null;
    }
  }
}
