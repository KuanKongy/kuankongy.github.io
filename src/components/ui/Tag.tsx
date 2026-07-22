import type { ReactNode } from "react";

export type TagAccent =
  | "violet"
  | "fuchsia"
  | "cyan"
  | "gold"
  | "green"
  | "neutral";

const ACCENTS: Record<TagAccent, string> = {
  violet:
    "border-accent-violet/40 bg-accent-violet/10 text-accent-violetDeep dark:text-accent-violet hover:border-accent-violet hover:shadow-[0_0_10px_rgba(167,139,250,0.35)]",
  fuchsia:
    "border-accent-fuchsia/40 bg-accent-fuchsia/10 text-accent-fuchsiaDeep dark:text-accent-bright hover:border-accent-fuchsia hover:shadow-[0_0_10px_rgba(217,70,239,0.35)]",
  cyan: "border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyanDeep dark:text-accent-cyan hover:border-accent-cyan hover:shadow-[0_0_10px_rgba(56,189,248,0.35)]",
  gold: "border-accent-gold/40 bg-accent-gold/10 text-accent-goldDeep dark:text-accent-gold hover:border-accent-gold hover:shadow-[0_0_10px_rgba(251,191,36,0.35)]",
  green:
    "border-accent-green/40 bg-accent-green/10 text-accent-greenDeep dark:text-accent-green hover:border-accent-green hover:shadow-[0_0_10px_rgba(52,211,153,0.35)]",
  neutral:
    "border-[color:var(--glass-border-soft)] bg-ink/5 text-ink/70 dark:bg-white/5 hover:border-[color:var(--accent-strong)] hover:text-ink hover:shadow-[0_0_10px_var(--glow)]",
};

interface TagProps {
  children: ReactNode;
  accent?: TagAccent;
  className?: string;
}

export default function Tag({
  children,
  accent = "neutral",
  className = "",
}: TagProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-xs transition duration-200 hover:-translate-y-0.5 ${ACCENTS[accent]} ${className}`}
    >
      {children}
    </span>
  );
}
