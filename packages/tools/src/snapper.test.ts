import { describe, it, expect } from 'vitest';
import { EntityStore, type Wall } from '@zynpparti/document';
import { SpatialIndex, entityBounds } from '@zynpparti/engine';
import { createSnapper } from './context';

function setup(): ReturnType<typeof createSnapper> {
  const store = new EntityStore();
  const index = new SpatialIndex();
  const wall: Wall = {
    id: 'w1',
    type: 'wall',
    layerId: 'default',
    start: { x: 0, y: 0 },
    end: { x: 100, y: 0 },
    thickness: 10,
  };
  store.put(wall);
  index.insert(wall.id, entityBounds(wall));
  return createSnapper(store, index, () => 1); // pixelSize = 1 → yarıçap 12 cm
}

describe('createSnapper', () => {
  it('snaps to a nearby wall endpoint', () => {
    const snap = setup();
    expect(snap({ x: 3, y: 2 })).toEqual({ x: 0, y: 0 });
    expect(snap({ x: 98, y: 1 })).toEqual({ x: 100, y: 0 });
  });

  it('falls back to the grid when no endpoint is near', () => {
    const snap = setup();
    expect(snap({ x: 313, y: 287 })).toEqual({ x: 300, y: 300 });
    expect(snap({ x: 24, y: 26 })).toEqual({ x: 0, y: 50 });
  });
});
