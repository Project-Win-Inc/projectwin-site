import { describe, expect, it } from 'vitest';
import { FALL_ORDER, SURVIVOR, gridPositions, tileName } from '../../src/scene/layout';

describe('grid layout', () => {
  it('has 12 tiles centred on the origin', () => {
    const p = gridPositions();
    expect(p).toHaveLength(12);
    const mx = p.reduce((s, t) => s + t.x, 0) / 12;
    const my = p.reduce((s, t) => s + t.y, 0) / 12;
    expect(Math.abs(mx)).toBeLessThan(1e-9);
    expect(Math.abs(my)).toBeLessThan(1e-9);
  });
  it('names tiles tile-01..tile-12, survivor is tile-07', () => {
    expect(tileName(0)).toBe('tile-01');
    expect(tileName(SURVIVOR)).toBe('tile-07');
  });
  it('fall order covers every non-survivor exactly once, irregularly', () => {
    const expected = [...Array(12).keys()].filter((i) => i !== SURVIVOR);
    expect([...FALL_ORDER].sort((a, b) => a - b)).toEqual(expected);
    const ascending = FALL_ORDER.every((v, i, a) => i === 0 || v > a[i - 1]);
    expect(ascending).toBe(false);
  });
});
