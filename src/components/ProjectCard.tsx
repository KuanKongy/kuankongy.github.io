import { FaGithub, FaExternalLinkAlt } from "react-icons/fa";
import type { Project, ProjectCategory } from "../data/types";
import type { MediaSet } from "../lib/projectMedia";
import Tag from "./ui/Tag";
import type { TagAccent } from "./ui/Tag";
import SparkleStar from "./ui/SparkleStar";

export const CATEGORY_META: Record<
  ProjectCategory,
  { label: string; accent: TagAccent }
> = {
  academic: { label: "Academic", accent: "cyan" },
  personal: { label: "Personal", accent: "violet" },
  hackathon: { label: "Hackathon", accent: "gold" },
};

const MAX_CARD_TAGS = 4;

interface ProjectCardProps {
  project: Project;
  media: MediaSet;
  onOpen: (slug: string) => void;
}

export default function ProjectCard({
  project,
  media,
  onOpen,
}: ProjectCardProps) {
  const category = CATEGORY_META[project.category];
  const github = project.links.find((l) => l.kind === "github");
  const live = project.links.find((l) => l.kind === "live" || l.kind === "npm");
  const extraTags = project.tech.length - MAX_CARD_TAGS;

  return (
    <article className="frosted-soft group relative flex h-full flex-col overflow-hidden transition duration-200 hover:-translate-y-1 hover:border-accent-violet/40 hover:shadow-[0_14px_40px_rgba(0,0,0,0.35)]">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 z-10 h-[2px] bg-gradient-to-r from-accent-violet to-accent-fuchsia opacity-0 transition group-hover:opacity-100"
      />

      <button
        type="button"
        onClick={() => onOpen(project.slug)}
        aria-label={`View details: ${project.title}`}
        className="block w-full cursor-pointer"
      >
        <div className="aspect-video w-full overflow-hidden bg-gradient-to-br from-sky-deep to-sky-mid">
          {media.cover ? (
            <img
              src={media.cover}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2">
              <SparkleStar size={28} animated={false} />
              <span className="font-display text-lg font-bold text-white/80">
                {project.title}
              </span>
            </div>
          )}
        </div>
      </button>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Tag accent={category.accent}>{category.label}</Tag>
          {project.featured && <Tag accent="fuchsia">★ Featured</Tag>}
        </div>
        <h3 className="mt-3 font-display text-xl font-bold text-ink">
          {project.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-ink/75">{project.blurb}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {project.tech.slice(0, MAX_CARD_TAGS).map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
          {extraTags > 0 && <Tag>+{extraTags}</Tag>}
        </div>

        <div className="mt-auto flex items-center gap-2 pt-5">
          <button
            type="button"
            onClick={() => onOpen(project.slug)}
            className="btn-primary flex-1"
          >
            Details
          </button>
          {github && (
            <a
              href={github.url}
              target="_blank"
              rel="noreferrer"
              aria-label={`${project.title} on GitHub`}
              className="btn-ghost !px-3"
            >
              <FaGithub size={18} />
            </a>
          )}
          {live && (
            <a
              href={live.url}
              target="_blank"
              rel="noreferrer"
              aria-label={`${project.title} — ${live.label}`}
              className="btn-ghost !px-3"
            >
              <FaExternalLinkAlt size={15} />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
