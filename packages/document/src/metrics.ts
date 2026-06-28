import { polygonArea, distanceToSegment, type Vec2 } from '@zynpparti/geometry';
import type { RoomType, Space, Wall } from './entities';

/**
 * Canlı metrik paneli çekirdeği (Faz 2A, FAZ2-NOTES §2b).
 * Saf TS — UI yok, test edilebilir. Toplam/net/brüt m² + tipe göre dağılım.
 *
 * KARAR (Moses): Oda tipi mahal adından TAHMİN EDİLMEZ. Kullanıcı her mahale tip atar;
 * burada sadece atanan tipe göre gruplama yapılır.
 */

/**
 * Mahal tipi → Türkçe etiket + kanonik renk (0xRRGGBB). **Tek doğruluk kaynağı** (VISUAL-CRAFT §6):
 * hem engine mahal dolgusu hem web lejantı buradan türetir → renkler asla kaymaz. Sıralı: panelde
 * bu sırayla çıkar.
 */
export const ROOM_TYPES: ReadonlyArray<{ key: RoomType; label: string; color: number }> = [
  { key: 'living', label: 'Yaşam', color: 0xd9a14a },
  { key: 'kitchen', label: 'Mutfak', color: 0xe0773f },
  { key: 'bathroom', label: 'Banyo/WC', color: 0x4ec9d9 },
  { key: 'wet', label: 'Islak hacim', color: 0x3fa9b8 },
  { key: 'sleeping', label: 'Yatma', color: 0x9a7fd9 },
  { key: 'circulation', label: 'Sirkülasyon', color: 0x8a8a8a },
  { key: 'service', label: 'Servis', color: 0x6fbf73 },
  { key: 'other', label: 'Diğer', color: 0x4a90d9 },
];

/**
 * Geçerli mahal-tipi anahtarları — TEK kaynak. LLM'in/peer'in uydurduğu tip (ör. "bedroom") modele
 * yazılmadan reddedilir. Assistant + collab eskiden bu listeyi elle KOPYALIYORDU → yeni tip eklenince
 * sessizce reddedip düşürürlerdi (denetim L22). Artık ROOM_TYPES'tan türetilir.
 */
export const ROOM_TYPE_KEYS: ReadonlySet<RoomType> = new Set(ROOM_TYPES.map((t) => t.key));

const LABEL_BY_KEY = new Map(ROOM_TYPES.map((t) => [t.key, t.label]));
const COLOR_BY_KEY = new Map(ROOM_TYPES.map((t) => [t.key, t.color]));

/** Mahalin tipi (atanmamışsa 'other'). */
export function roomTypeOf(space: Space): RoomType {
  return space.roomType ?? 'other';
}

/** Tip anahtarının Türkçe etiketi. */
export function roomTypeLabel(type: RoomType): string {
  return LABEL_BY_KEY.get(type) ?? 'Diğer';
}

/** Tip anahtarının kanonik rengi (0xRRGGBB). */
export function roomTypeColor(type: RoomType): number {
  return COLOR_BY_KEY.get(type) ?? 0x4a90d9;
}

/** 0xRRGGBB sayısını CSS hex dizgesine çevirir (#rrggbb). */
export function toHexColor(n: number): string {
  return '#' + n.toString(16).padStart(6, '0');
}

const CM2_PER_M2 = 10000;

/** Mahalin merkez-çizgi (centerline) alanı, m². Duvar orta-çizgilerinden bulunan poligonun alanı. */
export function centerlineAreaM2(space: Space): number {
  return polygonArea(space.boundary) / CM2_PER_M2;
}

/**
 * Bir mahali çevreleyen duvarların TEMSİLİ (medyan) kalınlığı (cm). NET genişlik tahmini için: mahal
 * sınırı duvar orta-çizgisi olduğundan ölçülen "en dar geçiş" gerçek serbest genişlikten ~bir tam
 * duvar kalınlığı fazladır (iki yandan yarısı). Bunu çıkarmak için temsili kalınlık. Eşleşen duvar
 * yoksa 0. (Copilot koridor/oda/banyo net-genişlik denetimleri kullanır.)
 */
export function representativeWallThickness(space: Space, walls: readonly Wall[]): number {
  const pts = space.boundary;
  const ts: number[] = [];
  for (let i = 0; i < pts.length; i++) {
    const t = edgeWallThickness(pts[i]!, pts[(i + 1) % pts.length]!, walls);
    if (t > 0) ts.push(t);
  }
  if (ts.length === 0) return 0;
  ts.sort((a, b) => a - b);
  return ts[Math.floor(ts.length / 2)]!; // medyan (uç değerlerden etkilenmez)
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
  // NaN/Infinity (bozuk koordinat/kalınlık) panele/Excel'e sızmasın → güvenli sıfıra düş.
  const safeCenter = Number.isFinite(center) ? center : 0;
  const safeDelta = Number.isFinite(deltaM2) ? deltaM2 : 0;
  return { netM2: Math.max(0, safeCenter - safeDelta), grossM2: safeCenter + safeDelta };
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
    const rawArea = centerlineAreaM2(s);
    const { netM2: n, grossM2: g } = netGrossAreaM2(s, walls);
    // NaN/Infinity (bozuk koordinat) toplamları zehirlemesin → güvenli sıfıra düş.
    const area = Number.isFinite(rawArea) ? rawArea : 0;
    totalM2 += area;
    netM2 += Number.isFinite(n) ? n : 0;
    grossM2 += Number.isFinite(g) ? g : 0;
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
