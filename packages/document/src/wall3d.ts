import type { Wall } from './entities';
import { DEFAULT_WALL_HEIGHT_CM } from './section';

/** Bir duvarın 3B kutu parametreleri (saf — three.js/DOM yok; engine/web üretir). */
export interface Wall3DBox {
  /** Kutu merkezi (plan düzleminde, cm). */
  readonly cx: number;
  readonly cy: number;
  /** Duvar uzunluğu (cm) = kutu uzun kenarı. */
  readonly length: number;
  /** Plan düzleminde dönüş açısı (radyan). */
  readonly angleRad: number;
  readonly thickness: number;
  readonly height: number;
}

/**
 * Duvarları 3B kutu parametrelerine çevirir (Faz 5 şematik 3B). Saf fonksiyon: her duvar, plan
 * orta noktasında, uzunluğu × kalınlığı × yüksekliğiyle ekstrüde edilmiş bir kutu olur.
 */
export function wallBoxes(
  walls: readonly Wall[],
  defaultHeight: number = DEFAULT_WALL_HEIGHT_CM,
): Wall3DBox[] {
  return walls.map((w) => {
    const dx = w.end.x - w.start.x;
    const dy = w.end.y - w.start.y;
    return {
      cx: (w.start.x + w.end.x) / 2,
      cy: (w.start.y + w.end.y) / 2,
      length: Math.hypot(dx, dy),
      angleRad: Math.atan2(dy, dx),
      thickness: w.thickness,
      height: w.height && w.height > 0 ? w.height : defaultHeight,
    };
  });
}
