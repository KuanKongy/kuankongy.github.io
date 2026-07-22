import { useEffect, useState } from "react";
import {
  BLOCK_SKINS,
  useGameStore,
  type BlockSkin,
} from "../store/gameStore";
import { renderSkinPreviews } from "../three/preview/renderSkinPreviews";

const SKIN_INFO: Record<BlockSkin, { name: string; desc: string }> = {
  CANDY: { name: "CANDY", desc: "2D candy sticker faces" },
  GEM: { name: "GEM", desc: "Whole-piece gem shine" },
  JEWEL: { name: "JEWEL", desc: "Faceted jewel bricks" },
  GLOSSY: { name: "GLOSSY", desc: "Clearcoat plastic" },
  CLASSIC: { name: "CLASSIC", desc: "Flat toon cubes" },
};

/**
 * Image carousel for the block skin — thumbnails are live renders of the
 * actual in-game materials (generated once, lazily, when the lobby opens).
 */
export default function SkinCarousel({ active }: { active: boolean }) {
  const blockSkin = useGameStore((s) => s.blockSkin);
  const setBlockSkin = useGameStore((s) => s.setBlockSkin);
  const [previews, setPreviews] = useState<
    Partial<Record<BlockSkin, string>>
  >({});

  useEffect(() => {
    if (!active) return;
    let alive = true;
    renderSkinPreviews()
      .then((p) => {
        if (alive) setPreviews(p);
      })
      .catch(() => {
        // Thumbnails are progressive enhancement — names still work.
      });
    return () => {
      alive = false;
    };
  }, [active]);

  const idx = Math.max(0, BLOCK_SKINS.indexOf(blockSkin));
  const cycle = (d: number) =>
    setBlockSkin(
      BLOCK_SKINS[(idx + d + BLOCK_SKINS.length) % BLOCK_SKINS.length],
    );
  const info = SKIN_INFO[blockSkin];
  const img = previews[blockSkin];

  return (
    <div className="mb-4 rounded-lg border-2 border-white/20 bg-white/5 px-3 py-2">
      <div className="mb-1 flex items-center justify-between">
        <div className="font-arcade text-[9px] text-tetra-l">BLOCK STYLE</div>
        <div className="flex items-center gap-1">
          {BLOCK_SKINS.map((s) => (
            <span
              key={s}
              className={`h-1.5 w-1.5 rounded-full transition ${
                s === blockSkin ? "bg-tetra-l" : "bg-white/25"
              }`}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => cycle(-1)}
          aria-label="Previous block style"
          className="flex h-14 w-8 items-center justify-center rounded-lg border border-white/20 bg-white/5 text-white/80 transition hover:border-white/50 hover:bg-white/10"
        >
          ◀
        </button>
        <div className="flex flex-1 items-center justify-center gap-3">
          {img ? (
            <img
              src={img}
              alt={`${info.name} block style`}
              className="h-16 w-16 shrink-0"
              draggable={false}
            />
          ) : (
            <span className="h-16 w-16 shrink-0 animate-pulse rounded-lg bg-white/10" />
          )}
          <div className="min-w-[8rem] text-left">
            <div className="font-arcade text-xs text-white">{info.name}</div>
            <div className="text-xs leading-snug text-white/70">
              {info.desc}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => cycle(1)}
          aria-label="Next block style"
          className="flex h-14 w-8 items-center justify-center rounded-lg border border-white/20 bg-white/5 text-white/80 transition hover:border-white/50 hover:bg-white/10"
        >
          ▶
        </button>
      </div>
    </div>
  );
}
