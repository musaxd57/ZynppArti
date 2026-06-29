import { describe, it, expect } from 'vitest';
import { SpatialIndex } from './spatial-index';

const box = (minX: number, minY: number, maxX: number, maxY: number) => ({ minX, minY, maxX, maxY });

describe('SpatialIndex', () => {
  it('inserts and searches by box', () => {
    const idx = new SpatialIndex();
    idx.insert('a', box(0, 0, 10, 10));
    idx.insert('b', box(100, 100, 110, 110));

    expect(idx.search(box(-1, -1, 5, 5))).toEqual(['a']);
    expect(idx.search(box(105, 105, 106, 106))).toEqual(['b']);
    expect(idx.size).toBe(2);
  });

  it('returns all overlapping ids', () => {
    const idx = new SpatialIndex();
    idx.insert('a', box(0, 0, 10, 10));
    idx.insert('b', box(5, 5, 15, 15));
    expect(idx.search(box(6, 6, 7, 7)).sort()).toEqual(['a', 'b']);
  });

  it('removes an entity', () => {
    const idx = new SpatialIndex();
    idx.insert('a', box(0, 0, 10, 10));
    idx.remove('a');
    expect(idx.search(box(0, 0, 10, 10))).toEqual([]);
    expect(idx.size).toBe(0);
  });

  it('updates the box of an entity', () => {
    const idx = new SpatialIndex();
    idx.insert('a', box(0, 0, 10, 10));
    idx.update('a', box(200, 200, 210, 210));
    expect(idx.search(box(0, 0, 10, 10))).toEqual([]);
    expect(idx.search(box(205, 205, 206, 206))).toEqual(['a']);
  });

  it('aynı id\'ye tekrar insert → hayalet düğüm bırakmaz (idempotans)', () => {
    const idx = new SpatialIndex();
    idx.insert('a', box(0, 0, 10, 10));
    idx.insert('a', box(200, 200, 210, 210)); // eski referans sökülmeli
    expect(idx.size).toBe(1);
    expect(idx.search(box(0, 0, 10, 10))).toEqual([]); // eski kutu kalmadı
    expect(idx.search(box(205, 205, 206, 206))).toEqual(['a']);
    idx.remove('a');
    expect(idx.search(box(0, 0, 300, 300))).toEqual([]); // hayalet düğüm yok
  });

  it('bulk loads and clears', () => {
    const idx = new SpatialIndex();
    idx.bulkLoad([
      { id: 'a', box: box(0, 0, 1, 1) },
      { id: 'b', box: box(2, 2, 3, 3) },
    ]);
    expect(idx.size).toBe(2);
    idx.clear();
    expect(idx.size).toBe(0);
    expect(idx.search(box(0, 0, 3, 3))).toEqual([]);
  });

  it('bounds() tüm öğeleri kapsayan birleşik kutuyu döndürür', () => {
    const idx = new SpatialIndex();
    expect(idx.bounds()).toBeNull(); // boş
    idx.insert('a', box(0, 0, 10, 10));
    idx.insert('b', box(-5, 20, 5, 30));
    expect(idx.bounds()).toEqual({ minX: -5, minY: 0, maxX: 10, maxY: 30 });
  });
});
