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
    "border-accent-violet/40 bg-accent-violet/10 text-accent-violetDeep dark:text-accent-violet",
  fuchsia:
    "border-accent-fuchsia/40 bg-accent-fuchsia/10 text-accent-fuchsiaDeep dark:text-accent-bright",
  cyan: "border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyanDeep dark:text-accent-cyan",
  gold: "border-accent-gold/40 bg-accent-gold/10 text-accent-goldDeep dark:text-accent-gold",
  green:
    "border-accent-green/40 bg-accent-green/10 text-accent-greenDeep dark:text-accent-green",
  neutral:
    "border-[color:var(--glass-border-soft)] bg-ink/5 text-ink/70 dark:bg-white/5",
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
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-xs ${ACCENTS[accent]} ${className}`}
    >
      {children}
    </span>
  );
}
