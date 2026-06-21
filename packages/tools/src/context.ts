import type { Container } from 'pixi.js';
import type { Vec2 } from '@zynpparti/geometry';
import { distance } from '@zynpparti/geometry';
import type { Entity, EntityStore, History } from '@zynpparti/document';
import type { SnapHint, SpatialIndex } from '@zynpparti/engine';

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
}

const SNAP_PX = 12; // ekran pikseli yarıçapı (tam nokta yakalama)
const ALIGN_PX = 8; // ekran pikseli toleransı (eksen hizalama)
const SNAP_GRID = 50; // cm (ızgara adımı)
const BIG = 1e7; // şerit aramada "sonsuz" eksen uzunluğu (dünya birimi)

/** Bir entity'nin snap/hizalama anahtar noktaları (dünya). Mahal/boşluk türetilmiş → katkı vermez. */
function keyPoints(e: Entity): readonly Vec2[] {
  switch (e.type) {
    case 'wall':
      return [e.start, e.end];
    case 'block':
    case 'annotation':
    case 'sheet':
      return [e.position];
    case 'dimension':
      return [e.a, e.b];
    case 'parcel':
      return e.boundary;
    case 'space':
    case 'opening':
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
    for (const pt of keyPoints(e)) {
      const d = Math.abs(pt[axis] - world[axis]);
      if (d < bestD) {
        bestD = d;
        best = { value: pt[axis], ref: pt };
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

    // 1) Tam nokta yakalama (öncelik).
    const r = SNAP_PX * px;
    let best: Vec2 | null = null;
    let bestD = r;
    for (const id of index.search({
      minX: world.x - r,
      minY: world.y - r,
      maxX: world.x + r,
      maxY: world.y + r,
    })) {
      const e = store.get(id);
      if (!e) continue;
      for (const pt of keyPoints(e)) {
        const d = distance(world, pt);
        if (d < bestD) {
          bestD = d;
          best = pt;
        }
      }
    }
    if (best) {
      onSnap?.({ point: { x: best.x, y: best.y }, vGuide: null, hGuide: null });
      return { x: best.x, y: best.y };
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
