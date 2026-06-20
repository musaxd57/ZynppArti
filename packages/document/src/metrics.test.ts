import { describe, expect, it } from 'vitest';
import {
  ROOM_TYPES,
  centerlineAreaM2,
  computeMetrics,
  netGrossAreaM2,
  roomTypeLabel,
  roomTypeOf,
} from './metrics';
import type { Space, Wall } from './entities';

/** 4 köşeli kare mahal (cm). side cm kenarlı, sol-alt köşesi origin. */
function squareSpace(id: string, side: number, roomType?: Space['roomType']): Space {
  return {
    id,
    type: 'space',
    layerId: 'rooms',
    name: 'Test',
    roomType,
    boundary: [
      { x: 0, y: 0 },
      { x: side, y: 0 },
      { x: side, y: side },
      { x: 0, y: side },
    ],
  };
}

/** Kare mahalin kenarlarına oturan 4 duvar (her biri thickness). */
function squareWalls(side: number, thickness: number): Wall[] {
  const c = [
    { x: 0, y: 0 },
    { x: side, y: 0 },
    { x: side, y: side },
    { x: 0, y: side },
  ];
  return c.map((p, i) => ({
    id: `w${i}`,
    type: 'wall' as const,
    layerId: 'default',
    start: p,
    end: c[(i + 1) % 4]!,
    thickness,
  }));
}

describe('centerlineAreaM2', () => {
  it('100x100 cm kare = 1 m²', () => {
    expect(centerlineAreaM2(squareSpace('s', 100))).toBeCloseTo(1, 6);
  });
});

describe('netGrossAreaM2', () => {
  it('net < centerline < brüt, duvar kalınlığına göre', () => {
    // 400x400 cm kare = 16 m² centerline. Çevre = 1600 cm, kalınlık 20 cm.
    // ΔA = 1600 × 20/2 = 16000 cm² = 1.6 m². net=14.4, brüt=17.6.
    const space = squareSpace('s', 400);
    const walls = squareWalls(400, 20);
    const { netM2, grossM2 } = netGrossAreaM2(space, walls);
    expect(centerlineAreaM2(space)).toBeCloseTo(16, 6);
    expect(netM2).toBeCloseTo(14.4, 6);
    expect(grossM2).toBeCloseTo(17.6, 6);
  });

  it('duvar yoksa net = brüt = centerline', () => {
    const space = squareSpace('s', 400);
    const { netM2, grossM2 } = netGrossAreaM2(space, []);
    expect(netM2).toBeCloseTo(16, 6);
    expect(grossM2).toBeCloseTo(16, 6);
  });
});

describe('roomTypeOf / roomTypeLabel', () => {
  it('atanmamış tip = other', () => {
    expect(roomTypeOf(squareSpace('s', 100))).toBe('other');
    expect(roomTypeOf(squareSpace('s', 100, 'wet'))).toBe('wet');
  });

  it('etiket Türkçe', () => {
    expect(roomTypeLabel('wet')).toBe('Islak hacim');
    expect(roomTypeLabel('living')).toBe('Yaşam');
  });

  it('ROOM_TYPES tüm tipleri kapsar', () => {
    expect(ROOM_TYPES.map((t) => t.key)).toEqual([
      'living',
      'wet',
      'sleeping',
      'circulation',
      'service',
      'other',
    ]);
  });
});

describe('computeMetrics', () => {
  it('boş plan → sıfır metrik', () => {
    const m = computeMetrics([], []);
    expect(m).toEqual({ roomCount: 0, totalM2: 0, netM2: 0, grossM2: 0, byType: [] });
  });

  it('tipe göre gruplar ve ROOM_TYPES sırasında döner', () => {
    const spaces = [
      squareSpace('a', 100, 'wet'),
      squareSpace('b', 100, 'living'),
      squareSpace('c', 100, 'wet'),
      squareSpace('d', 100), // atanmamış → other
    ];
    const m = computeMetrics(spaces, []);
    expect(m.roomCount).toBe(4);
    expect(m.totalM2).toBeCloseTo(4, 6); // 4 × 1 m²
    // Sıra: living, wet, other (ROOM_TYPES sırası)
    expect(m.byType.map((b) => b.type)).toEqual(['living', 'wet', 'other']);
    const wet = m.byType.find((b) => b.type === 'wet')!;
    expect(wet.count).toBe(2);
    expect(wet.areaM2).toBeCloseTo(2, 6);
  });
});
