import { describe, it, expect } from 'vitest';
import { closestPointOnSegment, distanceToSegment, segmentIntersection } from './segment';
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

describe('segmentIntersection', () => {
  it('iki çaprazın kesişimini bulur', () => {
    const p = segmentIntersection(vec2(0, 0), vec2(10, 10), vec2(0, 10), vec2(10, 0));
    expect(p).not.toBeNull();
    expect(p!.x).toBeCloseTo(5);
    expect(p!.y).toBeCloseTo(5);
  });

  it('parça sınırı dışında kesişim → null', () => {
    // sonsuz doğrular kesişir ama parçalar değmiyor
    expect(segmentIntersection(vec2(0, 0), vec2(1, 1), vec2(0, 10), vec2(1, 9))).toBeNull();
  });

  it('paralel parçalar → null', () => {
    expect(segmentIntersection(vec2(0, 0), vec2(10, 0), vec2(0, 5), vec2(10, 5))).toBeNull();
  });

  it('T kesişimi (uç ortaya değiyor) noktayı verir', () => {
    const p = segmentIntersection(vec2(0, 0), vec2(10, 0), vec2(5, 0), vec2(5, 10));
    expect(p).not.toBeNull();
    expect(p!.x).toBeCloseTo(5);
    expect(p!.y).toBeCloseTo(0);
  });

  it('eş-doğrusal ÖRTÜŞEN parçalar → null (tek nokta değil; gerçek çapraz değil)', () => {
    // [0,0]-[100,0] ile [50,0]-[150,0] aynı doğru üzerinde örtüşür → denom≈0 → null (tasarım gereği).
    expect(segmentIntersection(vec2(0, 0), vec2(100, 0), vec2(50, 0), vec2(150, 0))).toBeNull();
  });

  it('eş-doğrusal ama AYRIK parçalar → null', () => {
    expect(segmentIntersection(vec2(0, 0), vec2(40, 0), vec2(60, 0), vec2(100, 0))).toBeNull();
  });
});
