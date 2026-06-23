import { describe, it, expect } from 'vitest';
import { wallBoxes, wallBoxesWithOpenings } from './wall3d';
import type { Opening, Wall } from './entities';

function wall(x1: number, y1: number, x2: number, y2: number, thickness = 20, height?: number): Wall {
  return { id: 'w', type: 'wall', layerId: 'default', start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, ...(height ? { height } : {}) };
}

describe('wallBoxes', () => {
  it('yatay duvar: uzunluk, merkez, açı 0, varsayılan yükseklik', () => {
    const [b] = wallBoxes([wall(0, 0, 100, 0)]);
    expect(b!.length).toBe(100);
    expect(b!.cx).toBe(50);
    expect(b!.cy).toBe(0);
    expect(b!.angleRad).toBe(0);
    expect(b!.height).toBe(280); // varsayılan
    expect(b!.thickness).toBe(20);
  });

  it('dikey duvar: açı π/2', () => {
    const [b] = wallBoxes([wall(0, 0, 0, 100)]);
    expect(b!.angleRad).toBeCloseTo(Math.PI / 2);
    expect(b!.length).toBe(100);
  });

  it('duvar.height verilince onu kullanır', () => {
    const [b] = wallBoxes([wall(0, 0, 100, 0, 20, 320)]);
    expect(b!.height).toBe(320);
  });
});

describe('wallBoxesWithOpenings', () => {
  const op = (wallId: string, t: number, width: number, kind: 'door' | 'window'): Opening => ({
    id: `o-${wallId}-${t}`,
    type: 'opening',
    layerId: 'default',
    wallId,
    t,
    width,
    kind,
  });

  it('boşluk yokken tek dolu kutu (wallBoxes ile aynı)', () => {
    const out = wallBoxesWithOpenings([{ ...wall(0, 0, 400, 0), id: 'w1' }], []);
    expect(out).toHaveLength(1);
    expect(out[0]!.length).toBe(400);
  });

  it('kapı: önce/sonra dolu parça + üstte lento (3 kutu)', () => {
    const w = { ...wall(0, 0, 400, 0), id: 'w1' };
    const out = wallBoxesWithOpenings([w], [op('w1', 0.5, 100, 'door')], 280);
    // [0,150] dolu, [150,250] lento (base 210), [250,400] dolu
    expect(out).toHaveLength(3);
    const lento = out.find((b) => b.baseHeight === 210)!;
    expect(lento.height).toBeCloseTo(70); // 280 - 210
    expect(lento.length).toBeCloseTo(100);
  });

  it('pencere: denizlik (alt) + lento (üst) + iki dolu parça (4 kutu)', () => {
    const w = { ...wall(0, 0, 400, 0), id: 'w1' };
    const out = wallBoxesWithOpenings([w], [op('w1', 0.5, 100, 'window')], 280);
    expect(out).toHaveLength(4);
    expect(out.some((b) => b.baseHeight === 0 && b.height === 90 && b.length === 100)).toBe(true); // denizlik
    expect(out.some((b) => b.baseHeight === 220)).toBe(true); // lento
  });
});
