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

  it('devasa açıklık / küçük aralık → çizgi sayısı sınırı (donmaz / patlamaz)', () => {
    // Tarama yönüne (y) dik açıklık 2.000.000 br, spacing 1 → 2M çizgi olurdu → cap (>100k) → boş.
    const huge = [
      { x: 0, y: 0 },
      { x: 1000, y: 0 },
      { x: 1000, y: 2_000_000 },
      { x: 0, y: 2_000_000 },
    ];
    const t0 = Date.now();
    expect(hatchLines(huge, 1, 0)).toEqual([]); // aşırı sayım → boş (UI donmaz)
    expect(Date.now() - t0).toBeLessThan(500); // anında döner (asılı kalmaz)
  });

  it('tarama çizgisi reflex köşeye TAM denk gelince parite bozulmaz (açıklık tümden dolar)', () => {
    // Reflex köşe (5,5); y=5 taraması tam o köşeden geçer. Eski u-tabanlı kural ts=[0,5,10] üretip
    // yalnız (0,5)'i doldurur, (5,10) açıklığını yanlışça boş bırakırdı. Gerçek iç = [0,10].
    const arrow = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 5, y: 5 },
      { x: 0, y: 10 },
    ];
    // spacing 10 → tarama ofsetleri minP+5 = 5 (köşe hizası).
    const atVertex = hatchLines(arrow, 10, 0).filter((l) => Math.abs(l.a.y - 5) < 1e-6);
    expect(atVertex.length).toBeGreaterThan(0);
    // Segment(ler) birleşimi tüm açıklığı (0..10) kapsamalı — köşede parite ters dönüp yarısı boş
    // kalmamalı. (Reflex köşe iki bitişik segment verebilir; uzunluk toplamı = açıklık = 10.)
    const minX = Math.min(...atVertex.map((l) => Math.min(l.a.x, l.b.x)));
    const maxX = Math.max(...atVertex.map((l) => Math.max(l.a.x, l.b.x)));
    const covered = atVertex.reduce((sum, l) => sum + Math.abs(l.b.x - l.a.x), 0);
    expect(minX).toBeCloseTo(0, 6);
    expect(maxX).toBeCloseTo(10, 6);
    expect(covered).toBeCloseTo(10, 6); // bitişik, boşluksuz (eski bug 5 verirdi)
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
