# Portfolio

My portfolio [kuankongy.github.io](https://kuankongy.github.io) with an interactive 3D background you can step into and play.

Behind the glass is a nod to [Tricky Towers](https://www.trickytowers.com/): tetris with physics. Full game: [kuankongy.github.io/Tricky3DTowers](https://kuankongy.github.io/Tricky3DTowers/).

## Why this game

My first real project was a Multiplayer Tetris. And it just resonates a lot with me, shows how I've always worked like, developed, by stacking different blocks.

This was how I learned frontend for the first time, and when I wanted to have a more special portfolio, it was pretty clear what to add.

The game is a metaphor I keep coming back to in software:

> You need precision. You need to know where to put what. When to cut corners — and when you absolutely cannot — so you can keep building up without making the tower fall.

Same instinct. Different medium.

---

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:5173/`. **Hard refresh once after pulling** (`⌘⇧R` in Chrome, `⌘⌥E → ⌘R` in Safari) to bust any stale Vite HMR cache from a previous slice.

| Script              | Purpose                                  |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Vite dev server                          |
| `npm run build`     | Type-check + production build to `dist/` |
| `npm run preview`   | Preview the production build             |
| `npm run typecheck` | TypeScript only                          |

---

## Stack

- **Vite 5** + **React 18** + **TypeScript 5**
- **three** ^0.163 (WebGLRenderer, EffectComposer, ShaderMaterial, post-processing)
- **@dimforge/rapier3d-compat** ^0.14 (WASM physics, fixed timestep, void sensor, kinematic + dynamic bodies)
- **gsap** ^3.12 for camera mode transitions
- **zustand** ^4.5 for UI/game state
- **Tailwind CSS** ^3.4 for the frosted-glass overlay
- **react-icons** / **react-scroll** / **@heroicons/react** for the ported portfolio UI

---

## What's shipped

### Phase state machine

```
PORTFOLIO ──[Play btn]──► LOBBY_TRANSITION ──[camera tween]──► WAITING
                                                                 │
                                              [Space / click Start]
                                                                 ▼
                                                              PLAYING
                                                                 │
                                                       [lives = 0]
                                                                 ▼
                                                            GAME_OVER
                                                                 │
                                            ┌────────────────────┴───────────┐
                                            ▼                                ▼
                                        WAITING (Play Again)           PORTFOLIO (Quit)
```

The phase lives in `src/store/gameStore.ts` (Zustand). React drives it from button clicks; the `GameEngine` subscribes via `useGameStore.subscribe` and reacts (camera tweens, spawning the player piece, etc.) without any React-side coupling on the engine.

### The 3D background (`src/three/scene/`)

- Inverted sky sphere with a custom GLSL gradient (deep purple → violet → bright purple)
- Crescent moon (`ShapeGeometry` minus offset hole) + additive sprite glow, bobbing
- ~110-vertex `Points` star field, one draw call, twinkling via `sin(time + aPhase)`
- 7 sphere-cluster cloud groups drifting on X
- One flat-topped truncated-cone arena mountain + four `LatheGeometry` side mountains with snow caps and pine billboards
- Procedural castle: brick-textured walls (canvas-generated brick map), red battlements, glowing emissive windows, a side ladder, a 4×4 platform with a pulsing green/yellow diamond border `ShaderMaterial`, and a canvas-drawn skull decal on the front gate
- Lavender void fog plane with UV scroll
- Post-processing: `RenderPass → UnrealBloomPass → Vignette ShaderPass → OutputPass` (bloom auto-disables below 768 px width)

### Physics (`src/three/physics/`)

- Rapier `World({0, -12, 0})` with a fixed-timestep accumulator (1/60 cap, max 4 catch-up steps per frame)
- Static `Cuboid` for the platform top + `convexHull` colliders generated from each mountain's local geometry vertices
- Void sensor `Cuboid(200,1,200)` at `y=-20` with intersection callbacks; pieces are auto-removed when they fall through

### Idle tetromino rain (`src/three/gameplay/TetrominoManager.ts`)

- All 7 piece definitions and the spec's saturated colors
- Each piece is a `Group` of 4 `BoxGeometry(0.9)` `MeshToonMaterial` blocks plus a back-side outline child at scale 1.06 (cartoon rim trick from spec §5.2). Emissive at 35 %.
- One Rapier `Dynamic` body per piece, with 4 `Cuboid(0.45)` colliders at the cell offsets
- **Mobile-aware**: under 768 px, spawn cadence is 4–6 s and body cap is 30; desktop is 2–3 s and 60. Idle rain is paused outside `PORTFOLIO`.
- **Void cleanup distinguishes player vs idle pieces** — only locked player pieces falling through the void cost a life.

### Player gameplay (`src/three/gameplay/`)

| Module                  | Role                                                                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `TetrominoFactory.ts`   | Shared geo/material cache used by both the idle spawner and the player piece — visuals stay identical.                                    |
| `InputController.ts`    | Keyboard adapter with a buffered action queue + held-key set; supports DAS-style auto-repeat for left/right (220 ms initial, 80 ms tick). |
| `PlayerPiece.ts`        | Kinematic Rapier body that the player drives. Half-block lateral steps (0.5 u), 90° Y-rotation tween (~150 ms easeOutQuad), soft-drop ×4, hard-drop teleport via `world.castRay`. Locks on first downward contact (raycast within `contactThreshold`) by recreating itself as a `Dynamic` body at the same pose and handing ownership to the spawner. |
| `FallingRay.ts`         | Translucent additive cylinder previewing the landing path of the active piece, recoloured per tetromino key. Hidden when no hit.          |
| `ScoreManager.ts`       | Bridges Rapier events into the Zustand store: +10 on lock, +25 flat-landing bonus, +50 every 5 stacked, −1 life on player-piece void.     |
| `CameraController.ts`   | Spherical-coordinate orbit around the arena. Mouse drives target `azimuth`/`polar` clamped to ±30° / 10–40°, lerped at 6 % per frame for the spec's "damped" feel; **GSAP timelines tween `radius` + `target` between PORTFOLIO/WAITING/PLAY modes (~1.2 s)**, lerp doubles to 18 % during transitions for snap. |

### Controls

| Key       | Action                                            |
| --------- | ------------------------------------------------- |
| ←/→       | Move 0.5 unit; auto-repeat after holding 0.22 s   |
| ↑         | Rotate 90° clockwise around Y, smoothly tweened   |
| ↓         | Soft drop (×4 fall speed)                         |
| Space     | Hard drop in PLAYING; Start in WAITING / GAME_OVER |
| Q / Esc   | Quit back to PORTFOLIO                            |
| Enter / R | Play Again from GAME_OVER                         |
| Mouse     | Camera wobble (always; subtler in WAITING/PLAY)   |

### React UI

```
<App>
  ├── <ThreeCanvas />        z-0  fixed canvas + visible error overlay
  ├── <NavBar />             z-30 (PORTFOLIO only)
  ├── <PortfolioOverlay />   z-10 fades to opacity 0 + pointer-events:none outside PORTFOLIO
  ├── <LobbyOverlay />       z-30 visible during LOBBY_TRANSITION + WAITING
  ├── <GameHUD />            z-20 visible during PLAYING + GAME_OVER
  └── <GameOverCard />       z-30 visible during GAME_OVER
</App>
```

- `LobbyOverlay` = arcade-style title card with a controls cheat-sheet, hi-score / next-piece status, big "Press Space or click START" button, and a Quit button.
- `GameHUD` = SCORE (5-digit arcade font), height + pieces stats, 3 hearts for lives, NEXT piece preview rendered from the same cell coords.
- `GameOverCard` = "Tower Toppled" stat block (score / height / pieces) with **NEW HIGH SCORE!** when applicable, plus Play Again and Back-to-Portfolio buttons.

### Belt-and-braces fallbacks

- `<html>`, `<body>`, and `#root` all carry inline `background-color: #06030f` so a transient "white flash" can never appear on first paint, even on Safari/Chrome with WebGL slow to initialize.
- The canvas itself has a deep-purple radial gradient as its CSS `background` — if WebGL ever fails completely, you see purple, not white.
- StrictMode-safe engine lifecycle: `init()` is memoized as `initPromise`, every `await` boundary checks `disposed`, and `dispose()` awaits the in-flight init before tearing down. The `<ThreeCanvas>` mount also defers engine instantiation by one tick so the StrictMode mount→unmount→mount cycle in dev never traps a half-initialized renderer on the canvas.
- A `webglcontextlost` handler surfaces a frosted error card instead of a blank scene.

---

## File layout

```
src/
├── App.tsx                       # mounts ThreeCanvas + NavBar + PortfolioOverlay + LobbyOverlay + GameHUD + GameOverCard
├── main.tsx
├── vite-env.d.ts
├── styles/globals.css            # Tailwind + .frosted + .play-btn + typing keyframes
├── store/gameStore.ts            # phase, score, lives, height, lockedCount, current/nextPieceKey, highScore (LS)
├── three/
│   ├── GameEngine.ts             # orchestrator: init/dispose, tick, phase subscription, gameplay loop
│   ├── constants.ts              # PALETTE, TETROMINOES, CAMERA_MODES, PLAYER, PLAY_TUNING
│   ├── scene/                    # Sky, Moon, Stars, Clouds, VoidFog, Mountains, Castle
│   ├── physics/                  # PhysicsWorld, StaticColliders
│   ├── gameplay/                 # CameraController, TetrominoFactory, TetrominoManager,
│   │                             # InputController, PlayerPiece, FallingRay, ScoreManager
│   └── effects/PostProcessing.ts
└── components/
    ├── ThreeCanvas.tsx           # canvas + StrictMode-deferred engine + error overlay
    ├── NavBar.tsx
    ├── PortfolioOverlay.tsx      # fades on phase
    ├── LobbyOverlay.tsx          # WAITING / LOBBY_TRANSITION
    ├── GameHUD.tsx               # PLAYING + GAME_OVER
    ├── GameOverCard.tsx          # GAME_OVER
    └── sections/                 # Hero, About, Languages, Experiences, Projects, Contact, Footer
```

---

## Deferred to next slice

| Spec section | Deferred feature                                                  |
| ------------ | ----------------------------------------------------------------- |
| §8           | **Wizard mascot** (idle bob + conjure animation + pre-game arc)   |
| §11          | **Audio** (Howler ambient loop, land/rotate/void/game-over SFX)   |
| §5.2         | **Particle dissolve** on void-hit (currently piece is just removed) |
| §10 detail   | **Per-contact tilt re-evaluation for the flat bonus** (slice B awards the bonus at lock-time, before any post-lock toppling) |
| §4.4         | **Per-contact lateral nudge for blocks resting on side mountains** |
| §5.3 detail  | **Side-mountain block-spawn flourishes** (wizard "burst-of-pieces") |
| §12 deep     | **Aged-body culling beyond the 60-piece cap** (heuristic is currently FIFO) |
| §7 polish    | Crossfade portfolio HTML during PLAY (currently fades opacity only) |

The interactive game loop is **complete and playable end-to-end**: PORTFOLIO → Play btn → LOBBY → WAITING (Space) → PLAYING (arrows / soft+hard drop / rotate, with falling-ray indicator and toon-shaded pieces) → lock → score → next piece → eventually pieces topple → lives drop → GAME_OVER (with high score saved to `localStorage`) → Play Again or Back to Portfolio.

---

## Reference

- Visual style guide: `survival-full.png`.
- Original portfolio source: [`KuanKongy/Portfolio`](https://github.com/KuanKongyPortfolio).

---

## Adding project media (screenshots & videos)

Media is auto-discovered from `src/assets/projects/<slug>/` — drop files in, no code changes needed:

```
src/assets/projects/<slug>/
  cover.webp            ← card image (falls back to 01.*)
  01.webp, 02.webp, …   ← modal gallery, sorted by filename
  demo.mp4              ← optional; if present it plays FIRST in the modal
```

Slugs: `tricky-towers-3d`, `onboardbuddy`, `studyflow`, `floowforge`, `ubcpss`,
`feathersmcp`, `courseinsights`, `deeprecall`, `multiplayer-tetris`, `skribbl`,
`geoshopper`, `pokedex`, `portfolio`.

- WebP preferred; png/jpg also work. For full-page screenshots, cap the width
  and lean on quality so text stays crisp: `cwebp -resize 1920 0 -q 88 in.png -o out.webp`
  (each lands ~40–90 KB). Drop `-resize` for smaller source images.
- Keep local videos under ~10 MB — long demos should stay on YouTube
  (set `youtubeId` in `src/data/projects.ts` instead; a local `demo.mp4` wins
  over YouTube if both exist).
- Content lives in `src/data/` (`projects.ts`, `experience.ts`, `skills.ts`) —
  render order is array order, so reordering is a data edit.
