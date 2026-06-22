import { describe, it, expect } from 'vitest';
import {
  computeSection,
  solidBands,
  DEFAULT_WALL_HEIGHT_CM,
  DEFAULT_DOOR_HEAD_CM,
  DEFAULT_WINDOW_SILL_CM,
  DEFAULT_WINDOW_HEAD_CM,
} from './section';
import type { Opening, Wall } from './entities';

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

function opening(wallId: string, t: number, width: number, kind: 'door' | 'window'): Opening {
  return { id: `o${n++}`, type: 'opening', layerId: 'default', wallId, t, width, kind };
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

  it('kesit çizgisi kapı konumunda kesince boşluk (kapı) işaretlenir', () => {
    // Duvar x=100 dikey, y -50→50; kesit çizgisi y=0 → t=0.5 noktasında keser. Kapı t=0.5'te.
    const w = wall(100, -50, 100, 50, 20, 280);
    const s = computeSection({ x: 0, y: 0 }, { x: 200, y: 0 }, [w], [opening(w.id, 0.5, 90, 'door')]);
    expect(s.cuts).toHaveLength(1);
    expect(s.cuts[0]!.opening).toEqual({ kind: 'door', sillCm: 0, headCm: DEFAULT_DOOR_HEAD_CM });
  });

  it('kesim noktası boşluk genişliği dışındaysa dolu duvar kalır', () => {
    // Duvar 0→100 (uzunluk 100); kesit t=0.5 (50 cm) noktasında. Kapı t=0.1 (10 cm), genişlik 20 →
    // [0,20] aralığı; 50 cm dışarıda → boşluk yok.
    const w = wall(0, 50, 100, 50, 20, 280); // yatay, kesit dikey x=50
    const s = computeSection({ x: 50, y: 0 }, { x: 50, y: 100 }, [w], [opening(w.id, 0.1, 20, 'door')]);
    expect(s.cuts).toHaveLength(1);
    expect(s.cuts[0]!.opening).toBeUndefined();
  });

  it('pencere boşluğu denizlik + lento ile işaretlenir', () => {
    const w = wall(100, -50, 100, 50, 20, 280);
    const s = computeSection({ x: 0, y: 0 }, { x: 200, y: 0 }, [w], [opening(w.id, 0.5, 120, 'window')]);
    expect(s.cuts[0]!.opening).toEqual({
      kind: 'window',
      sillCm: DEFAULT_WINDOW_SILL_CM,
      headCm: DEFAULT_WINDOW_HEAD_CM,
    });
  });
});

describe('solidBands', () => {
  it('boşluksuz kesim → tek dolu bant [0, height]', () => {
    expect(solidBands({ offsetCm: 0, widthCm: 20, heightCm: 280 })).toEqual([{ from: 0, to: 280 }]);
  });

  it('kapı → yalnız lento üstü bant', () => {
    const bands = solidBands({
      offsetCm: 0,
      widthCm: 20,
      heightCm: 280,
      opening: { kind: 'door', sillCm: 0, headCm: 210 },
    });
    expect(bands).toEqual([{ from: 210, to: 280 }]);
  });

  it('pencere → denizlik altı + lento üstü iki bant', () => {
    const bands = solidBands({
      offsetCm: 0,
      widthCm: 20,
      heightCm: 280,
      opening: { kind: 'window', sillCm: 90, headCm: 210 },
    });
    expect(bands).toEqual([
      { from: 0, to: 90 },
      { from: 210, to: 280 },
    ]);
  });

  it('lento duvardan yüksekse (alçak duvar) üst bant atlanır', () => {
    const bands = solidBands({
      offsetCm: 0,
      widthCm: 20,
      heightCm: 200,
      opening: { kind: 'door', sillCm: 0, headCm: 210 },
    });
    expect(bands).toEqual([]); // kapı tüm duvarı kaplar → dolu bant yok
  });
});
