import { useEffect, useState } from "react";
import {
  CHARACTERS,
  useGameStore,
  type CharacterId,
} from "../store/gameStore";
import { renderCharacterPreviews } from "../three/preview/renderCharacterPreviews";

const CHARACTER_INFO: Record<CharacterId, { name: string; desc: string }> = {
  OWL: { name: "OWL", desc: "Goggle-eyed cloud surfer" },
  WIZARD: { name: "WIZARD", desc: "Classic tower wizard" },
  OCTOPUS: { name: "OCTOPUS", desc: "Octopus in a suit" },
};

/**
 * Image carousel for the cloud-rider character — same pattern as
 * SkinCarousel. On phones the 3D rider is hidden behind the lobby card, so
 * the live-rendered thumbnail is the only way to see who you're picking.
 */
export default function CharacterCarousel({ active }: { active: boolean }) {
  const character = useGameStore((s) => s.character);
  const setCharacter = useGameStore((s) => s.setCharacter);
  const [previews, setPreviews] = useState<
    Partial<Record<CharacterId, string>>
  >({});

  useEffect(() => {
    if (!active) return;
    let alive = true;
    renderCharacterPreviews()
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

  const idx = Math.max(0, CHARACTERS.indexOf(character));
  const cycle = (d: number) =>
    setCharacter(CHARACTERS[(idx + d + CHARACTERS.length) % CHARACTERS.length]);
  const info = CHARACTER_INFO[character];
  const img = previews[character];

  return (
    <div className="mb-4 rounded-lg border-2 border-ink/20 bg-ink/5 px-3 py-2">
      <div className="mb-1 flex items-center justify-between">
        <div className="font-arcade text-[9px] text-tetraDeep-j dark:text-tetra-j">
          CHARACTER
        </div>
        <div className="flex items-center gap-1">
          {CHARACTERS.map((c) => (
            <span
              key={c}
              className={`h-1.5 w-1.5 rounded-full transition ${
                c === character ? "bg-tetraDeep-j dark:bg-tetra-j" : "bg-ink/25"
              }`}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => cycle(-1)}
          aria-label="Previous character"
          className="flex h-14 w-8 items-center justify-center rounded-lg border border-ink/20 bg-ink/5 text-ink/80 transition hover:border-ink/50 hover:bg-ink/10"
        >
          ◀
        </button>
        <div className="flex flex-1 items-center justify-center gap-3">
          {img ? (
            <img
              src={img}
              alt={`${info.name} character`}
              className="h-16 w-16 shrink-0"
              draggable={false}
            />
          ) : (
            <span className="h-16 w-16 shrink-0 animate-pulse rounded-full bg-ink/10" />
          )}
          <div className="min-w-[8rem] text-left">
            <div className="font-arcade text-xs text-ink">{info.name}</div>
            <div className="text-xs leading-snug text-ink/70">{info.desc}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => cycle(1)}
          aria-label="Next character"
          className="flex h-14 w-8 items-center justify-center rounded-lg border border-ink/20 bg-ink/5 text-ink/80 transition hover:border-ink/50 hover:bg-ink/10"
        >
          ▶
        </button>
      </div>
    </div>
  );
}
