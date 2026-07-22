import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        sky: {
          deep: "#1a0d4a",
          mid: "#4a2a9a",
          low: "#6b48b8",
        },
        moon: "#fbe88a",
        cloudDark: "#5a6a9a",
        cloudMid: "#7a8ab8",
        mountainDark: "#4a4d58",
        mountainMid: "#5c5f6a",
        ice: "#cfd6dd",
        tetra: {
          i: "#e53935", // red
          s: "#26c6da", // cyan
          j: "#1e88e5", // blue
          l: "#ffca28", // yellow
          z: "#e65100", // dark orange
          o: "#8e24aa", // purple
          t: "#43a047", // green
        },
        // Light-theme counterparts — bright arcade tone in dark, deepened
        // twin on light glass (pattern: text-tetraDeep-x dark:text-tetra-x).
        tetraDeep: {
          i: "#c62828",
          s: "#0e7490",
          j: "#1565c0",
          l: "#b45309",
          z: "#c2410c",
          o: "#7b1fa2",
          t: "#2e7d32",
        },
        // One accent family grown from the night-sky purple: violet at rest,
        // fuchsia when bright. Deep variants exist for light-theme contrast.
        accent: {
          violet: "#a78bfa",
          fuchsia: "#d946ef",
          bright: "#e879f9",
          glow: "#f0abfc",
          cyan: "#38bdf8",
          gold: "#fbbf24",
          green: "#34d399",
          violetDeep: "#6d28d9",
          fuchsiaDeep: "#a21caf",
          cyanDeep: "#0369a1",
          goldDeep: "#b45309",
          greenDeep: "#047857",
        },
        ink: "rgb(var(--ink) / <alpha-value>)",
      },
      fontFamily: {
        display: ['"Syne"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
        arcade: ['"Press Start 2P"', "system-ui", "sans-serif"],
      },
      animation: {
        "play-pulse": "play-pulse 4s linear infinite",
        "wiz-bob": "wiz-bob 4s ease-in-out infinite",
        "sparkle-pulse": "sparkle-pulse 2.6s ease-in-out infinite",
        "bounce-slow": "bounce-slow 2s ease-in-out infinite",
        "grad-shift": "grad-shift 4s ease infinite",
      },
      keyframes: {
        // Cycles all 7 tetromino colors — part of the button's charm.
        "play-pulse": {
          "0%": { borderColor: "#e53935" },
          "14%": { borderColor: "#43a047" },
          "28%": { borderColor: "#26c6da" },
          "42%": { borderColor: "#e65100" },
          "57%": { borderColor: "#1e88e5" },
          "71%": { borderColor: "#ffca28" },
          "85%": { borderColor: "#8e24aa" },
          "100%": { borderColor: "#e53935" },
        },
        "wiz-bob": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        // Shine without rotating: opacity + scale only.
        "sparkle-pulse": {
          "0%, 100%": { opacity: "0.65", transform: "scale(0.92)" },
          "50%": { opacity: "1", transform: "scale(1.06)" },
        },
        "bounce-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(6px)" },
        },
        "grad-shift": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
