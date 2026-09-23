import { mountLabScene } from '../../src/scene/scene';
const p = Number(new URLSearchParams(location.search).get('p') ?? '0');
const canvas = document.getElementById('c') as HTMLCanvasElement;
const scene = mountLabScene(canvas, { centered: true });
scene.setProgress(p);
scene.renderOnce();
scene.ready.then(() => document.body.setAttribute('data-ready', '1'));
