import { FALL_ORDER, SURVIVOR, TILE } from './layout';

export const TILT_DEG = -8;
export const FALL_END = 0.62;
export const FILL_START = 0.66;
const FALL_WINDOW = 0.2;
const FALL_DISTANCE = 9;
const MIX_END = 0.35;

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const easeInCubic = (t: number) => t * t * t;
export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rad = (d: number) => (d * Math.PI) / 180;

export function viewSize(fovDeg: number, distance: number, aspect: number) {
  const h = 2 * distance * Math.tan(rad(fovDeg) / 2);
  return { w: h * aspect, h };
}

const BASE_DISTANCE = 14;
const GRID_SPAN = 4.9; // rotated grid width in world units
const FIT = 0.85;

/** Camera distance: 14 on wide screens; further back on narrow ones so the grid fits 85% of the width. */
export function cameraDistance(fovDeg: number, aspect: number) {
  const needed = GRID_SPAN / FIT / (2 * Math.tan(rad(fovDeg) / 2) * aspect);
  return Math.max(BASE_DISTANCE, needed);
}

/** Where the grid sits in world space: right of the wordmark on wide screens, below it on tall ones. */
export function stageOffset(view: { w: number; h: number }, aspect: number) {
  return aspect >= 1 ? { x: view.w * 0.27, y: 0 } : { x: 0, y: view.h * 0.08 };
}

/** The viewport centre (world 0,0) expressed in the tilted grid's local space. */
export function centerInGrid(offset: { x: number; y: number }, tiltDeg: number) {
  const x = -offset.x;
  const y = -offset.y;
  const t = -rad(tiltDeg);
  return { x: x * Math.cos(t) - y * Math.sin(t), y: x * Math.sin(t) + y * Math.cos(t) };
}

/** Scale at which one tile covers the whole view, with margin for the rotation. */
export function fillScale(view: { w: number; h: number }) {
  return (Math.hypot(view.w, view.h) * 1.1) / TILE;
}

export function backgroundMix(p: number) {
  return clamp01(p / MIX_END);
}

const FILL_FADE_END = 0.8;

/** 0 until the survivor starts to fill, 1 once it covers the screen; fades the lab copy out. */
export function fillMix(p: number) {
  return clamp01((p - FILL_START) / (FILL_FADE_END - FILL_START));
}

export interface TileState {
  x: number;
  y: number;
  rotZ: number;
  opacity: number;
  scale: number;
}

export function tileStateAt(
  index: number,
  progress: number,
  ctx: { base: { x: number; y: number }; center: { x: number; y: number }; fill: number },
): TileState {
  const p = clamp01(progress);
  const { base, center, fill } = ctx;
  if (index === SURVIVOR) {
    const e = easeInOutCubic(clamp01((p - FILL_START) / (1 - FILL_START)));
    return {
      x: lerp(base.x, center.x, e),
      y: lerp(base.y, center.y, e),
      rotZ: e * -rad(TILT_DEG),
      opacity: 1,
      scale: lerp(1, fill, e * e),
    };
  }
  const rank = FALL_ORDER.indexOf(index);
  const start = rank * ((FALL_END - FALL_WINDOW) / (FALL_ORDER.length - 1));
  const local = clamp01((p - start) / FALL_WINDOW);
  const e = easeInCubic(local);
  return {
    x: base.x + e * ((rank % 3) - 1) * 0.6,
    y: base.y - e * FALL_DISTANCE,
    rotZ: e * (rank % 2 ? 0.9 : -0.7) + 0, // "+ 0" turns -0 into 0 so equality checks at rest hold
    opacity: 1 - clamp01((local - 0.35) / 0.65),
    scale: 1,
  };
}
