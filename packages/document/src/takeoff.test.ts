import { describe, expect, it } from 'vitest';
import { computeTakeoff, DEFAULT_STOREY_HEIGHT_CM } from './takeoff';
import type { Block, Opening, Space, Wall } from './entities';

function wall(id: string, x1: number, y1: number, x2: number, y2: number): Wall {
  return { id, type: 'wall', layerId: 'default', start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: 15 };
}

/** 400×400 cm kare mahal. */
const squareSpace: Space = {
  id: 's',
  type: 'space',
  layerId: 'rooms',
  name: 'Oda',
  boundary: [
    { x: 0, y: 0 },
    { x: 400, y: 0 },
    { x: 400, y: 400 },
    { x: 0, y: 400 },
  ],
};

function door(id: string, width: number): Opening {
  return { id, type: 'opening', layerId: 'default', wallId: 'w', t: 0.5, width, kind: 'door' };
}

describe('computeTakeoff', () => {
  it('duvar uzunluğu metre cinsinden toplanır', () => {
    const t = computeTakeoff([wall('a', 0, 0, 500, 0), wall('b', 0, 0, 0, 300)], [], []);
    expect(t.wallLengthM).toBeCloseTo(8, 6); // 5 + 3 m
  });

  it('sıva alanı iki yüz × uzunluk × kat yüksekliği', () => {
    // 500 cm duvar, h=270 → 2×5×2,7 = 27 m²
    const t = computeTakeoff([wall('a', 0, 0, 500, 0)], [], [], [], { storeyHeightCm: 270 });
    expect(t.plasterAreaM2).toBeCloseTo(27, 6);
  });

  it('kapı sıva alanından (iki yüz) düşülür', () => {
    // 500 cm duvar h=270 = 27 m²; 90cm×210cm kapı iki yüz = 2×0,9×2,1 = 3,78 m² düşer
    const t = computeTakeoff([wall('a', 0, 0, 500, 0)], [], [door('d', 90)], [], { storeyHeightCm: 270 });
    expect(t.plasterAreaM2).toBeCloseTo(27 - 3.78, 5);
  });

  it('döşeme = mahal alanı, süpürgelik = çevre − kapı genişlikleri', () => {
    const t = computeTakeoff([], [squareSpace], [door('d', 90)]);
    expect(t.floorAreaM2).toBeCloseTo(16, 6); // 4×4
    // çevre 1600 cm = 16 m; kapı 90 cm = 0,9 m düşer → 15,1
    expect(t.skirtingM).toBeCloseTo(15.1, 6);
  });

  it('kapı/pencere çizelgesi genişliğe göre gruplanır', () => {
    const t = computeTakeoff(
      [],
      [],
      [door('d1', 90), door('d2', 90), door('d3', 80), { ...door('w1', 120), kind: 'window' }],
    );
    expect(t.doorCount).toBe(3);
    expect(t.windowCount).toBe(1);
    expect(t.doorSchedule).toEqual([
      { width: 80, count: 1 },
      { width: 90, count: 2 },
    ]);
    expect(t.windowSchedule).toEqual([{ width: 120, count: 1 }]);
  });

  it('mobilya çizelgesi tipe göre gruplanır (BLOCK_DEFS sırasıyla)', () => {
    const block = (id: string, kind: Block['kind']): Block => ({
      id,
      type: 'block',
      layerId: 'default',
      kind,
      position: { x: 0, y: 0 },
      rotation: 0,
    });
    const t = computeTakeoff(
      [],
      [],
      [],
      [block('b1', 'table'), block('b2', 'bed-double'), block('b3', 'table')],
    );
    // bed-double BLOCK_DEFS'te table'dan önce tanımlı → sırada önce gelir.
    expect(t.blockSchedule).toEqual([
      { kind: 'bed-double', label: 'Çift kişilik yatak', count: 1 },
      { kind: 'table', label: 'Masa', count: 2 },
    ]);
  });

  it('varsayılan kat yüksekliği sabiti', () => {
    expect(DEFAULT_STOREY_HEIGHT_CM).toBe(270);
  });
});
