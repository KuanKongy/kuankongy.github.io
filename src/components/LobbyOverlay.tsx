import { useEffect, useMemo } from "react";
import { useGameStore } from "../store/gameStore";
import { touchUIEnabled } from "../lib/touchUI";
import { TETROMINO_COLORS } from "../three/constants";
import { PiMoonFill, PiSun, PiSunHorizon } from "react-icons/pi";
import SkinCarousel from "./SkinCarousel";
import CharacterCarousel from "./CharacterCarousel";

function MiniPiece({ piece }: { piece: keyof typeof TETROMINO_COLORS | null }) {
  if (!piece) return null;
  const color = TETROMINO_COLORS[piece];
  return (
    <div className="flex items-center gap-1">
      <span
        className="inline-block h-3 w-3 rounded-sm"
        style={{ background: color, boxShadow: `0 0 6px ${color}99` }}
      />
      <span className="arcade-coat font-arcade text-[10px]" style={{ color }}>
        {piece}
      </span>
    </div>
  );
}

export default function LobbyOverlay() {
  const phase = useGameStore((s) => s.phase);
  const setPhase = useGameStore((s) => s.setPhase);
  const nextPiece = useGameStore((s) => s.nextPieceKey);
  const highScore = useGameStore((s) => s.highScore);
  const mode = useGameStore((s) => s.mode);
  const setMode = useGameStore((s) => s.setMode);
  const pendingPlayAfterLobby = useGameStore((s) => s.pendingPlayAfterLobby);
  const queuePendingPlay = useGameStore((s) => s.queuePendingPlay);
  const clearPendingPlay = useGameStore((s) => s.clearPendingPlay);
  const isDark = useGameStore((s) => s.isDark);
  const toggleDark = useGameStore((s) => s.toggleDark);
  const sceneTime = useGameStore((s) => s.sceneTime);
  const setSceneTime = useGameStore((s) => s.setSceneTime);

  // If the user clicked "Start" during LOBBY_TRANSITION we queue it; once
  // WAITING is reached we automatically advance to PLAYING.
  useEffect(() => {
    if (phase === "WAITING" && pendingPlayAfterLobby) {
      clearPendingPlay();
      setPhase("PLAYING");
    }
  }, [phase, pendingPlayAfterLobby, clearPendingPlay, setPhase]);

  const visible = phase === "WAITING" || phase === "LOBBY_TRANSITION";
  const ready = phase === "WAITING";
  const canInteract = visible;

  // One canonical "start the game" function — both buttons and Space go
  // through here. During LOBBY_TRANSITION we queue, during WAITING we
  // start instantly.
  const start = () => {
    if (phase === "WAITING") setPhase("PLAYING");
    else if (phase === "LOBBY_TRANSITION") queuePendingPlay();
  };
  const quit = () => setPhase("PORTFOLIO");
  // On touch devices, drop the keyboard lingo — those keys don't exist.
  const touchUI = useMemo(touchUIEnabled, []);

  return (
    <div
      className={`fixed inset-0 z-40 flex items-center justify-center transition-opacity duration-500 ${
        visible
          ? "pointer-events-none opacity-100"
          : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!visible}
    >
      <div
        className={`frosted w-full max-w-md px-8 py-7 text-center ${
          visible ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="mb-1 font-arcade text-[10px] tracking-widest text-tetraDeep-i dark:text-tetra-i/90">
              // ARENA · {ready ? "READY" : "ENTERING"}
            </p>
            <h2 className="font-arcade text-lg leading-tight tracking-wide md:text-xl">
              <span className="text-amber-600 dark:text-moon">TRICKY</span>{" "}
              <span style={{ color: "#945edb" }}>TOWERS 3D</span>
            </h2>
          </div>
          <button
            type="button"
            onClick={toggleDark}
            className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg border border-ink/20 bg-ink/5 text-base transition hover:border-ink/50 hover:bg-ink/10"
            title={isDark ? "Switch to day" : "Switch to night"}
          >
            {isDark ? <PiSun /> : <PiMoonFill />}
          </button>
        </div>

        <button
          type="button"
          onClick={start}
          disabled={!canInteract}
          className={`play-btn mb-4 block w-full rounded-xl border-2 px-4 py-5 transition disabled:cursor-not-allowed disabled:opacity-50 ${
            canInteract
              ? "border-tetra-i/80"
              : "border-ink/15 bg-black/25"
          }`}
        >
          <div className="font-arcade text-[10px] text-ink/70 dark:text-white/65">
            {ready
              ? touchUI
                ? "TAP"
                : "PRESS / CLICK"
              : pendingPlayAfterLobby
                ? "START QUEUED"
                : "READY IN…"}
          </div>
          <div className="mt-1 font-arcade text-2xl tracking-widest text-ink dark:text-white">
            {ready
              ? touchUI
                ? "[ START ]"
                : "[ SPACE ]"
              : pendingPlayAfterLobby
                ? "[ GO ]"
                : "WIZARDING…"}
          </div>
          <div className="mt-1 font-arcade text-[10px] text-ink/70 dark:text-white/65">
            {ready
              ? "TO START"
              : pendingPlayAfterLobby
                ? "WHEN ARENA LOADS"
                : ""}
          </div>
        </button>

        {/* Mode picker — SURVIVAL (3 hearts) vs ENDLESS (no life cap). */}
        <div className="mb-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode("SURVIVAL")}
            className={`rounded-lg border-2 px-3 py-2 text-left transition ${
              mode === "SURVIVAL"
                ? "border-tetra-z/80 bg-tetra-z/15 text-ink"
                : "border-ink/20 bg-ink/5 text-ink/70 hover:border-ink/50"
            }`}
          >
            <div className="font-arcade text-[10px] text-tetraDeep-z dark:text-tetra-z">
              SURVIVAL
            </div>
            <div className="text-xs">3 lives. Tower topples → GAME OVER.</div>
          </button>
          <button
            type="button"
            onClick={() => setMode("ENDLESS")}
            className={`rounded-lg border-2 px-3 py-2 text-left transition ${
              mode === "ENDLESS"
                ? "border-tetra-i/80 bg-tetra-i/15 text-ink"
                : "border-ink/20 bg-ink/5 text-ink/70 hover:border-ink/50"
            }`}
          >
            <div className="font-arcade text-[10px] text-tetraDeep-i dark:text-tetra-i">
              ENDLESS
            </div>
            <div className="text-xs">No life limit. Stack forever.</div>
          </button>
        </div>

        {/* Block-style carousel — thumbnails are live renders of each skin. */}
        <SkinCarousel active={visible} />

        {/* Character carousel — live-rendered thumbnails; swaps the
            cloud-rider in the arena (which phones can't see behind the
            card, hence images instead of text chips). */}
        <CharacterCarousel active={visible} />

        {/* Arena time — flips the game scene between night / day / evening
            skies, independent of the site theme. */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          {(
            [
              { id: "NIGHT", icon: PiMoonFill, accent: "text-tetraDeep-o dark:text-tetra-o", sel: "border-tetra-o/80 bg-tetra-o/15" },
              { id: "DAY", icon: PiSun, accent: "text-tetraDeep-s dark:text-tetra-s", sel: "border-tetra-s/80 bg-tetra-s/15" },
              { id: "EVENING", icon: PiSunHorizon, accent: "text-tetraDeep-z dark:text-tetra-z", sel: "border-tetra-z/80 bg-tetra-z/15" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSceneTime(t.id)}
              className={`rounded-lg border-2 px-2 py-2 text-center transition ${
                sceneTime === t.id
                  ? `${t.sel} text-ink`
                  : "border-ink/20 bg-ink/5 text-ink/70 hover:border-ink/50"
              }`}
            >
              <div className={`flex items-center justify-center gap-1.5 font-arcade text-[9px] ${t.accent}`}>
                <t.icon size={13} aria-hidden />
                {t.id}
              </div>
            </button>
          ))}
        </div>

        <div className="mb-3 grid grid-cols-2 gap-3 text-left text-xs text-ink/85">
          <div className="frosted-soft px-3 py-2">
            <div className="font-arcade text-[9px] text-tetraDeep-i dark:text-tetra-i">
              CONTROLS
            </div>
            <div className="mt-1 leading-relaxed">
              {touchUI ? (
                <>
                  ◀ ▶ move · ⟳ rotate
                  <br />⇊ soft drop
                  <br />
                  drag · aim camera
                  <br />
                  pinch · zoom
                </>
              ) : (
                <>
                  ← → move<br />↑ rotate<br />↓ soft drop<br />Space · start
                </>
              )}
            </div>
          </div>
          <div className="frosted-soft px-3 py-2">
            <div className="font-arcade text-[9px] text-tetraDeep-s dark:text-tetra-s">
              STATUS
            </div>
            <div className="mt-1 flex flex-col gap-1">
              <div>
                <span className="text-ink/60">Hi-score</span>{" "}
                <span className="font-arcade text-[11px] text-tetraDeep-o dark:text-tetra-o">
                  {highScore}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-ink/60">Next:</span>
                <MiniPiece piece={nextPiece} />
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={quit}
          className="inline-flex w-full items-center justify-center rounded-full border border-[color:var(--line-strong)] px-4 py-2 text-sm text-ink dark:text-ink/80 transition hover:border-ink/60 hover:bg-ink/5"
        >
          {touchUI
            ? "Quit · back to portfolio"
            : "Quit · back to portfolio (Q / Esc)"}
        </button>
      </div>
    </div>
  );
}
