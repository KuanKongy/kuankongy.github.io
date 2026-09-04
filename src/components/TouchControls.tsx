import { useMemo } from "react";
import type { IconType } from "react-icons";
import {
  PiArrowClockwiseBold,
  PiCaretDoubleDownBold,
  PiCaretLeftBold,
  PiCaretRightBold,
} from "react-icons/pi";
import { useGameStore } from "../store/gameStore";
import { touchUIEnabled } from "../lib/touchUI";

/**
 * Fire the same window key events the keyboard produces — InputController
 * was built as a dumb key adapter precisely so touch could ride on top of
 * it: its own hold-repeat handles held ◀/▶, and `held` drives soft-drop.
 */
function keyDown(key: string) {
  window.dispatchEvent(new KeyboardEvent("keydown", { key, code: key }));
}
function keyUp(key: string) {
  window.dispatchEvent(new KeyboardEvent("keyup", { key, code: key }));
}

function HoldButton({
  icon: Icon,
  label,
  keyName,
}: {
  icon: IconType;
  label: string;
  keyName: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        keyDown(keyName);
      }}
      onPointerUp={() => keyUp(keyName)}
      onPointerCancel={() => keyUp(keyName)}
      className="pointer-events-auto flex h-[4.25rem] w-[4.25rem] touch-none select-none items-center justify-center rounded-full border-2 border-ink/25 bg-[color:var(--glass-bg-soft)] text-2xl text-ink/90 shadow-lg backdrop-blur-md transition active:scale-90 active:border-[color:var(--accent-strong)] active:bg-ink/10"
    >
      <Icon aria-hidden />
    </button>
  );
}

/**
 * On-screen gameplay controls for touch devices: move buttons bottom-left,
 * rotate + soft-drop bottom-right — the bottom corners stay thumb-reachable
 * in both portrait and landscape (safe-area insets respected). Rendered
 * only while PLAYING on coarse-pointer devices; `?touch=1` forces them on
 * for desktop testing.
 */
export default function TouchControls() {
  const phase = useGameStore((s) => s.phase);
  const enabled = useMemo(touchUIEnabled, []);

  if (!enabled || phase !== "PLAYING") return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 flex items-end justify-between"
      style={{
        pointerEvents: "none",
        paddingLeft: "max(1.25rem, env(safe-area-inset-left))",
        paddingRight: "max(1.25rem, env(safe-area-inset-right))",
        paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))",
      }}
    >
      <div className="flex gap-4">
        <HoldButton icon={PiCaretLeftBold} label="Move left" keyName="ArrowLeft" />
        <HoldButton
          icon={PiCaretRightBold}
          label="Move right"
          keyName="ArrowRight"
        />
      </div>
      <div className="flex gap-4">
        <HoldButton
          icon={PiArrowClockwiseBold}
          label="Rotate"
          keyName="ArrowUp"
        />
        <HoldButton
          icon={PiCaretDoubleDownBold}
          label="Soft drop"
          keyName="ArrowDown"
        />
      </div>
    </div>
  );
}
