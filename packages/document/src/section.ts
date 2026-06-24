import { segmentIntersection, distance, type Vec2 } from '@zynpparti/geometry';
import type { Opening, Wall } from './entities';

/**
 * Şematik kesit (ADR-0016) — saf hesap. Bir kesit çizgisi (a→b) çizilir; bu çizgiyi kesen duvarlar
 * "kesilmiş" sayılır ve kesit görünümünde, çizgi boyunca konumlarında (offset) duvar kalınlığı
 * genişliğinde, kat tabanından duvar yüksekliğine kadar dikdörtgenler olarak gösterilir.
 *
 * Kesit çizgisi bir duvarı **bir kapı/pencere boşluğunun** konumunda kesiyorsa, o boşluk kesitte
 * boşluk (void) olarak görünür: kapı = zeminden lento yüksekliğine kadar açık (üstte yalnız lento
 * kirişi); pencere = denizlik altı + lento üstü dolu, arası açık. Gerçek mimari kesit davranışı.
 *
 * Bu HAFİF şematik kesittir (duvar yüksekliği + konum + boşluk); tam 3B kesit Faz 5'tir (ADR-0016).
 * Yaklaşım: kesit genişliği = duvar kalınlığı (dik kesişim varsayımı; eğik duvarda kabaca doğru).
 * Saf TS (UI yok) → hem önizleme hem export aynı kodu kullanır.
 */

export const DEFAULT_WALL_HEIGHT_CM = 280;
/** Kapı lento (üst) yüksekliği — standart kapı kasası ~210 cm (İmar/pratik). */
export const DEFAULT_DOOR_HEAD_CM = 210;
/** Pencere denizlik (alt parapet) yüksekliği — tipik ~90 cm. */
export const DEFAULT_WINDOW_SILL_CM = 90;
/** Pencere lento (üst) yüksekliği — tipik ~210 cm (kapı lentosuyla hizalı). */
export const DEFAULT_WINDOW_HEAD_CM = 210;

/** Kesilen duvardaki boşluk (kapı/pencere) — kat tabanından ölçülen açık bant. */
export interface SectionOpening {
  readonly kind: 'door' | 'window';
  /** Boşluğun alt kenarı (cm, kat tabanından). Kapı = 0. */
  readonly sillCm: number;
  /** Boşluğun üst kenarı (cm, kat tabanından). */
  readonly headCm: number;
}

export interface SectionCut {
  /** Kesit çizgisi başından (a) duvarın kesildiği yere uzaklık (cm). */
  readonly offsetCm: number;
  /** Kesilen duvar gövdesi genişliği (cm) = duvar kalınlığı. */
  readonly widthCm: number;
  /** Duvar yüksekliği (cm). */
  readonly heightCm: number;
  /** Kesit çizgisi bu duvarı bir boşluk konumunda kesiyorsa o boşluk; yoksa dolu duvar. */
  readonly opening?: SectionOpening;
}

/** Kat tabanından ölçülen dolu (masif) dikey bant [from, to] (cm). */
export interface SolidBand {
  readonly from: number;
  readonly to: number;
}

export interface Section {
  /** Kesit çizgisinin toplam uzunluğu (cm) = kesit görünümünün genişliği. */
  readonly lengthCm: number;
  /** En yüksek duvar (cm) — görünüm ölçeklemesi için (0 = kesit boş). */
  readonly maxHeightCm: number;
  /** Kesilen duvarlar, çizgi boyunca soldan sağa sıralı. */
  readonly cuts: readonly SectionCut[];
}

/**
 * Bir kesimin **dolu** (çizilecek) dikey bantlarını verir — boşluk varsa açıklığı çıkarır.
 * Dolu duvar → tek bant [0, height]; kapı → yalnız lento [head, height]; pencere → denizlik
 * altı [0, sill] + lento üstü [head, height]. Boş bant (örn. tavana dayanan kapı) atlanır.
 */
export function solidBands(cut: SectionCut): SolidBand[] {
  const h = cut.heightCm;
  if (!cut.opening) return [{ from: 0, to: h }];
  const sill = Math.max(0, Math.min(cut.opening.sillCm, h));
  const head = Math.max(sill, Math.min(cut.opening.headCm, h));
  const bands: SolidBand[] = [];
  if (sill > 0) bands.push({ from: 0, to: sill }); // denizlik altı (kapıda sill=0 → atlanır)
  if (head < h) bands.push({ from: head, to: h }); // lento üstü kiriş
  return bands;
}

/**
 * Kesit çizgisi (a→b) ile kesişen duvarlardan şematik kesit profilini üretir. `openings` verilirse,
 * çizgi bir boşluk konumunda kesince o duvar parçası açık (void) gösterilir.
 */
export function computeSection(
  a: Vec2,
  b: Vec2,
  walls: readonly Wall[],
  openings: readonly Opening[] = [],
  defaultHeight: number = DEFAULT_WALL_HEIGHT_CM,
): Section {
  const lengthCm = distance(a, b);
  const byWall = new Map<string, Opening[]>();
  for (const o of openings) {
    const list = byWall.get(o.wallId);
    if (list) list.push(o);
    else byWall.set(o.wallId, [o]);
  }
  const cuts: SectionCut[] = [];
  for (const w of walls) {
    const x = segmentIntersection(a, b, w.start, w.end);
    if (!x) continue;
    const height = w.height && w.height > 0 ? w.height : defaultHeight;
    const opening = openingAtCut(w, x, byWall.get(w.id), height);
    cuts.push({
      offsetCm: distance(a, x),
      widthCm: w.thickness,
      heightCm: height,
      ...(opening ? { opening } : {}),
    });
  }
  cuts.sort((p, q) => p.offsetCm - q.offsetCm);
  const maxHeightCm = cuts.reduce((m, c) => Math.max(m, c.heightCm), 0);
  return { lengthCm, maxHeightCm, cuts };
}

/** Kesim noktası (x) duvar üstündeki bir boşluğun açıklığına denk geliyorsa o boşluğu döndürür. */
function openingAtCut(
  wall: Wall,
  x: Vec2,
  openings: Opening[] | undefined,
  wallHeight: number,
): SectionOpening | undefined {
  if (!openings || openings.length === 0) return undefined;
  const wallLen = distance(wall.start, wall.end);
  if (wallLen === 0) return undefined; // dejenere duvar → centerAlong=0, tüm openings başta sanılır
  const cutAlong = distance(wall.start, x); // x duvar segmenti üzerinde → start'a uzaklık = konum
  for (const o of openings) {
    const centerAlong = o.t * wallLen;
    if (Math.abs(cutAlong - centerAlong) <= o.width / 2) {
      if (o.kind === 'door') {
        return { kind: 'door', sillCm: 0, headCm: Math.min(DEFAULT_DOOR_HEAD_CM, wallHeight) };
      }
      return {
        kind: 'window',
        sillCm: Math.min(DEFAULT_WINDOW_SILL_CM, wallHeight),
        headCm: Math.min(DEFAULT_WINDOW_HEAD_CM, wallHeight),
      };
    }
  }
  return undefined;
}
