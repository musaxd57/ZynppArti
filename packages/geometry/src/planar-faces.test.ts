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

  it('L şeklinde tek mahal bulur (doğru alan)', () => {
    // 200×200 kareden sağ-üst 100×100 çıkık → 40000 − 10000 = 30000 cm²
    const segs: Segment[] = [
      { a: vec2(0, 0), b: vec2(200, 0) },
      { a: vec2(200, 0), b: vec2(200, 100) },
      { a: vec2(200, 100), b: vec2(100, 100) },
      { a: vec2(100, 100), b: vec2(100, 200) },
      { a: vec2(100, 200), b: vec2(0, 200) },
      { a: vec2(0, 200), b: vec2(0, 0) },
    ];
    const faces = findFaces(segs);
    expect(faces).toHaveLength(1);
    expect(polygonArea(faces[0]!)).toBeCloseTo(30000);
  });

  it('kesişen ama kapalı bölge oluşturmayan iki çizgi → mahal yok', () => {
    const faces = findFaces([
      { a: vec2(0, 0), b: vec2(100, 100) },
      { a: vec2(0, 100), b: vec2(100, 0) }, // merkezde kesişir, hiçbir yüz kapanmaz
    ]);
    expect(faces).toHaveLength(0);
  });

  it('kopuk iç döngü (serbest kolon/çekirdek) mahali ÇİFT SAYMAZ', () => {
    // 200×200 dış kare + içinde DOKUNMAYAN serbest 40×40 kapalı halka (iki ayrı bağlı bileşen).
    // Hata (bileşen-farkında değilken): iç halka iki kez çıkar (CCW+CW) → çift hayalet mahal.
    const segs: Segment[] = [
      ...box(0, 0, 200, 200), // dış (40000)
      ...box(80, 80, 120, 120), // serbest iç halka (1600), dışa bağlı değil
    ];
    const faces = findFaces(segs);
    const areas = faces.map((f) => Math.round(polygonArea(f))).sort((a, b) => a - b);
    expect(faces).toHaveLength(2); // 3 değil — iç halka tek kez
    expect(areas).toEqual([1600, 40000]);
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
