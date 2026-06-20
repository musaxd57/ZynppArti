import { polygonArea, distanceToSegment, type Vec2 } from '@zynpparti/geometry';
import type { RoomType, Space, Wall } from './entities';

/**
 * Canlı metrik paneli çekirdeği (Faz 2A, FAZ2-NOTES §2b).
 * Saf TS — UI yok, test edilebilir. Toplam/net/brüt m² + tipe göre dağılım.
 *
 * KARAR (Moses): Oda tipi mahal adından TAHMİN EDİLMEZ. Kullanıcı her mahale tip atar;
 * burada sadece atanan tipe göre gruplama yapılır.
 */

/** Mahal tipi → Türkçe etiket (panelde ve Excel'de gösterilir). Sıralı: panelde bu sırayla çıkar. */
export const ROOM_TYPES: ReadonlyArray<{ key: RoomType; label: string }> = [
  { key: 'living', label: 'Yaşam' },
  { key: 'wet', label: 'Islak hacim' },
  { key: 'sleeping', label: 'Yatma' },
  { key: 'circulation', label: 'Sirkülasyon' },
  { key: 'service', label: 'Servis' },
  { key: 'other', label: 'Diğer' },
];

const LABEL_BY_KEY = new Map(ROOM_TYPES.map((t) => [t.key, t.label]));

/** Mahalin tipi (atanmamışsa 'other'). */
export function roomTypeOf(space: Space): RoomType {
  return space.roomType ?? 'other';
}

/** Tip anahtarının Türkçe etiketi. */
export function roomTypeLabel(type: RoomType): string {
  return LABEL_BY_KEY.get(type) ?? 'Diğer';
}

const CM2_PER_M2 = 10000;

/** Mahalin merkez-çizgi (centerline) alanı, m². Duvar orta-çizgilerinden bulunan poligonun alanı. */
export function centerlineAreaM2(space: Space): number {
  return polygonArea(space.boundary) / CM2_PER_M2;
}

/** Bir kenarın (a→b) üstünde durduğu duvarın kalınlığını döndürür; bulunamazsa 0. */
function edgeWallThickness(a: Vec2, b: Vec2, walls: readonly Wall[]): number {
  const TOL = 2; // cm — kenar uçları duvar orta-çizgisine bu kadar yakınsa o duvara aittir
  for (const w of walls) {
    if (distanceToSegment(a, w.start, w.end) <= TOL && distanceToSegment(b, w.start, w.end) <= TOL) {
      return w.thickness;
    }
  }
  return 0;
}

/**
 * Mahalin net ve brüt alanı (m²).
 *
 * Centerline alanı, duvar orta-çizgisine kadar olan alandır. Net (iç kullanılabilir) için her
 * kenardan duvarın yarı-kalınlığı çıkarılır; brüt için eklenir. Kullanılan birinci-derece
 * yaklaşım: ΔA = Σ(kenar_uzunluğu × kalınlık/2). İç (paylaşılan) duvarda her mahale yarısı düşer,
 * bu doğru; tam offset (Clipper) değil ama hızlı ve dürüst bir tahmindir.
 */
export function netGrossAreaM2(
  space: Space,
  walls: readonly Wall[],
): { netM2: number; grossM2: number } {
  const center = centerlineAreaM2(space);
  const pts = space.boundary;
  const n = pts.length;
  let deltaCm2 = 0;
  for (let i = 0; i < n; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % n]!;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    deltaCm2 += (len * edgeWallThickness(a, b, walls)) / 2;
  }
  const deltaM2 = deltaCm2 / CM2_PER_M2;
  return { netM2: Math.max(0, center - deltaM2), grossM2: center + deltaM2 };
}

export interface RoomTypeBreakdown {
  readonly type: RoomType;
  readonly label: string;
  readonly count: number;
  /** Bu tipteki mahallerin toplam centerline alanı (m²). */
  readonly areaM2: number;
}

export interface PlanMetrics {
  readonly roomCount: number;
  /** Tüm mahallerin toplam centerline alanı (m²). */
  readonly totalM2: number;
  /** Net (iç) toplam alan — duvar yarı-kalınlıkları çıkarılmış (m²). */
  readonly netM2: number;
  /** Brüt toplam alan — duvar yarı-kalınlıkları eklenmiş (m²). */
  readonly grossM2: number;
  /** Tipe göre dağılım — yalnızca o an mevcut tipler, ROOM_TYPES sırasında. */
  readonly byType: readonly RoomTypeBreakdown[];
}

/** Tüm mahaller + duvarlardan canlı metrikleri hesaplar (Faz 2A). */
export function computeMetrics(spaces: readonly Space[], walls: readonly Wall[]): PlanMetrics {
  let totalM2 = 0;
  let netM2 = 0;
  let grossM2 = 0;
  const agg = new Map<RoomType, { count: number; areaM2: number }>();

  for (const s of spaces) {
    const area = centerlineAreaM2(s);
    const { netM2: n, grossM2: g } = netGrossAreaM2(s, walls);
    totalM2 += area;
    netM2 += n;
    grossM2 += g;
    const t = roomTypeOf(s);
    const cur = agg.get(t) ?? { count: 0, areaM2: 0 };
    cur.count += 1;
    cur.areaM2 += area;
    agg.set(t, cur);
  }

  const byType: RoomTypeBreakdown[] = ROOM_TYPES.filter((t) => agg.has(t.key)).map((t) => {
    const a = agg.get(t.key)!;
    return { type: t.key, label: t.label, count: a.count, areaM2: a.areaM2 };
  });

  return { roomCount: spaces.length, totalM2, netM2, grossM2, byType };
}
