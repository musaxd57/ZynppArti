import { describe, it, expect } from 'vitest';
import { computeSection, DEFAULT_WALL_HEIGHT_CM } from './section';
import type { Wall } from './entities';

let n = 0;
function wall(x1: number, y1: number, x2: number, y2: number, thickness = 20, height?: number): Wall {
  return {
    id: `w${n++}`,
    type: 'wall',
    layerId: 'default',
    start: { x: x1, y: y1 },
    end: { x: x2, y: y2 },
    thickness,
    ...(height != null ? { height } : {}),
  };
}

describe('computeSection', () => {
  it('kesit çizgisini kesen duvarları offset/genişlik/yükseklikle döndürür', () => {
    // Kesit çizgisi yatay y=0, x 0→400. İki dikey duvar x=100 ve x=300 onu keser.
    const walls = [
      wall(100, -50, 100, 50, 20, 300),
      wall(300, -50, 300, 50, 15), // yükseklik yok → varsayılan
    ];
    const s = computeSection({ x: 0, y: 0 }, { x: 400, y: 0 }, walls);
    expect(s.lengthCm).toBeCloseTo(400);
    expect(s.cuts).toHaveLength(2);
    expect(s.cuts[0]!.offsetCm).toBeCloseTo(100);
    expect(s.cuts[0]!.heightCm).toBe(300);
    expect(s.cuts[1]!.offsetCm).toBeCloseTo(300);
    expect(s.cuts[1]!.heightCm).toBe(DEFAULT_WALL_HEIGHT_CM);
    expect(s.maxHeightCm).toBe(300);
  });

  it('kesişmeyen duvar kesite girmez', () => {
    const walls = [wall(100, 100, 100, 200)]; // y=0 çizgisini kesmez
    const s = computeSection({ x: 0, y: 0 }, { x: 400, y: 0 }, walls);
    expect(s.cuts).toHaveLength(0);
    expect(s.maxHeightCm).toBe(0);
  });

  it('kesimler soldan sağa sıralı', () => {
    const walls = [wall(300, -50, 300, 50), wall(100, -50, 100, 50), wall(200, -50, 200, 50)];
    const s = computeSection({ x: 0, y: 0 }, { x: 400, y: 0 }, walls);
    expect(s.cuts.map((c) => Math.round(c.offsetCm))).toEqual([100, 200, 300]);
  });

  it('boş duvar listesi → boş kesit', () => {
    const s = computeSection({ x: 0, y: 0 }, { x: 100, y: 0 }, []);
    expect(s.cuts).toHaveLength(0);
    expect(s.maxHeightCm).toBe(0);
  });
});
