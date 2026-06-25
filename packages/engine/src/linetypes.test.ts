import { describe, it, expect } from 'vitest';
import { CHAIN, DASH, DOT, dashSegment } from './linetypes';

/** dashSegment yalnız g.moveTo().lineTo() kullanır → çizilen kısa-çizgi sayısını sayan sahte Graphics. */
function fakeGraphics(): { moves: number; moveTo: () => unknown; lineTo: () => unknown } {
  const g = {
    moves: 0,
    moveTo() {
      g.moves++;
      return g;
    },
    lineTo() {
      return g;
    },
  };
  return g;
}

describe('dashSegment', () => {
  it('DASH [6,4] ile 20 px uzunlukta 2 kısa-çizgi üretir (pixelSize 1)', () => {
    const g = fakeGraphics();
    dashSegment(g as never, { x: 0, y: 0 }, { x: 20, y: 0 }, DASH, 1);
    expect(g.moves).toBe(2); // 0-6, 10-16
  });

  it('sıfır uzunlukta hiçbir şey çizmez', () => {
    const g = fakeGraphics();
    dashSegment(g as never, { x: 5, y: 5 }, { x: 5, y: 5 }, DASH, 1);
    expect(g.moves).toBe(0);
  });

  it('boş desen → çizim yok', () => {
    const g = fakeGraphics();
    dashSegment(g as never, { x: 0, y: 0 }, { x: 100, y: 0 }, [], 1);
    expect(g.moves).toBe(0);
  });

  it('daha uzun çizgi daha çok kısa-çizgi üretir; pixelSize deseni ölçekler', () => {
    const g1 = fakeGraphics();
    dashSegment(g1 as never, { x: 0, y: 0 }, { x: 100, y: 0 }, DASH, 1);
    const g2 = fakeGraphics();
    // pixelSize 2 → desen iki katı uzun → aynı çizgide daha az kısa-çizgi
    dashSegment(g2 as never, { x: 0, y: 0 }, { x: 100, y: 0 }, DASH, 2);
    expect(g1.moves).toBeGreaterThan(g2.moves);
  });

  it('desen sabitleri tanımlı (DASH/DOT/CHAIN)', () => {
    expect(DASH.length).toBeGreaterThan(0);
    expect(DOT.length).toBeGreaterThan(0);
    expect(CHAIN.length).toBe(4); // dash-dot zincir
  });

  it('aşırı yoğun (zoom-in) dash → tek katı çizgiye düşer (binlerce moveTo değil)', () => {
    const g = fakeGraphics();
    // Çok uzun kenar + minik pixelSize → naif yol ~5M dash üretirdi; cap → tek moveTo.
    dashSegment(g as never, { x: 0, y: 0 }, { x: 100_000, y: 0 }, DASH, 0.001);
    expect(g.moves).toBe(1);
  });
});
