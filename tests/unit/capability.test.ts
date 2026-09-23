import { describe, expect, it } from 'vitest';
import { shouldRun3D } from '../../src/scene/capability';

const ok = { reducedMotion: false, saveData: false, webgl2: true, deviceMemory: 8 };
describe('shouldRun3D', () => {
  it('runs on a capable device', () => expect(shouldRun3D(ok)).toBe(true));
  it('runs when deviceMemory is unreported (Safari/Firefox)', () =>
    expect(shouldRun3D({ ...ok, deviceMemory: undefined })).toBe(true));
  it('respects reduced motion', () =>
    expect(shouldRun3D({ ...ok, reducedMotion: true })).toBe(false));
  it('respects data saver', () => expect(shouldRun3D({ ...ok, saveData: true })).toBe(false));
  it('needs WebGL2', () => expect(shouldRun3D({ ...ok, webgl2: false })).toBe(false));
  it('skips low-memory devices', () => expect(shouldRun3D({ ...ok, deviceMemory: 2 })).toBe(false));
});
