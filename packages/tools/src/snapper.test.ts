import { describe, it, expect } from 'vitest';
import { EntityStore, type Wall } from '@zynpparti/document';
import { SpatialIndex, entityBounds, type SnapHint } from '@zynpparti/engine';
import { createSnapper } from './context';

function wallAt(): { store: EntityStore; index: SpatialIndex } {
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
  return { store, index };
}

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

  it('aligns to another point on the X axis and emits a vertical guide', () => {
    const { store, index } = wallAt();
    let hint: SnapHint | null = null;
    const snap = createSnapper(store, index, () => 1, (h) => {
      hint = h;
    });
    // x=3, duvar ucu x=0'a hizalanır (tol 8); y=200 hiçbir noktayla hizalanmaz → ızgara.
    const p = snap({ x: 3, y: 200 });
    expect(p.x).toBe(0);
    expect(p.y).toBe(200);
    expect(hint!.point).toBeNull();
    expect(hint!.vGuide).not.toBeNull();
    expect(hint!.hGuide).toBeNull();
  });

  it('exact endpoint snap reports a point hint (no guides)', () => {
    const { store, index } = wallAt();
    let hint: SnapHint | null = null;
    const snap = createSnapper(store, index, () => 1, (h) => {
      hint = h;
    });
    snap({ x: 2, y: 1 });
    expect(hint!.point).toEqual({ x: 0, y: 0 });
    expect(hint!.vGuide).toBeNull();
    expect(hint!.hGuide).toBeNull();
  });
});
