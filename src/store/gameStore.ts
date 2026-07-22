import { create } from "zustand";
import type { TetrominoKey } from "../three/constants";

export type GamePhase =
  | "PORTFOLIO"
  | "LOBBY_TRANSITION"
  | "WAITING"
  | "PLAYING"
  | "GAME_OVER";

export type GameMode = "SURVIVAL" | "ENDLESS";

export type BlockSkin = "CLASSIC" | "CANDY" | "GEM" | "JEWEL" | "GLOSSY";

export const BLOCK_SKINS: BlockSkin[] = [
  "CANDY",
  "GEM",
  "JEWEL",
  "GLOSSY",
  "CLASSIC",
];

export type CharacterId = "OWL" | "WIZARD" | "OCTOPUS";

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
}

const STARTING_LIVES = 3;

const stored = (() => {
  if (typeof window === "undefined")
    return {
      hi: 0,
      dark: true,
      mode: "SURVIVAL" as GameMode,
      skin: "CANDY" as BlockSkin,
      character: "OWL" as CharacterId,
    };
  const hi = Number(localStorage.getItem("trickyTowers.highScore") || "0");
  const dark = localStorage.getItem("trickyTowers.dark");
  const m = localStorage.getItem("trickyTowers.mode");
  const sk = localStorage.getItem("trickyTowers.blockSkin");
  const ch = localStorage.getItem("trickyTowers.character");
  // ?theme=light|dark overrides the saved preference for that visit.
  const forced = new URLSearchParams(window.location.search).get("theme");
  return {
    hi: isNaN(hi) ? 0 : hi,
    dark: forced ? forced !== "light" : dark === null ? true : dark === "1",
    mode: (m === "ENDLESS" ? "ENDLESS" : "SURVIVAL") as GameMode,
    // Legacy "PREMIUM" (and anything unknown) falls back to CANDY.
    skin: (sk === "CLASSIC" || sk === "GEM" || sk === "JEWEL" || sk === "GLOSSY"
      ? sk
      : "CANDY") as BlockSkin,
    character: (ch === "WIZARD" || ch === "OCTOPUS"
      ? ch
      : "OWL") as CharacterId,
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

  isDark: stored.dark,
  toggleDark: () =>
    set((s) => {
      const next = !s.isDark;
      if (typeof window !== "undefined") {
        localStorage.setItem("trickyTowers.dark", next ? "1" : "0");
        applyDomTheme(next);
      }
      return { isDark: next };
    }),
}));

function applyDomTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", dark ? "#1a0a3d" : "#c8d8f8");
}

if (typeof window !== "undefined") {
  applyDomTheme(stored.dark);
}
