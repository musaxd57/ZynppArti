import { describe, it, expect } from 'vitest';
import { fitOpeningT, openingCenterT, openingFrame, projectToWall } from './opening';
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

  it('uca yakın boşluk duvar İÇİNDE kalır (jamb taşmaz)', () => {
    // 200 boyu duvar, 80 genişlik kapı, t=0 (uçta) istense bile yarısı (40) içeri çekilir.
    const w = wall(0, 0, 200, 0);
    const f = openingFrame(opening(0, 80), w);
    expect(f.a.x).toBeGreaterThanOrEqual(-1e-9); // sol jamb duvar başlangıcından önce değil
    expect(f.b.x).toBeLessThanOrEqual(200 + 1e-9); // sağ jamb duvar sonundan sonra değil
    expect(f.center.x).toBeCloseTo(40, 6); // merkez yarı-genişlik kadar içeri
  });
});

describe('fitOpeningT', () => {
  it('orta konumu olduğu gibi bırakır', () => {
    expect(fitOpeningT(200, 80, 0.5)).toBeCloseTo(0.5, 6);
  });

  it('uçtaki t değerlerini içeri kısar (yarı/1−yarı)', () => {
    expect(fitOpeningT(200, 80, 0)).toBeCloseTo(0.2, 6); // 40/200
    expect(fitOpeningT(200, 80, 1)).toBeCloseTo(0.8, 6);
  });

  it('genişlik duvardan büyükse sığmaz → null', () => {
    expect(fitOpeningT(100, 120, 0.5)).toBeNull();
    expect(fitOpeningT(0, 80, 0.5)).toBeNull();
  });

  it('tam sığan genişlik (width = wallLen) → t ortaya kilitlenir', () => {
    expect(fitOpeningT(80, 80, 0.2)).toBeCloseTo(0.5, 6);
  });
});

describe('openingCenterT (plan/kesit/3B/metraj ortak konum kaynağı — denetim L5)', () => {
  it('sığan boşlukta t korunur', () => {
    expect(openingCenterT(wall(0, 0, 200, 0), opening(0.5, 80))).toBeCloseTo(0.5, 6);
  });

  it('kısaltılmış duvarda uca yakın t içeri kısılır (plan ile aynı sığdırma)', () => {
    // Duvar 200, kapı 80, t=1 → ham konum taşar; sığdırılmış t = 0.8 (= fitOpeningT).
    const w = wall(0, 0, 200, 0);
    const o = opening(1, 80);
    expect(openingCenterT(w, o)).toBeCloseTo(0.8, 6);
    // openingFrame (plan render) AYNI değeri kullanır → kesit/3B/metraj artık planla tutarlı.
    expect(openingFrame(o, w).center.x).toBeCloseTo(openingCenterT(w, o) * 200, 6);
  });

  it('genişlik duvardan büyükse ortalanır (0.5)', () => {
    expect(openingCenterT(wall(0, 0, 100, 0), opening(0.3, 120))).toBeCloseTo(0.5, 6);
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
