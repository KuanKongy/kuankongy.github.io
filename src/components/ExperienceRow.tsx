import { useId, useState } from "react";
import type { AccentKey, ExperienceEntry, ExperienceType } from "../data/types";
import Tag from "./ui/Tag";
import type { TagAccent } from "./ui/Tag";

const TYPE_META: Record<ExperienceType, { label: string; accent: TagAccent }> =
  {
    teaching: { label: "Teaching", accent: "cyan" },
    club: { label: "Club", accent: "violet" },
    "open-source": { label: "Open Source", accent: "gold" },
  };

const BUBBLE_GRADIENTS: Record<AccentKey, string> = {
  violet: "from-accent-violet to-accent-fuchsia",
  fuchsia: "from-accent-fuchsia to-accent-bright",
  cyan: "from-accent-cyan to-accent-violet",
  gold: "from-accent-gold to-accent-fuchsia",
  green: "from-accent-green to-accent-cyan",
};

/**
 * Timeline entry: the logo bubble sits ON the vertical spine (drawn by
 * ExperienceSection at left-6), and the content lives in its OWN glass card
 * beside it — bubble and card are deliberately separate elements.
 */
export default function ExperienceRow({ entry }: { entry: ExperienceEntry }) {
  const [open, setOpen] = useState(false);
  const regionId = useId();
  const type = TYPE_META[entry.type];
  const dates = entry.dateLabel ?? `${entry.start} – ${entry.end ?? "Present"}`;

  return (
    <div className="grid grid-cols-[3rem_1fr] items-start gap-x-4">
      {/* Bubble on the spine, detached from the card. */}
      <span className="relative z-10 mt-2 flex h-12 w-12 items-center justify-center">
        {entry.logo ? (
          <img
            src={entry.logo}
            alt=""
            className="h-12 w-12 rounded-full bg-white/90 object-contain p-1 ring-[3px] ring-accent-violetDeep dark:ring-accent-violet"
          />
        ) : (
          <span
            className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br font-display text-sm font-bold text-white ring-[3px] ring-accent-violetDeep dark:ring-accent-violet ${
              BUBBLE_GRADIENTS[entry.accent]
            }`}
          >
            {entry.orgInitials}
          </span>
        )}
      </span>

      {/* Separate glass card for the content. */}
      <div className="frosted-soft overflow-hidden transition hover:border-accent-violet/40">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={regionId}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full cursor-pointer items-center gap-4 p-4 text-left"
        >
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-display text-base font-bold text-ink md:text-lg">
                {entry.role}
              </span>
              <Tag accent={type.accent}>{type.label}</Tag>
            </span>
            <span className="font-mono text-xs text-ink/60">
              {entry.org} · {dates}
            </span>
          </span>

          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
            className={`shrink-0 text-ink/60 transition-transform duration-300 ${
              open ? "rotate-180" : ""
            }`}
          >
            <path
              d="M3 6l5 5 5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div
          id={regionId}
          className={`grid transition-[grid-template-rows] duration-300 ${
            open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div className="px-4 pb-4 pt-1">
              <ul className="space-y-2 text-sm text-ink/80 md:text-base">
                {entry.bullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span
                      aria-hidden
                      className="text-[color:var(--accent-strong)]"
                    >
                      →
                    </span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                {entry.tech.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
                {entry.orgUrl && (
                  <a
                    href={entry.orgUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto font-mono text-xs text-[color:var(--accent-strong)] underline-offset-4 hover:underline"
                  >
                    Visit site ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
