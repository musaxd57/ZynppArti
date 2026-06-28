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

  it('boş / tek nokta → kendisi (dejenere; patlamaz)', () => {
    expect(convexHull([])).toEqual([]);
    expect(convexHull([{ x: 5, y: 5 }])).toEqual([{ x: 5, y: 5 }]);
  });

  it('eş-doğrusal noktalar → yalnız iki uç (sıfır-alan kabuk)', () => {
    const h = convexHull([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 3 },
    ]);
    expect(h).toHaveLength(2);
  });

  it('yinelenen köşeler kabuğu bozmaz (kare = 4 köşe)', () => {
    const h = convexHull([
      { x: 0, y: 0 },
      { x: 0, y: 0 }, // çift
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 10, y: 10 }, // çift
      { x: 0, y: 10 },
    ]);
    expect(h).toHaveLength(4);
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

  it('eş-doğrusal (collinear) noktalar → 0 (dejenere; "darlık ölçümü" değil)', () => {
    // KİLİT: collinear girdi konveks kabukta <3 köşe → 0 döner. Çağıran (copilot koridor kuralı)
    // 0'ı "gerçek 0 cm darlık" değil "ölçülemez/dejenere" diye yorumlamalı (false-narrow vermesin).
    expect(
      polygonMinWidth([
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 100, y: 0 },
      ]),
    ).toBe(0);
  });

  it('konkav (L) → konveks-kabuk kapsayıcı genişliği (belgeli sınır, gerçek darboğaz değil)', () => {
    // L'nin gerçek dar kolu 60 cm ama kabuk 200×200'ü kapsar → min genişlik ~200 (false-negative).
    // Bu KASITLI/belgeli yaklaşım (hull.ts §sınır); testin amacı davranışı sabitlemek.
    const L = [
      { x: 0, y: 0 },
      { x: 200, y: 0 },
      { x: 200, y: 60 },
      { x: 60, y: 60 },
      { x: 60, y: 200 },
      { x: 0, y: 200 },
    ];
    expect(polygonMinWidth(L)).toBeGreaterThan(150); // dar 60 kolunu GÖRMEZ (kabuk kapsayıcı)
  });
});
