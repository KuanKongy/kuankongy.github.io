import { useEffect, useState } from "react";
import { FaGithub, FaExternalLinkAlt, FaNpm } from "react-icons/fa";
import Modal from "./ui/Modal";
import Tag from "./ui/Tag";
import { CATEGORY_META } from "../lib/categoryMeta";
import type { Project } from "../data/types";
import type { MediaSet } from "../lib/projectMedia";

function Gallery({ images, title }: { images: string[]; title: string }) {
  const [idx, setIdx] = useState(0);
  const many = images.length > 1;

  useEffect(() => {
    if (!many) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        setIdx((i) => (i - 1 + images.length) % images.length);
      } else if (e.key === "ArrowRight") {
        setIdx((i) => (i + 1) % images.length);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [many, images.length]);

  return (
    <div>
      <div className="relative overflow-hidden rounded-lg bg-black/30">
        <img
          src={images[idx]}
          alt={`${title} screenshot ${idx + 1} of ${images.length}`}
          className="aspect-video w-full object-contain"
        />
        {many && (
          <>
            <button
              type="button"
              onClick={() =>
                setIdx((i) => (i - 1 + images.length) % images.length)
              }
              aria-label="Previous screenshot"
              className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/75"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setIdx((i) => (i + 1) % images.length)}
              aria-label="Next screenshot"
              className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/75"
            >
              ›
            </button>
            <span className="absolute bottom-2 right-3 rounded-md bg-black/55 px-2 py-0.5 font-mono text-xs text-white">
              {idx + 1} / {images.length}
            </span>
          </>
        )}
      </div>
      {many && (
        <div className="mt-2 flex snap-x gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={`Go to screenshot ${i + 1}`}
              className={`h-14 w-24 shrink-0 snap-start overflow-hidden rounded-md border-2 transition ${
                i === idx
                  ? "border-accent-fuchsia"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const LINK_ICONS = {
  github: FaGithub,
  live: FaExternalLinkAlt,
  npm: FaNpm,
} as const;

interface ProjectModalProps {
  project: Project;
  media: MediaSet;
  onClose: () => void;
}

export default function ProjectModal({
  project,
  media,
  onClose,
}: ProjectModalProps) {
  const titleId = `project-modal-${project.slug}`;
  const category = CATEGORY_META[project.category];
  // Media priority: local video → YouTube → image gallery.
  const showVideo = Boolean(media.video);
  const showYoutube = !showVideo && Boolean(project.youtubeId);

  return (
    <Modal labelledBy={titleId} onClose={onClose}>
      <div className="flex flex-wrap items-center gap-2 pr-12">
        <h3 id={titleId} className="font-display text-2xl font-bold text-ink">
          {project.title}
        </h3>
        <Tag accent={category.accent}>{category.label}</Tag>
        {project.featured && <Tag accent="fuchsia">★ Featured</Tag>}
      </div>

      <div className="mt-5 space-y-4">
        {showVideo && (
          <video
            controls
            preload="metadata"
            poster={media.cover}
            className="aspect-video w-full rounded-lg bg-black"
            src={media.video}
          />
        )}
        {showYoutube && (
          <div className="aspect-video w-full overflow-hidden rounded-lg">
            <iframe
              className="h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${project.youtubeId}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={`${project.title} demo video`}
            />
          </div>
        )}
        {media.images.length > 0 && (
          <Gallery images={media.images} title={project.title} />
        )}
      </div>

      <p className="mt-5 text-sm leading-relaxed text-ink/80 md:text-base">
        {project.description}
      </p>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {project.tech.map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {project.links.map((l) => {
          const Icon = LINK_ICONS[l.kind];
          const primary = l.kind === "live";
          return (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className={primary ? "btn-primary" : "btn-ghost"}
            >
              <Icon size={16} />
              {l.label}
            </a>
          );
        })}
      </div>
    </Modal>
  );
}
