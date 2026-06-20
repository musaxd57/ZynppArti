import type { Container } from 'pixi.js';
import type { Vec2 } from '@zynpparti/geometry';
import { distance } from '@zynpparti/geometry';
import type { EntityStore, History } from '@zynpparti/document';
import type { SpatialIndex } from '@zynpparti/engine';

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
}

const SNAP_PX = 12; // ekran pikseli yarıçapı
const SNAP_GRID = 50; // cm (ızgara adımı)

/**
 * Snapping fonksiyonu üretir: önce yakın duvar uç noktaları (rbush ile), yoksa ızgara.
 * Yarıçap ekran-sabit (pixelSize ile ölçeklenir) → her zoom'da aynı his (ENGINEERING-NOTES §2).
 */
export function createSnapper(
  store: EntityStore,
  index: SpatialIndex,
  pixelSize: () => number,
): (world: Vec2) => Vec2 {
  return (world: Vec2): Vec2 => {
    const r = SNAP_PX * pixelSize();
    const ids = index.search({
      minX: world.x - r,
      minY: world.y - r,
      maxX: world.x + r,
      maxY: world.y + r,
    });
    let best: Vec2 | null = null;
    let bestD = r;
    for (const id of ids) {
      const e = store.get(id);
      if (e?.type === 'wall') {
        for (const pt of [e.start, e.end]) {
          const d = distance(world, pt);
          if (d < bestD) {
            bestD = d;
            best = pt;
          }
        }
      }
    }
    if (best) return { x: best.x, y: best.y };
    return {
      x: Math.round(world.x / SNAP_GRID) * SNAP_GRID,
      y: Math.round(world.y / SNAP_GRID) * SNAP_GRID,
    };
  };
}
