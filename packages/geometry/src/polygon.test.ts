import { describe, it, expect } from 'vitest';
import { polygonArea } from './polygon';
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
