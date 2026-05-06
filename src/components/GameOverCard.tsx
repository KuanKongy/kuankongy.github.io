import { useGameStore } from "../store/gameStore";

export default function GameOverCard() {
  const phase = useGameStore((s) => s.phase);
  const setPhase = useGameStore((s) => s.setPhase);
  const score = useGameStore((s) => s.score);
  const height = useGameStore((s) => s.height);
  const locked = useGameStore((s) => s.lockedCount);
  const high = useGameStore((s) => s.highScore);

  const visible = phase === "GAME_OVER";
  const isNewHigh = score > 0 && score >= high;

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
        <p className="mb-2 font-arcade text-[10px] tracking-widest text-tetra-z/90">
          // TOWER · TOPPLED
        </p>
        <h2 className="font-arcade mb-3 text-lg font-bold text-white leading-tight tracking-wide md:text-4xl">
          GAME <span className="text-tetra-z">OVER</span>
        </h2>
        {isNewHigh && (
          <p className="mb-3 font-arcade text-[11px] text-tetra-o">
            NEW HIGH SCORE!
          </p>
        )}
        <div className="mb-6 grid grid-cols-3 gap-3 text-center">
          <div className="frosted-soft px-3 py-3">
            <div className="font-arcade text-[9px] text-tetra-i">SCORE</div>
            <div className="mt-1 font-arcade text-xl tabular-nums">{score}</div>
          </div>
          <div className="frosted-soft px-3 py-3">
            <div className="font-arcade text-[9px] text-tetra-s">HEIGHT</div>
            <div className="mt-1 font-arcade text-xl tabular-nums">
              {height.toFixed(1)}u
            </div>
          </div>
          <div className="frosted-soft px-3 py-3">
            <div className="font-arcade text-[9px] text-tetra-o">PIECES</div>
            <div className="mt-1 font-arcade text-xl tabular-nums">{locked}</div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setPhase("PLAYING")}
          className="play-btn w-full justify-center"
        >
          Play Again (Enter / R)
        </button>
        <button
          type="button"
          onClick={() => setPhase("PORTFOLIO")}
          className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-white/30 px-4 py-2 text-sm text-white/80 transition hover:border-white/60 hover:bg-white/5"
        >
          Back to portfolio (Q / Esc)
        </button>
      </div>
    </div>
  );
}
