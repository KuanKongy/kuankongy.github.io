import * as THREE from "three";
import gsap from "gsap";
import { CAMERA_MODES, CAMERA_PLAY } from "../constants";

type Mode = keyof typeof CAMERA_MODES;

/**
 * Spherical-orbit camera with three "modes" (PORTFOLIO/WAITING/PLAY) tweened
 * via GSAP, manual click-and-drag rotation, mouse-wheel zoom in WAITING/PLAY,
 * and an optional follow-target so the camera anchors to the highest locked
 * piece while playing.
 */
export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private dom: HTMLElement;

  private azimuthDeg = 0;
  private polarDeg = 25;
  private radius = 38;
  private target = new THREE.Vector3(0, 5, 0);

  private anchor = new THREE.Vector3(0, 5, 0);
  private followAnchor = false;

  private mode: Mode = "PORTFOLIO";
  private currentPos = new THREE.Vector3();

  private tween: gsap.core.Timeline | null = null;

  private dragging = false;
  private lastMouse = new THREE.Vector2();
  private dragSensitivity = 0.35;
  /** Distance between the two fingers of an active pinch (0 = no pinch). */
  private pinchDist = 0;

  private hoverNorm = new THREE.Vector2(0, 0);

  private boundDown = (e: MouseEvent) => this.onMouseDown(e);
  private boundUp = () => this.onMouseUp();
  private boundMove = (e: MouseEvent) => this.onMouseMove(e);
  private boundWheel = (e: WheelEvent) => this.onWheel(e);
  private boundContext = (e: MouseEvent) => e.preventDefault();
  private boundTouchStart = (e: TouchEvent) => this.onTouchStart(e);
  private boundTouchMove = (e: TouchEvent) => this.onTouchMove(e);
  private boundTouchEnd = (e: TouchEvent) => this.onTouchEnd(e);

  constructor(camera: THREE.PerspectiveCamera, dom: HTMLElement) {
    this.camera = camera;
    this.dom = dom;
    this.applyMode("PORTFOLIO");
    this.currentPos.copy(camera.position);
    dom.addEventListener("mousedown", this.boundDown);
    window.addEventListener("mousemove", this.boundMove);
    window.addEventListener("mouseup", this.boundUp);
    window.addEventListener("wheel", this.boundWheel, { passive: false });
    dom.addEventListener("contextmenu", this.boundContext);
    // Touch: one finger orbits, two fingers pinch-zoom. In PORTFOLIO the
    // canvas is pointer-events-none, so these only fire in game phases.
    dom.addEventListener("touchstart", this.boundTouchStart, {
      passive: true,
    });
    dom.addEventListener("touchmove", this.boundTouchMove, {
      passive: false,
    });
    dom.addEventListener("touchend", this.boundTouchEnd);
    dom.addEventListener("touchcancel", this.boundTouchEnd);
  }

  applyMode(mode: Mode) {
    this.mode = mode;
    const m = CAMERA_MODES[mode];
    this.target.copy(m.target);
    this.anchor.copy(m.target);
    this.radius = m.radius;
    this.polarDeg = m.polar;
    this.azimuthDeg = m.azimuth;
    this.followAnchor = mode === "PLAY";
  }

  async tweenTo(mode: Mode, seconds = 1.2): Promise<void> {
    this.tween?.kill();
    this.mode = mode;
    const m = CAMERA_MODES[mode];
    this.followAnchor = mode === "PLAY";
    this.anchor.copy(m.target);
    return new Promise((resolve) => {
      this.tween = gsap.timeline({
        onComplete: () => {
          this.tween = null;
          resolve();
        },
      });
      this.tween.to(this, {
        radius: m.radius,
        polarDeg: m.polar,
        azimuthDeg: m.azimuth,
        duration: seconds,
        ease: "power2.inOut",
      }, 0);
      this.tween.to(this.target, {
        x: m.target.x,
        y: m.target.y,
        z: m.target.z,
        duration: seconds,
        ease: "power2.inOut",
      }, 0);
    });
  }

  setFollowTarget(p: THREE.Vector3) {
    this.anchor.copy(p);
  }

  setHoverNorm(x: number, y: number) {
    this.hoverNorm.set(x, y);
  }

  isMode(mode: Mode): boolean {
    return this.mode === mode;
  }

  private onMouseDown(e: MouseEvent) {
    if (e.button !== 0) return;
    this.dragging = true;
    this.lastMouse.set(e.clientX, e.clientY);
    this.dom.style.cursor = "grabbing";
  }

  private onMouseUp() {
    if (!this.dragging) return;
    this.dragging = false;
    this.dom.style.cursor = "";
  }

  private onMouseMove(e: MouseEvent) {
    if (this.dragging) {
      const dx = e.clientX - this.lastMouse.x;
      const dy = e.clientY - this.lastMouse.y;
      this.lastMouse.set(e.clientX, e.clientY);
      this.azimuthDeg = THREE.MathUtils.clamp(
        this.azimuthDeg + dx * this.dragSensitivity,
        -45,
        45,
      );
      this.polarDeg = THREE.MathUtils.clamp(
        this.polarDeg - dy * this.dragSensitivity,
        5,
        65,
      );
    } else {
      const rect = this.dom.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      this.hoverNorm.set(nx, ny);
    }
  }

  private touchDist(e: TouchEvent): number {
    const a = e.touches[0];
    const b = e.touches[1];
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }

  private onTouchStart(e: TouchEvent) {
    if (e.touches.length === 1) {
      this.dragging = true;
      this.lastMouse.set(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 2) {
      this.dragging = false;
      this.pinchDist = this.touchDist(e);
    }
  }

  private onTouchMove(e: TouchEvent) {
    // The camera owns this gesture — keep the browser from turning it into
    // scrolling or a navigation swipe.
    e.preventDefault();
    if (e.touches.length === 1 && this.dragging) {
      const t = e.touches[0];
      const dx = t.clientX - this.lastMouse.x;
      const dy = t.clientY - this.lastMouse.y;
      this.lastMouse.set(t.clientX, t.clientY);
      this.azimuthDeg = THREE.MathUtils.clamp(
        this.azimuthDeg + dx * this.dragSensitivity,
        -45,
        45,
      );
      this.polarDeg = THREE.MathUtils.clamp(
        this.polarDeg - dy * this.dragSensitivity,
        5,
        65,
      );
    } else if (e.touches.length === 2) {
      const d = this.touchDist(e);
      if (this.pinchDist > 0 && d > 0 && this.mode !== "PORTFOLIO") {
        // Fingers apart = zoom in (smaller radius), together = out.
        this.radius = THREE.MathUtils.clamp(
          (this.radius * this.pinchDist) / d,
          CAMERA_PLAY.zoomMin,
          CAMERA_PLAY.zoomMax,
        );
      }
      this.pinchDist = d;
    }
  }

  private onTouchEnd(e: TouchEvent) {
    if (e.touches.length === 0) {
      this.dragging = false;
      this.pinchDist = 0;
    } else if (e.touches.length === 1) {
      // Pinch ended with one finger still down — resume orbiting from it.
      this.pinchDist = 0;
      this.dragging = true;
      this.lastMouse.set(e.touches[0].clientX, e.touches[0].clientY);
    }
  }

  private onWheel(e: WheelEvent) {
    if (this.mode === "PORTFOLIO") return;
    // Snap zoom — high sensitivity, near-instant. Each wheel "tick" moves
    // the orbit radius by a healthy chunk so a single scroll noticeably
    // zooms in/out instead of drifting toward the target.
    const norm = e.deltaMode === 0 ? e.deltaY / 100 : e.deltaY;
    const delta = THREE.MathUtils.clamp(norm, -3, 3) * 20;
    this.radius = THREE.MathUtils.clamp(
      this.radius + delta,
      CAMERA_PLAY.zoomMin,
      CAMERA_PLAY.zoomMax,
    );
    e.preventDefault();
  }

  update() {
    let azTarget = this.azimuthDeg;
    let polTarget = this.polarDeg;
    if (this.mode === "PORTFOLIO" && !this.dragging && !this.tween) {
      azTarget = THREE.MathUtils.clamp(this.hoverNorm.x * 18, -30, 30);
      polTarget = THREE.MathUtils.clamp(25 - this.hoverNorm.y * 12, 10, 40);
      this.azimuthDeg = THREE.MathUtils.lerp(this.azimuthDeg, azTarget, 0.06);
      this.polarDeg = THREE.MathUtils.lerp(this.polarDeg, polTarget, 0.06);
    }

    if (this.followAnchor && !this.tween) {
      this.target.lerp(this.anchor, 0.12);
    }

    const az = THREE.MathUtils.degToRad(this.azimuthDeg);
    const pol = THREE.MathUtils.degToRad(this.polarDeg);

    const x = this.radius * Math.cos(pol) * Math.sin(az);
    const y = this.radius * Math.sin(pol);
    const z = this.radius * Math.cos(pol) * Math.cos(az);

    const desired = new THREE.Vector3(x, y, z).add(this.target);
    if (this.tween) {
      // During mode tweens, gsap drives radius/polar/azimuth — let the
      // resulting camera position track them tightly so the tween animation
      // dominates.
      this.currentPos.lerp(desired, 0.5);
    } else {
      // Outside tweens, snap so wheel-zoom is instant.
      this.currentPos.copy(desired);
    }
    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.target);
  }

  dispose() {
    this.tween?.kill();
    this.tween = null;
    this.dom.removeEventListener("mousedown", this.boundDown);
    this.dom.removeEventListener("contextmenu", this.boundContext);
    window.removeEventListener("wheel", this.boundWheel);
    window.removeEventListener("mousemove", this.boundMove);
    window.removeEventListener("mouseup", this.boundUp);
    this.dom.removeEventListener("touchstart", this.boundTouchStart);
    this.dom.removeEventListener("touchmove", this.boundTouchMove);
    this.dom.removeEventListener("touchend", this.boundTouchEnd);
    this.dom.removeEventListener("touchcancel", this.boundTouchEnd);
    this.dom.style.cursor = "";
  }
}
