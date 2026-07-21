import { useMemo, useState } from "react";
import { projects } from "../../data/projects";
import type { ProjectCategory } from "../../data/types";
import { mediaFor } from "../../lib/projectMedia";
import SectionHeading from "../ui/SectionHeading";
import Reveal from "../ui/Reveal";
import ProjectCard from "../ProjectCard";
import ProjectModal from "../ProjectModal";

type Filter = "all" | ProjectCategory;

const TABS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "academic", label: "Academic" },
  { key: "personal", label: "Personal" },
  { key: "hackathon", label: "Hackathon" },
];

export default function ProjectsSection() {
  const [filter, setFilter] = useState<Filter>("all");
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const list = useMemo(() => {
    const filtered =
      filter === "all"
        ? projects
        : projects.filter((p) => p.category === filter);
    return [...filtered].sort(
      (a, b) => Number(b.featured ?? false) - Number(a.featured ?? false),
    );
  }, [filter]);

  const openProject = openSlug
    ? projects.find((p) => p.slug === openSlug) ?? null
    : null;

  return (
    <section id="projects" className="scroll-mt-24">
      <SectionHeading kicker="// things I've built" title="Projects" />

      <div
        className="frosted-soft mb-8 inline-flex max-w-full flex-wrap gap-1 rounded-xl p-1"
        role="group"
        aria-label="Filter projects by category"
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            aria-pressed={filter === t.key}
            onClick={() => setFilter(t.key)}
            className={`min-h-[44px] cursor-pointer rounded-lg px-4 font-mono text-xs uppercase tracking-wider transition ${
              filter === t.key
                ? "bg-gradient-to-r from-[#7c3aed] to-[#c026d3] text-white shadow-md"
                : "text-ink/70 hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((p, i) => (
          <Reveal key={p.slug} delay={(i % 3) * 80} className="h-full">
            <ProjectCard
              project={p}
              media={mediaFor(p.slug)}
              onOpen={setOpenSlug}
            />
          </Reveal>
        ))}
      </div>

      {openProject && (
        <ProjectModal
          project={openProject}
          media={mediaFor(openProject.slug)}
          onClose={() => setOpenSlug(null)}
        />
      )}
    </section>
  );
}
