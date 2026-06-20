import { Application, Container, Graphics } from 'pixi.js';
import type { Vec2 } from '@zynpparti/geometry';
import { pointInPolygon } from '@zynpparti/geometry';
import type { EntityId, EntityStore } from '@zynpparti/document';
import { type Camera, DEFAULT_CAMERA, screenToWorld, zoomAt, clamp } from './transform';
import { EntityLayer } from './entity-layer';
import type { AABB, SpatialIndex } from './spatial-index';
import type { SceneTool, ScenePointer } from './tool';
import { installRoomFont } from './room-font';
import { LINEWEIGHTS, PALETTE } from './lineweights';

/** `createCanvasApp` tarafından döndürülen kontrol kolu. */
export interface CanvasHandle {
  readonly store: EntityStore;
  /** Mekânsal indeks (hit-test/snapping için). */
  readonly index: SpatialIndex;
  /** Araçların geçici (rubber-band/seçim) çizim yaptığı dünya-uzayı katmanı. */
  readonly overlay: Container;
  /** Bir ekran pikselinin kaç dünya birimi olduğu (zoom'a göre tolerans ölçekleme). */
  pixelSize(): number;
  /** Aktif aracı ayarla (null = araç yok, yalnız gezinme). */
  setActiveTool(tool: SceneTool | null): void;
  /** Bir mahal içine çift tıklanınca çağrılacak handler (ör. isim düzenleme). */
  setSpaceActivateHandler(cb: (id: EntityId) => void): void;
  /** Mevcut sahneyi PNG data-URL olarak dışa aktarır. */
  exportPng(): Promise<string>;
  destroy: () => void;
}

const GRID_SPACING = 50; // dünya birimi (cm)
const GRID_EXTENT = 5000;
const MIN_ZOOM = 0.05;
const MAX_ZOOM = 40;
const ZOOM_SENSITIVITY = 0.0015;

/**
 * PixiJS tuvali: gezinme (Space/orta-tuş ile pan, tekerlek ile zoom), ızgara, store'a abone
 * entity katmanı (mekânsal indeks + culling) ve aktif araca yönlendirilen etkileşim.
 * React'e bağımlı DEĞİL (saf DOM/PixiJS).
 */
export async function createCanvasApp(
  container: HTMLElement,
  store: EntityStore,
): Promise<CanvasHandle> {
  const app = new Application();
  await app.init({
    resizeTo: container,
    antialias: true,
    background: PALETTE.background,
    autoDensity: true,
    resolution: window.devicePixelRatio || 1,
  });
  container.appendChild(app.canvas);

  installRoomFont(); // mahal etiketleri için TR_CHARSET atlasını hazırla (I18N-TEXT.md)

  const world = new Container();
  app.stage.addChild(world);
  const redrawGrid = buildGrid(world);

  const entityLayer = new EntityLayer(store);
  world.addChild(entityLayer.container);

  const overlay = new Container();
  world.addChild(overlay);

  let camera: Camera = DEFAULT_CAMERA;
  let activeTool: SceneTool | null = null;
  let spaceActivate: ((id: EntityId) => void) | null = null;

  function viewportBounds(): AABB {
    const tl = screenToWorld({ x: 0, y: 0 }, camera);
    const br = screenToWorld({ x: app.screen.width, y: app.screen.height }, camera);
    return { minX: tl.x, minY: tl.y, maxX: br.x, maxY: br.y };
  }

  function applyCamera(): void {
    world.position.set(camera.x, camera.y);
    world.scale.set(camera.zoom);
    const pixelSize = 1 / camera.zoom;
    entityLayer.updateLineweights(pixelSize); // ekran-sabit konturlar (yalnız zoom değişince)
    redrawGrid(pixelSize);
    entityLayer.cull(viewportBounds());
  }

  camera = { x: app.screen.width / 2, y: app.screen.height / 2, zoom: 1 };
  applyCamera();
  app.renderer.on('resize', () => entityLayer.cull(viewportBounds()));

  const canvas = app.canvas;

  function pointerPos(e: MouseEvent): Vec2 {
    const rect = canvas.getBoundingClientRect();
    const sx = app.screen.width / rect.width;
    const sy = app.screen.height / rect.height;
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  }

  function scenePointer(e: PointerEvent): ScenePointer {
    return {
      world: screenToWorld(pointerPos(e), camera),
      shiftKey: e.shiftKey,
      altKey: e.altKey,
      ctrlKey: e.ctrlKey || e.metaKey,
    };
  }

  // --- Gezinme durumu ---
  let spaceHeld = false;
  let panning = false;
  let panStart: Vec2 = { x: 0, y: 0 };
  let cameraStart: Camera = camera;

  function beginPan(e: PointerEvent): void {
    panning = true;
    panStart = pointerPos(e);
    cameraStart = camera;
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = 'grabbing';
  }

  function onPointerDown(e: PointerEvent): void {
    const wantsPan = spaceHeld || e.button === 1; // Space-basılı veya orta tuş
    if (wantsPan) {
      beginPan(e);
      return;
    }
    if (e.button === 0) activeTool?.onPointerDown?.(scenePointer(e));
  }

  function onPointerMove(e: PointerEvent): void {
    if (panning) {
      const p = pointerPos(e);
      camera = {
        zoom: cameraStart.zoom,
        x: cameraStart.x + (p.x - panStart.x),
        y: cameraStart.y + (p.y - panStart.y),
      };
      applyCamera();
      return;
    }
    activeTool?.onPointerMove?.(scenePointer(e));
  }

  function onPointerUp(e: PointerEvent): void {
    if (panning) {
      panning = false;
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
      canvas.style.cursor = spaceHeld ? 'grab' : 'default';
      return;
    }
    activeTool?.onPointerUp?.(scenePointer(e));
  }

  // Mahal içine çift tık → isim düzenleme (aktif araçtan bağımsız; CLAUDE.md UX cilası).
  function onDblClick(e: MouseEvent): void {
    if (!spaceActivate) return;
    const world = screenToWorld(pointerPos(e), camera);
    const ids = entityLayer.index.search({
      minX: world.x,
      minY: world.y,
      maxX: world.x,
      maxY: world.y,
    });
    for (const id of ids) {
      const ent = store.get(id);
      if (ent?.type === 'space' && pointInPolygon(world, ent.boundary)) {
        e.preventDefault();
        spaceActivate(id);
        return;
      }
    }
  }

  function onWheel(e: WheelEvent): void {
    e.preventDefault();
    const pivot = pointerPos(e);
    const factor = Math.exp(-e.deltaY * ZOOM_SENSITIVITY);
    const newZoom = clamp(camera.zoom * factor, MIN_ZOOM, MAX_ZOOM);
    camera = zoomAt(camera, pivot, newZoom);
    applyCamera();
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (e.code === 'Space' && !spaceHeld) {
      spaceHeld = true;
      if (!panning) canvas.style.cursor = 'grab';
      e.preventDefault();
      return;
    }
    activeTool?.onKeyDown?.(e);
  }

  function onKeyUp(e: KeyboardEvent): void {
    if (e.code === 'Space') {
      spaceHeld = false;
      if (!panning) canvas.style.cursor = 'default';
    }
  }

  canvas.style.cursor = 'default';
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointerleave', onPointerUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('dblclick', onDblClick);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  return {
    store,
    index: entityLayer.index,
    overlay,
    pixelSize: () => 1 / camera.zoom,
    exportPng: () => app.renderer.extract.base64({ target: app.stage, format: 'png' }),
    setSpaceActivateHandler(cb: (id: EntityId) => void): void {
      spaceActivate = cb;
    },
    setActiveTool(tool: SceneTool | null): void {
      if (activeTool === tool) return;
      activeTool?.onDeactivate?.();
      activeTool = tool;
      activeTool?.onActivate?.();
    },
    destroy(): void {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('dblclick', onDblClick);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      activeTool?.onDeactivate?.();
      entityLayer.destroy();
      app.destroy(true, { children: true });
    },
  };
}

/**
 * Izgara + eksenleri kurar ve zoom'da yeniden çizen fonksiyonu döndürür. Izgara en ince
 * (hairline) ve ekran-sabittir → zoom'la şişmez, geri planda kalır (VISUAL-CRAFT §1/§6).
 */
function buildGrid(target: Container): (pixelSize: number) => void {
  const grid = new Graphics();
  const axes = new Graphics();
  target.addChild(grid);
  target.addChild(axes);

  let lastPx = -1;
  return (pixelSize: number): void => {
    if (Math.abs(pixelSize - lastPx) < 1e-9) return;
    lastPx = pixelSize;

    grid.clear();
    for (let x = -GRID_EXTENT; x <= GRID_EXTENT; x += GRID_SPACING) {
      grid.moveTo(x, -GRID_EXTENT).lineTo(x, GRID_EXTENT);
    }
    for (let y = -GRID_EXTENT; y <= GRID_EXTENT; y += GRID_SPACING) {
      grid.moveTo(-GRID_EXTENT, y).lineTo(GRID_EXTENT, y);
    }
    grid.stroke({ width: LINEWEIGHTS.hairline * pixelSize, color: PALETTE.grid });

    axes.clear();
    axes.moveTo(-GRID_EXTENT, 0).lineTo(GRID_EXTENT, 0);
    axes.moveTo(0, -GRID_EXTENT).lineTo(0, GRID_EXTENT);
    axes.stroke({ width: LINEWEIGHTS.thin * pixelSize, color: PALETTE.axis });
  };
}
