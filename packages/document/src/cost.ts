import type { Takeoff } from './takeoff';

/**
 * Canlı yaklaşık maliyet (PRO-FEATURES §2) — saf TS. Metraj × birim fiyat → kaba TL tahmini,
 * kategorilere ayrılmış (Kaba yapı / Tesisat / İnce yapı) + genel gider & kâr payı + ₺/m².
 *
 * UYARI: Birim fiyatlar **kaba 2026 ortalama** tohum değerleridir; bölge/malzeme/işçilikle ciddi
 * değişir. Bu bir gerçek keşif/teklif DEĞİL, tasarım sırasında büyüklük hissi veren canlı bir
 * göstergedir (ADR-0019: dürüst tahmin, palavra değil). İleride poz/birim-fiyat veritabanı bağlanır.
 */

export type CostCategory = 'Kaba yapı' | 'Tesisat' | 'İnce yapı';

/** Birim fiyatlar (₺). Kaba 2026 ortalama (Türkiye, malzeme+işçilik); ileride düzenlenebilir/veritabanı. */
export interface UnitPrices {
  /** Duvar örgü (tuğla/gazbeton + işçilik), ₺/m² (cephe alanı = uzunluk × yükseklik). */
  readonly wallMasonryM2: number;
  /** İç sıva (alçı/çimento + işçilik), ₺/m² (iç duvar yüzleri). */
  readonly plasterM2: number;
  /** Dış cephe sıvası (mantolama/dekoratif + işçilik), ₺/m² — iç sıvadan ayrı poz, genelde daha pahalı. */
  readonly facadePlasterM2: number;
  /** Elektrik tesisatı (kablolama+anahtar+priz+armatür kabası), ₺/m² (kapalı alan). */
  readonly electricalM2: number;
  /** Sıhhi tesisat (temiz+pis su+ısıtma kabası), ₺/m² (kapalı alan; ıslak hacme yoğunlaşır, alana yayılır). */
  readonly plumbingM2: number;
  /** Boya (astar+saten + işçilik), ₺/m² (duvar yüzleri + tavan). */
  readonly paintM2: number;
  /** Döşeme (şap + kaplama: seramik/laminat ort.), ₺/m². */
  readonly floorM2: number;
  /** Süpürgelik, ₺/m. */
  readonly skirtingM: number;
  /** Kapı (kasa+kanat+montaj), ₺/adet. */
  readonly door: number;
  /** Pencere (PVC+cam+montaj), ₺/adet. */
  readonly window: number;
  /** Genel gider + müteahhit kârı oranı (0–1). Ara toplam üzerine eklenir. */
  readonly overheadRate: number;
}

// Kaba 2026 tohum değerleri (Türkiye, malzeme+işçilik dahil; iyi-finişli konut ~₺14-15 bin/m²
// mertebesinde çıkar). Bölge/marka/lüks ile ±%50 oynar; kullanıcı panelden kendi rayicini girebilir.
export const DEFAULT_UNIT_PRICES: UnitPrices = {
  wallMasonryM2: 1300,
  plasterM2: 500,
  facadePlasterM2: 650,
  electricalM2: 1400,
  plumbingM2: 1600,
  paintM2: 320,
  floorM2: 2800,
  skirtingM: 400,
  door: 18000,
  window: 24000,
  overheadRate: 0.15,
};

export interface CostLine {
  readonly label: string;
  readonly category: CostCategory;
  readonly quantity: number;
  readonly unit: string;
  readonly unitPrice: number;
  readonly total: number;
}

export interface CostEstimate {
  readonly lines: readonly CostLine[];
  /** İmalat ara toplamı (genel gider/kâr hariç). */
  readonly subtotal: number;
  /** Genel gider + kâr tutarı (subtotal × overheadRate). */
  readonly overhead: number;
  /** Uygulanan genel gider + kâr oranı (0–1). */
  readonly overheadRate: number;
  /** Genel toplam (subtotal + overhead). */
  readonly total: number;
  /** m² başına maliyet (total / döşeme alanı); alan yoksa 0. */
  readonly perM2: number;
}

/**
 * Metrajdan kaba maliyet tahmini üretir (saf). Miktar 0 olan kalemler atlanır. Kalemler kategorilere
 * (Kaba yapı / Tesisat / İnce yapı) ayrılır; sonra genel gider + kâr eklenir ve ₺/m² hesaplanır.
 */
export function estimateCost(t: Takeoff, prices: UnitPrices = DEFAULT_UNIT_PRICES): CostEstimate {
  const area = t.floorAreaM2; // kapalı alan — tesisat ve ₺/m² için
  const raw: Array<Omit<CostLine, 'total'>> = [
    // Kaba yapı
    { label: 'Duvar örgü', category: 'Kaba yapı', quantity: t.wallElevationM2, unit: 'm²', unitPrice: prices.wallMasonryM2 },
    { label: 'İç sıva', category: 'Kaba yapı', quantity: t.plasterAreaM2, unit: 'm²', unitPrice: prices.plasterM2 },
    { label: 'Dış cephe sıvası', category: 'Kaba yapı', quantity: t.facadePlasterAreaM2, unit: 'm²', unitPrice: prices.facadePlasterM2 },
    // Tesisat (kapalı alana yayılmış kaba tahmin)
    { label: 'Elektrik tesisatı', category: 'Tesisat', quantity: area, unit: 'm²', unitPrice: prices.electricalM2 },
    { label: 'Sıhhi tesisat', category: 'Tesisat', quantity: area, unit: 'm²', unitPrice: prices.plumbingM2 },
    // İnce yapı
    { label: 'Boya (duvar+tavan)', category: 'İnce yapı', quantity: t.paintAreaM2, unit: 'm²', unitPrice: prices.paintM2 },
    { label: 'Döşeme (şap+kaplama)', category: 'İnce yapı', quantity: t.floorAreaM2, unit: 'm²', unitPrice: prices.floorM2 },
    { label: 'Süpürgelik', category: 'İnce yapı', quantity: t.skirtingM, unit: 'm', unitPrice: prices.skirtingM },
    { label: 'Kapı', category: 'İnce yapı', quantity: t.doorCount, unit: 'adet', unitPrice: prices.door },
    { label: 'Pencere', category: 'İnce yapı', quantity: t.windowCount, unit: 'adet', unitPrice: prices.window },
  ];
  const lines: CostLine[] = raw
    .filter((l) => l.quantity > 0 && Number.isFinite(l.quantity) && Number.isFinite(l.unitPrice))
    .map((l) => ({ ...l, total: l.quantity * l.unitPrice }));
  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  // Bozuk/elle-düzenlenmiş birim fiyat (localStorage) NaN overheadRate sızdırabilir → 0'a düş.
  const rate = Number.isFinite(prices.overheadRate) ? Math.max(0, prices.overheadRate) : 0;
  const overhead = subtotal * rate;
  const total = subtotal + overhead;
  const perM2 = area > 0 ? total / area : 0;
  return { lines, subtotal, overhead, overheadRate: rate, total, perM2 };
}

/** TL biçimlendirme (binlik ayraçlı, kuruşsuz) — ör. 1.234.567 ₺. NaN/Infinity → "0 ₺". */
export function formatTRY(value: number): string {
  if (!Number.isFinite(value)) return '0 ₺';
  return `${Math.round(value).toLocaleString('tr-TR')} ₺`;
}
