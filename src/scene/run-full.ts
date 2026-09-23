import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { mountLabScene } from './scene';
import { backgroundMix, fillMix } from './timeline';

export async function runFull(stage: HTMLElement) {
  gsap.registerPlugin(ScrollTrigger);
  const html = document.documentElement;
  const lab = stage.querySelector<HTMLElement>('[data-lab]')!;

  const canvas = document.createElement('canvas');
  canvas.className = 'stage-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  stage.prepend(canvas);
  const scene = mountLabScene(canvas);

  const lenis = new Lenis({ lerp: 0.09, anchors: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

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

  // The pin adds 200vh of spacer after the browser already jumped to any #anchor,
  // which leaves the old scroll position pointing into the pinned lab. Re-apply it.
  const hashTarget = location.hash
    ? document.getElementById(decodeURIComponent(location.hash.slice(1)))
    : null;
  if (hashTarget) {
    ScrollTrigger.refresh(); // lay out the pin spacer now, not on the next tick
    lenis.resize(); // Lenis caches the scroll limit; the page just got taller
    lenis.scrollTo(hashTarget, { immediate: true, force: true });
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
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      scene.resize();
      ScrollTrigger.refresh();
    }, 120);
  });

  sync();
  await scene.ready;
  html.dataset.scene = 'ready';
}
