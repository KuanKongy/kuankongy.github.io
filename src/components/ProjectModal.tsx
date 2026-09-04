import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaGithub, FaExternalLinkAlt, FaNpm, FaExpand } from "react-icons/fa";
import Modal from "./ui/Modal";
import Tag from "./ui/Tag";
import { CATEGORY_META } from "../lib/categoryMeta";
import type { Project } from "../data/types";
import type { MediaSet } from "../lib/projectMedia";

/** One scroller for everything — the demo video is just the first slide. */
type MediaItem =
  | { kind: "video"; src: string; poster?: string }
  | { kind: "youtube"; id: string }
  | { kind: "image"; src: string };

function itemKey(item: MediaItem) {
  return item.kind === "youtube" ? item.id : item.src;
}

function PlayBadge() {
  return (
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 pl-0.5 text-[10px] text-white">
        ▶
      </span>
    </span>
  );
}

const ZOOM = 2.5;

const FRAME_RATIO = 16 / 9;

/**
 * Lightbox above the project modal: the picture at the largest size that
 * fits on screen, with the same click-zoom + drag-pan as the gallery frame.
 */
function InspectView({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const frameRef = useRef<HTMLButtonElement>(null);
  const drag = useRef<{
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef(false);

  useEffect(() => {
    // Capture phase so Escape closes the inspect view before the modal's
    // own document listener closes the whole dialog.
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    }
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  function clampOffset(x: number, y: number) {
    const el = frameRef.current;
    if (!el) return { x, y };
    const maxX = (el.clientWidth * (ZOOM - 1)) / 2;
    const maxY = (el.clientHeight * (ZOOM - 1)) / 2;
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  }

  function onClick(e: React.MouseEvent) {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    if (zoom) {
      setZoom(false);
      setOffset({ x: 0, y: 0 });
      return;
    }
    const el = frameRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      const cx = e.clientX - r.left - r.width / 2;
      const cy = e.clientY - r.top - r.height / 2;
      setOffset(clampOffset(-cx * (ZOOM - 1), -cy * (ZOOM - 1)));
    }
    setZoom(true);
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!zoom) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: offset.x,
      baseY: offset.y,
      moved: false,
    };
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) + Math.abs(dy) > 6) d.moved = true;
    setOffset(clampOffset(d.baseX + dx, d.baseY + dy));
  }

  function endDrag() {
    if (drag.current?.moved) suppressClick.current = true;
    drag.current = null;
    setDragging(false);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        ref={frameRef}
        type="button"
        aria-label={zoom ? "Zoom out" : "Zoom in"}
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={`relative touch-none overflow-hidden rounded-lg border border-accent-violetDeep dark:border-accent-violet ${
          zoom
            ? dragging
              ? "cursor-grabbing"
              : "cursor-grab"
            : "cursor-zoom-in"
        }`}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${
              zoom ? ZOOM : 1
            })`,
            transition: dragging ? "none" : "transform 300ms ease",
          }}
          className="max-h-[88dvh] max-w-[94vw] select-none object-contain"
        />
      </button>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close full-size view"
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/20 text-white transition hover:border-white/50 hover:bg-black/70"
      >
        ✕
      </button>
    </div>,
    document.body,
  );
}

function Gallery({ items, title }: { items: MediaItem[]; title: string }) {
  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  /** Frame aspect = the tallest media in the album (measured upfront). */
  const [frameRatio, setFrameRatio] = useState(FRAME_RATIO);
  const [inspect, setInspect] = useState(false);
  const frameRef = useRef<HTMLButtonElement>(null);
  const drag = useRef<{
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef(false);
  const many = items.length > 1;
  const current = items[idx];

  // Keep the zoomed image covering its frame — no panning past its edges.
  function clampOffset(x: number, y: number) {
    const el = frameRef.current;
    if (!el) return { x, y };
    const maxX = (el.clientWidth * (ZOOM - 1)) / 2;
    const maxY = (el.clientHeight * (ZOOM - 1)) / 2;
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  }

  function resetZoom() {
    setZoom(false);
    setOffset({ x: 0, y: 0 });
  }

  useEffect(resetZoom, [idx]);

  // Measure every album item once and size the frame for the tallest one
  // (smallest width/height ratio). The frame then never changes between
  // slides, so switching pages doesn't jump.
  useEffect(() => {
    let alive = true;
    const ratios: number[] = [];
    let pending = 0;
    function done() {
      if (alive && ratios.length > 0) setFrameRatio(Math.min(...ratios));
    }
    items.forEach((item) => {
      if (item.kind === "image") {
        pending++;
        const im = new Image();
        im.onload = () => {
          ratios.push(im.naturalWidth / im.naturalHeight);
          if (--pending === 0) done();
        };
        im.onerror = () => {
          if (--pending === 0) done();
        };
        im.src = item.src;
      } else if (item.kind === "video") {
        pending++;
        const v = document.createElement("video");
        v.preload = "metadata";
        v.onloadedmetadata = () => {
          if (v.videoWidth > 0) ratios.push(v.videoWidth / v.videoHeight);
          if (--pending === 0) done();
        };
        v.onerror = () => {
          if (--pending === 0) done();
        };
        v.src = item.src;
      } else {
        // YouTube embeds are 16:9.
        ratios.push(FRAME_RATIO);
      }
    });
    if (pending === 0) done();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map(itemKey).join("|")]);

  useEffect(() => {
    if (!many && !zoom) return;
    function onKey(e: KeyboardEvent) {
      if (zoom) {
        // While zoomed the arrows pan instead of switching slides.
        const step = 80;
        if (e.key === "ArrowLeft") {
          setOffset((o) => clampOffset(o.x + step, o.y));
        } else if (e.key === "ArrowRight") {
          setOffset((o) => clampOffset(o.x - step, o.y));
        } else if (e.key === "ArrowUp") {
          setOffset((o) => clampOffset(o.x, o.y + step));
        } else if (e.key === "ArrowDown") {
          setOffset((o) => clampOffset(o.x, o.y - step));
        }
        return;
      }
      if (e.key === "ArrowLeft") {
        setIdx((i) => (i - 1 + items.length) % items.length);
      } else if (e.key === "ArrowRight") {
        setIdx((i) => (i + 1) % items.length);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [many, items.length, zoom]);

  function openInspect() {
    resetZoom();
    setInspect(true);
  }

  function onImageClick(e: React.MouseEvent) {
    if (suppressClick.current) {
      // This click just finished a pan drag — don't toggle the zoom.
      suppressClick.current = false;
      return;
    }
    // Touch devices skip in-frame zoom (pointer zooming is clumsy there)
    // and go straight to the full-size inspect view.
    if (window.matchMedia("(pointer: coarse)").matches) {
      openInspect();
      return;
    }
    if (zoom) {
      resetZoom();
      return;
    }
    // Zoom in toward the clicked point.
    const el = frameRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      const cx = e.clientX - r.left - r.width / 2;
      const cy = e.clientY - r.top - r.height / 2;
      setOffset(clampOffset(-cx * (ZOOM - 1), -cy * (ZOOM - 1)));
    }
    setZoom(true);
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!zoom) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: offset.x,
      baseY: offset.y,
      moved: false,
    };
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) + Math.abs(dy) > 6) d.moved = true;
    setOffset(clampOffset(d.baseX + dx, d.baseY + dy));
  }

  function endDrag() {
    if (drag.current?.moved) suppressClick.current = true;
    drag.current = null;
    setDragging(false);
  }

  return (
    <div>
      <div className="relative">
        {/* Invisible frame sized for the album's tallest media — identical
            on every slide, so the layout and buttons never move. */}
        <div
          // Cap the frame so tall albums never blow the modal past the
          // viewport — media letterboxes invisibly inside.
          style={{ aspectRatio: `${frameRatio}`, maxHeight: "60dvh" }}
          className="flex w-full items-center justify-center"
        >
          {current.kind === "video" && (
            <video
              controls
              preload="metadata"
              poster={current.poster}
              className="aspect-video max-h-full w-full rounded-lg bg-black"
              src={current.src}
            />
          )}
          {current.kind === "youtube" && (
            <div className="aspect-video max-h-full w-full overflow-hidden rounded-lg">
              <iframe
                className="h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${current.id}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={`${title} demo video`}
              />
            </div>
          )}
          {current.kind === "image" && (
            /* Click zooms toward the pointer; drag pans; click again zooms
               back out. On touch, tap opens inspect instead. */
            <button
              ref={frameRef}
              type="button"
              aria-label={zoom ? "Zoom out" : "Zoom in"}
              onClick={onImageClick}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              className={`block h-full w-full overflow-hidden rounded-lg ${
                zoom
                  ? `touch-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`
                  : "cursor-zoom-in"
              }`}
            >
              <img
                src={current.src}
                alt={`${title} media ${idx + 1} of ${items.length}`}
                draggable={false}
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${
                    zoom ? ZOOM : 1
                  })`,
                  transition: dragging ? "none" : "transform 300ms ease",
                }}
                className="h-full w-full select-none object-contain"
              />
            </button>
          )}
        </div>
        {current.kind === "image" && (
          <button
            type="button"
            onClick={openInspect}
            aria-label="Open full-size view"
            className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/20 text-white transition hover:border-white/50 hover:bg-black/70"
          >
            <FaExpand size={13} />
          </button>
        )}
        {many && (
          <>
            <button
              type="button"
              onClick={() =>
                setIdx((i) => (i - 1 + items.length) % items.length)
              }
              aria-label="Previous media"
              className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/20 text-white transition hover:border-white/50 hover:bg-black/70"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setIdx((i) => (i + 1) % items.length)}
              aria-label="Next media"
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/20 text-white transition hover:border-white/50 hover:bg-black/70"
            >
              ›
            </button>
            <span className="absolute bottom-2 right-3 rounded-md bg-black/55 px-2 py-0.5 font-mono text-xs text-white">
              {idx + 1} / {items.length}
            </span>
          </>
        )}
      </div>
      {many && (
        <div className="scrollbar-hidden mt-2 flex snap-x gap-2 overflow-x-auto pb-1">
          {items.map((item, i) => {
            const thumb =
              item.kind === "image"
                ? item.src
                : item.kind === "video"
                  ? item.poster
                  : `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`;
            return (
              <button
                key={itemKey(item)}
                type="button"
                onClick={() => setIdx(i)}
                aria-label={`Go to media ${i + 1}`}
                className={`relative h-14 w-24 shrink-0 snap-start overflow-hidden rounded-md border-2 transition ${
                  i === idx
                    ? "border-accent-fuchsia"
                    : "border-white opacity-60 hover:opacity-100 dark:border-ink/30"
                }`}
              >
                {thumb ? (
                  <img
                    src={thumb}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="block h-full w-full bg-black/60" />
                )}
                {item.kind !== "image" && <PlayBadge />}
              </button>
            );
          })}
        </div>
      )}
      {inspect && current.kind === "image" && (
        <InspectView
          src={current.src}
          alt={`${title} media ${idx + 1} full size`}
          onClose={() => setInspect(false)}
        />
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
  // One gallery: the demo video (local beats YouTube) is the first slide,
  // followed by the screenshots.
  const items: MediaItem[] = [
    ...(media.video
      ? [{ kind: "video", src: media.video, poster: media.cover } as const]
      : project.youtubeId
        ? [{ kind: "youtube", id: project.youtubeId } as const]
        : []),
    ...media.images.map((src) => ({ kind: "image", src }) as const),
  ];

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
        {items.length > 0 && <Gallery items={items} title={project.title} />}
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
