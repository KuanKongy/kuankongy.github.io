import { useMemo } from "react";
import { PiMoonFill, PiSun } from "react-icons/pi";
import { useGameStore } from "../store/gameStore";
import { touchUIEnabled } from "../lib/touchUI";

export default function GameOverCard() {
  const phase = useGameStore((s) => s.phase);
  const setPhase = useGameStore((s) => s.setPhase);
  const score = useGameStore((s) => s.score);
  const height = useGameStore((s) => s.height);
  const locked = useGameStore((s) => s.lockedCount);
  const high = useGameStore((s) => s.highScore);
  const isDark = useGameStore((s) => s.isDark);
  const toggleDark = useGameStore((s) => s.toggleDark);

  const visible = phase === "GAME_OVER";
  const isNewHigh = score > 0 && score >= high;
  // Touch devices don't have the shortcut keys — drop the lingo.
  const touchUI = useMemo(touchUIEnabled, []);

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-30 flex items-center justify-center transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden={!visible}
    >
      <div
        className={`frosted w-full max-w-md px-8 py-8 text-center ${
          visible ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div className="mb-2 flex items-start justify-between">
          <p className="mt-2 font-arcade text-[10px] tracking-widest text-tetraDeep-z dark:text-tetra-z/90">
            // TOWER · TOPPLED
          </p>
          <button
            type="button"
            onClick={toggleDark}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink/20 bg-ink/5 text-base transition hover:border-ink/50 hover:bg-ink/10"
            title={isDark ? "Switch to day" : "Switch to night"}
          >
            {isDark ? <PiSun /> : <PiMoonFill />}
          </button>
        </div>
        <h2 className="font-arcade mb-3 text-lg font-bold text-ink leading-tight tracking-wide md:text-4xl">
          GAME{" "}
          <span className="text-tetraDeep-z dark:text-tetra-z">OVER</span>
        </h2>
        {isNewHigh && (
          <p className="mb-3 font-arcade text-[11px] text-tetraDeep-o dark:text-tetra-o">
            NEW HIGH SCORE!
          </p>
        )}
        <div className="mb-6 grid grid-cols-3 gap-3 text-center">
          <div className="frosted-soft px-3 py-3">
            <div className="font-arcade text-[9px] text-tetraDeep-i dark:text-tetra-i">
              SCORE
            </div>
            <div className="mt-1 font-arcade text-xl tabular-nums">{score}</div>
          </div>
          <div className="frosted-soft px-3 py-3">
            <div className="font-arcade text-[9px] text-tetraDeep-s dark:text-tetra-s">
              HEIGHT
            </div>
            <div className="mt-1 font-arcade text-xl tabular-nums">
              {height.toFixed(1)}u
            </div>
          </div>
          <div className="frosted-soft px-3 py-3">
            <div className="font-arcade text-[9px] text-tetraDeep-o dark:text-tetra-o">
              PIECES
            </div>
            <div className="mt-1 font-arcade text-xl tabular-nums">{locked}</div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setPhase("PLAYING")}
          className="play-btn w-full justify-center"
        >
          {touchUI ? "Play Again" : "Play Again (Enter / R)"}
        </button>
        <button
          type="button"
          onClick={() => setPhase("PORTFOLIO")}
          className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-[color:var(--line-strong)] px-4 py-2 text-sm text-ink dark:text-ink/80 transition hover:border-ink/60 hover:bg-ink/5"
        >
          {touchUI ? "Back to portfolio" : "Back to portfolio (Q / Esc)"}
        </button>
      </div>
    </div>
  );
}
