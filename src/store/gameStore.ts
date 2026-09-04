import { create } from "zustand";
import type { TetrominoKey } from "../three/constants";

export type GamePhase =
  | "PORTFOLIO"
  | "LOBBY_TRANSITION"
  | "WAITING"
  | "PLAYING"
  | "GAME_OVER";

export type GameMode = "SURVIVAL" | "ENDLESS";

// Naming history: GLOSSY is the old candy-sticker look renamed; SMOOTH is
// the old clearcoat "glossy"; CANDY/GALAXY are the Tricky-Towers-style
// brick packs (candy.png / galaxy.png references).
export type BlockSkin =
  | "CLASSIC"
  | "CANDY"
  | "GALAXY"
  | "GEM"
  | "NEON"
  | "JEWEL"
  | "GLOSSY"
  | "SMOOTH";

export const BLOCK_SKINS: BlockSkin[] = [
  "GEM",
  "CANDY",
  "GALAXY",
  "NEON",
  "JEWEL",
  "GLOSSY",
  "SMOOTH",
  "CLASSIC",
];

export type CharacterId = "OWL" | "WIZARD" | "OCTOPUS";

export const CHARACTERS: CharacterId[] = ["OWL", "WIZARD", "OCTOPUS"];

/** Game-arena time of day, chosen in the lobby. */
export type SceneTime = "NIGHT" | "DAY" | "EVENING";

export interface GameState {
  phase: GamePhase;
  setPhase: (phase: GamePhase) => void;

  mode: GameMode;
  setMode: (m: GameMode) => void;

  blockSkin: BlockSkin;
  setBlockSkin: (s: BlockSkin) => void;

  character: CharacterId;
  setCharacter: (c: CharacterId) => void;

  mouseNorm: { x: number; y: number };
  setMouseNorm: (x: number, y: number) => void;

  score: number;
  setScore: (n: number) => void;
  addScore: (delta: number) => void;

  lives: number;
  setLives: (n: number) => void;
  loseLife: () => void;

  highScore: number;
  setHighScore: (n: number) => void;

  lockedCount: number;
  incLocked: () => void;

  /** Tower height in block units (max y of any locked piece's top, relative to platform). */
  height: number;
  setHeight: (n: number) => void;

  currentPieceKey: TetrominoKey | null;
  setCurrentPieceKey: (k: TetrominoKey | null) => void;
  nextPieceKey: TetrominoKey | null;
  setNextPieceKey: (k: TetrominoKey | null) => void;

  /** Reset gameplay-only state (keeps phase + highScore). */
  resetGameplay: () => void;

  /**
   * When the user clicks "Play" during LOBBY_TRANSITION (the wizard is still
   * flying in), we queue a "start as soon as WAITING is reached" flag.
   */
  pendingPlayAfterLobby: boolean;
  queuePendingPlay: () => void;
  clearPendingPlay: () => void;

  isDark: boolean;
  toggleDark: () => void;

  /**
   * Scene time of day, coupled two-way with the theme: NIGHT ⇔ dark,
   * DAY/EVENING ⇔ light (DAY is the light default; EVENING is the warm
   * variant). Picking a time switches the theme and vice versa.
   */
  sceneTime: SceneTime;
  setSceneTime: (t: SceneTime) => void;
}

const STARTING_LIVES = 3;

const stored = (() => {
  if (typeof window === "undefined")
    return {
      hi: 0,
      dark: true,
      mode: "SURVIVAL" as GameMode,
      skin: "GEM" as BlockSkin,
      character: "OWL" as CharacterId,
      sceneTime: "NIGHT" as SceneTime,
    };
  const hi = Number(localStorage.getItem("trickyTowers.highScore") || "0");
  const dark = localStorage.getItem("trickyTowers.dark");
  const m = localStorage.getItem("trickyTowers.mode");
  const sk = localStorage.getItem("trickyTowers.blockSkin");
  const ch = localStorage.getItem("trickyTowers.character");
  const st = localStorage.getItem("trickyTowers.sceneTime");
  // ?theme=light|dark overrides the saved preference for that visit.
  // First visit (nothing saved) follows the OS theme; "no preference"
  // systems land on night, which is the brand default. Must mirror the
  // pre-paint inline script in index.html.
  const forced = new URLSearchParams(window.location.search).get("theme");
  const isDark = forced
    ? forced !== "light"
    : dark === null
      ? !window.matchMedia("(prefers-color-scheme: light)").matches
      : dark === "1";
  return {
    hi: isNaN(hi) ? 0 : hi,
    dark: isDark,
    mode: (m === "ENDLESS" ? "ENDLESS" : "SURVIVAL") as GameMode,
    // Saved skins are honored; anything unknown (or a new user) gets GEM.
    skin: (sk === "CLASSIC" ||
    sk === "CANDY" ||
    sk === "GALAXY" ||
    sk === "JEWEL" ||
    sk === "GLOSSY" ||
    sk === "SMOOTH" ||
    sk === "NEON"
      ? sk
      : "GEM") as BlockSkin,
    character: (ch === "WIZARD" || ch === "OCTOPUS"
      ? ch
      : "OWL") as CharacterId,
    // Scene time is theme-coupled: dark is always NIGHT; light honors a
    // saved EVENING, otherwise defaults to DAY.
    sceneTime: (isDark
      ? "NIGHT"
      : st === "EVENING"
        ? "EVENING"
        : "DAY") as SceneTime,
  };
})();

export const useGameStore = create<GameState>((set, get) => ({
  phase: "PORTFOLIO",
  setPhase: (phase) => set({ phase }),

  mode: stored.mode,
  setMode: (m) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("trickyTowers.mode", m);
    }
    set({ mode: m });
  },

  blockSkin: stored.skin,
  setBlockSkin: (s) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("trickyTowers.blockSkin", s);
    }
    set({ blockSkin: s });
  },

  character: stored.character,
  setCharacter: (c) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("trickyTowers.character", c);
    }
    set({ character: c });
  },

  mouseNorm: { x: 0, y: 0 },
  setMouseNorm: (x, y) => set({ mouseNorm: { x, y } }),

  score: 0,
  setScore: (n) => set({ score: n }),
  addScore: (delta) => {
    const next = Math.max(0, get().score + delta);
    set({ score: next });
    if (next > get().highScore) get().setHighScore(next);
  },

  lives: STARTING_LIVES,
  setLives: (n) => set({ lives: Math.max(0, n) }),
  loseLife: () => {
    if (get().mode === "ENDLESS") return;
    const next = Math.max(0, get().lives - 1);
    set({ lives: next });
    if (next === 0 && get().phase === "PLAYING") {
      set({ phase: "GAME_OVER" });
    }
  },

  highScore: stored.hi,
  setHighScore: (n) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("trickyTowers.highScore", String(n));
    }
    set({ highScore: n });
  },

  lockedCount: 0,
  incLocked: () => set({ lockedCount: get().lockedCount + 1 }),

  height: 0,
  setHeight: (n) => set({ height: n }),

  currentPieceKey: null,
  setCurrentPieceKey: (k) => set({ currentPieceKey: k }),
  nextPieceKey: null,
  setNextPieceKey: (k) => set({ nextPieceKey: k }),

  resetGameplay: () =>
    set({
      score: 0,
      lives: STARTING_LIVES,
      lockedCount: 0,
      height: 0,
      currentPieceKey: null,
      nextPieceKey: null,
    }),

  pendingPlayAfterLobby: false,
  queuePendingPlay: () => set({ pendingPlayAfterLobby: true }),
  clearPendingPlay: () => set({ pendingPlayAfterLobby: false }),

  sceneTime: stored.sceneTime,
  setSceneTime: (t) => {
    // NIGHT drags the theme dark; DAY/EVENING drag it light.
    const dark = t === "NIGHT";
    if (typeof window !== "undefined") {
      localStorage.setItem("trickyTowers.sceneTime", t);
      localStorage.setItem("trickyTowers.dark", dark ? "1" : "0");
      applyDomTheme(t);
    }
    set({ sceneTime: t, isDark: dark });
  },

  isDark: stored.dark,
  toggleDark: () =>
    set((s) => {
      const next = !s.isDark;
      // Theme drags the scene with it: dark → NIGHT, light → DAY (the
      // light default — EVENING is only ever picked explicitly).
      const time: SceneTime = next ? "NIGHT" : "DAY";
      if (typeof window !== "undefined") {
        localStorage.setItem("trickyTowers.dark", next ? "1" : "0");
        localStorage.setItem("trickyTowers.sceneTime", time);
        applyDomTheme(time);
      }
      return { isDark: next, sceneTime: time };
    }),
}));

function applyDomTheme(time: SceneTime) {
  const dark = time === "NIGHT";
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.setAttribute("data-scene", time.toLowerCase());
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute(
      "content",
      dark ? "#1a0a3d" : time === "EVENING" ? "#f0c393" : "#c8d8f8",
    );
}

if (typeof window !== "undefined") {
  applyDomTheme(stored.sceneTime);
}
