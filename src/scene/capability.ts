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

/** CPU (no GPU) WebGL implementations; a masked or unknown name is assumed to be hardware. */
export function isSoftwareRenderer(renderer: string | null): boolean {
  return !!renderer && /swiftshader|llvmpipe|softpipe|basic render driver|software/i.test(renderer);
}

export function readCapability(win: Window): CapabilityInput {
  const nav = win.navigator as Navigator & {
    connection?: { saveData?: boolean };
    deviceMemory?: number;
  };
  let webgl2 = false;
  try {
    // Software-rendered WebGL (no GPU) would make every frame a long task; treat it as absent.
    const gl = win.document
      .createElement('canvas')
      .getContext('webgl2', { failIfMajorPerformanceCaveat: true });
    const info = gl?.getExtension('WEBGL_debug_renderer_info');
    const renderer = gl && info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : null;
    webgl2 = !!gl && !isSoftwareRenderer(renderer);
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
