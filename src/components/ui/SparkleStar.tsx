import { useId } from "react";

const GRADIENTS = {
  violet: ["#a78bfa", "#d946ef"],
  gold: ["#fbbf24", "#f59e0b"],
} as const;

interface SparkleStarProps {
  size?: number;
  /** Shine (opacity/scale pulse) — never rotates. */
  animated?: boolean;
  color?: keyof typeof GRADIENTS;
  className?: string;
}

export default function SparkleStar({
  size = 18,
  animated = true,
  color = "violet",
  className = "",
}: SparkleStarProps) {
  const id = useId();
  const [from, to] = GRADIENTS[color];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={`${animated ? "animate-sparkle-pulse" : ""} ${className}`}
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
      {/* 4-fold symmetric sparkle — straight edges, identical points. */}
      <path
        d="M8 0 L9.8 6.2 L16 8 L9.8 9.8 L8 16 L6.2 9.8 L0 8 L6.2 6.2 Z"
        fill={`url(#${id})`}
      />
    </svg>
  );
}
