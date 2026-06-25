import type { Vec2 } from '@zynpparti/geometry';
import type { Sheet } from './entities';

/**
 * Pafta (sheet) — kağıt/sayfa düzeni (CLAUDE.md §7 paper canvas, §8.6). Model uzayına yerleştirilen
 * bir baskı çerçevesi + antet (title block). Belirli bir **ölçekte** (1:scale) çizimi çerçeveler:
 * kağıt mm'si model cm'sine `mm × scale / 10` ile dönüşür (1 kağıt-mm = scale model-mm = scale/10 cm).
 *
 * Saf veri/geometri — render engine'de (render-sheet.ts).
 */

export type SheetSize = 'A4' | 'A3' | 'A2' | 'A1' | 'A0';
export type SheetOrientation = 'portrait' | 'landscape';

/** ISO 216 kağıt boyutları (mm) — [kısa kenar, uzun kenar]. */
const SIZES_MM: Record<SheetSize, readonly [number, number]> = {
  A4: [210, 297],
  A3: [297, 420],
  A2: [420, 594],
  A1: [594, 841],
  A0: [841, 1189],
};

export const SHEET_SIZES: readonly SheetSize[] = ['A4', 'A3', 'A2', 'A1', 'A0'];
/** Sık kullanılan mimari ölçekler (1:N). */
export const SHEET_SCALES: readonly number[] = [20, 50, 100, 200, 500];

/** Kağıt boyutu (mm), yönelime göre genişlik/yükseklik. */
export function sheetPaperMm(size: SheetSize, orientation: SheetOrientation): { w: number; h: number } {
  const [short, long] = SIZES_MM[size];
  return orientation === 'landscape' ? { w: long, h: short } : { w: short, h: long };
}

/** Kağıt-mm → model-cm dönüşüm katsayısı (ölçek dahil). */
export function sheetMmToModelCm(scale: number): number {
  return scale / 10;
}

/** Pafta'nın model uzayında kapladığı boyut (cm). */
export function sheetModelSize(sheet: Sheet): { w: number; h: number } {
  const p = sheetPaperMm(sheet.size, sheet.orientation);
  const f = sheetMmToModelCm(sheet.scale);
  return { w: p.w * f, h: p.h * f };
}

// Yeni pafta varsayılanları (SheetTool + "+ Pafta ekle" tek kaynaktan kullanır).
export const SHEET_DEFAULT_SIZE: SheetSize = 'A3';
export const SHEET_DEFAULT_ORIENTATION: SheetOrientation = 'landscape';
export const SHEET_DEFAULT_SCALE = 50;

export interface SheetOpts {
  size?: SheetSize;
  orientation?: SheetOrientation;
  scale?: number;
  title?: string;
  project?: string;
  date?: string;
  sheetNo?: string;
  /** Sade sayfa: antet yok, pafta panelinde gizli ("− N sayfa +" ile çoğaltılan boş sayfa). */
  plain?: boolean;
}

/** Paylaşılan pafta factory (id hariç) — varsayılanlar + override. SheetTool ve panel "+ ekle" kullanır. */
export function makeSheet(position: Vec2, opts: SheetOpts = {}): Omit<Sheet, 'id'> {
  return {
    type: 'sheet',
    layerId: 'sheet',
    position,
    size: opts.size ?? SHEET_DEFAULT_SIZE,
    orientation: opts.orientation ?? SHEET_DEFAULT_ORIENTATION,
    scale: opts.scale ?? SHEET_DEFAULT_SCALE,
    title: opts.title ?? 'Pafta',
    ...(opts.project ? { project: opts.project } : {}),
    ...(opts.date ? { date: opts.date } : {}),
    ...(opts.sheetNo ? { sheetNo: opts.sheetNo } : {}),
    ...(opts.plain ? { plain: true } : {}),
  };
}

/**
 * Yeni paftayı mevcut paftaların SAĞINA, üst üste binmeyecek şekilde yerleştirir (aralarında `gapCm`
 * boşluk; üst kenarlar hizalı). Pafta yoksa origin. "+ Pafta ekle" bunu kullanır → tıklama gerekmez.
 */
export function nextSheetPosition(sheets: readonly Sheet[], gapCm = 200): Vec2 {
  if (sheets.length === 0) return { x: 0, y: 0 };
  let right = -Infinity;
  let top = Infinity;
  for (const s of sheets) {
    const { w } = sheetModelSize(s);
    if (s.position.x + w > right) right = s.position.x + w;
    if (s.position.y < top) top = s.position.y;
  }
  if (!Number.isFinite(right) || !Number.isFinite(top)) return { x: 0, y: 0 };
  return { x: right + gapCm, y: top };
}

/** N pafta varken yeni paftanın 1-tabanlı numarası ("3"). "i/N" yeniden-numaralandırma panelde ayrıca yapılır. */
export function nextSheetNo(count: number): string {
  return String(count + 1);
}

/** Antet (title block) dikdörtgeni — pafta'nın sağ-alt köşesinde (model cm). */
export function sheetTitleBlock(sheet: Sheet): { x: number; y: number; w: number; h: number } {
  const f = sheetMmToModelCm(sheet.scale);
  const size = sheetModelSize(sheet);
  const marginMm = 10;
  const blockWmm = 180;
  const blockHmm = 40;
  const m = marginMm * f;
  const bw = blockWmm * f;
  const bh = blockHmm * f;
  return {
    x: sheet.position.x + size.w - m - bw,
    y: sheet.position.y + size.h - m - bh,
    w: bw,
    h: bh,
  };
}
