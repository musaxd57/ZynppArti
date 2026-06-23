import { describe, it, expect } from 'vitest';
import { wallBoxes } from './wall3d';
import type { Wall } from './entities';

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
