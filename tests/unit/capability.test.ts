import { describe, expect, it } from 'vitest';
import { isSoftwareRenderer, shouldRun3D } from '../../src/scene/capability';

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

describe('isSoftwareRenderer', () => {
  it('flags CPU renderers', () => {
    for (const r of [
      'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (LLVM 10.0.0) (0x0000C0DE)), SwiftShader driver)',
      'llvmpipe (LLVM 15.0.7, 256 bits)',
      'ANGLE (Microsoft, Microsoft Basic Render Driver Direct3D11 vs_5_0 ps_5_0)',
      'Google SwiftShader',
    ])
      expect(isSoftwareRenderer(r)).toBe(true);
  });
  it('passes real GPUs and masked names', () => {
    for (const r of [
      'Apple M2',
      'Apple GPU',
      'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060)',
      'Adreno (TM) 640',
      'Mali-G78',
      null,
    ])
      expect(isSoftwareRenderer(r)).toBe(false);
  });
});
