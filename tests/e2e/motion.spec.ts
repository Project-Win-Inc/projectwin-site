import { expect, test } from '@playwright/test';
import { test3d } from './fixtures';

test3d('capable device runs the 3D scene without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'full');
  await expect(page.locator('html')).toHaveAttribute('data-scene', 'ready', { timeout: 10_000 });
  await expect(page.locator('canvas.stage-canvas')).toBeAttached();
  expect(errors).toEqual([]);
});

test('reduced motion shows stills and no canvas', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'static');
  await expect(page.locator('canvas.stage-canvas')).toHaveCount(0);
  await expect(page.locator('img[data-still="p000"]')).toBeVisible();
  await page.locator('#lab').scrollIntoViewIfNeeded();
  await expect(page.locator('img[data-still="p040"]')).toBeVisible();
});

test('JS disabled: everything readable, stills visible', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('img[data-still="p000"]')).toBeVisible();
  await expect(page.getByText('20251401400')).toBeVisible();
  await ctx.close();
});

test3d('three chunk failing to load falls back to static', async ({ page }) => {
  await page.route(/\/_astro\/three\..*\.js$/, (r) => r.abort());
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'static', { timeout: 10_000 });
  await expect(page.locator('img[data-still="p000"]')).toBeVisible();
});

test3d('jumping to #contact past the pinned lab leaves a consistent page', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-scene', 'ready', { timeout: 10_000 });
  await page.goto('/#contact');
  await expect(page.locator('html')).toHaveAttribute('data-scene', 'ready', { timeout: 10_000 });
  await page.waitForTimeout(800);
  await expect(page.locator('#contact')).toBeInViewport();
  const mix = await page
    .locator('[data-stage]')
    .evaluate((el) => Number(getComputedStyle(el).getPropertyValue('--mix')));
  expect(mix).toBe(1);
  const labOpacity = await page
    .locator('#lab h2')
    .evaluate((el) => Number(getComputedStyle(el).opacity));
  expect(labOpacity).toBe(0);
  // Seamless hand-off: the stage itself turns the exact DOM amber and the canvas fades out.
  const handoff = await page.evaluate(() => ({
    bg: getComputedStyle(document.querySelector('[data-stage]')!).backgroundColor,
    canvas: Number(getComputedStyle(document.querySelector('canvas.stage-canvas')!).opacity),
  }));
  const rgb = handoff.bg.startsWith('color(srgb')
    ? handoff.bg
        .match(/[\d.]+/g)!
        .slice(0, 3)
        .map((v) => Math.round(Number(v) * 255))
    : handoff.bg.match(/\d+/g)!.slice(0, 3).map(Number);
  expect(rgb).toEqual([255, 174, 3]);
  expect(handoff.canvas).toBeCloseTo(0, 5);
});

test3d('resize mid-page keeps canvas matched and no overflow', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-scene', 'ready', { timeout: 10_000 });
  await page.mouse.wheel(0, 600);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  const { cw, vw, overflow } = await page.evaluate(() => {
    const c = document.querySelector('canvas.stage-canvas') as HTMLCanvasElement;
    return {
      cw: c.clientWidth,
      vw: window.innerWidth,
      overflow: document.documentElement.scrollWidth - window.innerWidth,
    };
  });
  expect(cw).toBe(vw);
  expect(overflow).toBeLessThanOrEqual(0);
});

test3d('render loop stops when the scene is offscreen', async ({ page }) => {
  await page.goto('/#contact');
  await expect(page.locator('html')).toHaveAttribute('data-scene', 'ready', { timeout: 10_000 });
  await page.waitForTimeout(600);
  const frames = () =>
    page
      .locator('canvas.stage-canvas')
      .evaluate((c) => Number((c as HTMLCanvasElement).dataset.frames));
  const a = await frames();
  await page.waitForTimeout(1000);
  expect(await frames()).toBe(a);
});

test3d('largest contentful paint is the wordmark, not an image', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __lcp: string[] }).__lcp = [];
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as (PerformanceEntry & { element?: Element })[]) {
        (window as unknown as { __lcp: string[] }).__lcp.push(
          e.element ? e.element.tagName + (e.element.closest('h1') ? ':in-h1' : '') : 'none',
        );
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-scene', 'ready', { timeout: 10_000 });
  const lcp = await page.evaluate(() => (window as unknown as { __lcp: string[] }).__lcp);
  expect(lcp.at(-1)).toMatch(/H1|:in-h1/);
});

test3d('3D code is requested only after the page has loaded', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-scene', 'ready', { timeout: 10_000 });
  const t = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const three = performance
      .getEntriesByType('resource')
      .find((r) => /\/_astro\/three\.[^/]*\.js$/.test(r.name));
    return { load: nav.loadEventEnd, three: three?.startTime ?? -1 };
  });
  expect(t.three).toBeGreaterThanOrEqual(t.load);
});

test('software-rendered WebGL (no GPU) falls back to static stills', async ({ page }) => {
  // The Playwright config forces SwiftShader, i.e. a browser with no GPU acceleration.
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'static', { timeout: 10_000 });
  await expect(page.locator('canvas.stage-canvas')).toHaveCount(0);
  await expect(page.locator('img[data-still="p000"]')).toBeVisible();
});

test3d('reading position is kept when the 3D scene arrives late', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  await page.route(/\/_astro\/three\..*\.js$/, async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto('/');
  await page.locator('#values').evaluate((el) => el.scrollIntoView({ block: 'start' }));
  const before = await page.locator('#values').evaluate((el) => el.getBoundingClientRect().top);
  release();
  await expect(page.locator('html')).toHaveAttribute('data-scene', 'ready', { timeout: 10_000 });
  await page.waitForTimeout(300);
  const after = await page.locator('#values').evaluate((el) => el.getBoundingClientRect().top);
  expect(Math.abs(after - before)).toBeLessThan(4);
});

test3d(
  'header Contact link lands on the contact section right after the scene loads',
  async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-scene', 'ready', { timeout: 10_000 });
    await page.getByRole('link', { name: 'Contact' }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator('#contact')).toBeInViewport();
  },
);

test3d('lab section stays readable while the 3D code is still downloading', async ({ page }) => {
  await page.route(/\/_astro\/three\..*\.js$/, () => {
    /* never answer: a stalled request */
  });
  await page.goto('/');
  await page.waitForTimeout(1500);
  await page.locator('#lab').scrollIntoViewIfNeeded();
  const lab = await page.locator('#lab').evaluate((el) => ({
    opacity: Number(getComputedStyle(el.querySelector('h2')!).opacity),
    bg: getComputedStyle(el).backgroundColor,
  }));
  expect(lab.opacity).toBe(1);
  expect(lab.bg).toBe('rgb(20, 20, 20)');
});

test3d(
  'touch: toolbar-sized height changes do not re-measure the pin or distort the scene',
  async ({ page }, info) => {
    test3d.skip(info.project.name !== 'mobile', 'mobile browser toolbars only');
    const vp = page.viewportSize()!;
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-scene', 'ready', { timeout: 10_000 });
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(400);
    // The pin's length is what must not change (Chromium's emulation also shrinks svh-based
    // sections, which a real iOS toolbar does not).
    const pinLength = () =>
      page.evaluate(() => (document.querySelector('.pin-spacer') as HTMLElement).offsetHeight);
    const pinBefore = await pinLength();
    await page.setViewportSize({ width: vp.width, height: Math.round(vp.height * 0.9) });
    await page.waitForTimeout(600);
    const r = await page.evaluate(() => {
      const c = document.querySelector('canvas.stage-canvas') as HTMLCanvasElement;
      return {
        buffer: c.width / c.height,
        box: c.clientWidth / c.clientHeight,
      };
    });
    expect(await pinLength()).toBe(pinBefore);
    expect(Math.abs(r.buffer - r.box) / r.box).toBeLessThan(0.02);
  },
);
