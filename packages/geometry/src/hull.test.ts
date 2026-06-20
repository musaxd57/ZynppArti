import { describe, expect, it } from 'vitest';
import { convexHull, polygonMinWidth } from './hull';

describe('convexHull', () => {
  it('kareyi (içteki nokta atılır) döndürür', () => {
    const hull = convexHull([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
      { x: 50, y: 50 }, // iç nokta — kabukta olmamalı
    ]);
    expect(hull).toHaveLength(4);
  });
});

describe('polygonMinWidth', () => {
  it('kare → kenar uzunluğu', () => {
    expect(
      polygonMinWidth([
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ]),
    ).toBeCloseTo(100, 6);
  });

  it('dikdörtgen → kısa kenar (genişlik)', () => {
    // 300 (uzun) × 90 (kısa) → min genişlik 90
    expect(
      polygonMinWidth([
        { x: 0, y: 0 },
        { x: 300, y: 0 },
        { x: 300, y: 90 },
        { x: 0, y: 90 },
      ]),
    ).toBeCloseTo(90, 6);
  });

  it('dejenere (2 nokta) → 0', () => {
    expect(
      polygonMinWidth([
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ]),
    ).toBe(0);
  });
});
