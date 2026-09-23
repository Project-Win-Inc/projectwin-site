import { expect, test } from '@playwright/test';

test('capable device runs the 3D scene without errors', async ({ page }) => {
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

test('three chunk failing to load falls back to static', async ({ page }) => {
  await page.route(/\/_astro\/three\..*\.js$/, (r) => r.abort());
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'static', { timeout: 10_000 });
  await expect(page.locator('img[data-still="p000"]')).toBeVisible();
});

test('jumping to #contact past the pinned lab leaves a consistent page', async ({ page }) => {
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

test('resize mid-page keeps canvas matched and no overflow', async ({ page }) => {
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

test('render loop stops when the scene is offscreen', async ({ page }) => {
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

test('largest contentful paint is the wordmark, not an image', async ({ page }) => {
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

test('3D code is requested only after the page has loaded', async ({ page }) => {
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
