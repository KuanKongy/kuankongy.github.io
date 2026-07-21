import type { CSSProperties } from "react";
import { skills } from "../../data/skills";
import type { AccentKey, SkillCategory, SkillItem } from "../../data/types";
import SectionHeading from "../ui/SectionHeading";
import Reveal from "../ui/Reveal";

const ACCENT_BAR: Record<AccentKey, string> = {
  violet: "from-accent-violet to-accent-fuchsia",
  fuchsia: "from-accent-fuchsia to-accent-bright",
  cyan: "from-accent-cyan to-accent-violet",
  gold: "from-accent-gold to-accent-fuchsia",
  green: "from-accent-green to-accent-cyan",
};

function SkillPill({ item }: { item: SkillItem }) {
  const Icon = item.icon;
  return (
    <span
      className="skill-pill inline-flex items-center gap-2 rounded-lg border border-[color:var(--glass-border-soft)] bg-ink/5 px-3 py-1.5 font-mono text-xs text-ink/80 dark:bg-white/5"
      style={{ "--glow-c": item.brandColor } as CSSProperties}
    >
      <Icon
        size={15}
        style={{ color: item.brandColor }}
        className="opacity-80"
        aria-hidden
      />
      {item.name}
    </span>
  );
}

function CategoryCard({ category }: { category: SkillCategory }) {
  const Icon = category.icon;
  return (
    <div className="frosted flex h-full flex-col p-5">
      <div className="flex items-center gap-2.5">
        <Icon
          size={18}
          className="text-[color:var(--accent-strong)]"
          aria-hidden
        />
        <h3 className="font-display text-lg font-bold text-ink">
          {category.label}
        </h3>
      </div>
      <div
        className={`mt-2 h-0.5 w-12 rounded-full bg-gradient-to-r ${
          ACCENT_BAR[category.accent]
        }`}
      />
      <div className="mt-4 flex flex-wrap gap-2">
        {category.items.map((item) => (
          <SkillPill key={item.name} item={item} />
        ))}
      </div>
    </div>
  );
}

export default function SkillsSection() {
  return (
    <section id="skills" className="scroll-mt-24">
      {/* Legacy anchor — old /#languages links still land here. */}
      <span id="languages" aria-hidden />
      <SectionHeading kicker="// what I work with" title="Skills" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {skills.map((c, i) => (
          <Reveal key={c.id} delay={(i % 3) * 80} className="h-full">
            <CategoryCard category={c} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
