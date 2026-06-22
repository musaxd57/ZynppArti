import { describe, it, expect } from 'vitest';
import { polygonArea, polygonCentroid, distanceToPolygonBoundary } from './polygon';
import { vec2 } from './vec2';

describe('polygonArea', () => {
  it('returns 0 for fewer than 3 points', () => {
    expect(polygonArea([])).toBe(0);
    expect(polygonArea([vec2(0, 0), vec2(1, 1)])).toBe(0);
  });

  it('computes the area of a unit square', () => {
    const square = [vec2(0, 0), vec2(1, 0), vec2(1, 1), vec2(0, 1)];
    expect(polygonArea(square)).toBeCloseTo(1);
  });

  it('is independent of winding direction', () => {
    const ccw = [vec2(0, 0), vec2(2, 0), vec2(2, 2), vec2(0, 2)];
    const cw = [vec2(0, 0), vec2(0, 2), vec2(2, 2), vec2(2, 0)];
    expect(polygonArea(ccw)).toBeCloseTo(4);
    expect(polygonArea(cw)).toBeCloseTo(4);
  });
});

describe('polygonCentroid', () => {
  it('simetrik dikdörtgenin merkezi', () => {
    const rect = [vec2(0, 0), vec2(100, 0), vec2(100, 60), vec2(0, 60)];
    const c = polygonCentroid(rect);
    expect(c.x).toBeCloseTo(50);
    expect(c.y).toBeCloseTo(30);
  });

  it('sarım yönünden bağımsız', () => {
    const ccw = polygonCentroid([vec2(0, 0), vec2(10, 0), vec2(10, 10), vec2(0, 10)]);
    const cw = polygonCentroid([vec2(0, 0), vec2(0, 10), vec2(10, 10), vec2(10, 0)]);
    expect(ccw.x).toBeCloseTo(cw.x);
    expect(ccw.y).toBeCloseTo(cw.y);
  });

  it('L şeklinde ağırlık merkezi köşe-ortalamasından farklı (kütleye kayar)', () => {
    // L: büyük gövde sol-altta → centroid sol-alta kaymalı.
    const L = [
      vec2(0, 0),
      vec2(60, 0),
      vec2(60, 20),
      vec2(20, 20),
      vec2(20, 60),
      vec2(0, 60),
    ];
    const c = polygonCentroid(L);
    // köşe ortalaması (160/6, 160/6) ≈ (26.7, 26.7); alan-merkezi daha sol-altta olmalı
    expect(c.x).toBeLessThan(26.7);
    expect(c.y).toBeLessThan(26.7);
  });

  it('dejenere (alan ~0) → köşe ortalamasına düşer', () => {
    const line = [vec2(0, 0), vec2(10, 0), vec2(20, 0)];
    const c = polygonCentroid(line);
    expect(c.x).toBeCloseTo(10);
    expect(c.y).toBeCloseTo(0);
  });

  it('boş → orijin', () => {
    expect(polygonCentroid([])).toEqual({ x: 0, y: 0 });
  });
});

describe('distanceToPolygonBoundary', () => {
  const sq = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
  ];
  it('içteki noktanın en yakın kenara uzaklığı', () => {
    expect(distanceToPolygonBoundary({ x: 20, y: 50 }, sq)).toBeCloseTo(20, 6);
  });
  it('dıştaki noktanın kenara uzaklığı', () => {
    expect(distanceToPolygonBoundary({ x: -10, y: 50 }, sq)).toBeCloseTo(10, 6);
  });
});
