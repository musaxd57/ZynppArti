import { describe, it, expect } from 'vitest';
import { estimateCost, formatTRY, DEFAULT_UNIT_PRICES } from './cost';
import type { Takeoff } from './takeoff';

const base: Takeoff = {
  wallLengthM: 0,
  plasterAreaM2: 0,
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

  it('her kalemi birim fiyatla çarpar + toplar', () => {
    const t: Takeoff = { ...base, floorAreaM2: 100, doorCount: 2 };
    const c = estimateCost(t);
    expect(c.lines).toHaveLength(2);
    const floor = c.lines.find((l) => l.label.startsWith('Döşeme'))!;
    expect(floor.total).toBe(100 * DEFAULT_UNIT_PRICES.floorM2);
    expect(c.total).toBe(100 * DEFAULT_UNIT_PRICES.floorM2 + 2 * DEFAULT_UNIT_PRICES.door);
  });

  it('özel fiyatlar uygulanır', () => {
    const t: Takeoff = { ...base, wallLengthM: 10 };
    const c = estimateCost(t, { ...DEFAULT_UNIT_PRICES, wallMasonryM: 1000 });
    expect(c.total).toBe(10 * 1000);
  });
});

describe('formatTRY', () => {
  it('binlik ayraçlı + ₺ son ek', () => {
    expect(formatTRY(1234567)).toBe('1.234.567 ₺');
    expect(formatTRY(0)).toBe('0 ₺');
  });
});
