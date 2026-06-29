import { polygonArea, distanceToPolygonBoundary } from '@zynpparti/geometry';
import { BLOCK_DEFS, type BlockKind } from './block';
import type { Block, Opening, Space, Wall } from './entities';
import { openingCenterT } from './opening';
import { wallMaterialById } from './wall-material';

/**
 * Metraj / miktar çıkarımı (PRO-FEATURES §1) — saf TS, canlı. Duvar/mahal/boşluktan otomatik
 * miktar: duvar uzunluğu, sıva-boya m², döşeme m², süpürgelik mt, kapı/pencere çizelgesi.
 *
 * Kat yüksekliği ve boşluk yükseklikleri planda saklanmadığından **varsayım**dır (panelde
 * gösterilir, kat yüksekliği düzenlenebilir). Resmî metrajda doğrulanmalı. (ADR-0019: dürüst tahmin.)
 */

/** Varsayılan kat (net oda) yüksekliği — cm. Kullanıcı panelden değiştirebilir. */
export const DEFAULT_STOREY_HEIGHT_CM = 270;
/** Boşluk yükseklik varsayımları — sıva alanından düşmek için (cm). */
const DOOR_HEIGHT_CM = 210;
const WINDOW_HEIGHT_CM = 140;

export interface ScheduleRow {
  /** Genişlik (cm). */
  readonly width: number;
  readonly count: number;
}

export interface BlockScheduleRow {
  readonly kind: BlockKind;
  /** Türkçe etiket (BLOCK_DEFS). */
  readonly label: string;
  readonly count: number;
}

export interface Takeoff {
  /** Toplam duvar uzunluğu (m) — segmentlerin toplamı (köşe örtüşmesi hariç tutulmaz). */
  readonly wallLengthM: number;
  /** Duvar düşey (cephe) alanı (m²) — uzunluk × yükseklik (TEK yüz); örgü/duvar işçiliği bu alandan. */
  readonly wallElevationM2: number;
  /** İÇ sıva alanı (m²) — iç yüzler (bölme iki yüz + dış duvar iç yüzü), boşluklar düşülmüş. */
  readonly plasterAreaM2: number;
  /** DIŞ CEPHE sıva alanı (m²) — yalnız dış (çevre) duvarların DIŞ yüzü. Ayrı poz/birim fiyat (farklı iş). */
  readonly facadePlasterAreaM2: number;
  /** Tavan alanı (m²) — mahal alanlarının toplamı (boyanır/sıvanır). */
  readonly ceilingAreaM2: number;
  /** Boya alanı (m²) — duvar yüzleri (sıva) + tavan. Sıvadan farklı: tavanı da kapsar. */
  readonly paintAreaM2: number;
  /** Döşeme/şap alanı (m²) — mahal alanlarının toplamı. */
  readonly floorAreaM2: number;
  /** Süpürgelik uzunluğu (m) — mahal çevreleri, kapı genişlikleri düşülmüş. */
  readonly skirtingM: number;
  readonly doorCount: number;
  readonly windowCount: number;
  /** Kapı dökümü — genişliğe göre gruplanmış (door/window schedule). */
  readonly doorSchedule: ScheduleRow[];
  readonly windowSchedule: ScheduleRow[];
  /** Mobilya/blok çizelgesi — tipe göre gruplanmış adet. */
  readonly blockSchedule: BlockScheduleRow[];
  /** Duvar uzunluğu malzemeye göre dağılım (atanmamış → "Belirsiz"). */
  readonly wallByMaterial: WallMaterialRow[];
}

export interface WallMaterialRow {
  readonly label: string;
  readonly lengthM: number;
}

export interface TakeoffOptions {
  readonly storeyHeightCm: number;
}

const CM2_PER_M2 = 10000;

function wallLengthCm(w: Wall): number {
  return Math.hypot(w.end.x - w.start.x, w.end.y - w.start.y);
}

/**
 * Bir duvarın kaç MAHALE komşu olduğu (orta noktası oda sınırına duvar yarı-kalınlığı + pay kadar
 * yakınsa o odaya komşu sayılır; copilot windowsServingRoom ile aynı kaba eşleştirme). 1 = çevre
 * (dış) duvar, 2 = iki odayı ayıran iç bölme. İç/dış sıva ayrımında kullanılır.
 */
function wallBorderCount(w: Wall, spaces: readonly Space[]): number {
  const mx = (w.start.x + w.end.x) / 2;
  const my = (w.start.y + w.end.y) / 2;
  const margin = w.thickness / 2 + 8;
  let n = 0;
  for (const sp of spaces) {
    if (sp.boundary.length >= 3 && distanceToPolygonBoundary({ x: mx, y: my }, sp.boundary) <= margin) n++;
  }
  return n;
}

function schedule(openings: readonly Opening[], kind: Opening['kind']): ScheduleRow[] {
  const byWidth = new Map<number, number>();
  for (const o of openings) {
    if (o.kind !== kind) continue;
    if (!(o.width > 0) || !Number.isFinite(o.width)) continue; // negatif/sıfır/NaN genişlik çizelgeye girmesin
    const w = Math.round(o.width);
    byWidth.set(w, (byWidth.get(w) ?? 0) + 1);
  }
  return [...byWidth.entries()].sort((a, b) => a[0] - b[0]).map(([width, count]) => ({ width, count }));
}

/** Blok çizelgesi — tipe göre adet, sabit görünüm sırası (BLOCK_DEFS) korunur. */
function blockSchedule(blocks: readonly Block[]): BlockScheduleRow[] {
  const counts = new Map<BlockKind, number>();
  for (const b of blocks) counts.set(b.kind, (counts.get(b.kind) ?? 0) + 1);
  return (Object.keys(BLOCK_DEFS) as BlockKind[])
    .filter((k) => counts.has(k))
    .map((kind) => ({ kind, label: BLOCK_DEFS[kind].label, count: counts.get(kind)! }));
}

/** Duvar uzunluğunu malzemeye göre gruplar (atanmamış → "Belirsiz"); uzun→kısa sıralı. */
function wallsByMaterial(walls: readonly Wall[]): WallMaterialRow[] {
  const byLabel = new Map<string, number>();
  for (const w of walls) {
    const label = wallMaterialById(w.material)?.label ?? 'Belirsiz';
    byLabel.set(label, (byLabel.get(label) ?? 0) + wallLengthCm(w));
  }
  return [...byLabel.entries()]
    .map(([label, cm]) => ({ label, lengthM: cm / 100 }))
    .sort((a, b) => b.lengthM - a.lengthM);
}

/** Tüm metrajı hesaplar (canlı; çizim değişince yeniden çağrılır). */
export function computeTakeoff(
  walls: readonly Wall[],
  spaces: readonly Space[],
  openings: readonly Opening[],
  blocks: readonly Block[] = [],
  opts: TakeoffOptions = { storeyHeightCm: DEFAULT_STOREY_HEIGHT_CM },
): Takeoff {
  // Kat yüksekliği NaN/≤0 ise varsayılana düş (bozuk opts metrajı zehirlemesin).
  const h = Number.isFinite(opts.storeyHeightCm) && opts.storeyHeightCm > 0 ? opts.storeyHeightCm : DEFAULT_STOREY_HEIGHT_CM;
  // Duvar yüksekliği/uzunluğu NaN-güvenli: bozuk height (NaN/≤0) → kat yüksekliği; bozuk uzunluk → 0.
  const safeH = (w: Wall): number =>
    Number.isFinite(w.height) && (w.height as number) > 0 ? (w.height as number) : h;
  const safeLen = (w: Wall): number => {
    const l = wallLengthCm(w);
    return Number.isFinite(l) && l > 0 ? l : 0;
  };

  const wallLenCm = walls.reduce((s, w) => s + safeLen(w), 0);

  // Boşluk (kapı/pencere) alanlarını DUVAR BAZINDA topla → her duvar yalnız KENDİ boşluğunu düşer,
  // dar bir duvardaki büyük boşluk komşu duvarların alanını "çalmaz" (eski global-akümülatör hatası).
  const openingCutByWall = new Map<string, number>();
  for (const o of openings) {
    if (!(o.width > 0) || !Number.isFinite(o.width)) continue; // bozuk genişlik alanı zehirlemesin
    const oh = o.kind === 'door' ? DOOR_HEIGHT_CM : WINDOW_HEIGHT_CM;
    openingCutByWall.set(o.wallId, (openingCutByWall.get(o.wallId) ?? 0) + o.width * oh);
  }

  // Sıva: İÇ yüzler vs DIŞ CEPHE ayrı (araştırma 2026-06-25 — Türk metrajında farklı poz/birim fiyat).
  // Bir duvarın kaç ODAYA komşu olduğuna bak: 1 → ÇEVRE duvarı (1 iç + 1 dış yüz); 2+/0 → 2 iç yüz.
  const borderCount = new Map<string, number>();
  for (const w of walls) borderCount.set(w.id, wallBorderCount(w, spaces));
  const faces = (id: string, w: Wall): { i: number; e: number } => {
    const c = borderCount.get(id) ?? wallBorderCount(w, spaces);
    return c === 1 ? { i: 1, e: 1 } : { i: 2, e: 0 };
  };

  // Tek geçiş: her duvarın tek-yüz NET alanı (yükseklik×uzunluk − kendi boşluğu, duvar-bazlı clamp≥0).
  let wallElevCm2 = 0;
  let interiorPlasterCm2 = 0;
  let facadePlasterCm2 = 0;
  for (const w of walls) {
    const net = Math.max(0, safeLen(w) * safeH(w) - (openingCutByWall.get(w.id) ?? 0));
    const f = faces(w.id, w);
    wallElevCm2 += net; // örgü = tek yüz net
    interiorPlasterCm2 += f.i * net;
    facadePlasterCm2 += f.e * net;
  }
  const plasterCm2 = interiorPlasterCm2; // "Sıva" = iç sıva (zaten ≥0)
  const facadeCm2 = facadePlasterCm2;

  const floorCm2 = spaces.reduce((s, sp) => s + polygonArea(sp.boundary), 0);
  // Boya = duvar yüzleri (sıva alanı) + tavan (mahal alanı). Tavan boyası ayrıca sayılır.
  const paintCm2 = plasterCm2 + floorCm2;

  // Süpürgelik: ODA-BAZLI çevre − o odanın duvarındaki kapı genişlikleri (araştırma 2026-06-25).
  // Kapı süpürgeliği keser, pencere kesmez. Paylaşılan iç kapı İKİ odanın da çevresinde → iki kez
  // düşülür (her odanın kendi süpürgelik koşusu kesilir = DOĞRU). Dış kapı tek odada → bir kez.
  // Kapının hangi odaya değdiği: kapı orta noktası (duvar üstünde t) o odanın sınırına duvar
  // yarı-kalınlığı + pay kadar yakınsa (copilot windowsServingRoom ile aynı kaba eşleştirme).
  const wallById = new Map(walls.map((w) => [w.id, w]));
  let skirtingCm = 0;
  for (const sp of spaces) {
    const b = sp.boundary;
    let perim = 0;
    for (let i = 0; i < b.length; i++) {
      const a = b[i]!;
      const c = b[(i + 1) % b.length]!;
      perim += Math.hypot(c.x - a.x, c.y - a.y);
    }
    let doorCut = 0;
    for (const o of openings) {
      if (o.kind !== 'door' || !(o.width > 0) || !Number.isFinite(o.width)) continue;
      const w = wallById.get(o.wallId);
      if (!w) continue;
      const t = openingCenterT(w, o); // sığdırılmış t (plan/kesit/3B ile aynı) — denetim L5
      const mx = w.start.x + t * (w.end.x - w.start.x);
      const my = w.start.y + t * (w.end.y - w.start.y);
      if (distanceToPolygonBoundary({ x: mx, y: my }, b) <= w.thickness / 2 + 8) doorCut += o.width;
    }
    skirtingCm += Math.max(0, perim - doorCut);
  }

  return {
    wallLengthM: wallLenCm / 100,
    wallElevationM2: wallElevCm2 / CM2_PER_M2,
    plasterAreaM2: plasterCm2 / CM2_PER_M2,
    facadePlasterAreaM2: facadeCm2 / CM2_PER_M2,
    ceilingAreaM2: floorCm2 / CM2_PER_M2,
    paintAreaM2: paintCm2 / CM2_PER_M2,
    floorAreaM2: floorCm2 / CM2_PER_M2,
    skirtingM: skirtingCm / 100,
    // Geçerli (genişlik > 0, sonlu) açıklıkları say — schedule() ve duvar-kesimi zaten bozuk genişliği
    // eliyor; saymada elemezsek bozuk/import açıklık adedi şişer ve maliyeti (adet × ₺) yanlış artar (denetim).
    doorCount: openings.filter((o) => o.kind === 'door' && o.width > 0 && Number.isFinite(o.width)).length,
    windowCount: openings.filter((o) => o.kind === 'window' && o.width > 0 && Number.isFinite(o.width)).length,
    doorSchedule: schedule(openings, 'door'),
    windowSchedule: schedule(openings, 'window'),
    blockSchedule: blockSchedule(blocks),
    wallByMaterial: wallsByMaterial(walls),
  };
}
