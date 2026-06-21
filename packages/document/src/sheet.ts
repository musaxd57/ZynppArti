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
