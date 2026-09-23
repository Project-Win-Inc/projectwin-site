import { expect, test } from '@playwright/test';

test('home renders all five sections with verified facts', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Project Win');
  for (const id of ['lab', 'dreamcatcher', 'values', 'contact']) {
    await expect(page.locator(`#${id}`)).toBeAttached();
  }
  await expect(page.getByText('20251401400')).toBeVisible();
  await expect(page.getByText('Ian Cross')).toBeVisible();
  await expect(page.getByRole('link', { name: /App Store/ })).toHaveAttribute(
    'href',
    'https://apps.apple.com/us/app/dreamcatcher-ai-journal/id6762375451',
  );
});

test('no horizontal overflow', async ({ page }) => {
  await page.goto('/');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

for (const vp of [
  { width: 1280, height: 640 },
  { width: 844, height: 390 },
]) {
  test(`short landscape ${vp.width}x${vp.height} keeps hero readable`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
    await expect(page.getByText(/two-founder product lab/)).toBeInViewport();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test('first Tab focuses the skip link', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
});

test('internal pages resolve', async ({ page }) => {
  for (const path of ['/privacy', '/terms']) {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  }
  const res = await page.goto('/does-not-exist');
  expect(res?.status()).toBe(404);
});

test('header stays on one row at phone width, keeping the legal tagline', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/');
  const box = await page.locator('.site-header').boundingBox();
  expect(box!.height).toBeLessThanOrEqual(56);
  await expect(page.getByText('Colorado LLC · est. 2025')).toBeVisible();
});

test('still frames keep their aspect ratio', async ({ page }) => {
  // The still is the static-mode stand-in for the 3D scene, so check it in static mode.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const img = page.locator('img[data-still="p000"]');
  await expect(img).toBeVisible();
  const { rendered, natural } = await img.evaluate((el: HTMLImageElement) => ({
    rendered: el.clientWidth / el.clientHeight,
    natural: el.naturalWidth / el.naturalHeight,
  }));
  expect(Math.abs(rendered - natural) / natural).toBeLessThan(0.02);
});
