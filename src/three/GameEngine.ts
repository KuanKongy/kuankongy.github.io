import * as THREE from "three";
import {
  ARENA,
  CAMERA_PLAY,
  PALETTE,
  PALETTE_DAY,
  PALETTE_EVENING,
  PLAYER,
  TETROMINO_KEYS,
  type TetrominoKey,
} from "./constants";
import { PhysicsWorld } from "./physics/PhysicsWorld";
import { buildStaticColliders } from "./physics/StaticColliders";
import { createSky } from "./scene/Sky";
import { createMoon, type MoonHandle } from "./scene/Moon";
import { createSun, type SunHandle } from "./scene/Sun";
import { createStars, type StarsHandle } from "./scene/Stars";
import { createClouds, type CloudsHandle } from "./scene/Clouds";
import { createMountains, type MountainsHandle } from "./scene/Mountains";
import { createMist, type MistHandle } from "./scene/Mist";
import { createCastle, type CastleHandle } from "./scene/Castle";
// VoidFog removed per user request — no ground fog mist near the void.
import {
  createCharacter,
  type CharacterHandle,
} from "./scene/characters";
import { CameraController } from "./gameplay/CameraController";
import { TetrominoManager } from "./gameplay/TetrominoManager";
import { TetrominoFactory } from "./gameplay/TetrominoFactory";
import { InputController } from "./gameplay/InputController";
import { PlayerPiece } from "./gameplay/PlayerPiece";
import { FallingRay } from "./gameplay/FallingRay";
import { ScoreManager } from "./gameplay/ScoreManager";
import { createPostProcessing, type PostHandle } from "./effects/PostProcessing";
import { TrailFx } from "./effects/TrailFx";
import {
  createShootingStars,
  type ShootingStarsHandle,
} from "./scene/ShootingStars";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { setDirector, type SceneDirector } from "./sceneBridge";
import { prefersReducedMotion } from "../lib/motion";
import {
  useGameStore,
  type CharacterId,
  type GamePhase,
  type SceneTime,
} from "../store/gameStore";

export type EngineStatus =
  | { phase: "idle" }
  | { phase: "initializing"; step: string }
  | { phase: "ready" }
  | { phase: "error"; message: string };

function pickRandomKey(): TetrominoKey {
  return TETROMINO_KEYS[Math.floor(Math.random() * TETROMINO_KEYS.length)];
}

export class GameEngine implements SceneDirector {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private clock = new THREE.Clock();

  private pw: PhysicsWorld | null = null;
  private moon: MoonHandle | null = null;
  private sun: SunHandle | null = null;
  private stars: StarsHandle | null = null;
  private clouds: CloudsHandle | null = null;
  private mountains: MountainsHandle | null = null;
  private mist: MistHandle | null = null;
  private castle: CastleHandle | null = null;
  private character: CharacterHandle | null = null;
  private camCtrl: CameraController | null = null;
  private spawner: TetrominoManager | null = null;
  private factory: TetrominoFactory | null = null;
  private input: InputController | null = null;
  private fallingRay: FallingRay | null = null;
  private trailFx: TrailFx | null = null;
  private score: ScoreManager | null = null;
  private playerPiece: PlayerPiece | null = null;
  private post: PostHandle | null = null;

  private skyMesh: THREE.Mesh | null = null;
  private blockEnvMap: THREE.Texture | null = null;
  private hemiLight: THREE.HemisphereLight | null = null;
  private sunLight: THREE.DirectionalLight | null = null;
  private moonLight: THREE.DirectionalLight | null = null;
  private unsubscribeDark: (() => void) | null = null;
  private unsubscribeSkin: (() => void) | null = null;
  private unsubscribeCharacter: (() => void) | null = null;

  private rafId: number | null = null;
  private disposed = false;
  private initPromise: Promise<void> | null = null;
  private status: EngineStatus = { phase: "idle" };
  private statusListeners = new Set<(s: EngineStatus) => void>();

  private unsubscribePhase: (() => void) | null = null;
  private unsubscribePlayerVoid: (() => void) | null = null;
  private currentPhase: GamePhase = "PORTFOLIO";

  private followVec = new THREE.Vector3();

  // Portfolio-only scene director state (scroll moments + cursor repel).
  private shootingStars: ShootingStarsHandle | null = null;
  private pointerNdc = new THREE.Vector2();
  private hasPointer = false;
  private scrollT = 0;
  private starPulse = 0;
  private repelAccum = 0;
  private repelRaycaster = new THREE.Raycaster();
  private repelPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  private repelPoint = new THREE.Vector3();
  private reducedMotion = false;

  private boundResize = () => this.resize();
  private boundVisibility = () => {
    if (!document.hidden) this.clock.start();
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  onStatus(fn: (s: EngineStatus) => void): () => void {
    this.statusListeners.add(fn);
    fn(this.status);
    return () => this.statusListeners.delete(fn);
  }

  private setStatus(s: EngineStatus) {
    this.status = s;
    this.statusListeners.forEach((fn) => fn(s));
  }

  private applyVisualScene(time: SceneTime) {
    if (!this.scene || !this.renderer) return;
    const isNight = time === "NIGHT";
    const sky = isNight
      ? PALETTE
      : time === "DAY"
        ? PALETTE_DAY
        : PALETTE_EVENING;
    this.renderer.setClearColor(sky.skyTop, 1);
    this.scene.background = sky.skyTop.clone();
    // Lower exposure at night so the saturated purple sky doesn't blow out.
    // Day stays restrained (day.png: bluish, real shadows — not blown-out
    // bright); evening runs a touch hotter for the sunset glow.
    this.renderer.toneMappingExposure = isNight
      ? 0.95
      : time === "DAY"
        ? 1.02
        : 1.1;
    if (this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.color.copy(sky.groundFog);
      this.scene.fog.near = isNight ? 100 : 90;
      this.scene.fog.far = isNight ? 320 : 320;
    }
    const skyMat = this.skyMesh?.material as THREE.ShaderMaterial | undefined;
    if (skyMat?.uniforms) {
      skyMat.uniforms.uColorTop.value.copy(sky.skyTop);
      skyMat.uniforms.uColorMid.value.copy(sky.skyMid);
      skyMat.uniforms.uColorLow.value.copy(sky.skyLow);
      skyMat.uniforms.uColorFog.value.copy(sky.groundFog);
      // Nebula mottling is a night-only flourish.
      skyMat.uniforms.uNebulaAmt.value = isNight ? 1.0 : 0.0;
    }
    if (this.hemiLight) {
      // Night: a softer ambient sky-fill so the towers and arena read
      // clearly without flooding the scene like daylight. Day keeps the
      // fill restrained so the sun's shadows stay visible (user: shadows
      // are enormous — the scene shouldn't look like they don't exist).
      this.hemiLight.color.copy(sky.skyMid);
      this.hemiLight.groundColor.copy(sky.groundFog);
      this.hemiLight.intensity = isNight ? 0.45 : time === "DAY" ? 0.85 : 0.95;
    }
    if (this.sunLight) {
      // Strong key light only when the sun is up — near-white at day,
      // warm gold at evening (palette-driven).
      this.sunLight.color.copy(sky.moonGlow);
      this.sunLight.intensity = isNight ? 0.0 : 1.4;
      this.sunLight.castShadow = !isNight;
      this.sunLight.visible = !isNight;
    }
    if (this.moonLight) {
      // Cool key light from the moon's direction at night — bumped a
      // little so the moon visibly "shines" on the towers.
      this.moonLight.intensity = isNight ? 0.7 : 0.0;
      this.moonLight.castShadow = isNight;
      this.moonLight.visible = isNight;
    }
    if (this.moon) this.moon.group.visible = isNight;
    if (this.sun) this.sun.group.visible = !isNight;
    if (this.stars?.points) this.stars.points.visible = isNight;
    // The dark corners are part of the look's charm — full at night,
    // eased slightly (not removed) for the sunlit scenes.
    this.post?.setVignette(isNight ? 0.90 : 0.75);
    this.clouds?.setDayNight(isNight);
    this.mountains?.setDayNight(isNight);
    this.mist?.setDayNight(isNight);
    this.character?.setDayNight(isNight);
  }

  init(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this._init().catch((e) => {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[GameEngine] init error:", e);
      this.setStatus({ phase: "error", message: msg });
      this.teardown();
    });
    return this.initPromise;
  }

  private async _init() {
    this.setStatus({ phase: "initializing", step: "renderer" });
    if (this.disposed) return;

    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;

    const gl =
      this.canvas.getContext("webgl2") || this.canvas.getContext("webgl");
    if (!gl) {
      throw new Error(
        "WebGL is not available in this browser. The 3D scene cannot render.",
      );
    }

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      context: gl as WebGL2RenderingContext,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h, false);
    this.renderer.setClearColor(PALETTE.skyTop, 1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.95;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.canvas.addEventListener(
      "webglcontextlost",
      this.onContextLost as EventListener,
      false,
    );

    this.scene = new THREE.Scene();
    this.scene.background = PALETTE.skyTop;
    this.scene.fog = new THREE.Fog(PALETTE.groundFog.getHex(), 130, 360);

    this.camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 2000);
    this.camera.position.set(0, 18, 55);
    this.camera.lookAt(0, 5, 0);

    this.scene.add(
      (this.hemiLight = new THREE.HemisphereLight(
        PALETTE.skyLow.getHex(),
        PALETTE.groundFog.getHex(),
        0.45,
      )),
    );
    // Day-mode key light (sun). Positioned front-of-scene (+z, camera side)
    // so clouds and mountain faces toward the viewer are sunlit — behind-the-
    // scene light left everything camera-facing in shade and read overcast.
    const sunLight = new THREE.DirectionalLight(PALETTE_DAY.moonGlow.getHex(), 0.0);
    this.sunLight = sunLight;
    sunLight.position.set(-14, 30, 22);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(1024, 1024);
    sunLight.shadow.camera.left = -25;
    sunLight.shadow.camera.right = 25;
    sunLight.shadow.camera.top = 25;
    sunLight.shadow.camera.bottom = -25;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 100;
    sunLight.shadow.bias = -0.0005;
    this.scene.add(sunLight);

    // Dark-mode soft moon light — comes from the moon's direction with a
    // cool, low-intensity tint so the moon visibly illuminates the towers
    // without lighting the rest of the scene like daytime.
    const moonLight = new THREE.DirectionalLight(0xc8d8ff, 0.0);
    this.moonLight = moonLight;
    moonLight.position.set(-6, 22, -10);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.set(1024, 1024);
    moonLight.shadow.camera.left = -22;
    moonLight.shadow.camera.right = 22;
    moonLight.shadow.camera.top = 22;
    moonLight.shadow.camera.bottom = -22;
    moonLight.shadow.camera.near = 0.5;
    moonLight.shadow.camera.far = 80;
    moonLight.shadow.bias = -0.0006;
    this.scene.add(moonLight);

    this.skyMesh = createSky();
    this.scene.add(this.skyMesh);
    this.moon = createMoon();
    this.scene.add(this.moon.group);
    this.sun = createSun();
    this.sun.group.visible = false; // applyVisualScene will toggle correctly
    this.scene.add(this.sun.group);
    this.stars = createStars(900, 110, 60);
    this.scene.add(this.stars.points);
    this.shootingStars = createShootingStars();
    this.scene.add(this.shootingStars.group);
    this.clouds = createClouds(28);
    this.scene.add(this.clouds.group);

    this.mountains = createMountains();
    this.scene.add(this.mountains.group);
    this.mist = createMist();
    this.scene.add(this.mist.group);
    this.castle = createCastle();
    this.scene.add(this.castle.group);
    this.character = createCharacter(useGameStore.getState().character);
    this.scene.add(this.character.group);

    this.renderer.render(this.scene, this.camera);

    this.setStatus({ phase: "initializing", step: "physics" });
    if (this.disposed) return;
    this.pw = await PhysicsWorld.create();
    if (this.disposed) return;

    buildStaticColliders(this.pw, this.castle, this.mountains);

    // Studio environment for the GLOSSY block skin's clearcoat reflections
    // (applied per-material, NOT scene.environment, so nothing else shifts).
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.blockEnvMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    this.factory = new TetrominoFactory(this.blockEnvMap);
    this.trailFx = new TrailFx(this.scene);
    // Ambient (portfolio) trails respect reduced-motion; the player's own
    // trail stays on — it's gameplay feedback, not decoration.
    this.spawner = new TetrominoManager(
      this.scene,
      this.pw,
      this.factory,
      this.trailFx,
      !prefersReducedMotion(),
    );
    this.fallingRay = new FallingRay(this.scene);
    this.score = new ScoreManager();
    this.input = new InputController();

    this.unsubscribePlayerVoid = this.spawner.onPlayerVoid(() => {
      this.score?.onPlayerVoid();
    });

    this.camCtrl = new CameraController(this.camera, this.canvas);

    const enableBloom = window.matchMedia("(min-width: 768px)").matches;
    this.post = createPostProcessing(
      this.renderer,
      this.scene,
      this.camera,
      enableBloom,
    );
    this.post.setSize(w, h);

    // sceneTime is coupled to the theme in the store (NIGHT ⇔ dark), so it
    // is the single source of truth for the scene's look.
    let lastScene = useGameStore.getState().sceneTime;
    this.unsubscribeDark = useGameStore.subscribe((s) => {
      if (s.sceneTime === lastScene) return;
      lastScene = s.sceneTime;
      this.applyVisualScene(s.sceneTime);
    });
    this.applyVisualScene(lastScene);

    let lastSkin = useGameStore.getState().blockSkin;
    this.unsubscribeSkin = useGameStore.subscribe((s) => {
      if (s.blockSkin === lastSkin) return;
      lastSkin = s.blockSkin;
      this.spawner?.reskinAll(s.blockSkin);
    });

    let lastCharacter = useGameStore.getState().character;
    this.unsubscribeCharacter = useGameStore.subscribe((s) => {
      if (s.character === lastCharacter) return;
      lastCharacter = s.character;
      this.swapCharacter(s.character);
    });

    window.addEventListener("resize", this.boundResize);
    document.addEventListener("visibilitychange", this.boundVisibility);

    this.unsubscribePhase = useGameStore.subscribe((s, prev) => {
      if (s.phase !== prev.phase) {
        void this.onPhaseChange(s.phase);
      }
    });
    this.currentPhase = useGameStore.getState().phase;

    this.reducedMotion = prefersReducedMotion();
    setDirector(this);

    this.clock.start();
    this.tick();
    this.setStatus({ phase: "ready" });
  }

  // --- SceneDirector (portfolio DOM → 3D scene) ---------------------------

  setPointer(nx: number, ny: number) {
    this.pointerNdc.set(nx, ny);
    this.hasPointer = true;
  }

  setScrollProgress(t: number) {
    this.scrollT = THREE.MathUtils.clamp(t, 0, 1);
  }

  triggerMoment(name: "projects" | "skills") {
    if (this.currentPhase !== "PORTFOLIO" || this.reducedMotion) return;
    if (name === "projects") {
      this.shootingStars?.burst(3);
    } else {
      // Skills: a slow star-glow swell (3s envelope, applied in tick()).
      this.starPulse = 3;
    }
  }

  /** Cursor-reactive blocks + scroll-linked star glow. PORTFOLIO only. */
  private updatePortfolioEffects(dt: number) {
    this.shootingStars?.update(dt);
    if (this.currentPhase !== "PORTFOLIO") return;

    if (this.stars) {
      if (this.starPulse > 0) this.starPulse = Math.max(0, this.starPulse - dt);
      const pulse =
        this.starPulse > 0 ? Math.sin(Math.PI * (1 - this.starPulse / 3)) : 0;
      this.stars.setBoost(1 + 0.25 * this.scrollT + 0.5 * pulse);
    }

    if (this.hasPointer && !this.reducedMotion && this.camera) {
      this.repelAccum += dt;
      if (this.repelAccum >= 0.12) {
        this.repelAccum = 0;
        this.repelRaycaster.setFromCamera(this.pointerNdc, this.camera);
        if (
          this.repelRaycaster.ray.intersectPlane(this.repelPlane, this.repelPoint)
        ) {
          this.spawner?.applyRepel(this.repelPoint, 7, 2.6);
        }
      }
    }
  }

  private async onPhaseChange(phase: GamePhase) {
    if (this.disposed) return;
    this.currentPhase = phase;

    switch (phase) {
      case "PORTFOLIO":
        useGameStore.getState().clearPendingPlay();
        this.spawner?.setIdleEnabled(true);
        this.playerPiece?.abort();
        this.playerPiece = null;
        this.spawner?.clearAll();
        this.score?.reset();
        this.character?.setCasting(false);
        await this.camCtrl?.tweenTo("PORTFOLIO", 1.2);
        break;
      case "LOBBY_TRANSITION": {
        this.spawner?.setIdleEnabled(false);
        this.spawner?.clearAll();

        // Stop the wizard well short of the arena centre — he hovers off to
        // the side casting, never directly over the play column.
        const arenaCenter = new THREE.Vector3(9, ARENA.platformY + 5, PLAYER.spawnZ + 1);
        this.character?.setCasting(true);
        await Promise.all([
          this.character?.flyTo(arenaCenter, 0.7),
          this.camCtrl?.tweenTo("WAITING", 1.0),
        ]);
        if (useGameStore.getState().phase === "LOBBY_TRANSITION") {
          useGameStore.getState().setPhase("WAITING");
        }
        break;
      }
      case "WAITING":
        this.spawner?.setIdleEnabled(false);
        this.spawner?.clearAll();
        this.score?.reset();
        useGameStore.getState().setNextPieceKey(pickRandomKey());
        this.character?.setCasting(true);
        break;
      case "PLAYING": {
        this.playerPiece?.abort();
        this.playerPiece = null;
        this.spawner?.setIdleEnabled(false);
        this.spawner?.clearAll();
        this.score?.reset();
        useGameStore.getState().setNextPieceKey(pickRandomKey());
        this.character?.setCasting(false);
        void this.character?.flyHome(0.55);
        await this.camCtrl?.tweenTo("PLAY", 0.9);
        if (useGameStore.getState().phase === "PLAYING") {
          this.spawnNextPlayerPiece();
        }
        break;
      }
      case "GAME_OVER":
        this.playerPiece?.abort();
        this.playerPiece = null;
        this.spawner?.setIdleEnabled(false);
        this.character?.setCasting(false);
        break;
    }
  }

  /**
   * Live character swap at the rider's current position. Removing the group
   * from the scene BEFORE dispose matters — dispose() frees GPU resources
   * but does not detach, and a still-attached group would render black.
   */
  private swapCharacter(id: CharacterId) {
    if (!this.scene || !this.character) return;
    const old = this.character;
    const pos = old.group.position.clone();
    this.scene.remove(old.group);
    old.dispose();
    const next = createCharacter(id);
    next.placeAt(pos);
    this.scene.add(next.group);
    next.setDayNight(useGameStore.getState().sceneTime === "NIGHT");
    next.setCasting(
      this.currentPhase === "WAITING" ||
        this.currentPhase === "LOBBY_TRANSITION",
    );
    this.character = next;
  }

  private spawnNextPlayerPiece() {
    if (!this.scene || !this.pw || !this.factory || !this.fallingRay || !this.spawner) return;
    const store = useGameStore.getState();
    const key = store.nextPieceKey ?? pickRandomKey();
    store.setCurrentPieceKey(key);
    store.setNextPieceKey(pickRandomKey());

    const towerTop = Math.max(ARENA.platformY, this.spawner.topPlayerY());
    const spawnY = towerTop + PLAYER.spawnAboveTop;
    // PlayerPiece will snap this to the proper grid for its width parity.
    const spawnX = 0;
    const spawnZ = PLAYER.spawnZ;

    this.playerPiece = new PlayerPiece(
      this.scene,
      this.pw,
      this.factory,
      key,
      this.fallingRay,
      this.trailFx,
      spawnX,
      spawnY,
      spawnZ,
    );
  }

  private onContextLost = (e: Event) => {
    e.preventDefault();
    console.warn("[GameEngine] WebGL context lost");
    this.setStatus({
      phase: "error",
      message: "WebGL context was lost. Reload the page to recover.",
    });
  };

  private resize() {
    if (!this.renderer || !this.camera || !this.post) return;
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.post.setSize(w, h);
  }

  private routeInputs() {
    if (!this.input) return;
    const actions = this.input.drain();
    for (const a of actions) {
      switch (this.currentPhase) {
        case "LOBBY_TRANSITION":
          if (a === "start") {
            useGameStore.getState().queuePendingPlay();
          }
          break;
        case "WAITING":
          if (a === "start") {
            useGameStore.getState().setPhase("PLAYING");
          } else if (a === "quit") {
            useGameStore.getState().setPhase("PORTFOLIO");
          }
          break;
        case "PLAYING":
          if (a === "quit") {
            useGameStore.getState().setPhase("PORTFOLIO");
          } else if (this.playerPiece) {
            this.playerPiece.applyAction(a);
          }
          break;
        case "GAME_OVER":
          if (a === "playAgain" || a === "start") {
            useGameStore.getState().setPhase("PLAYING");
          } else if (a === "quit") {
            useGameStore.getState().setPhase("PORTFOLIO");
          }
          break;
      }
    }
  }

  private updateCameraFollow() {
    if (this.currentPhase !== "PLAYING" || !this.camCtrl || !this.spawner) return;
    const top = Math.max(ARENA.platformY, this.spawner.topPlayerY());
    this.followVec.set(0, top + CAMERA_PLAY.followAbove, PLAYER.spawnZ);
    this.camCtrl.setFollowTarget(this.followVec);
  }

  private tick = () => {
    if (this.disposed) return;
    if (document.hidden) {
      this.rafId = requestAnimationFrame(this.tick);
      return;
    }
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.getElapsedTime();

    this.routeInputs();

    this.pw?.step(dt);
    this.moon?.update(t);
    this.sun?.update(t);
    this.stars?.update(t);
    this.updatePortfolioEffects(dt);
    this.clouds?.update(t);
    this.mist?.update(t);
    this.castle?.update(t);
    this.character?.update(t);
    this.spawner?.update(dt);
    this.trailFx?.update(dt);
    this.updateCameraFollow();
    this.camCtrl?.update();

    if (this.currentPhase === "PLAYING" && this.playerPiece) {
      // A piece that falls past the arena without touching anything is a
      // LOST piece: no lock, no points — SURVIVAL loses a life via the
      // same clustered void logic as collapsing towers.
      if (this.playerPiece.hasFallenOut()) {
        this.playerPiece.abort();
        this.playerPiece = null;
        this.score?.onPlayerVoid();
        if (
          useGameStore.getState().phase === "PLAYING" &&
          useGameStore.getState().lives > 0
        ) {
          this.spawnNextPlayerPiece();
        }
      }
    }

    if (this.currentPhase === "PLAYING" && this.playerPiece && this.input) {
      const lock = this.playerPiece.update(dt, this.input.isSoftDrop());
      if (lock) {
        this.spawner?.registerPlayerLocked({
          group: lock.group,
          body: lock.body,
          colliderHandles: lock.colliderHandles,
          key: lock.key,
        });
        this.score?.onLock({
          flat: lock.flat,
          topY: lock.body.translation().y + 0.5,
        });
        this.playerPiece = null;
        if (
          useGameStore.getState().phase === "PLAYING" &&
          useGameStore.getState().lives > 0
        ) {
          this.spawnNextPlayerPiece();
        }
      }
    }

    if (this.post) {
      this.post.composer.render();
    } else if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
    this.rafId = requestAnimationFrame(this.tick);
  };

  async dispose() {
    if (this.disposed) return;
    this.disposed = true;
    if (this.initPromise) {
      try {
        await this.initPromise;
      } catch {
        // already logged
      }
    }
    this.teardown();
  }

  private teardown() {
    setDirector(null);
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    window.removeEventListener("resize", this.boundResize);
    document.removeEventListener("visibilitychange", this.boundVisibility);
    this.canvas.removeEventListener(
      "webglcontextlost",
      this.onContextLost as EventListener,
    );
    this.unsubscribePhase?.();
    this.unsubscribePhase = null;
    this.unsubscribePlayerVoid?.();
    this.unsubscribePlayerVoid = null;

    this.unsubscribeDark?.();
    this.unsubscribeDark = null;
    this.unsubscribeSkin?.();
    this.unsubscribeSkin = null;
    this.unsubscribeCharacter?.();
    this.unsubscribeCharacter = null;
    this.skyMesh = null;
    this.hemiLight = null;
    this.sunLight = null;
    this.moonLight = null;

    this.input?.dispose();
    this.playerPiece?.abort();
    this.fallingRay?.dispose();
    this.trailFx?.dispose();
    this.trailFx = null;
    this.factory?.dispose();
    this.blockEnvMap?.dispose();
    this.blockEnvMap = null;
    this.camCtrl?.dispose();
    this.spawner?.dispose();
    this.score?.dispose();
    this.post?.dispose();

    this.moon?.dispose();
    this.sun?.dispose();
    this.stars?.dispose();
    this.shootingStars?.dispose();
    this.shootingStars = null;
    this.clouds?.dispose();
    this.mountains?.dispose();
    this.mist?.dispose();
    this.castle?.dispose();
    this.character?.dispose();

    this.scene?.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const m = mesh.material;
      if (m) {
        if (Array.isArray(m)) m.forEach((mm) => mm.dispose());
        else (m as THREE.Material).dispose();
      }
    });

    this.pw?.dispose();
    this.renderer?.dispose();
    this.renderer?.forceContextLoss?.();

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.pw = null;
    this.moon = null;
    this.sun = null;
    this.stars = null;
    this.clouds = null;
    this.mountains = null;
    this.mist = null;
    this.castle = null;
    this.character = null;
    this.camCtrl = null;
    this.spawner = null;
    this.factory = null;
    this.input = null;
    this.playerPiece = null;
    this.fallingRay = null;
    this.score = null;
    this.post = null;
    this.statusListeners.clear();
  }
}
