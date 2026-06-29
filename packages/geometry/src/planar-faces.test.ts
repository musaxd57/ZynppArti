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

  it('dışarıdan değen sarkık duvar (spur) oda poligonuna spike kaçırmaz', () => {
    // Kare oda + sağ kenarın ortasından (200,100) dışarı uzanan sarkık duvar. Spur git-gel net 0 alan →
    // iç oda ile dış yüz AYNI |alan|ı verir; eski "en büyük |alan|" tie-break yanlış yüzü tutup oda
    // poligonuna (260,100) spike'ını gömüyordu (denetim). İşaret-bazlı dış-yüz seçimi temiz kareyi döndürmeli.
    const segs: Segment[] = [
      { a: vec2(0, 0), b: vec2(200, 0) },
      { a: vec2(200, 0), b: vec2(200, 100) },
      { a: vec2(200, 100), b: vec2(200, 200) },
      { a: vec2(200, 200), b: vec2(0, 200) },
      { a: vec2(0, 200), b: vec2(0, 0) },
      { a: vec2(200, 100), b: vec2(260, 100) }, // dışarı sarkan duvar
    ];
    const faces = findFaces(segs);
    expect(faces).toHaveLength(1);
    expect(polygonArea(faces[0]!)).toBeCloseTo(40000);
    // Hiçbir köşe x>200 olmamalı (spike gömülmemiş).
    for (const v of faces[0]!) expect(v.x).toBeLessThanOrEqual(200.001);
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

  it('kelebek (bowtie / kendini kesen kapalı döngü) çökmeden iki üçgen yüz verir', () => {
    // (0,0)→(100,100)→(100,0)→(0,100)→kapat. 1. kenar (0,0)-(100,100) ile 3. kenar (100,0)-(0,100)
    // merkezde (50,50) kesişir → planar bölme iki üçgen (her biri 2500 cm²) verir.
    const faces = findFaces([
      { a: vec2(0, 0), b: vec2(100, 100) },
      { a: vec2(100, 100), b: vec2(100, 0) },
      { a: vec2(100, 0), b: vec2(0, 100) },
      { a: vec2(0, 100), b: vec2(0, 0) },
    ]);
    const areas = faces.map((f) => Math.round(polygonArea(f))).sort((a, b) => a - b);
    expect(faces).toHaveLength(2);
    expect(areas).toEqual([2500, 2500]);
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

  it('hücre sınırını çapraz aşan ~yakın köşeleri birleştirir (ızgara-bucket straddle)', () => {
    // Köşeler snapTol(1) içinde ama farklı ızgara hücrelerinde (sınır .5'te): A ucu (0.4,0.6),
    // B ucu (0.6,0.4) → bucket (0,1) vs (1,0); eski kod birleştirmez, oda kaybolurdu.
    const faces = findFaces([
      { a: vec2(0.4, 0.6), b: vec2(0.4, 100) },
      { a: vec2(0.4, 100), b: vec2(100, 100) },
      { a: vec2(100, 100), b: vec2(100, 0.4) },
      { a: vec2(100, 0.4), b: vec2(0.6, 0.4) },
    ]);
    expect(faces).toHaveLength(1);
    expect(polygonArea(faces[0]!)).toBeGreaterThan(9000);
  });
});
