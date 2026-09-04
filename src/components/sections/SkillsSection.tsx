import type { CSSProperties } from "react";
import { FaChevronDown } from "react-icons/fa";
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
      style={
        {
          "--pill-dark": item.brandColor,
          "--pill-light": item.brandColorLight ?? item.brandColor,
        } as CSSProperties
      }
    >
      <Icon size={15} className="skill-pill-icon opacity-90" aria-hidden />
      {item.name}
    </span>
  );
}

function CategoryCard({ category }: { category: SkillCategory }) {
  const Icon = category.icon;
  const overflow = category.overflow ?? [];
  return (
    <div
      className="frosted group flex h-full flex-col p-5 hover-lift hover:border-[color:var(--glass-border)] hover:shadow-[0_10px_36px_-14px_var(--glow)]"
      tabIndex={overflow.length > 0 ? 0 : undefined}
    >
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
      <div className="mt-4 flex flex-wrap content-start gap-2">
        {category.items.map((item) => (
          <SkillPill key={item.name} item={item} />
        ))}
      </div>
      {overflow.length > 0 && (
        <>
          {/* Desktop (xl) keeps these pills tucked away; hovering (or
              keyboard-focusing) the card eases grid-template-rows 0fr -> 1fr
              (animates the true content height, so open and close feel the
              same) and the other cards in the same grid row stretch along
              with it. Mobile and tablet always show everything. */}
          <div className="xl:grid xl:grid-rows-[0fr] xl:transition-[grid-template-rows] xl:duration-300 xl:ease-out xl:group-hover:grid-rows-[1fr] xl:group-focus-within:grid-rows-[1fr]">
            <div className="xl:overflow-hidden">
              <div className="flex flex-wrap content-start gap-2 pt-2">
                {overflow.map((item) => (
                  <SkillPill key={item.name} item={item} />
                ))}
              </div>
            </div>
          </div>
          <FaChevronDown
            size={12}
            aria-hidden
            className="mx-auto mt-2 hidden shrink-0 text-ink/40 transition-opacity duration-300 group-hover:opacity-0 group-focus-within:opacity-0 xl:block"
          />
        </>
      )}
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
