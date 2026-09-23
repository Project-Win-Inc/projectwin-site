# projectwin-site: agent brief

The public site for Project Win LLC at projectwin.cloud. Spec and plan live in the Project Win vault:
`project-win/projects/studio-site/2026-09-22-projectwin-site-design.md` and `...-plan.md`.

- Copy lives only in `src/content/site.ts`. It must be true, and it must have no em or en dashes.
- Animation math lives in `src/scene/timeline.ts` (pure, unit tested). `scene.ts` only applies it.
- Run `npm run check && npm test && npm run build && npm run budget && npm run e2e` before any PR.
- Deploys: GitHub Pages (public repo), from `main` only, after every CI gate passes (`.github/workflows/ci.yml`).
  Custom domain projectwin.cloud is set in the repo's Pages settings; DNS is at Hostinger. DNS changes need Ian's go.
  There are no per-PR previews; preview locally with `npm run build && npm run preview`.
- Lighthouse: `npx lhci autorun` locally checks the real 3D path (LCP 1500ms budget). CI has no GPU and checks the
  still-frame fallback with `lighthouserc.ci.json` (LCP 2000ms). Run the local one before any visual or loading change.
- Regenerate stills (`npm run stills`) whenever `src/scene/*` changes, and commit them.

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
