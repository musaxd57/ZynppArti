import { polygonArea } from '@zynpparti/geometry';
import { BLOCK_DEFS, type BlockKind } from './block';
import type { Block, Opening, Space, Wall } from './entities';
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
  /** Sıva/boya alanı (m²) — iki yüz × uzunluk × kat yüksekliği, boşluklar düşülmüş. */
  readonly plasterAreaM2: number;
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

function schedule(openings: readonly Opening[], kind: Opening['kind']): ScheduleRow[] {
  const byWidth = new Map<number, number>();
  for (const o of openings) {
    if (o.kind !== kind) continue;
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
  const h = opts.storeyHeightCm;

  const wallLenCm = walls.reduce((s, w) => s + wallLengthCm(w), 0);

  // Sıva: iki yüz. Her duvar kendi yüksekliğiyle (yoksa kat yüksekliği). Boşluk alanı (iki yüz) düşülür.
  let plasterCm2 = walls.reduce((s, w) => s + 2 * wallLengthCm(w) * (w.height ?? h), 0);
  for (const o of openings) {
    const oh = o.kind === 'door' ? DOOR_HEIGHT_CM : WINDOW_HEIGHT_CM;
    plasterCm2 -= 2 * o.width * oh;
  }
  plasterCm2 = Math.max(0, plasterCm2);

  const floorCm2 = spaces.reduce((s, sp) => s + polygonArea(sp.boundary), 0);

  // Süpürgelik: mahal çevreleri − kapı genişlikleri.
  let skirtingCm = 0;
  for (const sp of spaces) {
    const b = sp.boundary;
    for (let i = 0; i < b.length; i++) {
      const a = b[i]!;
      const c = b[(i + 1) % b.length]!;
      skirtingCm += Math.hypot(c.x - a.x, c.y - a.y);
    }
  }
  for (const o of openings) if (o.kind === 'door') skirtingCm -= o.width;
  skirtingCm = Math.max(0, skirtingCm);

  return {
    wallLengthM: wallLenCm / 100,
    plasterAreaM2: plasterCm2 / CM2_PER_M2,
    floorAreaM2: floorCm2 / CM2_PER_M2,
    skirtingM: skirtingCm / 100,
    doorCount: openings.filter((o) => o.kind === 'door').length,
    windowCount: openings.filter((o) => o.kind === 'window').length,
    doorSchedule: schedule(openings, 'door'),
    windowSchedule: schedule(openings, 'window'),
    blockSchedule: blockSchedule(blocks),
    wallByMaterial: wallsByMaterial(walls),
  };
}
