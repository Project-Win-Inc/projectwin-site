# projectwin.cloud: how the site works and how to run it

Live at https://projectwin.cloud. Design spec and build plan are in the Project Win vault:
`project-win/projects/studio-site/`. The HQ card is `public-one-pager-for-project-win-llc-at-projectwin-cloud`.

## What's where

| Path                      | What it does                                                                                                                                                                                        |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/content/site.ts`     | Every word and fact on the site. `tests/unit/content.test.ts` checks it: verified entity facts, store links, no em or en dashes, no marketing clichés, and only characters the subset font contains |
| `src/components/*.astro`  | The five sections: Hero, Lab, DreamCatcher, Values, Colophon                                                                                                                                        |
| `src/styles/tokens.css`   | Colors, type scale, easing, and the `@font-face` for the subset display font                                                                                                                        |
| `src/scene/capability.ts` | Decides whether a device gets the 3D scene (pure, unit tested)                                                                                                                                      |
| `src/scene/timeline.ts`   | All animation math: scroll progress to tile positions, background mix, fill, camera framing (pure, unit tested)                                                                                     |
| `src/scene/scene.ts`      | Three.js: builds the 12-tile grid and applies `timeline.ts` output                                                                                                                                  |
| `src/scene/run-full.ts`   | Wires the scene to GSAP ScrollTrigger (the pin) and Lenis (smooth scroll). Loaded lazily                                                                                                            |
| `src/scripts/main.ts`     | Entry point: runs the capability check, then loads `run-full` after `window.load`                                                                                                                   |
| `src/assets/stills/`      | Still frames of the real scene, used when the 3D doesn't run. Made by `npm run stills`                                                                                                              |
| `public/fonts/`           | Schibsted Grotesk subset, made by `scripts/subset-font.sh`                                                                                                                                          |

## Motion modes

The page sets `html[data-motion]` and every visual state keys off it:

- **No attribute (no JS):** static layout. Still frames show and all text is visible.
- **`pending`:** set by an inline script in `<head>` unless the visitor has reduced motion on. The page is readable with static styling, and the hero still is hidden so the wordmark is what paints first (LCP). This state lasts until `run-full` builds the pin.
- **`full`:** the 3D scene runs. `run-full` sets it just before measuring the pin, and puts the reader back on the section they were viewing, because the pin adds 200vh of height.
- **`static`:** reduced motion, data saver, no WebGL2, software-rendered WebGL (no GPU), under 4 GB of device memory, or a failed download of the 3D code. Still frames show.

## Common changes

- **Copy:** edit `src/content/site.ts`, then run `npm test`. If you add a character outside ASCII plus `· ’ “ ” … é →`, the font test fails. Add it to `scripts/subset-font.sh` and rerun the script (it needs `pip install fonttools brotli`).
- **Scene or animation:** change constants in `timeline.ts`. `scene.ts` should only hold lighting and materials. Run `npm test`, then `npm run stills` to regenerate and commit the still frames.
- **Before any PR:** run `npm run check && npm test && npm run build && npm run budget && npm run e2e`. For visual or loading changes, also run `npx lhci autorun` on a Mac (see Lighthouse below).

## Quality gates (CI, `.github/workflows/ci.yml`)

- Type check and prettier, unit tests (Vitest), build, and the JS budget: own JS ≤ 60 KB gzipped, the `three` chunk ≤ 170 KB gzipped.
- Playwright e2e at phone and desktop sizes. Tests that exercise the 3D path use the `test3d` fixture (`tests/e2e/fixtures.ts`), because CI has no GPU.
- **Lighthouse:** CI runners have no GPU, so the site correctly serves the still-frame fallback there. `lighthouserc.ci.json` allows LCP ≤ 2000 ms on that path. The real 3D path's budget is `lighthouserc.json` (LCP ≤ 1500 ms; 1.43 s at launch), run locally with `npx lhci autorun`. Both require Performance ≥ 0.95 and 100 for Accessibility, Best Practices and SEO.

## Deploys

- GitHub Pages, from `main` only, after the `quality` job passes (job `deploy`). The repo is public: the org is on GitHub Free, where Pages needs a public repo. Keep secrets out of it.
- There are no per-PR previews. Preview with `npm run build && npm run preview` (http://localhost:4321).
- Pages can't set response headers. Every file is served with `Cache-Control: max-age=600`.

## Domain and DNS

- DNS for projectwin.cloud is at **Hostinger** (hPanel → Domains → projectwin.cloud → DNS), not Cloudflare.
  - `@`: four A records to 185.199.108.153, 185.199.109.153, 185.199.110.153 and 185.199.111.153 (GitHub Pages).
  - `www`: CNAME to `project-win-inc.github.io`. GitHub redirects it to the bare domain.
  - `hq`, `social`, `dreamverse`, `dc-events` and `content` are A records to the VPS (2.24.111.174). Don't touch them for the site.
- **Rollback:** delete the four GitHub A records and set `@` A back to `2.57.91.91` (Hostinger's parked page).
- **HTTPS:** the certificate covers projectwin.cloud and www (issued 2026-09-23, renewed automatically by GitHub), and "Enforce HTTPS" is on.
- **Gotcha:** if the custom domain is set before DNS points at GitHub, no certificate is issued. Clear the domain and set it again:

  ```bash
  echo '{"cname":null}' | gh api -X PUT repos/Project-Win-Inc/projectwin-site/pages --input -
  gh api -X PUT repos/Project-Win-Inc/projectwin-site/pages -f cname=projectwin.cloud
  ```

## Analytics and contact

- **Analytics:** off. Setting the repo variable `PUBLIC_CF_BEACON_TOKEN` (the site token from Cloudflare dashboard → Web Analytics → add projectwin.cloud) turns on the cookieless beacon. The privacy page's analytics sentence follows the same switch automatically.
- **Contact:** projectwinteam@gmail.com. Hostinger has no free email forwarder, so there's no hello@projectwin.cloud.

## Known minor issues (deferred at launch)

- If `main.ts` itself fails to load, the page stays `pending` and the hero still never shows. All text still reads fine.
- The capability check leaves one spare WebGL context open (`WEBGL_lose_context` would release it).
- Console errors aren't asserted on the static path, and external links aren't checked by the tests.
- The OG share image (`public/og.png`) is rendered with a fallback font. The stills harness doesn't load Schibsted.
- Links use `/privacy` while the canonical URL is `/privacy/`, which costs one redirect.
