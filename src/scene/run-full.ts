import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { mountLabScene } from './scene';
import { backgroundMix, fillMix } from './timeline';

/** The later section the reader is looking at, and where it sits, before the pin adds height. */
function readingAnchor(): { el: Element; top: number } | null {
  for (const el of document.querySelectorAll('#dreamcatcher, #values, #contact')) {
    const r = el.getBoundingClientRect();
    if (r.bottom > 0 && r.top < window.innerHeight) return { el, top: r.top };
  }
  return null;
}

export async function runFull(stage: HTMLElement) {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  const html = document.documentElement;
  const lab = stage.querySelector<HTMLElement>('[data-lab]')!;
  // Captured before anything changes layout: a reader who scrolled (or followed #contact)
  // while the 3D code downloaded must not be moved by the pin's extra 200vh.
  const anchor = readingAnchor();

  const canvas = document.createElement('canvas');
  canvas.className = 'stage-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  stage.prepend(canvas);
  const scene = mountLabScene(canvas);

  const lenis = new Lenis({ lerp: 0.09, anchors: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  // Final layout (lab stills hidden, transparent lab) before the pin is measured.
  html.dataset.motion = 'full';

  const setMix = (p: number) => {
    stage.style.setProperty('--mix', String(backgroundMix(p)));
    stage.style.setProperty('--fill', String(fillMix(p)));
  };
  ScrollTrigger.create({
    trigger: lab,
    start: 'top top',
    end: '+=200%',
    pin: true,
    scrub: true,
    onUpdate: (s) => {
      scene.setProgress(s.progress);
      setMix(s.progress);
    },
    onRefresh: (s) => {
      scene.setProgress(s.progress);
      setMix(s.progress);
    },
  });

  ScrollTrigger.refresh(); // lay out the pin spacer now, not on the next tick
  lenis.resize(); // Lenis caches the scroll limit; the page just got taller
  if (anchor) {
    const y = anchor.el.getBoundingClientRect().top + window.scrollY - anchor.top;
    lenis.scrollTo(y, { immediate: true, force: true });
  }

  let onScreen = true;
  const sync = () => scene.setActive(onScreen && !document.hidden);
  new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    sync();
  }).observe(stage);
  document.addEventListener('visibilitychange', sync);

  window.addEventListener(
    'pointermove',
    (e) => scene.setPointer((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1),
    { passive: true },
  );
  // ScrollTrigger refreshes itself on real resizes and ignores mobile toolbar show/hide.
  // The scene only re-frames when its own box changes (the canvas is 100lvh, so toolbars
  // do not change it on phones).
  let box = `${canvas.clientWidth}x${canvas.clientHeight}`;
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      const next = `${canvas.clientWidth}x${canvas.clientHeight}`;
      if (next !== box) {
        box = next;
        scene.resize();
      }
    }, 120);
  });

  sync();
  await scene.ready;
  html.dataset.scene = 'ready';
}
