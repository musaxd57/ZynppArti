import { describe, it, expect } from 'vitest';
import { openingFrame, projectToWall } from './opening';
import type { Opening, Wall } from './entities';

const wall = (x1: number, y1: number, x2: number, y2: number, thickness = 20): Wall => ({
  id: 'w',
  type: 'wall',
  layerId: 'default',
  start: { x: x1, y: y1 },
  end: { x: x2, y: y2 },
  thickness,
});

const opening = (t: number, width: number): Opening => ({
  id: 'o',
  type: 'opening',
  layerId: 'default',
  wallId: 'w',
  t,
  width,
  kind: 'door',
});

describe('openingFrame', () => {
  it('yatay duvarda merkez = t oranı, dir/normal birim', () => {
    const f = openingFrame(opening(0.5, 80), wall(0, 0, 200, 0, 20));
    expect(f.center).toEqual({ x: 100, y: 0 });
    expect(f.dir.x).toBeCloseTo(1, 6);
    expect(f.dir.y).toBeCloseTo(0, 6);
    expect(f.normal.x).toBeCloseTo(0, 6); // -0 olabilir → toBeCloseTo
    expect(f.normal.y).toBeCloseTo(1, 6);
    expect(f.thickness).toBe(20);
  });

  it('jamb kenarları merkezden ±yarı genişlik (duvar yönünde)', () => {
    const f = openingFrame(opening(0.5, 80), wall(0, 0, 200, 0));
    expect(f.a).toEqual({ x: 60, y: 0 });
    expect(f.b).toEqual({ x: 140, y: 0 });
    expect(Math.hypot(f.b.x - f.a.x, f.b.y - f.a.y)).toBeCloseTo(80, 6);
  });

  it('dikey duvarda dir/normal döner', () => {
    const f = openingFrame(opening(0.25, 100), wall(0, 0, 0, 400));
    expect(f.center).toEqual({ x: 0, y: 100 });
    expect(f.dir).toEqual({ x: 0, y: 1 });
    expect(f.normal).toEqual({ x: -1, y: 0 });
  });

  it('dejenere (sıfır uzunluk) duvarda patlamaz', () => {
    const f = openingFrame(opening(0.5, 80), wall(10, 10, 10, 10));
    expect(Number.isFinite(f.center.x)).toBe(true);
    expect(Number.isFinite(f.dir.x)).toBe(true);
  });
});

describe('projectToWall', () => {
  it('duvar üstündeki nokta → t, uzaklık 0', () => {
    const r = projectToWall({ x: 50, y: 0 }, wall(0, 0, 200, 0));
    expect(r.t).toBeCloseTo(0.25, 6);
    expect(r.dist).toBeCloseTo(0, 6);
  });

  it('duvara dik uzaklığı verir', () => {
    const r = projectToWall({ x: 100, y: 30 }, wall(0, 0, 200, 0));
    expect(r.t).toBeCloseTo(0.5, 6);
    expect(r.dist).toBeCloseTo(30, 6);
  });

  it('uçların ötesi t∈[0,1] sınırına kırpılır', () => {
    expect(projectToWall({ x: -100, y: 0 }, wall(0, 0, 200, 0)).t).toBe(0);
    expect(projectToWall({ x: 999, y: 0 }, wall(0, 0, 200, 0)).t).toBe(1);
  });
});
