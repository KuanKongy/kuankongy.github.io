/**
 * Auto-discovers project media from src/assets/projects/<slug>/.
 *
 * Drop convention (no code changes needed to add media):
 *   cover.webp            → card image (falls back to the first image)
 *   01.webp, 02.webp, …   → modal gallery, sorted by filename
 *   demo.mp4 / demo.webm  → optional; plays FIRST in the modal
 *
 * WebP preferred; png/jpg also work. Keep videos under ~10 MB — long demos
 * should stay on YouTube (set `youtubeId` in src/data/projects.ts instead).
 */
const imageModules = import.meta.glob(
  "../assets/projects/*/*.{webp,png,jpg,jpeg}",
  { eager: true, import: "default" },
) as Record<string, string>;

const videoModules = import.meta.glob("../assets/projects/*/*.{mp4,webm}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

export interface MediaSet {
  cover?: string;
  /** Gallery images in filename order (cover excluded unless it's the only one). */
  images: string[];
  video?: string;
}

interface Entry {
  file: string;
  url: string;
}

function bucket(modules: Record<string, string>): Map<string, Entry[]> {
  const map = new Map<string, Entry[]>();
  for (const [path, url] of Object.entries(modules)) {
    const match = path.match(/\/projects\/([^/]+)\/([^/]+)$/);
    if (!match) continue;
    const [, slug, file] = match;
    const list = map.get(slug) ?? [];
    list.push({ file, url });
    map.set(slug, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.file.localeCompare(b.file));
  }
  return map;
}

const imagesBySlug = bucket(imageModules);
const videosBySlug = bucket(videoModules);

export function mediaFor(slug: string): MediaSet {
  const imgs = imagesBySlug.get(slug) ?? [];
  const vids = videosBySlug.get(slug) ?? [];

  const coverEntry =
    imgs.find((e) => e.file.startsWith("cover.")) ?? imgs[0] ?? undefined;
  const gallery = imgs
    .filter((e) => !e.file.startsWith("cover."))
    .map((e) => e.url);

  return {
    cover: coverEntry?.url,
    images: gallery.length > 0 ? gallery : coverEntry ? [coverEntry.url] : [],
    video: vids[0]?.url,
  };
}
