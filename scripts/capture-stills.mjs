import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const STILLS = [
  ['p000', 0],
  ['p040', 0.4],
  ['p064', 0.64],
];
const server = await createServer({
  root: 'tests/stills',
  server: { port: 5199, fs: { allow: [process.cwd()] } },
  logLevel: 'error',
});
await server.listen();
const browser = await chromium.launch({
  args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'],
});
const page = await browser.newPage({
  viewport: { width: 1200, height: 900 },
  deviceScaleFactor: 1,
});
for (const [name, p] of STILLS) {
  await page.goto(`http://localhost:5199/?p=${p}`);
  await page.waitForSelector('body[data-ready="1"]');
  await page
    .locator('#c')
    .screenshot({ path: `src/assets/stills/${name}.png`, omitBackground: true });
  console.log('captured', name);
}
await page.setViewportSize({ width: 1200, height: 630 });
await page.goto('http://localhost:5199/?p=0');
await page.waitForSelector('body[data-ready="1"]');
await page.evaluate(() => {
  document.body.style.background = '#ecebe6';
  const h = document.createElement('div');
  h.textContent = 'Project Win';
  h.style.cssText =
    "position:fixed;left:48px;bottom:40px;font:900 132px/0.82 'Schibsted Grotesk',system-ui;letter-spacing:-0.055em;color:#141414";
  document.body.append(h);
});
await page.screenshot({ path: 'public/og.png' });
console.log('captured og');
await browser.close();
await server.close();
