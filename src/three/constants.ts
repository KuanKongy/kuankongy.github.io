import * as THREE from "three";

/**
 * Night palette — lighter saturated purples (closer to survival-full.png).
 */
export const PALETTE = {
  // Survival-purple, gradually darkened a few notches from the brighter
  // reference so the night reads as a deeper purple while keeping the same
  // hue family.
  skyTop: new THREE.Color("#22104a"),
  skyMid: new THREE.Color("#3e2080"),
  skyLow: new THREE.Color("#583aa0"),
  groundFog: new THREE.Color("#7c5ab2"),
  /** Used by stand-alone mist meshes (currently unused — kept for future). */
  mistColor: new THREE.Color("#a08bc4"),
  moon: new THREE.Color("#fbe88a"),
  moonGlow: new THREE.Color("#fff0c8"),
  cloudDark: new THREE.Color("#3e2670"),
  cloudMid: new THREE.Color("#604394"),
  cloudLight: new THREE.Color("#8669b8"),
  mountainDark: new THREE.Color("#231454"),
  mountainMid: new THREE.Color("#3a2076"),
  mountainFront: new THREE.Color("#5538a0"),
  mountainPeakGreen: new THREE.Color("#4a8a5e"),
  mountainPeakSnow: new THREE.Color("#e8d8f0"),
  pineGray: new THREE.Color("#5a4a78"),
  star: new THREE.Color("#ffffff"),
  castleStone: new THREE.Color("#b8bcc6"),
  castleStoneDark: new THREE.Color("#8a8e98"),
  castleGrout: new THREE.Color("#5e616b"),
  castleAccent: new THREE.Color("#c83040"),
  castleAccentDark: new THREE.Color("#8a1a26"),
  castleBase: new THREE.Color("#7e5a40"),
  castleWindow: new THREE.Color("#ff9933"),
  castleSkullBg: new THREE.Color("#160830"),
  platformBorderA: new THREE.Color("#c62828"),
  platformBorderB: new THREE.Color("#ff6b6b"),
  pine: new THREE.Color("#3f8b5a"),
  /** Owl mascot — deep teal robe + deeper cyan hat, per user request. */
  wizardHat: new THREE.Color("#1f6f86"),
  wizardRobe: new THREE.Color("#3fa8ba"),
  wizardSkin: new THREE.Color("#f6c9a3"),
  wizardCloud: new THREE.Color("#f4f0ff"),
  wizardStar: new THREE.Color("#ffe14a"),
  owlBeak: new THREE.Color("#f0a030"),
  owlWing: new THREE.Color("#4fc0d2"),
  owlChest: new THREE.Color("#d8f4f8"),
  hatBand: new THREE.Color("#ffd34d"),
  /** Classic Tricky-Towers-style wizard. */
  wizClassicRobe: new THREE.Color("#6d4fc4"),
  wizClassicHat: new THREE.Color("#3d2a8f"),
  /** Octopus-in-a-suit homage. */
  octoSkin: new THREE.Color("#f5a03c"),
  octoSuit: new THREE.Color("#2e5fbf"),
  octoTie: new THREE.Color("#d8352c"),
} as const;

/**
 * DAY sky — the ORIGINAL cool blues (user: keep exactly these; the warm
 * cream-horizon variant lives in PALETTE_EVENING only). Default scene for
 * the light theme.
 */
export const PALETTE_DAY = {
  skyTop: new THREE.Color("#b8d4f8"),
  skyMid: new THREE.Color("#6ba8e8"),
  skyLow: new THREE.Color("#4a8ad4"),
  groundFog: new THREE.Color("#9ec5ea"),
  moon: new THREE.Color("#fff8e0"),
  moonGlow: new THREE.Color("#ffffff"),
} as const;

/**
 * EVENING sky — a proper Tricky-Towers sunset (evening.png reference):
 * pale gold zenith through warm gold to a dusty orange horizon and haze,
 * golden sun light. Only shown when the user picks EVENING.
 */
export const PALETTE_EVENING = {
  // Sunset ramp runs BRIGHT AT THE HORIZON, dark overhead. skyMid is what
  // covers most of the visible upper sky, so it carries the strong orange
  // (user: orange must start at mountain level, not just near the zenith)
  // and the horizon glow stays golden-orange, not white.
  skyTop: new THREE.Color("#c96a3c"),
  skyMid: new THREE.Color("#de8752"),
  skyLow: new THREE.Color("#f6bd7d"),
  groundFog: new THREE.Color("#f0b070"),
  moon: new THREE.Color("#fff8e0"),
  moonGlow: new THREE.Color("#ffd898"),
} as const;

/**
 * Cell layouts. Coordinates are [x, y, z]. The TetrominoFactory builds each
 * piece around the BBOX center of these cells so every cell ends up on the
 * half-integer grid relative to the piece's pivot — which keeps the world
 * positions of all cells aligned with the castle's column centers.
 *
 * For J / L the user wanted the "extra" block on the bottom to swap sides:
 *   J (blue)   – extra block on the RIGHT  → bottom-right + top row of three
 *   L (yellow) – extra block on the LEFT   → bottom-left  + top row of three
 */
export const TETROMINOES = {
  I: [
    [0, 0, 0],
    [1, 0, 0],
    [2, 0, 0],
    [3, 0, 0],
  ],
  O: [
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
    [1, 1, 0],
  ],
  T: [
    [0, 0, 0],
    [1, 0, 0],
    [2, 0, 0],
    [1, 1, 0],
  ],
  S: [
    [1, 0, 0],
    [2, 0, 0],
    [0, 1, 0],
    [1, 1, 0],
  ],
  Z: [
    [0, 0, 0],
    [1, 0, 0],
    [1, 1, 0],
    [2, 1, 0],
  ],
  J: [
    [2, 0, 0],
    [0, 1, 0],
    [1, 1, 0],
    [2, 1, 0],
  ],
  L: [
    [0, 0, 0],
    [0, 1, 0],
    [1, 1, 0],
    [2, 1, 0],
  ],
} as const;

export type TetrominoKey = keyof typeof TETROMINOES;

// I / Z / L are deliberately far apart in hue+brightness — the old red /
// dark-orange / amber triplet blurred together against the night sky.
export const TETROMINO_COLORS: Record<TetrominoKey, string> = {
  I: "#ff3b30", // vivid red
  S: "#26c6da", // cyan
  J: "#1e88e5", // blue
  L: "#ffd60a", // clear yellow
  Z: "#ff700a", // deep orange — #ff8c1a washed toward yellow once the skin bakes brightened it
  O: "#8e24aa", // purple
  T: "#43a047", // green
};

export const TETROMINO_KEYS = Object.keys(TETROMINOES) as TetrominoKey[];

export const PHYSICS = {
  gravity: { x: 0, y: -16, z: 0 },
  fixedStep: 1 / 60,
  voidY: -20,
  maxBodies: 60,
} as const;

/**
 * Square castle: 6×6 cell footprint. The play deck (where blocks fall) is
 * wider than the castle body so pieces can drift left/right beyond the
 * castle's solid top.
 */
export const ARENA = {
  /** Y of the castle's TOP face (where pieces rest). */
  platformY: 8,
  /** Castle body footprint in X (3 → 6 cells wide). */
  platformHalfWidth: 3,
  /** Castle body footprint in Z (3 → 6 cells deep). */
  platformHalfDepth: 3,
  /** Wider stacking deck — movement clamp + extended floor collider. */
  playfieldHalfWidth: 8,
  platformThickness: 0.35,
  /** Height of the visible castle wall below the platform top. */
  castleWallHeight: 4.5,
  /** Spire dimensions — thin column descending into the void. */
  spireTopRadius: 1.9,
  spireBottomRadius: 0.6,
  spireHeight: 14,
} as const;

export const CAMERA_MODES = {
  PORTFOLIO: { radius: 38, polar: 25, azimuth: 0, target: new THREE.Vector3(0, 5, 0) },
  WAITING: { radius: 26, polar: 26, azimuth: 0, target: new THREE.Vector3(0, 9, ARENA.platformHalfDepth - 0.5) },
  PLAY: { radius: 18, polar: 22, azimuth: 0, target: new THREE.Vector3(0, 11, ARENA.platformHalfDepth - 0.5) },
} as const;

export const PLAYER = {
  /** How far above the current tower top a new piece spawns. */
  spawnAboveTop: 11,
  /**
   * Z plane the play area lives on — the front rail strip itself, so pieces
   * fall on top of the rails (and stack against them).
   */
  spawnZ: ARENA.platformHalfDepth - 0.5,
  fallSpeed: 2.2,
  softDropMultiplier: 4.5,
  /** Movement step in cells. 0.5 = half-block columns. */
  moveStep: 0.5,
  rotateMs: 130,
  /** Lock the piece when any cell is within this distance of a surface. */
  contactThreshold: 0.05,
  settleSeconds: 0.6,
  cell: 1.0,
  loseY: -8,
} as const;

export const CAMERA_PLAY = {
  followAbove: 4.5,
  zoomMin: 11,
  zoomMax: 42,
} as const;

export const PLAY_TUNING = {
  idleSpawnMin: 2,
  idleSpawnMax: 3,
  mobileSpawnMin: 4,
  mobileSpawnMax: 6,
  mobileBodyCap: 30,
} as const;

export const SCORING = {
  voidClusterMs: 2000,
} as const;

/** Cloud-rider mascot (owl / wizard / octopus) home perch + idle bob. */
export const CHARACTER = {
  position: new THREE.Vector3(15, 11, -2),
  bobAmplitude: 0.6,
  bobPeriod: 4.0,
} as const;
