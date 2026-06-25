import { Application, Container, Graphics } from 'pixi.js';
import type { Vec2 } from '@zynpparti/geometry';
import { pointInPolygon } from '@zynpparti/geometry';
import { commentSize, pointInAnnotation, type EntityId, type EntityStore } from '@zynpparti/document';
import { type Camera, DEFAULT_CAMERA, screenToWorld, zoomAt, clamp } from './transform';
import { EntityLayer } from './entity-layer';
import type { AABB, SpatialIndex } from './spatial-index';
import type { SceneTool, ScenePointer } from './tool';
import { installRoomFont } from './room-font';
import { LINEWEIGHTS, PALETTE } from './lineweights';
import { LayerState } from './layer-state';

/** `createCanvasApp` tarafından döndürülen kontrol kolu. */
export interface CanvasHandle {
  readonly store: EntityStore;
  /** Mekânsal indeks (hit-test/snapping için). */
  readonly index: SpatialIndex;
  /** Araçların geçici (rubber-band/seçim) çizim yaptığı dünya-uzayı katmanı. */
  readonly overlay: Container;
  /** Katman görünürlük durumu (panel + hit-test paylaşır). */
  readonly layers: LayerState;
  /** Bir ekran pikselinin kaç dünya birimi olduğu (zoom'a göre tolerans ölçekleme). */
  pixelSize(): number;
  /** Görünür dünya-uzayı kutusu (ekrandaki alan). Snapping'i görünür geometriyle sınırlamak için. */
  viewportBounds(): AABB;
  /** Aktif aracı ayarla (null = araç yok, yalnız gezinme). */
  setActiveTool(tool: SceneTool | null): void;
  /** Tuval imlecini ayarla (araç başına; pan/space geçici olarak geçersiz kılar). */
  setCursor(cursor: string): void;
  /** Bir mahal içine çift tıklanınca çağrılacak handler (ör. isim düzenleme). */
  setSpaceActivateHandler(cb: (id: EntityId) => void): void;
  /** Bir açıklama metnine çift tıklanınca çağrılacak handler (ör. metin düzenleme). */
  setAnnotationActivateHandler(cb: (id: EntityId) => void): void;
  /** Bir yoruma çift tıklanınca çağrılacak handler (düzenle/çözüldü/sil menüsü). */
  setCommentActivateHandler(cb: (id: EntityId) => void): void;
  /** İmleç hareket ettikçe dünya koordinatını (cm), tuvalden çıkınca null bildirir (durum çubuğu). */
  setHoverHandler(cb: (world: Vec2 | null) => void): void;
  /** Sağ-tık (contextmenu) olunca ekran koordinatını bildirir (bağlam menüsü). */
  setContextMenuHandler(cb: (screenX: number, screenY: number) => void): void;
  /** Mevcut sahneyi PNG data-URL olarak dışa aktarır. */
  exportPng(): Promise<string>;
  /** Tüm entity'leri ekrana sığacak şekilde kamerayı ayarlar (zoom extents). */
  zoomToFit(): void;
  /** Kamerayı verilen dünya-uzayı kutusuna odaklar (pafta "Git" navigasyonu). */
  zoomToBounds(b: AABB): void;
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

  const layers = new LayerState();
  const entityLayer = new EntityLayer(store, layers);
  world.addChild(entityLayer.container);

  // Not: Kesit (A—A') işareti artık kalıcı bir `section` entity'sidir (ADR-0039) → EntityLayer çizer.

  const overlay = new Container();
  world.addChild(overlay);

  let camera: Camera = DEFAULT_CAMERA;
  let activeTool: SceneTool | null = null;
  let spaceActivate: ((id: EntityId) => void) | null = null;
  let annotationActivate: ((id: EntityId) => void) | null = null;
  let commentActivate: ((id: EntityId) => void) | null = null;
  let hoverCb: ((world: Vec2 | null) => void) | null = null;
  let contextMenuCb: ((screenX: number, screenY: number) => void) | null = null;

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
  const onResize = (): void => entityLayer.cull(viewportBounds());
  app.renderer.on('resize', onResize);

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
  let toolCursor = 'default'; // aktif aracın imleci (pan bittiğinde geri yüklenir)

  // Aktif aracın bir handler'ı patlarsa tüm etkileşim donmasın → logla, devam et.
  function guardTool(label: string, fn: () => void): void {
    try {
      fn();
    } catch (err) {
      console.error(`Araç hatası (${label}):`, err);
    }
  }

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
    if (e.button === 0) {
      // Pointer capture: sürükleme (kutu-seçim/taşıma) sırasında imleç panellerin üstüne geçse
      // bile olaylar tuvale gelir → seçim iptal olmaz (Figma/Rayon davranışı).
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        /* capture desteklenmiyorsa yoksay */
      }
      guardTool('pointerDown', () => activeTool?.onPointerDown?.(scenePointer(e)));
    }
  }

  function onPointerMove(e: PointerEvent): void {
    hoverCb?.(screenToWorld(pointerPos(e), camera)); // durum çubuğu koordinatı (pan sırasında da geçerli)
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
    guardTool('pointerMove', () => activeTool?.onPointerMove?.(scenePointer(e)));
  }

  function onPointerUp(e: PointerEvent): void {
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    if (panning) {
      panning = false;
      canvas.style.cursor = spaceHeld ? 'grab' : toolCursor;
      return;
    }
    guardTool('pointerUp', () => activeTool?.onPointerUp?.(scenePointer(e)));
  }

  // Çift tık → yerinde düzenleme (aktif araçtan bağımsız; CLAUDE.md UX cilası):
  // mahal içinde → ad düzenle; açıklama metninde → metin düzenle.
  function onDblClick(e: MouseEvent): void {
    if (!spaceActivate && !annotationActivate && !commentActivate) return;
    const world = screenToWorld(pointerPos(e), camera);
    const ids = entityLayer.index.search({
      minX: world.x,
      minY: world.y,
      maxX: world.x,
      maxY: world.y,
    });
    for (const id of ids) {
      const ent = store.get(id);
      // Gizli/kilitli katmandaki entity yerinde-düzenlemeye AÇILMAZ (tek-tık hit-test ile tutarlı).
      if (!ent || layers.isHidden(ent.layerId) || layers.isLocked(ent.layerId)) continue;
      if (spaceActivate && ent.type === 'space' && pointInPolygon(world, ent.boundary)) {
        e.preventDefault();
        spaceActivate(id);
        return;
      }
      if (annotationActivate && ent.type === 'annotation' && pointInAnnotation(ent, world)) {
        e.preventDefault();
        annotationActivate(id);
        return;
      }
      if (commentActivate && ent.type === 'comment') {
        // Yorum baloncuğu position'ın YUKARISINDA → kutu testi (hit-test ile aynı).
        const { w, h } = commentSize(ent);
        const px = ent.position.x;
        const py = ent.position.y;
        if (world.x >= px && world.x <= px + w && world.y >= py - h && world.y <= py) {
          e.preventDefault();
          commentActivate(id);
          return;
        }
      }
    }
  }

  /** Kamerayı verilen dünya-uzayı kutusuna sığdırır (%10 boşlukla). Pafta "Git" + zoomToFit kullanır. */
  function zoomToBounds(b: AABB): void {
    const bw = Math.max(b.maxX - b.minX, 1);
    const bh = Math.max(b.maxY - b.minY, 1);
    const pad = 0.1; // her kenarda %10 boşluk
    const zoom = clamp(
      Math.min((app.screen.width * (1 - 2 * pad)) / bw, (app.screen.height * (1 - 2 * pad)) / bh),
      MIN_ZOOM,
      MAX_ZOOM,
    );
    const cx = (b.minX + b.maxX) / 2;
    const cy = (b.minY + b.maxY) / 2;
    camera = { zoom, x: app.screen.width / 2 - cx * zoom, y: app.screen.height / 2 - cy * zoom };
    applyCamera();
  }

  function zoomToFit(): void {
    const b = entityLayer.index.bounds();
    if (b) zoomToBounds(b);
  }

  function onWheel(e: WheelEvent): void {
    e.preventDefault();
    const pivot = pointerPos(e);
    const factor = Math.exp(-e.deltaY * ZOOM_SENSITIVITY);
    const newZoom = clamp(camera.zoom * factor, MIN_ZOOM, MAX_ZOOM);
    camera = zoomAt(camera, pivot, newZoom);
    applyCamera();
  }

  // Bir metin/sayı kutusunda yazarken klavye tuval kısayollarını (Space-pan, Home, araç harfleri)
  // çalmamalı — odak düzenlenebilir bir öğedeyse tuval klavyesini atla.
  function isEditableTarget(t: EventTarget | null): boolean {
    const el = t as HTMLElement | null;
    if (!el || !el.tagName) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (isEditableTarget(e.target)) return;
    if (e.code === 'Space' && !spaceHeld) {
      spaceHeld = true;
      if (!panning) canvas.style.cursor = 'grab';
      e.preventDefault();
      return;
    }
    if (e.key === 'Home') {
      zoomToFit();
      e.preventDefault();
      return;
    }
    guardTool('keyDown', () => activeTool?.onKeyDown?.(e));
  }

  function onKeyUp(e: KeyboardEvent): void {
    if (e.code === 'Space') {
      spaceHeld = false;
      if (!panning) canvas.style.cursor = toolCursor;
    }
  }

  canvas.style.cursor = 'default';
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  // pointercancel (tarayıcı jesti / odak kaybı): pan'i güvenle sonlandır, yoksa "grabbing"de takılır.
  canvas.addEventListener('pointercancel', onPointerUp);
  // NOT: pointerleave artık onPointerUp ÇAĞIRMAZ — sürükleme pointer-capture'la sürdüğünden imleç
  // panellere/tuval dışına geçince hareket erkenden bitip seçimi iptal etmemeli. Yalnız hover temizlenir.
  const onPointerLeaveHover = (): void => hoverCb?.(null);
  canvas.addEventListener('pointerleave', onPointerLeaveHover);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('dblclick', onDblClick);
  const onContextMenu = (e: MouseEvent): void => {
    e.preventDefault(); // tarayıcı menüsünü bastır
    contextMenuCb?.(e.clientX, e.clientY);
  };
  canvas.addEventListener('contextmenu', onContextMenu);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  return {
    store,
    index: entityLayer.index,
    overlay,
    layers,
    pixelSize: () => 1 / camera.zoom,
    viewportBounds,
    exportPng: async () => {
      // WebGL bağlamı kaybı / extract desteklenmemesi → anlamlı hata (çağıran yakalar).
      try {
        return await app.renderer.extract.base64({ target: app.stage, format: 'png' });
      } catch (err) {
        console.error('PNG extract başarısız:', err);
        throw new Error('Tuval görüntüsü alınamadı (WebGL bağlamı hazır değil).');
      }
    },
    zoomToFit,
    zoomToBounds,
    setSpaceActivateHandler(cb: (id: EntityId) => void): void {
      spaceActivate = cb;
    },
    setAnnotationActivateHandler(cb: (id: EntityId) => void): void {
      annotationActivate = cb;
    },
    setCommentActivateHandler(cb: (id: EntityId) => void): void {
      commentActivate = cb;
    },
    setHoverHandler(cb: (world: Vec2 | null) => void): void {
      hoverCb = cb;
    },
    setContextMenuHandler(cb: (screenX: number, screenY: number) => void): void {
      contextMenuCb = cb;
    },
    setActiveTool(tool: SceneTool | null): void {
      if (activeTool === tool) return;
      activeTool?.onDeactivate?.();
      activeTool = tool;
      activeTool?.onActivate?.();
    },
    setCursor(cursor: string): void {
      toolCursor = cursor;
      if (!panning && !spaceHeld) canvas.style.cursor = cursor;
    },
    destroy(): void {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerLeaveHover);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('dblclick', onDblClick);
      canvas.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      app.renderer.off('resize', onResize); // tutarlı temizlik (app.destroy zaten renderer'ı söker)
      activeTool?.onDeactivate?.();
      entityLayer.destroy();
      app.destroy(true, { children: true });
    },
  };
}

/**
 * Izgara + eksenleri kurar ve zoom'da yeniden çizen fonksiyonu döndürür. Hiyerarşi (VISUAL-CRAFT
 * §1/§6): ince çizgiler (her 50 cm, hairline) + ana çizgiler (her 1 m, biraz belirgin) + eksenler.
 * Hepsi ekran-sabit → zoom'la şişmez, geri planda kalır.
 */
const GRID_MAJOR_EVERY = 2; // her 2. çizgi (= 1 m) ana çizgi

/**
 * Arka plan ızgarası (background grid). Sayfalar artık gerçek `sheet` (sade) entity'leridir
 * (render-sheet) — ızgara sadece zemindir. Yalnız zoom değişince yeniden çizilir.
 */
function buildGrid(target: Container): (pixelSize: number) => void {
  const minor = new Graphics();
  const major = new Graphics();
  const axes = new Graphics();
  target.addChild(minor, major, axes);

  let lastPx = -1;
  return (pixelSize: number): void => {
    if (Math.abs(pixelSize - lastPx) < 1e-9) return;
    lastPx = pixelSize;
    const step = GRID_SPACING * GRID_MAJOR_EVERY;

    minor.clear();
    major.clear();
    for (let x = -GRID_EXTENT; x <= GRID_EXTENT; x += GRID_SPACING) {
      const g = x % step === 0 ? major : minor;
      g.moveTo(x, -GRID_EXTENT).lineTo(x, GRID_EXTENT);
    }
    for (let y = -GRID_EXTENT; y <= GRID_EXTENT; y += GRID_SPACING) {
      const g = y % step === 0 ? major : minor;
      g.moveTo(-GRID_EXTENT, y).lineTo(GRID_EXTENT, y);
    }
    minor.stroke({ width: LINEWEIGHTS.hairline * pixelSize, color: PALETTE.grid });
    major.stroke({ width: LINEWEIGHTS.hairline * pixelSize, color: PALETTE.gridMajor });

    axes.clear();
    axes.moveTo(-GRID_EXTENT, 0).lineTo(GRID_EXTENT, 0);
    axes.moveTo(0, -GRID_EXTENT).lineTo(0, GRID_EXTENT);
    axes.stroke({ width: LINEWEIGHTS.thin * pixelSize, color: PALETTE.axis });
  };
}
