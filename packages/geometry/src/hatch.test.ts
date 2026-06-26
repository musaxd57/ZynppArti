import { describe, expect, it } from 'vitest';
import { hatchLines, hatchPattern } from './hatch';
import { pointInPolygon } from './point-in-polygon';

const square = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 },
];

describe('hatchLines', () => {
  it('kareyi yatay çizgilerle doldurur (açı 0 → yatay)', () => {
    const lines = hatchLines(square, 20, 0);
    // 100 yükseklik / 20 aralık ≈ 5 çizgi
    expect(lines.length).toBeGreaterThanOrEqual(4);
    expect(lines.length).toBeLessThanOrEqual(6);
    // her çizgi kare içinde, x uçları 0..100
    for (const l of lines) {
      expect(Math.min(l.a.x, l.b.x)).toBeCloseTo(0, 4);
      expect(Math.max(l.a.x, l.b.x)).toBeCloseTo(100, 4);
      expect(l.a.y).toBeGreaterThanOrEqual(-0.001);
      expect(l.a.y).toBeLessThanOrEqual(100.001);
    }
  });

  it('45° tarama çizgileri üretir', () => {
    const lines = hatchLines(square, 15, Math.PI / 4);
    expect(lines.length).toBeGreaterThan(0);
  });

  it('dejenere girdi → boş', () => {
    expect(hatchLines([{ x: 0, y: 0 }], 10, 0)).toEqual([]);
    expect(hatchLines(square, 0, 0)).toEqual([]);
  });

  it('konkav (U) poligonda çentiği DOLDURMAZ — her segment poligon içinde', () => {
    // U yukarı açık: sol kol x[0,30], sağ kol x[70,100] tam yükseklik, taban y[0,40].
    // Çentik: x(30,70) × y(40,100) DIŞARIDA. Eski kod min/max-t ile tek segment çizip
    // çentiği doldururdu (orta nokta 50,70 dışarıda).
    const u = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 70, y: 100 },
      { x: 70, y: 40 },
      { x: 30, y: 40 },
      { x: 30, y: 100 },
      { x: 0, y: 100 },
    ];
    const lines = hatchLines(u, 10, 0);
    expect(lines.length).toBeGreaterThan(0);
    for (const l of lines) {
      const mid = { x: (l.a.x + l.b.x) / 2, y: (l.a.y + l.b.y) / 2 };
      expect(pointInPolygon(mid, u)).toBe(true);
    }
  });
});

describe('hatchPattern', () => {
  it('single = hatchLines ile aynı', () => {
    expect(hatchPattern(square, 20, 0, 'single')).toEqual(hatchLines(square, 20, 0));
  });

  it('cross = tek yön + dik yön (yaklaşık iki katı çizgi)', () => {
    const single = hatchPattern(square, 20, 0, 'single').length;
    const cross = hatchPattern(square, 20, 0, 'cross').length;
    expect(cross).toBe(single + hatchLines(square, 20, Math.PI / 2).length);
    expect(cross).toBeGreaterThan(single);
  });

  it('varsayılan kind = single', () => {
    expect(hatchPattern(square, 20, 0)).toEqual(hatchLines(square, 20, 0));
  });
});
