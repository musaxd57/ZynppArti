import { describe, it, expect } from 'vitest';
import { closestPointOnSegment, distanceToSegment } from './segment';
import { vec2 } from './vec2';

describe('closestPointOnSegment', () => {
  it('projects a point onto the segment interior', () => {
    expect(closestPointOnSegment(vec2(5, 3), vec2(0, 0), vec2(10, 0))).toEqual({ x: 5, y: 0 });
  });

  it('clamps to the endpoints when the projection falls outside', () => {
    expect(closestPointOnSegment(vec2(-5, 0), vec2(0, 0), vec2(10, 0))).toEqual({ x: 0, y: 0 });
    expect(closestPointOnSegment(vec2(99, 0), vec2(0, 0), vec2(10, 0))).toEqual({ x: 10, y: 0 });
  });

  it('handles a degenerate (zero-length) segment', () => {
    expect(closestPointOnSegment(vec2(3, 4), vec2(1, 1), vec2(1, 1))).toEqual({ x: 1, y: 1 });
  });
});

describe('distanceToSegment', () => {
  it('measures perpendicular distance to the segment', () => {
    expect(distanceToSegment(vec2(5, 4), vec2(0, 0), vec2(10, 0))).toBeCloseTo(4);
  });

  it('measures distance to the nearest endpoint when beyond the segment', () => {
    expect(distanceToSegment(vec2(13, 4), vec2(0, 0), vec2(10, 0))).toBeCloseTo(5);
  });
});
