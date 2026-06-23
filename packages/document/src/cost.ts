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
  /** Sıva + boya, ₺/m². */
  readonly plasterPaintM2: number;
  /** Döşeme (şap + kaplama), ₺/m². */
  readonly floorM2: number;
  /** Duvar örgü (kat yüksekliği dahil kaba), ₺/m (duvar uzunluğu). */
  readonly wallMasonryM: number;
  /** Süpürgelik, ₺/m. */
  readonly skirtingM: number;
  /** Kapı (kasa+kanat+montaj), ₺/adet. */
  readonly door: number;
  /** Pencere (PVC+cam+montaj), ₺/adet. */
  readonly window: number;
}

export const DEFAULT_UNIT_PRICES: UnitPrices = {
  plasterPaintM2: 280,
  floorM2: 650,
  wallMasonryM: 950,
  skirtingM: 130,
  door: 5000,
  window: 6500,
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
    { label: 'Sıva + boya', quantity: t.plasterAreaM2, unit: 'm²', unitPrice: prices.plasterPaintM2 },
    { label: 'Döşeme (şap+kaplama)', quantity: t.floorAreaM2, unit: 'm²', unitPrice: prices.floorM2 },
    { label: 'Duvar örgü', quantity: t.wallLengthM, unit: 'm', unitPrice: prices.wallMasonryM },
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
