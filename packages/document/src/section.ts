import { segmentIntersection, distance, type Vec2 } from '@zynpparti/geometry';
import type { Wall } from './entities';

/**
 * Şematik kesit (ADR-0016) — saf hesap. Bir kesit çizgisi (a→b) çizilir; bu çizgiyi kesen duvarlar
 * "kesilmiş" sayılır ve kesit görünümünde, çizgi boyunca konumlarında (offset) duvar kalınlığı
 * genişliğinde, kat tabanından duvar yüksekliğine kadar dikdörtgenler olarak gösterilir.
 *
 * Bu HAFİF şematik kesittir (duvar yüksekliği + konum); tam 3B kesit Faz 5'tir (ADR-0016).
 * Yaklaşım: kesit genişliği = duvar kalınlığı (dik kesişim varsayımı; eğik duvarda kabaca doğru).
 * Saf TS (UI yok) → hem önizleme hem export aynı kodu kullanır.
 */

export const DEFAULT_WALL_HEIGHT_CM = 280;

export interface SectionCut {
  /** Kesit çizgisi başından (a) duvarın kesildiği yere uzaklık (cm). */
  readonly offsetCm: number;
  /** Kesilen duvar gövdesi genişliği (cm) = duvar kalınlığı. */
  readonly widthCm: number;
  /** Duvar yüksekliği (cm). */
  readonly heightCm: number;
}

export interface Section {
  /** Kesit çizgisinin toplam uzunluğu (cm) = kesit görünümünün genişliği. */
  readonly lengthCm: number;
  /** En yüksek duvar (cm) — görünüm ölçeklemesi için (0 = kesit boş). */
  readonly maxHeightCm: number;
  /** Kesilen duvarlar, çizgi boyunca soldan sağa sıralı. */
  readonly cuts: readonly SectionCut[];
}

/** Kesit çizgisi (a→b) ile kesişen duvarlardan şematik kesit profilini üretir. */
export function computeSection(
  a: Vec2,
  b: Vec2,
  walls: readonly Wall[],
  defaultHeight: number = DEFAULT_WALL_HEIGHT_CM,
): Section {
  const lengthCm = distance(a, b);
  const cuts: SectionCut[] = [];
  for (const w of walls) {
    const x = segmentIntersection(a, b, w.start, w.end);
    if (!x) continue;
    const height = w.height && w.height > 0 ? w.height : defaultHeight;
    cuts.push({ offsetCm: distance(a, x), widthCm: w.thickness, heightCm: height });
  }
  cuts.sort((p, q) => p.offsetCm - q.offsetCm);
  const maxHeightCm = cuts.reduce((m, c) => Math.max(m, c.heightCm), 0);
  return { lengthCm, maxHeightCm, cuts };
}
