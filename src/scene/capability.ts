export interface CapabilityInput {
  reducedMotion: boolean;
  saveData: boolean;
  webgl2: boolean;
  deviceMemory?: number;
}

export function shouldRun3D(c: CapabilityInput): boolean {
  if (c.reducedMotion || c.saveData || !c.webgl2) return false;
  if (c.deviceMemory !== undefined && c.deviceMemory < 4) return false;
  return true;
}

export function readCapability(win: Window): CapabilityInput {
  const nav = win.navigator as Navigator & {
    connection?: { saveData?: boolean };
    deviceMemory?: number;
  };
  let webgl2 = false;
  try {
    webgl2 = !!win.document.createElement('canvas').getContext('webgl2');
  } catch {
    webgl2 = false;
  }
  return {
    reducedMotion: win.matchMedia('(prefers-reduced-motion: reduce)').matches,
    saveData: nav.connection?.saveData === true,
    webgl2,
    deviceMemory: nav.deviceMemory,
  };
}
