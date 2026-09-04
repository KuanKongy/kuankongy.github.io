import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaGithub, FaExternalLinkAlt, FaNpm, FaExpand } from "react-icons/fa";
import { touchUIEnabled } from "../lib/touchUI";
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

const MAX_SCALE = 4;

const FRAME_RATIO = 16 / 9;

/** Shared style for the overlay circle buttons (arrows, inspect, close). */
const CTL_BTN =
  "absolute flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/20 text-white transition hover:border-white/50 hover:bg-black/70 active:scale-90";

/**
 * Pan-and-zoom viewport for one image. Fills its positioned parent; at rest
 * the image is letterbox-centred exactly like plain object-contain.
 * A click/tap toggles 2.5× and fit — the discoverable way in. A trackpad
 * pinch (ctrl+wheel, Safari gesture events, two-finger touch) zooms 1:1
 * toward the fingers; plain two-finger scroll zooms in from fit and glides
 * around the image once zoomed, eased through a rAF spring so wheel steps
 * feel fluid. Dragging pans while zoomed and keeps gliding briefly on
 * release. Motion is written straight to the img style — React never
 * re-renders during a gesture; remount (key by src) resets the view.
 */
function ZoomPan({
  src,
  alt,
  badge,
}: {
  src: string;
  alt: string;
  /** Show the live zoom-level pill (click resets to fit) while zoomed. */
  badge?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const badgeRef = useRef<HTMLButtonElement>(null);
  const view = useRef({ scale: 1, x: 0, y: 0 }); // painted right now
  const goal = useRef({ scale: 1, x: 0, y: 0 }); // where the spring heads
  const vel = useRef({ x: 0, y: 0 }); // pan glide after a drag, px/frame
  const raf = useRef(0);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  // Distinguishes a plain click/tap (zoom toggle) from a drag or pinch.
  const gesture = useRef({ startX: 0, startY: 0, moved: false, multi: false });
  const [zoomed, setZoomed] = useState(false);
  const [dragging, setDragging] = useState(false);

  const paint = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    const v = view.current;
    img.style.transform = `translate(${v.x}px, ${v.y}px) scale(${v.scale})`;
    if (badgeRef.current) {
      badgeRef.current.textContent = `${v.scale.toFixed(1)}×`;
    }
    setZoomed(goal.current.scale > 1.001);
  }, []);

  /** Clamp pan: the image stays inside the frame, centred where it fits. */
  const clamp = useCallback((s: { scale: number; x: number; y: number }) => {
    const wrap = wrapRef.current;
    const img = imgRef.current;
    if (!wrap || !img) return;
    const maxX = Math.max(0, (img.offsetWidth * s.scale - wrap.clientWidth) / 2);
    const maxY = Math.max(
      0,
      (img.offsetHeight * s.scale - wrap.clientHeight) / 2,
    );
    s.x = Math.min(maxX, Math.max(-maxX, s.x));
    s.y = Math.min(maxY, Math.max(-maxY, s.y));
  }, []);

  /** One animation frame: glide the pan, ease the view toward the goal. */
  const tick = useCallback(() => {
    const v = view.current;
    const g = goal.current;
    const k = vel.current;
    if (k.x || k.y) {
      g.x += k.x;
      g.y += k.y;
      k.x *= 0.92;
      k.y *= 0.92;
      if (Math.hypot(k.x, k.y) < 0.4) {
        k.x = 0;
        k.y = 0;
      }
      clamp(g);
    }
    v.scale += (g.scale - v.scale) * 0.3;
    v.x += (g.x - v.x) * 0.3;
    v.y += (g.y - v.y) * 0.3;
    const settled =
      !k.x &&
      !k.y &&
      Math.abs(g.scale - v.scale) < 0.001 &&
      Math.abs(g.x - v.x) < 0.3 &&
      Math.abs(g.y - v.y) < 0.3;
    if (settled) {
      view.current = { ...g };
      raf.current = 0;
    } else {
      raf.current = requestAnimationFrame(tick);
    }
    paint();
  }, [clamp, paint]);

  const animate = useCallback(() => {
    if (!raf.current) raf.current = requestAnimationFrame(tick);
  }, [tick]);

  /** Retarget so the frame point under (cx, cy) — client coords — stays put. */
  const zoomAt = useCallback(
    (next: number, cx: number, cy: number, immediate = false) => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const g = goal.current;
      const s = Math.min(MAX_SCALE, Math.max(1, next));
      const r = wrap.getBoundingClientRect();
      const px = cx - r.left - r.width / 2;
      const py = cy - r.top - r.height / 2;
      g.x = px - ((px - g.x) * s) / g.scale;
      g.y = py - ((py - g.y) * s) / g.scale;
      g.scale = s;
      if (s <= 1.001) {
        g.scale = 1;
        g.x = 0;
        g.y = 0;
      }
      clamp(g);
      setZoomed(g.scale > 1.001); // cursor + badge react before frame one
      if (immediate) {
        view.current = { ...g };
        paint();
      } else {
        animate();
      }
    },
    [animate, clamp, paint],
  );

  // Native non-passive listeners: React's synthetic handlers can't
  // preventDefault a wheel, and the page would scroll behind the zoom.
  // A trackpad pinch reaches Chrome/Firefox as ctrl+wheel, applied 1:1.
  // Plain two-finger scroll zooms in from fit and pans once zoomed — the
  // mode is locked per gesture burst so momentum never flips it mid-glide.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const wheelGesture = { mode: "zoom" as "zoom" | "pan", t: 0 };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const stepY = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      if (e.ctrlKey || e.metaKey) {
        wheelGesture.t = 0; // a pinch ends any scroll gesture
        zoomAt(
          goal.current.scale * Math.exp(-stepY * 0.01),
          e.clientX,
          e.clientY,
          true,
        );
        return;
      }
      const now = performance.now();
      const continues = now - wheelGesture.t < 250;
      wheelGesture.t = now;
      if (!continues) {
        wheelGesture.mode = goal.current.scale > 1.001 ? "pan" : "zoom";
      }
      if (wheelGesture.mode === "pan") {
        const g = goal.current;
        g.x -= e.deltaMode === 1 ? e.deltaX * 16 : e.deltaX;
        g.y -= stepY;
        clamp(g);
        animate();
      } else {
        zoomAt(
          goal.current.scale * Math.exp(-stepY * 0.0028),
          e.clientX,
          e.clientY,
        );
      }
    };
    // Safari reports the trackpad pinch as gesture* events with a running
    // e.scale; the pointer-count guard avoids double-applying on iOS where
    // they fire alongside the two-pointer pinch.
    let gestureBase = 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onGestureStart = (e: any) => {
      e.preventDefault();
      gestureBase = goal.current.scale;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onGestureChange = (e: any) => {
      e.preventDefault();
      if (pointers.current.size < 2) {
        zoomAt(gestureBase * e.scale, e.clientX, e.clientY, true);
      }
    };
    wrap.addEventListener("wheel", onWheel, { passive: false });
    wrap.addEventListener("gesturestart", onGestureStart);
    wrap.addEventListener("gesturechange", onGestureChange);
    return () => {
      wrap.removeEventListener("wheel", onWheel);
      wrap.removeEventListener("gesturestart", onGestureStart);
      wrap.removeEventListener("gesturechange", onGestureChange);
    };
  }, [zoomAt, clamp, animate]);

  useEffect(() => {
    cancelAnimationFrame(raf.current);
    raf.current = 0;
    view.current = { scale: 1, x: 0, y: 0 };
    goal.current = { scale: 1, x: 0, y: 0 };
    vel.current = { x: 0, y: 0 };
    pointers.current.clear();
    setDragging(false);
    paint();
    return () => cancelAnimationFrame(raf.current);
  }, [src, paint]);

  const onPointerDown = (e: React.PointerEvent) => {
    vel.current = { x: 0, y: 0 }; // grabbing the image stops any glide
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      gesture.current = {
        startX: e.clientX,
        startY: e.clientY,
        moved: false,
        multi: false,
      };
    } else {
      gesture.current.multi = true;
    }
    if (goal.current.scale > 1 || pointers.current.size === 2) {
      wrapRef.current?.setPointerCapture(e.pointerId);
      setDragging(true);
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const pts = pointers.current;
    const prev = pts.get(e.pointerId);
    if (!prev) return;
    if (
      Math.hypot(
        e.clientX - gesture.current.startX,
        e.clientY - gesture.current.startY,
      ) > 6
    ) {
      gesture.current.moved = true;
    }
    const g = goal.current;
    if (pts.size === 2) {
      // Pinch: zoom by the distance ratio around the midpoint, pan with it.
      const [a, b] = [...pts.values()];
      const prevDist = Math.hypot(a.x - b.x, a.y - b.y);
      const prevMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const [a2, b2] = [...pts.values()];
      const dist = Math.hypot(a2.x - b2.x, a2.y - b2.y);
      const mid = { x: (a2.x + b2.x) / 2, y: (a2.y + b2.y) / 2 };
      g.x += mid.x - prevMid.x;
      g.y += mid.y - prevMid.y;
      zoomAt(g.scale * (prevDist > 0 ? dist / prevDist : 1), mid.x, mid.y, true);
    } else if (g.scale > 1) {
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      g.x += dx;
      g.y += dy;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      clamp(g);
      view.current = { ...g };
      // Low-passed drag speed seeds the glide when the pointer lets go.
      vel.current.x = vel.current.x * 0.4 + dx * 0.6;
      vel.current.y = vel.current.y * 0.4 + dy * 0.6;
      paint();
    } else {
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
  };

  const onPointerEnd = (e: React.PointerEvent) => {
    if (!pointers.current.delete(e.pointerId)) return;
    if (pointers.current.size === 0) {
      setDragging(false);
      const tap =
        e.type === "pointerup" &&
        !gesture.current.moved &&
        !gesture.current.multi;
      if (tap) {
        // A plain click/tap toggles the zoom — the discoverable way in.
        const g = goal.current;
        if (g.scale > 1.001) zoomAt(1, 0, 0);
        else zoomAt(2.5, e.clientX, e.clientY);
      } else if (vel.current.x || vel.current.y) {
        animate(); // let the pan glide out
      }
    }
  };

  return (
    <div
      ref={wrapRef}
      className={`absolute inset-0 flex select-none items-center justify-center overflow-hidden ${
        zoomed ? (dragging ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in"
      }`}
      style={{ touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        draggable={false}
        className="max-h-full max-w-full will-change-transform"
      />
      {badge && (
        <button
          ref={badgeRef}
          type="button"
          onClick={() => zoomAt(1, 0, 0)}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label="Reset zoom"
          title="Reset zoom"
          className={`absolute bottom-2 left-1/2 -translate-x-1/2 cursor-pointer rounded-full border border-white/15 bg-black/35 px-3 py-1 font-mono text-xs text-white backdrop-blur-sm transition hover:border-white/50 hover:bg-black/70 active:scale-90 ${
            zoomed ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          1.0×
        </button>
      )}
    </div>
  );
}

/**
 * Lightbox above the project modal. The stage is the album's, not the
 * photo's: shaped by the tallest image, as large as the viewport allows, so
 * the overlaid arrows/counter keep one place across the whole album.
 */
function InspectView({
  src,
  alt,
  ratio,
  counter,
  onPrev,
  onNext,
  onClose,
}: {
  src: string;
  alt: string;
  ratio: number;
  counter?: string;
  onPrev?: () => void;
  onNext?: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    // Capture phase so Escape closes the inspect view before the modal's
    // own document listener closes the whole dialog.
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      } else if (e.key === "ArrowLeft") {
        onPrev?.();
      } else if (e.key === "ArrowRight") {
        onNext?.();
      }
    }
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onClose, onPrev, onNext]);

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
      <div
        className="relative"
        style={{
          width: `min(94vw, calc(86dvh * ${ratio}))`,
          aspectRatio: `${ratio}`,
        }}
      >
        <div className="absolute inset-0 overflow-hidden rounded-lg border border-accent-violetDeep dark:border-accent-violet">
          <ZoomPan key={src} src={src} alt={alt} badge />
        </div>
        {onPrev && (
          <button
            type="button"
            onClick={onPrev}
            aria-label="Previous image"
            className={`${CTL_BTN} left-2 top-1/2 -translate-y-1/2`}
          >
            ‹
          </button>
        )}
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            aria-label="Next image"
            className={`${CTL_BTN} right-2 top-1/2 -translate-y-1/2`}
          >
            ›
          </button>
        )}
        {counter && (
          <span className="absolute bottom-2 right-3 rounded-md bg-black/55 px-2 py-0.5 font-mono text-xs text-white">
            {counter}
          </span>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close full-size view"
          className={`${CTL_BTN} right-2 top-2`}
        >
          ✕
        </button>
      </div>
    </div>,
    document.body,
  );
}

function Gallery({ items, title }: { items: MediaItem[]; title: string }) {
  const [idx, setIdx] = useState(0);
  /** Frame aspect = the tallest media in the album (measured upfront). */
  const [frameRatio, setFrameRatio] = useState(FRAME_RATIO);
  const [inspect, setInspect] = useState(false);
  const touchUI = useMemo(touchUIEnabled, []);
  const many = items.length > 1;
  const current = items[idx];
  const imageCount = items.filter((it) => it.kind === "image").length;
  const imagePos = items
    .slice(0, idx)
    .filter((it) => it.kind === "image").length;

  /** Jump to the nearest image slide in the given direction (wraps). */
  function stepImage(dir: 1 | -1) {
    const n = items.length;
    for (let k = 1; k <= n; k++) {
      const j = (idx + dir * k + n) % n;
      if (items[j].kind === "image") {
        setIdx(j);
        return;
      }
    }
  }

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

  // Preload the neighbouring images so arrow navigation feels instant.
  useEffect(() => {
    for (const d of [1, -1] as const) {
      const n = items.length;
      for (let k = 1; k <= n; k++) {
        const it = items[(idx + d * k + n) % n];
        if (it.kind === "image") {
          const im = new Image();
          im.src = it.src;
          break;
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, items.map(itemKey).join("|")]);

  useEffect(() => {
    // While inspect is open its own listener owns the arrow keys.
    if (!many || inspect) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        setIdx((i) => (i - 1 + items.length) % items.length);
      } else if (e.key === "ArrowRight") {
        setIdx((i) => (i + 1) % items.length);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [many, items.length, inspect]);

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
          {current.kind === "image" &&
            (touchUI ? (
              /* On touch the tap opens the inspect lightbox — in-frame
                 pinching would fight the modal's own scrolling. */
              <div
                role="button"
                aria-label="Open full-size view"
                onClick={() => setInspect(true)}
                className="block h-full w-full overflow-hidden rounded-lg"
              >
                <img
                  src={current.src}
                  alt={`${title} media ${idx + 1} of ${items.length}`}
                  draggable={false}
                  className="h-full w-full select-none object-contain"
                />
              </div>
            ) : (
              <div className="relative h-full w-full overflow-hidden rounded-lg">
                <ZoomPan
                  key={current.src}
                  src={current.src}
                  alt={`${title} media ${idx + 1} of ${items.length}`}
                />
              </div>
            ))}
        </div>
        {/* Touch users open inspect by tapping the picture itself. */}
        {!touchUI && current.kind === "image" && (
          <button
            type="button"
            onClick={() => setInspect(true)}
            aria-label="Open full-size view"
            className={`${CTL_BTN} right-2 top-2`}
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
              className={`${CTL_BTN} left-2 top-1/2 -translate-y-1/2`}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setIdx((i) => (i + 1) % items.length)}
              aria-label="Next media"
              className={`${CTL_BTN} right-2 top-1/2 -translate-y-1/2`}
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
                    : "border-accent-violetDeep/45 opacity-60 hover:opacity-100 dark:border-accent-violet/45"
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
          ratio={frameRatio}
          counter={
            imageCount > 1 ? `${imagePos + 1} / ${imageCount}` : undefined
          }
          onPrev={imageCount > 1 ? () => stepImage(-1) : undefined}
          onNext={imageCount > 1 ? () => stepImage(1) : undefined}
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
