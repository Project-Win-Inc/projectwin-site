import { test as base } from '@playwright/test';

/**
 * CI browsers have no GPU, so Chromium renders WebGL in software (SwiftShader). The site rightly
 * treats that as "no 3D". Tests that exercise the 3D path opt in here, so the real renderer
 * runs under SwiftShader.
 */
export const test3d = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
        this: HTMLCanvasElement,
        type: string,
        attrs?: Record<string, unknown>,
      ) {
        const relaxed = attrs ? { ...attrs, failIfMajorPerformanceCaveat: false } : attrs;
        return original.call(this, type, relaxed);
      } as typeof original;
      // ...and report a hardware renderer name, since the gate also checks for "SwiftShader".
      const getParameter = WebGL2RenderingContext.prototype.getParameter;
      WebGL2RenderingContext.prototype.getParameter = function (
        this: WebGL2RenderingContext,
        pname: number,
      ) {
        return pname === 0x9246 ? 'Test GPU' : getParameter.call(this, pname);
      };
    });
    await use(page);
  },
});
