import { describe, it, expect } from 'vitest';
import { EntityStore, type Sheet, type Wall } from '@zynpparti/document';
import { SpatialIndex } from './spatial-index';
import { entityBounds } from './entity-bounds';
import { hitTest, marqueeHitTest } from './hit-test';

function wall(id: string, start: { x: number; y: number }, end: { x: number; y: number }): Wall {
  return { id, type: 'wall', layerId: 'default', start, end, thickness: 10 };
}

/** Bir store + indeks kurar (entity'leri bounds'larıyla indeksler). */
function setup(walls: Wall[]): { store: EntityStore; index: SpatialIndex } {
  const store = new EntityStore();
  const index = new SpatialIndex();
  for (const w of walls) {
    store.put(w);
    index.insert(w.id, entityBounds(w));
  }
  return { store, index };
}

describe('hitTest', () => {
  it('hits a wall within reach (half thickness + tolerance)', () => {
    const { store, index } = setup([wall('w1', { x: 0, y: 0 }, { x: 100, y: 0 })]);
    // duvar y=0'da, kalınlık 10 → yarısı 5; tolerans 5 → y=9 erişimde
    expect(hitTest(store, index, { x: 50, y: 9 })).toBe('w1');
  });

  it('misses when the point is too far', () => {
    const { store, index } = setup([wall('w1', { x: 0, y: 0 }, { x: 100, y: 0 })]);
    expect(hitTest(store, index, { x: 50, y: 40 })).toBeNull();
  });

  it('returns the nearest wall among candidates', () => {
    const { store, index } = setup([
      wall('w1', { x: 0, y: 0 }, { x: 100, y: 0 }),
      wall('w2', { x: 0, y: 20 }, { x: 100, y: 20 }),
    ]);
    expect(hitTest(store, index, { x: 50, y: 16 }, 8)).toBe('w2');
    expect(hitTest(store, index, { x: 50, y: 4 }, 8)).toBe('w1');
  });

  it('marqueeHitTest: çapraz duvarın boş bbox köşesine çizilen kutu onu SEÇMEZ (narrow-phase)', () => {
    // (0,0)→(100,100) çapraz duvar; AABB'si 0..100 kare. Sol-üst köşe (0..20, 80..100) duvardan uzak.
    const { store, index } = setup([wall('w1', { x: 0, y: 0 }, { x: 100, y: 100 })]);
    const empty = marqueeHitTest(store, index, { minX: 2, minY: 82, maxX: 20, maxY: 98 });
    expect(empty).toEqual([]); // eski broad-phase'de 'w1' yanlış seçilirdi
    // Kutu gerçekten duvarı kesiyorsa seçilir.
    const onit = marqueeHitTest(store, index, { minX: 40, minY: 40, maxX: 60, maxY: 60 });
    expect(onit).toEqual(['w1']);
  });

  it('marqueeHitTest: gizli/kilitli katman atlanır, mahaller hariç', () => {
    const { store, index } = setup([wall('w1', { x: 0, y: 0 }, { x: 100, y: 0 })]);
    expect(marqueeHitTest(store, index, { minX: 0, minY: -10, maxX: 100, maxY: 10 })).toEqual(['w1']);
    expect(marqueeHitTest(store, index, { minX: 0, minY: -10, maxX: 100, maxY: 10 }, (lid) => lid === 'default')).toEqual([]);
  });

  it('pafta yalnız çerçevesinden seçilir (iç alana tık → null)', () => {
    const store = new EntityStore();
    const index = new SpatialIndex();
    const sheet: Sheet = {
      id: 's1',
      type: 'sheet',
      layerId: 'sheet',
      position: { x: 0, y: 0 }, // A3 yatay 1:50 → 2100×1485
      size: 'A3',
      orientation: 'landscape',
      scale: 50,
      title: 'P',
    };
    store.put(sheet);
    index.insert(sheet.id, entityBounds(sheet));
    // Üst kenara yakın → çerçeveden seçilir.
    expect(hitTest(store, index, { x: 1000, y: 2 }, 5)).toBe('s1');
    // İç alan (kenarlardan uzak) → seçilmez.
    expect(hitTest(store, index, { x: 1000, y: 700 }, 5)).toBeNull();
  });
});
