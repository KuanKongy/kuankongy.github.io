import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { prefersReducedMotion } from "../../lib/motion";

interface RevealProps {
  children: ReactNode;
  /** Transition delay in ms — use for staggering siblings. */
  delay?: number;
  className?: string;
}

/** Fades content up once when it first scrolls into view. */
export default function Reveal({ children, delay = 0, className = "" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(() => prefersReducedMotion());

  useEffect(() => {
    if (on) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setOn(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [on]);

  return (
    <div
      ref={ref}
      className={`reveal ${on ? "on" : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
