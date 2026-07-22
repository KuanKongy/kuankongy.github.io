interface SectionHeadingProps {
  kicker: string;
  title: string;
  align?: "left" | "center";
  /** Extra classes for the kicker (e.g. bigger/bolder in Contact). */
  kickerClassName?: string;
}

/** Mono kicker + Syne title + gradient underline, laid bare on the sky. */
export default function SectionHeading({
  kicker,
  title,
  align = "left",
  kickerClassName = "text-xs",
}: SectionHeadingProps) {
  const center = align === "center";
  // Headings sit bare over the 3D scene — the themed glow keeps them
  // readable when the moon/clouds pass behind them.
  return (
    <div className={`mb-10 ${center ? "text-center" : ""}`}>
      <p
        className={`font-mono uppercase tracking-[0.3em] text-[color:var(--accent-strong)] ${kickerClassName}`}
        style={{ textShadow: "var(--heading-glow)" }}
      >
        {kicker}
      </p>
      <h2
        className="mt-2 font-display text-3xl font-bold text-[color:var(--heading-ink)] md:text-4xl"
        style={{ textShadow: "var(--heading-glow)" }}
      >
        {title}
      </h2>
      <div
        className={`mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-accent-violet to-accent-fuchsia ${
          center ? "mx-auto" : ""
        }`}
      />
    </div>
  );
}
