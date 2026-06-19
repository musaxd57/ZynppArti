import { describe, it, expect } from 'vitest';
import { pointInPolygon } from './point-in-polygon';
import { vec2 } from './vec2';

describe('pointInPolygon', () => {
  const square = [vec2(0, 0), vec2(10, 0), vec2(10, 10), vec2(0, 10)];

  it('returns true for an interior point', () => {
    expect(pointInPolygon(vec2(5, 5), square)).toBe(true);
  });

  it('returns false for an exterior point', () => {
    expect(pointInPolygon(vec2(15, 5), square)).toBe(false);
    expect(pointInPolygon(vec2(-1, 5), square)).toBe(false);
  });

  it('handles a concave (L-shaped) polygon', () => {
    const ell = [
      vec2(0, 0),
      vec2(10, 0),
      vec2(10, 4),
      vec2(4, 4),
      vec2(4, 10),
      vec2(0, 10),
    ];
    expect(pointInPolygon(vec2(2, 8), ell)).toBe(true); // dikey kolda
    expect(pointInPolygon(vec2(8, 8), ell)).toBe(false); // çentik dışı
  });
});
