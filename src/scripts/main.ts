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
  // Wait for load (HTML, CSS, fonts) so the 3D bundle never competes with first render.
  const idle = () =>
    'requestIdleCallback' in window
      ? requestIdleCallback(start, { timeout: 1500 })
      : setTimeout(start, 200);
  if (document.readyState === 'complete') idle();
  else window.addEventListener('load', idle, { once: true });
} else {
  html.dataset.motion = 'static';
}
