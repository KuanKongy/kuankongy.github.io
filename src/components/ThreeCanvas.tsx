import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { GameEngine, type EngineStatus } from "../three/GameEngine";
import { useGameStore } from "../store/gameStore";

export default function ThreeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<EngineStatus>({ phase: "idle" });
  const phase = useGameStore((s) => s.phase);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    let engine: GameEngine | null = null;
    let cancelled = false;

    // Defer instantiation by one tick so React 18 StrictMode's immediate
    // mount → unmount → mount cycle in dev never lets a half-initialized
    // engine grab the canvas's WebGL context.
    const id = window.setTimeout(() => {
      if (cancelled) return;
      engine = new GameEngine(canvas);
      engine.onStatus(setStatus);
      void engine.init();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(id);
      void engine?.dispose();
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className={clsx(
          "fixed inset-0 z-0 h-screen w-screen",
          // In PORTFOLIO mode the canvas sits BEHIND the portfolio HTML and
          // must NOT swallow clicks — otherwise resume button, hero buttons,
          // section hovers etc. don't work because the canvas covers them.
          phase === "PORTFOLIO" && "pointer-events-none",
        )}
        style={{ display: "block", background: "transparent" }}
      />
      {status.phase === "error" && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center pt-20">
          <div className="pointer-events-auto frosted max-w-xl px-5 py-3 text-sm text-rose-700 dark:text-rose-200">
            <strong className="mr-2 font-arcade text-xs text-rose-800 dark:text-rose-300">
              [SCENE]
            </strong>
            {status.message}
          </div>
        </div>
      )}
    </>
  );
}
