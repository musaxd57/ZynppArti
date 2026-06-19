import { describe, it, expect } from 'vitest';
import { findFaces, type Segment } from './planar-faces';
import { polygonArea } from './polygon';
import { vec2 } from './vec2';

function box(x1: number, y1: number, x2: number, y2: number): Segment[] {
  return [
    { a: vec2(x1, y1), b: vec2(x2, y1) },
    { a: vec2(x2, y1), b: vec2(x2, y2) },
    { a: vec2(x2, y2), b: vec2(x1, y2) },
    { a: vec2(x1, y2), b: vec2(x1, y1) },
  ];
}

describe('findFaces', () => {
  it('finds a single room from a closed square', () => {
    const faces = findFaces(box(0, 0, 100, 100));
    expect(faces).toHaveLength(1);
    expect(polygonArea(faces[0]!)).toBeCloseTo(10000); // 100x100 cm²
  });

  it('finds two rooms split by a middle wall (T-junctions)', () => {
    const segs: Segment[] = [
      ...box(0, 0, 200, 100),
      { a: vec2(100, 0), b: vec2(100, 100) }, // orta bölme, uçları alt/üst kenarda
    ];
    const faces = findFaces(segs);
    expect(faces).toHaveLength(2);
    for (const f of faces) expect(polygonArea(f)).toBeCloseTo(10000);
  });

  it('returns no rooms for an open (non-closed) shape', () => {
    const faces = findFaces([
      { a: vec2(0, 0), b: vec2(100, 0) },
      { a: vec2(100, 0), b: vec2(100, 100) },
    ]);
    expect(faces).toHaveLength(0);
  });

  it('snaps near-coincident endpoints to still close the room', () => {
    const faces = findFaces([
      { a: vec2(0, 0), b: vec2(100, 0) },
      { a: vec2(100, 0), b: vec2(100, 100) },
      { a: vec2(100, 100), b: vec2(0, 100) },
      { a: vec2(0, 100), b: vec2(0.4, 0.3) }, // ~kapanıyor (snapTol=1 içinde)
    ]);
    expect(faces).toHaveLength(1);
    expect(polygonArea(faces[0]!)).toBeCloseTo(10000, -1);
  });
});
