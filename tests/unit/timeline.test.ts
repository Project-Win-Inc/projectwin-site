import { describe, expect, it } from 'vitest';
import { FALL_ORDER, SURVIVOR, gridPositions } from '../../src/scene/layout';
import {
  FALL_END,
  FILL_START,
  TILT_DEG,
  backgroundMix,
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
  it('desktop shifts the grid right, portrait shifts it down', () => {
    expect(stageOffset(view, 16 / 9).x).toBeGreaterThan(0);
    const tall = viewSize(30, 14, 9 / 19.5);
    const o = stageOffset(tall, 9 / 19.5);
    expect(o.x).toBe(0);
    expect(o.y).toBeLessThan(0);
  });
});
