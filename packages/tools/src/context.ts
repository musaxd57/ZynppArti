import type { Container } from 'pixi.js';
import type { Vec2 } from '@zynpparti/geometry';
import { distance, closestPointOnSegment, segmentIntersection } from '@zynpparti/geometry';
import type { Entity, EntityId, EntityStore, History } from '@zynpparti/document';
import type { SnapHint, SnapPointKind, SpatialIndex } from '@zynpparti/engine';

/**
 * Araçların ihtiyaç duyduğu servisler. Web uygulaması bunu kurar ve `ToolManager`'a verir.
 * (Engine, store, history ve mekânsal indeksi sağlar; overlay geçici çizim katmanıdır.)
 */
export interface ToolContext {
  readonly store: EntityStore;
  readonly history: History;
  readonly index: SpatialIndex;
  readonly overlay: Container;
  /** Bir ekran pikselinin dünya birimi karşılığı (tolerans/yarıçap ölçekleme). */
  pixelSize(): number;
  /** Dünya noktasını en yakın uç noktaya, yoksa ızgaraya yakalar. */
  snap(world: Vec2): Vec2;
  /** Katman gizliyse o entity seçilemez/silinemez (hit-test atlar). İsteğe bağlı. */
  isLayerHidden?(layerId: string): boolean;
  /** Katman kilitliyse seçilemez/düzenlenemez (görünür kalır). İsteğe bağlı. */
  isLayerLocked?(layerId: string): boolean;
  /** Tuval imlecini ayarla (araç başına). İsteğe bağlı. */
  setCursor?(cursor: string): void;
  /** Seçim değişince çağrılır (Özellikler paneli için seçili id'ler). İsteğe bağlı. */
  onSelectionChange?(ids: EntityId[]): void;
}

const SNAP_PX = 12; // ekran pikseli yarıçapı (tam nokta yakalama)
const ALIGN_PX = 8; // ekran pikseli toleransı (eksen hizalama)
const SNAP_GRID = 50; // cm (ızgara adımı)
const BIG = 1e7; // şerit aramada "sonsuz" eksen uzunluğu (dünya birimi)

/** Snap anahtar noktası + türü (gösterge glyph'i için). */
interface SnapPoint {
  readonly p: Vec2;
  readonly kind: SnapPointKind;
}

const mid = (a: Vec2, b: Vec2): Vec2 => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

/**
 * Bir entity'nin snap/hizalama anahtar noktaları (dünya) + türleri. Köşeler (endpoint),
 * kenar ortaları (midpoint). Mahal/boşluk türetilmiş → katkı vermez.
 */
function snapPoints(e: Entity): readonly SnapPoint[] {
  switch (e.type) {
    case 'wall':
      return [
        { p: e.start, kind: 'endpoint' },
        { p: e.end, kind: 'endpoint' },
        { p: mid(e.start, e.end), kind: 'midpoint' },
      ];
    case 'block':
    case 'annotation':
    case 'sheet':
      return [{ p: e.position, kind: 'endpoint' }];
    case 'dimension':
    case 'section':
      return [
        { p: e.a, kind: 'endpoint' },
        { p: e.b, kind: 'endpoint' },
        { p: mid(e.a, e.b), kind: 'midpoint' },
      ];
    case 'parcel': {
      const pts: SnapPoint[] = [];
      const b = e.boundary;
      for (let i = 0; i < b.length; i++) {
        const a = b[i];
        const next = b[(i + 1) % b.length];
        if (!a || !next) continue;
        pts.push({ p: a, kind: 'endpoint' });
        pts.push({ p: mid(a, next), kind: 'midpoint' });
      }
      return pts;
    }
    case 'space':
    case 'opening':
      return [];
  }
}

/** Bir entity'nin kenar segmentleri (kenar-üstü/dik yakalama için). */
function segmentsOf(e: Entity): readonly (readonly [Vec2, Vec2])[] {
  switch (e.type) {
    case 'wall':
      return [[e.start, e.end]];
    case 'dimension':
    case 'section':
      return [[e.a, e.b]];
    case 'parcel': {
      const segs: (readonly [Vec2, Vec2])[] = [];
      const b = e.boundary;
      for (let i = 0; i < b.length; i++) {
        const a = b[i];
        const next = b[(i + 1) % b.length];
        if (a && next) segs.push([a, next]);
      }
      return segs;
    }
    default:
      return [];
  }
}

/** Verilen eksende imleçle hizalı en yakın anahtar noktayı bulur (şerit arama). */
function nearestAxis(
  store: EntityStore,
  index: SpatialIndex,
  world: Vec2,
  axis: 'x' | 'y',
  tol: number,
): { value: number; ref: Vec2 } | null {
  const box =
    axis === 'x'
      ? { minX: world.x - tol, maxX: world.x + tol, minY: -BIG, maxY: BIG }
      : { minX: -BIG, maxX: BIG, minY: world.y - tol, maxY: world.y + tol };
  let best: { value: number; ref: Vec2 } | null = null;
  let bestD = tol;
  for (const id of index.search(box)) {
    const e = store.get(id);
    if (!e) continue;
    for (const sp of snapPoints(e)) {
      const d = Math.abs(sp.p[axis] - world[axis]);
      if (d < bestD) {
        bestD = d;
        best = { value: sp.p[axis], ref: sp.p };
      }
    }
  }
  return best;
}

/**
 * Snapping fonksiyonu üretir (ENGINEERING-NOTES §2): öncelik sırasıyla
 * (1) yakın anahtar nokta (duvar ucu/blok merkezi/ölçü ucu…), (2) başka bir noktayla **eksen
 * hizalaması** (yatay/dikey kılavuz), (3) ızgara. Yarıçaplar ekran-sabit → her zoom'da aynı his.
 * `onSnap` gösterge için zengin ipucu (nokta + kılavuz segmentleri) yayınlar.
 *
 * Not: hizalama, şerit (strip) rbush aramasıyla bulunur; çok büyük modellerde şerit çok aday
 * döndürebilir — gerekirse ileride aday sınırı/kademeli arama eklenir (PERFORMANCE.md).
 */
export function createSnapper(
  store: EntityStore,
  index: SpatialIndex,
  pixelSize: () => number,
  onSnap?: (hint: SnapHint) => void,
): (world: Vec2) => Vec2 {
  return (world: Vec2): Vec2 => {
    const px = pixelSize();

    // 1) Tam nokta yakalama (köşe/orta, öncelik) ve 1.5) kenar-üstü yakalama — tek rbush aramasıyla.
    const r = SNAP_PX * px;
    let bestPt: SnapPoint | null = null;
    let bestPtD = r;
    let bestEdge: Vec2 | null = null;
    let bestEdgeD = r;
    const nearSegs: (readonly [Vec2, Vec2])[] = [];
    for (const id of index.search({
      minX: world.x - r,
      minY: world.y - r,
      maxX: world.x + r,
      maxY: world.y + r,
    })) {
      const e = store.get(id);
      if (!e) continue;
      for (const sp of snapPoints(e)) {
        const d = distance(world, sp.p);
        if (d < bestPtD) {
          bestPtD = d;
          bestPt = sp;
        }
      }
      for (const seg of segmentsOf(e)) {
        nearSegs.push(seg);
        const c = closestPointOnSegment(world, seg[0], seg[1]);
        const d = distance(world, c);
        if (d < bestEdgeD) {
          bestEdgeD = d;
          bestEdge = c;
        }
      }
    }

    // Kesişim: yakındaki segment çiftlerinin gerçek çaprazları (kenardan öncelikli).
    let bestIx: Vec2 | null = null;
    let bestIxD = r;
    for (let i = 0; i < nearSegs.length; i++) {
      for (let j = i + 1; j < nearSegs.length; j++) {
        const segA = nearSegs[i];
        const segB = nearSegs[j];
        if (!segA || !segB) continue;
        const x = segmentIntersection(segA[0], segA[1], segB[0], segB[1]);
        if (!x) continue;
        const d = distance(world, x);
        if (d < bestIxD) {
          bestIxD = d;
          bestIx = x;
        }
      }
    }

    // Öncelik: köşe/orta nokta > kesişim > kenar-üstü (hepsi güçlüden zayıfa niyet).
    if (bestPt) {
      const p = { x: bestPt.p.x, y: bestPt.p.y };
      onSnap?.({ point: p, pointKind: bestPt.kind, vGuide: null, hGuide: null });
      return p;
    }
    if (bestIx) {
      onSnap?.({ point: bestIx, pointKind: 'intersection', vGuide: null, hGuide: null });
      return bestIx;
    }
    if (bestEdge) {
      onSnap?.({ point: bestEdge, pointKind: 'edge', vGuide: null, hGuide: null });
      return bestEdge;
    }

    // 2) Eksen hizalama (yoksa 3) ızgara). Eksenler bağımsız: biri hizalanırken diğeri ızgaraya düşebilir.
    const aTol = ALIGN_PX * px;
    const vx = nearestAxis(store, index, world, 'x', aTol);
    const hy = nearestAxis(store, index, world, 'y', aTol);
    const snapped: Vec2 = {
      x: vx ? vx.value : Math.round(world.x / SNAP_GRID) * SNAP_GRID,
      y: hy ? hy.value : Math.round(world.y / SNAP_GRID) * SNAP_GRID,
    };
    onSnap?.({
      point: null,
      vGuide: vx ? [vx.ref, snapped] : null,
      hGuide: hy ? [hy.ref, snapped] : null,
    });
    return snapped;
  };
}
