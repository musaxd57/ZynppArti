import { describe, expect, it } from 'vitest';
import { hatchLines, hatchPattern } from './hatch';

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
