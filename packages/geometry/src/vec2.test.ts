import { describe, it, expect } from 'vitest';
import { snapToAngle, vec2 } from './vec2';

describe('snapToAngle (ortho/polar)', () => {
  const o = vec2(0, 0);
  const HV = Math.PI / 2; // yatay/dikey
  const POLAR = Math.PI / 4; // +45°

  it('hafif eğik yatayı yataya kilitler (uzaklık korunur)', () => {
    // (100, 5) ≈ yatay → y sıfırlanır, x ~uzaklık
    const r = snapToAngle(o, vec2(100, 5), HV);
    expect(r.y).toBeCloseTo(0);
    expect(r.x).toBeCloseTo(Math.hypot(100, 5));
  });

  it('hafif eğik dikeyi dikeye kilitler', () => {
    const r = snapToAngle(o, vec2(4, 90), HV);
    expect(r.x).toBeCloseTo(0);
    expect(r.y).toBeCloseTo(Math.hypot(4, 90));
  });

  it('polar modda 45°ye kilitler', () => {
    const r = snapToAngle(o, vec2(100, 90), POLAR); // ~42° → 45°
    expect(r.x).toBeCloseTo(r.y); // 45° → x=y
  });

  it('uzaklık 0 → değişmez', () => {
    expect(snapToAngle(o, vec2(0, 0), HV)).toEqual({ x: 0, y: 0 });
  });

  it('origin kayması doğru hesaplanır', () => {
    const r = snapToAngle(vec2(10, 10), vec2(110, 12), HV);
    expect(r.y).toBeCloseTo(10); // yatay → start.y korunur
    expect(r.x).toBeGreaterThan(10);
  });
});
