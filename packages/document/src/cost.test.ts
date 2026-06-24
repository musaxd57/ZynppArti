import { describe, it, expect } from 'vitest';
import { estimateCost, formatTRY, DEFAULT_UNIT_PRICES } from './cost';
import type { Takeoff } from './takeoff';

const base: Takeoff = {
  wallLengthM: 0,
  wallElevationM2: 0,
  plasterAreaM2: 0,
  ceilingAreaM2: 0,
  paintAreaM2: 0,
  floorAreaM2: 0,
  skirtingM: 0,
  doorCount: 0,
  windowCount: 0,
  doorSchedule: [],
  windowSchedule: [],
  blockSchedule: [],
  wallByMaterial: [],
};

describe('estimateCost', () => {
  it('miktar 0 olan kalemleri atlar; boş metraj → 0', () => {
    const c = estimateCost(base);
    expect(c.lines).toHaveLength(0);
    expect(c.total).toBe(0);
  });

  it('her kalemi birim fiyatla çarpar; tesisat alana göre eklenir; genel gider + ₺/m²', () => {
    const t: Takeoff = { ...base, floorAreaM2: 100, doorCount: 2 };
    const c = estimateCost(t);
    // Döşeme + Kapı + Elektrik + Sıhhi (ikisi alana bağlı) = 4 kalem
    expect(c.lines).toHaveLength(4);
    const floor = c.lines.find((l) => l.label.startsWith('Döşeme'))!;
    expect(floor.total).toBe(100 * DEFAULT_UNIT_PRICES.floorM2);
    expect(floor.category).toBe('İnce yapı');
    const sub =
      100 * DEFAULT_UNIT_PRICES.floorM2 +
      2 * DEFAULT_UNIT_PRICES.door +
      100 * DEFAULT_UNIT_PRICES.electricalM2 +
      100 * DEFAULT_UNIT_PRICES.plumbingM2;
    expect(c.subtotal).toBe(sub);
    expect(c.overhead).toBeCloseTo(sub * DEFAULT_UNIT_PRICES.overheadRate, 4);
    expect(c.total).toBeCloseTo(sub * (1 + DEFAULT_UNIT_PRICES.overheadRate), 4);
    expect(c.perM2).toBeCloseTo(c.total / 100, 4);
  });

  it('özel fiyatlar + genel gider oranı uygulanır', () => {
    const t: Takeoff = { ...base, wallElevationM2: 10 };
    const c = estimateCost(t, { ...DEFAULT_UNIT_PRICES, wallMasonryM2: 1000, overheadRate: 0.2 });
    expect(c.subtotal).toBe(10 * 1000);
    expect(c.total).toBeCloseTo(10000 * 1.2, 4);
    expect(c.perM2).toBe(0); // alan yok → ₺/m² 0
  });
});

describe('formatTRY', () => {
  it('binlik ayraçlı + ₺ son ek', () => {
    expect(formatTRY(1234567)).toBe('1.234.567 ₺');
    expect(formatTRY(0)).toBe('0 ₺');
  });
});
