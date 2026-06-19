import { Application, Container, Graphics } from 'pixi.js';
import type { Vec2 } from '@zynpparti/geometry';
import type { EntityStore } from '@zynpparti/document';
import { type Camera, DEFAULT_CAMERA, screenToWorld, zoomAt, clamp } from './transform';
import { EntityLayer } from './entity-layer';
import type { AABB, SpatialIndex } from './spatial-index';

/** `createCanvasApp` tarafından döndürülen kontrol kolu. */
export interface CanvasHandle {
  /** Mekânsal indeks (hit-test/snapping için; 1C araçları kullanır). */
  readonly index: SpatialIndex;
  destroy: () => void;
}

const GRID_SPACING = 50; // dünya birimi (cm)
const GRID_EXTENT = 5000; // grid bu yarıçapta çizilir (-EXTENT..EXTENT)
const MIN_ZOOM = 0.05;
const MAX_ZOOM = 40;
const ZOOM_SENSITIVITY = 0.0015;

/**
 * Verilen DOM konteynerine PixiJS tabanlı tuval kurar: sürükle → pan, tekerlek → imleç-merkezli
 * zoom, sabit ızgara, ve `store`'a abone entity katmanı (mekânsal indeks + viewport culling).
 *
 * Bu motor React'e bağımlı DEĞİLDİR (saf DOM/PixiJS) — CLAUDE.md §4/§5.
 */
export async function createCanvasApp(
  container: HTMLElement,
  store: EntityStore,
): Promise<CanvasHandle> {
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

  const entityLayer = new EntityLayer(store);
  world.addChild(entityLayer.container);

  let camera: Camera = DEFAULT_CAMERA;

  /** Ekranın görünür alanının dünya koordinatındaki sınır kutusu (culling için). */
  function viewportBounds(): AABB {
    const tl = screenToWorld({ x: 0, y: 0 }, camera);
    const br = screenToWorld({ x: app.screen.width, y: app.screen.height }, camera);
    return { minX: tl.x, minY: tl.y, maxX: br.x, maxY: br.y };
  }

  function applyCamera(): void {
    world.position.set(camera.x, camera.y);
    world.scale.set(camera.zoom);
    entityLayer.cull(viewportBounds());
  }

  // Açılışta dünya orijinini ekranın ortasına yerleştir.
  camera = { x: app.screen.width / 2, y: app.screen.height / 2, zoom: 1 };
  applyCamera();

  // Pencere boyutu değişince yeniden cull et (kamera aynı kalsa da viewport değişir).
  app.renderer.on('resize', () => entityLayer.cull(viewportBounds()));

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
    index: entityLayer.index,
    destroy(): void {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
      entityLayer.destroy();
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
