import { useId } from "react";

interface SparkleStarProps {
  size?: number;
  /** Shine (opacity/scale pulse) — never rotates. */
  animated?: boolean;
  className?: string;
}

export default function SparkleStar({
  size = 18,
  animated = true,
  className = "",
}: SparkleStarProps) {
  const id = useId();
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
          <stop stopColor="#a78bfa" />
          <stop offset="1" stopColor="#d946ef" />
        </linearGradient>
      </defs>
      <path
        d="M8 0 C8.35 4.1 8.9 6.05 10.1 7.1 C11.15 8 12.9 8.35 16 8 C11.9 8.35 9.95 8.9 8.9 10.1 C8 11.15 7.65 12.9 8 16 C7.65 11.9 7.1 9.95 5.9 8.9 C4.85 8 3.1 7.65 0 8 C4.1 7.65 6.05 7.1 7.1 5.9 C8 4.85 8.35 3.1 8 0 Z"
        fill={`url(#${id})`}
      />
    </svg>
  );
}
