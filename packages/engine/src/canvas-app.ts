import { Application, Container, Graphics } from 'pixi.js';
import type { Vec2 } from '@zynpparti/geometry';
import { type Camera, DEFAULT_CAMERA, zoomAt, clamp } from './transform';

/** `createCanvasApp` tarafından döndürülen kontrol kolu. */
export interface CanvasHandle {
  destroy: () => void;
}

const GRID_SPACING = 50; // dünya birimi
const GRID_EXTENT = 5000; // grid bu yarıçapta çizilir (-EXTENT..EXTENT)
const MIN_ZOOM = 0.05;
const MAX_ZOOM = 40;
const ZOOM_SENSITIVITY = 0.0015;

/**
 * Verilen DOM konteynerine PixiJS tabanlı boş bir tuval kurar:
 * sürükle → pan, fare tekerleği → imleç-merkezli zoom, sabit bir ızgara (grid).
 *
 * Bu motor React'e bağımlı DEĞİLDİR (saf DOM/PixiJS) — CLAUDE.md §4/§5.
 */
export async function createCanvasApp(container: HTMLElement): Promise<CanvasHandle> {
  const app = new Application();
  await app.init({
    resizeTo: container,
    antialias: true,
    background: '#1e1e1e',
    autoDensity: true,
    resolution: window.devicePixelRatio || 1,
  });
  container.appendChild(app.canvas);

  const world = new Container();
  app.stage.addChild(world);
  drawGrid(world);

  let camera: Camera = DEFAULT_CAMERA;

  function applyCamera(): void {
    world.position.set(camera.x, camera.y);
    world.scale.set(camera.zoom);
  }

  // Açılışta dünya orijinini ekranın ortasına yerleştir.
  camera = { x: app.screen.width / 2, y: app.screen.height / 2, zoom: 1 };
  applyCamera();

  const canvas = app.canvas;

  /**
   * Fare olayının ekran konumunu PixiJS sahne (logical) koordinatına çevirir.
   * CLAUDE.md §8.1: konteyner CSS ile ölçeklenmişse `screen/rect` oranıyla düzelt.
   */
  function pointerPos(e: PointerEvent | WheelEvent): Vec2 {
    const rect = canvas.getBoundingClientRect();
    const sx = app.screen.width / rect.width;
    const sy = app.screen.height / rect.height;
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  }

  // --- Pan (sürükle) ---
  let dragging = false;
  let dragStart: Vec2 = { x: 0, y: 0 };
  let cameraStart: Camera = camera;

  function onPointerDown(e: PointerEvent): void {
    dragging = true;
    dragStart = pointerPos(e);
    cameraStart = camera;
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = 'grabbing';
  }

  function onPointerMove(e: PointerEvent): void {
    if (!dragging) return;
    const p = pointerPos(e);
    camera = {
      zoom: cameraStart.zoom,
      x: cameraStart.x + (p.x - dragStart.x),
      y: cameraStart.y + (p.y - dragStart.y),
    };
    applyCamera();
  }

  function onPointerUp(e: PointerEvent): void {
    dragging = false;
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    canvas.style.cursor = 'grab';
  }

  // --- Zoom (fare tekerleği, imleç-merkezli) ---
  function onWheel(e: WheelEvent): void {
    e.preventDefault();
    const pivot = pointerPos(e);
    const factor = Math.exp(-e.deltaY * ZOOM_SENSITIVITY);
    const newZoom = clamp(camera.zoom * factor, MIN_ZOOM, MAX_ZOOM);
    camera = zoomAt(camera, pivot, newZoom);
    applyCamera();
  }

  canvas.style.cursor = 'grab';
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointerleave', onPointerUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });

  return {
    destroy(): void {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
      app.destroy(true, { children: true });
    },
  };
}

/** Sabit bir ızgara + vurgulu orijin eksenleri çizer (dünya uzayında). */
function drawGrid(target: Container): void {
  const grid = new Graphics();
  for (let x = -GRID_EXTENT; x <= GRID_EXTENT; x += GRID_SPACING) {
    grid.moveTo(x, -GRID_EXTENT).lineTo(x, GRID_EXTENT);
  }
  for (let y = -GRID_EXTENT; y <= GRID_EXTENT; y += GRID_SPACING) {
    grid.moveTo(-GRID_EXTENT, y).lineTo(GRID_EXTENT, y);
  }
  grid.stroke({ width: 1, color: 0x333333, alpha: 1 });

  const axes = new Graphics();
  axes.moveTo(-GRID_EXTENT, 0).lineTo(GRID_EXTENT, 0);
  axes.moveTo(0, -GRID_EXTENT).lineTo(0, GRID_EXTENT);
  axes.stroke({ width: 2, color: 0x4a90d9, alpha: 0.8 });

  target.addChild(grid);
  target.addChild(axes);
}
