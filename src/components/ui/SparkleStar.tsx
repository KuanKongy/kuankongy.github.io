import { useId } from "react";
import {
  EMBLEM_ARCS,
  EMBLEM_ARCS_COLORED,
  EMBLEM_STAR,
  EMBLEM_STAR_GOLD,
  EMBLEM_VIEWBOX_H,
  SHORT_TOP_VIEWBOX_H,
  STAR_NO_BLOCKS,
  STAR_NO_BLOCKS_SOLID,
  STAR_SHORT_TOP,
} from "./emblemPaths";

const GRADIENTS = {
  violet: ["#a78bfa", "#d946ef"],
  gold: ["#fbbf24", "#f59e0b"],
} as const;

/** Minecraft-diamond cyan for the v7 eye pieces. */
const DIAMOND_GRADIENT = ["#4aedd9", "#1fbfae"] as const;

/** v8 radial eye fill: white at the convergence dot fading out to cyan. */
const DIAMOND_CORE_STOPS = [
  { offset: "0", color: "#ffffff" },
  { offset: "0.35", color: "#a5f3e8" },
  { offset: "1", color: "#1fc7b2" },
] as const;

/** Indices of the two inner horizontal "eye" pieces in the star arrays. */
const EYE_INDICES = [1, 2];

/* The five approved marks. All are symmetric about the horizontal-spike
   axis, which sits at the icon's vertical center — flex centering aligns
   it with adjacent text. */
type Variant =
  | "sparkle" /* classic 4-point */
  | "emblem" /* full emblem: spikes + 8 ring blocks, single color */
  | "emblemColored" /* full emblem in the reference colors */
  | "emblemStar" /* no blocks, eye cuts kept + diagonal rhombi */
  | "emblemStarSolid" /* no blocks, whole horizontal spikes */
  | "emblemStarShort" /* v6: like emblemStar with a shorter top spike */
  | "emblemStarShortDiamond" /* v7: v6 with Minecraft-diamond cyan eyes */
  | "emblemStarShortDiamondCore"; /* v8: v7 eyes white (center) -> cyan (outer) (nav default) */

const SPARKLE_PATH =
  "M8 0 L9.8 6.2 L16 8 L9.8 9.8 L8 16 L6.2 9.8 L0 8 L6.2 6.2 Z";

interface SparkleStarProps {
  size?: number;
  /** Shine (opacity/scale pulse) — never rotates. */
  animated?: boolean;
  color?: keyof typeof GRADIENTS;
  variant?: Variant;
  className?: string;
}

export default function SparkleStar({
  size = 18,
  animated = true,
  color = "violet",
  variant = "sparkle",
  className = "",
}: SparkleStarProps) {
  const id = useId();
  const [from, to] = GRADIENTS[color];
  const cls = `${animated ? "animate-sparkle-pulse" : ""} ${className}`;

  if (variant === "sparkle") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        className={cls}
      >
        <defs>
          <linearGradient
            id={id}
            x1="0"
            y1="0"
            x2="16"
            y2="16"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor={from} />
            <stop offset="1" stopColor={to} />
          </linearGradient>
        </defs>
        <path d={SPARKLE_PATH} fill={`url(#${id})`} />
      </svg>
    );
  }

  const coreEyes = variant === "emblemStarShortDiamondCore";
  const diamondEyes = variant === "emblemStarShortDiamond" || coreEyes;
  const shortTop = variant === "emblemStarShort" || diamondEyes;
  const pieces =
    variant === "emblemStar"
      ? STAR_NO_BLOCKS
      : variant === "emblemStarSolid"
        ? STAR_NO_BLOCKS_SOLID
        : shortTop
          ? STAR_SHORT_TOP
          : EMBLEM_STAR;
  const boxH = shortTop ? SHORT_TOP_VIEWBOX_H : EMBLEM_VIEWBOX_H;
  const fill = variant === "emblemColored" ? EMBLEM_STAR_GOLD : `url(#${id})`;

  return (
    <svg
      width={size}
      height={(size * boxH) / 100}
      viewBox={`0 0 100 ${boxH}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cls}
    >
      <defs>
        <linearGradient
          id={id}
          x1="0"
          y1="0"
          x2="100"
          y2={boxH}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
        {diamondEyes &&
          (coreEyes ? (
            /* Centered on the STAR_SHORT_TOP convergence dot (50, 62). */
            <radialGradient
              id={`${id}-d`}
              cx="50"
              cy="62"
              r="28"
              gradientUnits="userSpaceOnUse"
            >
              {DIAMOND_CORE_STOPS.map((s) => (
                <stop key={s.offset} offset={s.offset} stopColor={s.color} />
              ))}
            </radialGradient>
          ) : (
            <linearGradient
              id={`${id}-d`}
              x1="0"
              y1="0"
              x2="100"
              y2={boxH}
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor={DIAMOND_GRADIENT[0]} />
              <stop offset="1" stopColor={DIAMOND_GRADIENT[1]} />
            </linearGradient>
          ))}
      </defs>
      {pieces.map((d, i) => (
        <path
          key={d}
          d={d}
          fill={
            diamondEyes && EYE_INDICES.includes(i) ? `url(#${id}-d)` : fill
          }
        />
      ))}
      {variant === "emblem" &&
        EMBLEM_ARCS.map((d) => <path key={d} d={d} fill={`url(#${id})`} />)}
      {variant === "emblemColored" &&
        EMBLEM_ARCS_COLORED.map(({ d, color: c }) => (
          <path key={d} d={d} fill={c} />
        ))}
    </svg>
  );
}
