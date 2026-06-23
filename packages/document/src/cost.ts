import type { Takeoff } from './takeoff';

/**
 * Canlı yaklaşık maliyet (PRO-FEATURES §2, Faz 3) — saf TS. Metraj × birim fiyat → kaba TL tahmini.
 *
 * UYARI: Birim fiyatlar **kaba 2026 ortalama** tohum değerleridir; bölge/malzeme/işçilikle ciddi
 * değişir. Bu bir gerçek keşif/teklif DEĞİL, tasarım sırasında büyüklük hissi veren canlı bir
 * göstergedir (ADR-0019: dürüst tahmin, palavra değil). İleride poz/birim-fiyat veritabanı bağlanır.
 */

/** Birim fiyatlar (₺). Kaba 2026 ortalama; ileride düzenlenebilir/veritabanı. */
export interface UnitPrices {
  /** Sıva (alçı/çimento + işçilik), ₺/m² (duvar yüzleri). */
  readonly plasterM2: number;
  /** Boya (astar+saten + işçilik), ₺/m² (duvar yüzleri + tavan). */
  readonly paintM2: number;
  /** Döşeme (şap + kaplama), ₺/m². */
  readonly floorM2: number;
  /** Duvar örgü (tuğla+işçilik), ₺/m² (cephe alanı = uzunluk × yükseklik). */
  readonly wallMasonryM2: number;
  /** Süpürgelik, ₺/m. */
  readonly skirtingM: number;
  /** Kapı (kasa+kanat+montaj), ₺/adet. */
  readonly door: number;
  /** Pencere (PVC+cam+montaj), ₺/adet. */
  readonly window: number;
}

// Kaba 2026 tohum değerleri (Türkiye, malzeme+işçilik dahil). Bölge/marka ile ±%50 oynar.
export const DEFAULT_UNIT_PRICES: UnitPrices = {
  plasterM2: 250,
  paintM2: 150,
  floorM2: 1100,
  wallMasonryM2: 600,
  skirtingM: 180,
  door: 8500,
  window: 12000,
};

export interface CostLine {
  readonly label: string;
  readonly quantity: number;
  readonly unit: string;
  readonly unitPrice: number;
  readonly total: number;
}

export interface CostEstimate {
  readonly lines: readonly CostLine[];
  readonly total: number;
}

/** Metrajdan kaba maliyet tahmini üretir (saf). Miktar 0 olan kalemler atlanır. */
export function estimateCost(t: Takeoff, prices: UnitPrices = DEFAULT_UNIT_PRICES): CostEstimate {
  const raw: Array<Omit<CostLine, 'total'>> = [
    { label: 'Duvar örgü', quantity: t.wallElevationM2, unit: 'm²', unitPrice: prices.wallMasonryM2 },
    { label: 'Sıva', quantity: t.plasterAreaM2, unit: 'm²', unitPrice: prices.plasterM2 },
    { label: 'Boya (duvar+tavan)', quantity: t.paintAreaM2, unit: 'm²', unitPrice: prices.paintM2 },
    { label: 'Döşeme (şap+kaplama)', quantity: t.floorAreaM2, unit: 'm²', unitPrice: prices.floorM2 },
    { label: 'Süpürgelik', quantity: t.skirtingM, unit: 'm', unitPrice: prices.skirtingM },
    { label: 'Kapı', quantity: t.doorCount, unit: 'adet', unitPrice: prices.door },
    { label: 'Pencere', quantity: t.windowCount, unit: 'adet', unitPrice: prices.window },
  ];
  const lines: CostLine[] = raw
    .filter((l) => l.quantity > 0)
    .map((l) => ({ ...l, total: l.quantity * l.unitPrice }));
  const total = lines.reduce((s, l) => s + l.total, 0);
  return { lines, total };
}

/** TL biçimlendirme (binlik ayraçlı, kuruşsuz) — ör. 1.234.567 ₺. */
export function formatTRY(value: number): string {
  return `${Math.round(value).toLocaleString('tr-TR')} ₺`;
}
