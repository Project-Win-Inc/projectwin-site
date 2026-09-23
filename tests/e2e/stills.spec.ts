import { expect, test } from '@playwright/test';
test('generated stills exist and are not placeholders', async () => {
  const fs = await import('node:fs');
  for (const n of ['p000', 'p040', 'p064']) {
    const size = fs.statSync(`src/assets/stills/${n}.png`).size;
    expect(size).toBeGreaterThan(20_000);
  }
});
