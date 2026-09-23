import { describe, expect, it } from 'vitest';
import { FALL_ORDER, SURVIVOR, gridPositions } from '../../src/scene/layout';
import {
  FALL_END,
  FILL_START,
  TILT_DEG,
  backgroundMix,
  cameraDistance,
  fillMix,
  centerInGrid,
  fillScale,
  stageOffset,
  tileStateAt,
  viewSize,
} from '../../src/scene/timeline';

const view = viewSize(30, 14, 16 / 9);
const offset = stageOffset(view, 16 / 9);
const center = centerInGrid(offset, TILT_DEG);
const fill = fillScale(view);
const base = gridPositions();
const at = (i: number, p: number) => tileStateAt(i, p, { base: base[i], center, fill });

describe('timeline', () => {
  it('at progress 0 every tile rests at its base, opaque, unscaled', () => {
    for (let i = 0; i < 12; i++) {
      expect(at(i, 0)).toMatchObject({ x: base[i].x, y: base[i].y, rotZ: 0, opacity: 1, scale: 1 });
    }
  });
  it('by FALL_END every non-survivor has fallen out of view and faded', () => {
    for (const i of FALL_ORDER) {
      const s = at(i, FALL_END);
      expect(s.opacity).toBe(0);
      expect(s.y).toBeLessThan(base[i].y - 8);
    }
  });
  it('tiles fall in FALL_ORDER sequence', () => {
    const first = FALL_ORDER[0];
    const last = FALL_ORDER[FALL_ORDER.length - 1];
    expect(at(first, 0.1).y).toBeLessThan(base[first].y);
    expect(at(last, 0.1).y).toBe(base[last].y);
  });
  it('survivor holds still until FILL_START, then reaches centre at full scale', () => {
    expect(at(SURVIVOR, FILL_START)).toMatchObject({
      x: base[SURVIVOR].x,
      y: base[SURVIVOR].y,
      scale: 1,
    });
    const end = at(SURVIVOR, 1);
    expect(end.x).toBeCloseTo(center.x, 6);
    expect(end.y).toBeCloseTo(center.y, 6);
    expect(end.scale).toBeCloseTo(fill, 6);
    expect(end.rotZ).toBeCloseTo((-TILT_DEG * Math.PI) / 180, 6);
  });
  it('survivor scale never decreases as progress grows', () => {
    let prev = 0;
    for (let p = 0; p <= 1.0001; p += 0.01) {
      const s = at(SURVIVOR, Math.min(p, 1)).scale;
      expect(s).toBeGreaterThanOrEqual(prev - 1e-12);
      prev = s;
    }
  });
  it('fill scale covers the whole viewport', () => {
    expect(fill).toBeGreaterThan(Math.max(view.w, view.h));
  });
  it('clamps progress outside 0..1', () => {
    expect(at(SURVIVOR, 1.5)).toEqual(at(SURVIVOR, 1));
    expect(at(0, -1)).toEqual(at(0, 0));
  });
  it('background mixes canvas to ink over the first 35%', () => {
    expect(backgroundMix(0)).toBe(0);
    expect(backgroundMix(0.35)).toBe(1);
    expect(backgroundMix(1)).toBe(1);
    expect(backgroundMix(0.175)).toBeCloseTo(0.5, 6);
  });
  it('desktop shifts the grid right; portrait centres it just above middle, clear of the copy', () => {
    expect(stageOffset(view, 16 / 9).x).toBeGreaterThan(0);
    const aspect = 9 / 19.5;
    const tall = viewSize(30, cameraDistance(30, aspect), aspect);
    const o = stageOffset(tall, aspect);
    expect(o.x).toBe(0);
    expect(o.y).toBeGreaterThan(0);
    expect(o.y).toBeLessThan(tall.h * 0.15);
  });
  it('camera keeps 14 on wide screens and backs off so the grid fits a phone', () => {
    expect(cameraDistance(30, 16 / 9)).toBe(14);
    const aspect = 9 / 19.5;
    const tall = viewSize(30, cameraDistance(30, aspect), aspect);
    const rotatedGridWidth = 4.9;
    expect(rotatedGridWidth).toBeLessThanOrEqual(tall.w * 0.85 + 1e-9);
  });
  it('lab copy fades out as the survivor fills the screen', () => {
    expect(fillMix(0)).toBe(0);
    expect(fillMix(FILL_START)).toBe(0);
    expect(fillMix(0.8)).toBe(1);
    expect(fillMix(1)).toBe(1);
  });
  it('desktop grid sits clear of the left-hand copy column', () => {
    // 4 tiles + 3 gaps = 4.54 wide; half, plus ~0.13 for the 8 degree tilt.
    const halfGrid = 2.4;
    // Left edge must start right of 58% of the viewport (headline ends near 55%).
    expect(offset.x - halfGrid).toBeGreaterThan(view.w * 0.08);
    // ...and the right edge must stay on screen.
    expect(offset.x + halfGrid).toBeLessThan(view.w / 2);
  });
});
