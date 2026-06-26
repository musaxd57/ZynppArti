import { describe, it, expect } from 'vitest';
import { EntityStore, type Block, type Wall } from '@zynpparti/document';
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

  it('blok merkezine tam yakalama (anahtar nokta duvar dışı tipleri de kapsar)', () => {
    const store = new EntityStore();
    const index = new SpatialIndex();
    const block: Block = {
      id: 'b1',
      type: 'block',
      layerId: 'furniture',
      kind: 'table',
      position: { x: 100, y: 100 },
      rotation: 0,
    };
    store.put(block);
    index.insert(block.id, entityBounds(block));
    const snap = createSnapper(store, index, () => 1);
    expect(snap({ x: 103, y: 98 })).toEqual({ x: 100, y: 100 }); // merkeze yakalar
  });

  it('duvar orta noktasına yakalar ve midpoint glyph bildirir', () => {
    const { store, index } = wallAt();
    let hint: SnapHint | null = null;
    const snap = createSnapper(store, index, () => 1, (h) => {
      hint = h;
    });
    // Orta nokta {50,0}; {52,3} ona yakın (uçlar uzak).
    expect(snap({ x: 52, y: 3 })).toEqual({ x: 50, y: 0 });
    expect(hint!.point).toEqual({ x: 50, y: 0 });
    expect(hint!.pointKind).toBe('midpoint');
  });

  it('duvar kenarına dik iz düşümle yakalar (edge) — uç/orta uzaksa', () => {
    const { store, index } = wallAt();
    let hint: SnapHint | null = null;
    const snap = createSnapper(store, index, () => 1, (h) => {
      hint = h;
    });
    // {30,5}: hiçbir anahtar noktaya yakın değil ama duvar kenarına 5 cm → {30,0}.
    expect(snap({ x: 30, y: 5 })).toEqual({ x: 30, y: 0 });
    expect(hint!.pointKind).toBe('edge');
  });

  it('iki çaprazlanan duvarın kesişimine yakalar (intersection glyph)', () => {
    const store = new EntityStore();
    const index = new SpatialIndex();
    // a: yatay y=0 (0,0)-(100,0); b: dikey x=30 (30,-40)-(30,60). Kesişim {30,0} —
    // hiçbirinin ucu/orta noktası değil (a-orta {50,0}, b-orta {30,10}).
    const a: Wall = {
      id: 'a',
      type: 'wall',
      layerId: 'default',
      start: { x: 0, y: 0 },
      end: { x: 100, y: 0 },
      thickness: 10,
    };
    const b: Wall = {
      id: 'b',
      type: 'wall',
      layerId: 'default',
      start: { x: 30, y: -40 },
      end: { x: 30, y: 60 },
      thickness: 10,
    };
    store.put(a);
    store.put(b);
    index.insert(a.id, entityBounds(a));
    index.insert(b.id, entityBounds(b));
    let hint: SnapHint | null = null;
    const snap = createSnapper(store, index, () => 1, (h) => {
      hint = h;
    });
    const p = snap({ x: 30, y: -3 });
    expect(p.x).toBeCloseTo(30);
    expect(p.y).toBeCloseTo(0);
    expect(hint!.pointKind).toBe('intersection');
  });

  it('exclude verilen entity yakalamaya katılmaz (kendine-snap önlenir)', () => {
    const store = new EntityStore();
    const index = new SpatialIndex();
    // Izgara-DIŞI uçlu duvar (10,10)-(110,10) → uç (10,10) ızgara noktası değil.
    const wall: Wall = {
      id: 'w1',
      type: 'wall',
      layerId: 'default',
      start: { x: 10, y: 10 },
      end: { x: 110, y: 10 },
      thickness: 10,
    };
    store.put(wall);
    index.insert(wall.id, entityBounds(wall));
    const snap = createSnapper(store, index, () => 1);
    // w1 dahil → kendi ucuna (10,10) yapışır.
    expect(snap({ x: 13, y: 12 })).toEqual({ x: 10, y: 10 });
    // w1 hariç → uca yapışmaz, ızgaraya düşer (0,0).
    expect(snap({ x: 13, y: 12 }, new Set(['w1']))).toEqual({ x: 0, y: 0 });
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
