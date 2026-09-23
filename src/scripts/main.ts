import { readCapability, shouldRun3D } from '../scene/capability';
import { initReveal } from '../motion/reveal';

const html = document.documentElement;
const stage = document.querySelector<HTMLElement>('[data-stage]');

if (stage && shouldRun3D(readCapability(window))) {
  html.dataset.motion = 'full';
  initReveal(document);
  const start = () =>
    import('../scene/run-full')
      .then((m) => m.runFull(stage))
      .catch(() => {
        html.dataset.motion = 'static';
      });
  if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 1500 });
  else setTimeout(start, 200);
} else {
  html.dataset.motion = 'static';
}
