import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { lockBodyScroll } from "../../lib/scrollLock";

interface ModalProps {
  /** id of the element that titles this dialog (aria-labelledby). */
  labelledBy: string;
  onClose: () => void;
  children: ReactNode;
}

const TABBABLE =
  'a[href], button:not([disabled]), video, iframe, input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Accessible dialog: portal, focus trap, Esc/backdrop/button close,
 * body-scroll lock, opener-focus restore. Note: Esc is not received while a
 * YouTube iframe has focus — the visible close button covers that case.
 */
export default function Modal({ labelledBy, onClose, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const release = lockBodyScroll();
    const opener = document.activeElement as HTMLElement | null;
    // Focus the panel, not the close button — Safari draws the accent
    // :focus-visible ring around programmatically-focused buttons.
    panelRef.current?.focus();
    return () => {
      release();
      opener?.focus?.();
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const tabbables = panel.querySelectorAll<HTMLElement>(TABBABLE);
      if (tabbables.length === 0) return;
      const first = tabbables[0];
      const last = tabbables[tabbables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        style={{ outline: "none" }}
        className="frosted scrollbar-hidden relative max-h-[90dvh] w-full max-w-3xl overflow-y-auto p-5 sm:p-8"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="hover-lift absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--line-strong)] bg-[color:var(--glass-bg)] text-lg text-ink/80 hover:text-[color:var(--accent-strong)]"
        >
          ✕
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}
