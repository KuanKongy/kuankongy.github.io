import { useGameStore } from "../store/gameStore";
import { TETROMINO_COLORS, TETROMINOES } from "../three/constants";

function NextPiecePreview({ piece }: { piece: keyof typeof TETROMINOES | null }) {
  if (!piece) return <div className="h-12 w-12 rounded bg-ink/5" />;
  const cells = TETROMINOES[piece];
  const color = TETROMINO_COLORS[piece];
  const minX = Math.min(...cells.map((c) => c[0]));
  const maxX = Math.max(...cells.map((c) => c[0]));
  const minY = Math.min(...cells.map((c) => c[1]));
  const maxY = Math.max(...cells.map((c) => c[1]));
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const cellPx = 12;
  return (
    <div
      className="relative"
      style={{
        width: cellPx * w,
        height: cellPx * h,
      }}
    >
      {cells.map((c, i) => (
        <span
          key={i}
          className="absolute rounded-[2px]"
          style={{
            left: (c[0] - minX) * cellPx,
            top: (maxY - c[1]) * cellPx,
            width: cellPx - 2,
            height: cellPx - 2,
            background: color,
            boxShadow: `0 0 6px ${color}aa, inset 0 0 0 1px rgba(0,0,0,0.4)`,
          }}
        />
      ))}
    </div>
  );
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      aria-hidden
      className={filled ? "text-tetra-z" : "text-ink/20"}
      fill="currentColor"
    >
      <path d="M12 21s-8-5.4-8-11.4C4 6.4 6.5 4 9.4 4c1.7 0 3.2.9 4.1 2.3.9-1.4 2.4-2.3 4.1-2.3C20.5 4 23 6.4 23 9.6 23 15.6 15 21 15 21" />
    </svg>
  );
}

export default function GameHUD() {
  const phase = useGameStore((s) => s.phase);
  const score = useGameStore((s) => s.score);
  const lives = useGameStore((s) => s.lives);
  const height = useGameStore((s) => s.height);
  const lockedCount = useGameStore((s) => s.lockedCount);
  const next = useGameStore((s) => s.nextPieceKey);
  const mode = useGameStore((s) => s.mode);
  const visible = phase === "PLAYING" || phase === "GAME_OVER";

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-0 z-20 flex items-start justify-between px-4 pt-20 transition-opacity duration-500 md:px-8 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden={!visible}
    >
      <div className="frosted px-5 py-3">
        <div className="font-arcade text-[10px] tracking-widest text-tetraDeep-i dark:text-tetra-i">
          SCORE
        </div>
        <div className="font-arcade text-3xl text-ink tabular-nums">
          {String(score).padStart(5, "0")}
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-ink/70">
          <span>
            <span className="text-ink/70 dark:text-ink/40">Height</span>{" "}
            <span className="font-arcade text-[11px] text-tetraDeep-s dark:text-tetra-s">
              {height.toFixed(1)}u
            </span>
          </span>
          <span>
            <span className="text-ink/70 dark:text-ink/40">Pieces</span>{" "}
            <span className="font-arcade text-[11px] text-tetraDeep-o dark:text-tetra-o">
              {lockedCount}
            </span>
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-3">
        {mode === "SURVIVAL" ? (
          <div className="frosted flex items-center gap-2 px-4 py-2">
            <span className="mr-1 font-arcade text-[10px] text-tetraDeep-z dark:text-tetra-z">
              LIVES
            </span>
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart key={i} filled={i < lives} />
            ))}
          </div>
        ) : (
          <div className="frosted flex items-center gap-2 px-4 py-2">
            <span className="font-arcade text-[10px] text-tetraDeep-i dark:text-tetra-i">
              MODE
            </span>
            <span className="font-arcade text-xs text-tetraDeep-i dark:text-tetra-i">
              ENDLESS · ∞
            </span>
          </div>
        )}
        <div className="frosted flex items-center gap-3 px-4 py-3">
          <span className="font-arcade text-[10px] text-tetraDeep-t dark:text-tetra-t">
            NEXT
          </span>
          <NextPiecePreview piece={next} />
        </div>
      </div>
    </div>
  );
}
