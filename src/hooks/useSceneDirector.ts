import { useEffect } from "react";
import { getDirector } from "../three/sceneBridge";
import { useGameStore } from "../store/gameStore";

const MOMENT_SECTIONS = ["projects", "skills"] as const;

/**
 * Pipes portfolio DOM signals into the 3D scene: rAF-throttled scroll
 * progress, pointer position, and one-shot section moments. Re-arms every
 * time the portfolio becomes visible again (e.g. after a game session).
 */
export function useSceneDirector() {
  const phase = useGameStore((s) => s.phase);
  const active = phase === "PORTFOLIO";

  useEffect(() => {
    if (!active) return;

    let raf = 0;
    let pending = false;

    const onScroll = () => {
      if (pending) return;
      pending = true;
      raf = requestAnimationFrame(() => {
        pending = false;
        const doc = document.documentElement;
        const max = doc.scrollHeight - window.innerHeight;
        getDirector()?.setScrollProgress(max > 0 ? window.scrollY / max : 0);
      });
    };

    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      getDirector()?.setPointer(nx, ny);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMove, { passive: true });
    onScroll();

    const observers: IntersectionObserver[] = [];
    for (const id of MOMENT_SECTIONS) {
      const el = document.getElementById(id);
      if (!el) continue;
      const obs = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            getDirector()?.triggerMoment(id);
            obs.disconnect();
          }
        },
        { threshold: 0.25 },
      );
      obs.observe(el);
      observers.push(obs);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMove);
      observers.forEach((o) => o.disconnect());
    };
  }, [active]);
}
