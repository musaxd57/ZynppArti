import { describe, it, expect } from 'vitest';
import { BLOCK_DEFS, blockCorners, pointInBlock } from './block';
import type { Block } from './entities';

const make = (over: Partial<Block> = {}): Block => ({
  id: 'b1',
  type: 'block',
  layerId: 'default',
  kind: 'table',
  position: { x: 0, y: 0 },
  rotation: 0,
  ...over,
});

describe('blockCorners', () => {
  it('returns the footprint corners centred on position (rotation 0)', () => {
    const { w, h } = BLOCK_DEFS.table; // 120 x 80
    const c = blockCorners(make());
    expect(c).toHaveLength(4);
    // sol-üst, sağ-üst, sağ-alt, sol-alt
    expect(c[0]).toEqual({ x: -w / 2, y: -h / 2 });
    expect(c[2]).toEqual({ x: w / 2, y: h / 2 });
  });

  it('offsets corners by the block position', () => {
    const { w, h } = BLOCK_DEFS.table;
    const c = blockCorners(make({ position: { x: 100, y: 50 } }));
    expect(c[0]).toEqual({ x: 100 - w / 2, y: 50 - h / 2 });
  });

  it('rotates 90° → genişlik/derinlik eksenleri yer değiştirir', () => {
    const { w, h } = BLOCK_DEFS.table; // 120 x 80
    const c = blockCorners(make({ rotation: Math.PI / 2 }));
    // Köşelerin eksen-hizalı sınır kutusu artık h × w olmalı.
    const xs = c.map((p) => p.x);
    const ys = c.map((p) => p.y);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(h, 6);
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(w, 6);
  });
});

describe('pointInBlock', () => {
  it('merkez içeride, uzak nokta dışarıda', () => {
    const b = make();
    expect(pointInBlock(b, { x: 0, y: 0 })).toBe(true);
    expect(pointInBlock(b, { x: 1000, y: 1000 })).toBe(false);
  });

  it('respects rotation — döndürülünce köşe-ötesi nokta dışarı düşer', () => {
    const { w } = BLOCK_DEFS.table; // 120 geniş, 80 derin
    const justInsideX = w / 2 - 1;
    const b0 = make();
    expect(pointInBlock(b0, { x: justInsideX, y: 0 })).toBe(true);
    // 90° döndür: yerel x ekseni artık dünya y; aynı dünya-x noktası derinlik (80) sınırını aşar.
    const b90 = make({ rotation: Math.PI / 2 });
    expect(pointInBlock(b90, { x: justInsideX, y: 0 })).toBe(false);
  });

  it('honours block position', () => {
    const b = make({ position: { x: 200, y: 0 } });
    expect(pointInBlock(b, { x: 200, y: 0 })).toBe(true);
    expect(pointInBlock(b, { x: 0, y: 0 })).toBe(false);
  });
});
