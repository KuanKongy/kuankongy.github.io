interface SectionHeadingProps {
  kicker: string;
  title: string;
  align?: "left" | "center";
}

/** Mono kicker + Syne title + gradient underline, laid bare on the sky. */
export default function SectionHeading({
  kicker,
  title,
  align = "left",
}: SectionHeadingProps) {
  const center = align === "center";
  return (
    <div className={`mb-10 ${center ? "text-center" : ""}`}>
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">
        {kicker}
      </p>
      <h2 className="mt-2 font-display text-3xl font-bold text-ink md:text-4xl">
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
