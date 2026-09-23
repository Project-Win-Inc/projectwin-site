import {
  CanvasTexture,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  NeutralToneMapping,
  PerspectiveCamera,
  PlaneGeometry,
  SRGBColorSpace,
  Scene,
  WebGLRenderer,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { SURVIVOR, TILE, gridPositions, tileName } from './layout';
import { TILT_DEG, centerInGrid, fillScale, stageOffset, tileStateAt, viewSize } from './timeline';

export interface LabScene {
  setProgress(p: number): void;
  setPointer(nx: number, ny: number): void;
  resize(): void;
  setActive(on: boolean): void;
  renderOnce(): void;
  ready: Promise<void>;
  dispose(): void;
}

const FOV = 30;
const DISTANCE = 14;
const MAX_TILT = (6 * Math.PI) / 180;

function shadowTexture(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(64, 64, 8, 64, 64, 64);
  grad.addColorStop(0, 'rgba(20,20,20,0.35)');
  grad.addColorStop(1, 'rgba(20,20,20,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new CanvasTexture(c);
}

export function mountLabScene(
  canvas: HTMLCanvasElement,
  opts: { centered?: boolean } = {},
): LabScene {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping; // keeps the amber on-brand (ACES shifted it to yellow)
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 100);
  camera.position.set(0, 0, DISTANCE);
  scene.add(new HemisphereLight(0xffffff, 0xcfcac0, 1.1));
  const key = new DirectionalLight(0xffffff, 2.2);
  key.position.set(-4, 6, 8);
  scene.add(key);
  const rim = new DirectionalLight(0xfff1d6, 0.8);
  rim.position.set(5, -2, 4);
  scene.add(rim);

  const stage = new Group();
  const grid = new Group();
  grid.rotation.z = (TILT_DEG * Math.PI) / 180;
  stage.add(grid);
  scene.add(stage);

  const geo = new RoundedBoxGeometry(TILE, TILE, 0.28, 4, 0.14);
  const shadowGeo = new PlaneGeometry(TILE * 1.6, TILE * 1.6);
  const shadowTex = shadowTexture();
  const bases = gridPositions();
  const tiles = bases.map((b, i) => {
    const mat =
      i === SURVIVOR
        ? new MeshPhysicalMaterial({
            color: 0xffae03,
            roughness: 0.35,
            emissive: 0xffae03,
            emissiveIntensity: 0.18,
            clearcoat: 0.6,
          })
        : new MeshPhysicalMaterial({
            color: 0xd9d7d0,
            roughness: 0.62,
            clearcoat: 0.25,
            clearcoatRoughness: 0.5,
            transparent: true,
          });
    const mesh = new Mesh(geo, mat);
    mesh.name = tileName(i);
    mesh.position.set(b.x, b.y, 0);
    const shadow = new Mesh(
      shadowGeo,
      new MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }),
    );
    shadow.position.set(b.x + 0.12, b.y - 0.16, -0.3);
    grid.add(shadow, mesh);
    return { mesh, shadow, mat };
  });

  let progress = 0;
  let pointer = { x: 0, y: 0 };
  let tilt = { x: 0, y: 0 };
  let ctx = { center: { x: 0, y: 0 }, fill: 1 };
  let active = false;
  let raf = 0;
  let frames = 0;
  const t0 = performance.now();
  let resolveReady!: () => void;
  const ready = new Promise<void>((r) => (resolveReady = r));

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const view = viewSize(FOV, DISTANCE, camera.aspect);
    // Stills are framed on the grid itself; the live page offsets it beside the wordmark.
    const offset = opts.centered ? { x: 0, y: 0 } : stageOffset(view, camera.aspect);
    stage.position.set(offset.x, offset.y, 0);
    ctx = { center: centerInGrid(offset, TILT_DEG), fill: fillScale(view) };
  }

  function apply(time: number) {
    tiles.forEach(({ mesh, shadow, mat }, i) => {
      const s = tileStateAt(i, progress, { base: bases[i], ...ctx });
      mesh.position.set(s.x, s.y, 0);
      mesh.rotation.z = s.rotZ;
      mesh.scale.setScalar(s.scale);
      if (i !== SURVIVOR) mat.opacity = s.opacity;
      shadow.position.set(s.x + 0.12, s.y - 0.16, -0.3);
      (shadow.material as MeshBasicMaterial).opacity =
        s.opacity * (i === SURVIVOR && s.scale > 1.2 ? 0 : 1);
    });
    const calm = 1 - Math.min(1, progress * 3);
    tilt.x += (pointer.y * MAX_TILT * calm - tilt.x) * 0.08;
    tilt.y += (pointer.x * MAX_TILT * calm - tilt.y) * 0.08;
    grid.rotation.x = -tilt.x;
    grid.rotation.y = tilt.y;
    grid.position.y = Math.sin(((time - t0) / 1000) * 0.6) * 0.06 * calm;
  }

  function draw(time: number) {
    apply(time);
    renderer.render(scene, camera);
    frames += 1;
    canvas.dataset.frames = String(frames);
    if (frames === 1) resolveReady();
  }

  function loop(time: number) {
    if (!active) return;
    draw(time);
    raf = requestAnimationFrame(loop);
  }

  resize();
  return {
    setProgress: (p) => (progress = p),
    setPointer: (nx, ny) => (pointer = { x: nx, y: ny }),
    resize,
    setActive(on) {
      if (on === active) return;
      active = on;
      if (on) raf = requestAnimationFrame(loop);
      else cancelAnimationFrame(raf);
    },
    renderOnce: () => draw(performance.now()),
    ready,
    dispose() {
      active = false;
      cancelAnimationFrame(raf);
      geo.dispose();
      shadowGeo.dispose();
      shadowTex.dispose();
      tiles.forEach(({ mat, shadow }) => {
        mat.dispose();
        (shadow.material as MeshBasicMaterial).dispose();
      });
      renderer.dispose();
    },
  };
}
