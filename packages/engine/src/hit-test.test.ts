import { describe, it, expect } from 'vitest';
import { EntityStore, type Wall } from '@zynpparti/document';
import { SpatialIndex } from './spatial-index';
import { entityBounds } from './entity-bounds';
import { hitTest } from './hit-test';

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
});
