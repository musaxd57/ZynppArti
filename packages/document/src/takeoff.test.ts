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

  it('duvar örgü = tek yüz; çevre duvarı → 1 iç + 1 dış cephe yüzü; boya = iç sıva + tavan', () => {
    // 500cm duvar h=270, odaya komşu (çevre duvarı) → iç sıva 1×5×2,7 = 13,5; dış cephe 13,5; örgü 13,5.
    const t = computeTakeoff([wall('a', 0, 0, 500, 0)], [squareSpace], [], [], { storeyHeightCm: 270 });
    expect(t.wallElevationM2).toBeCloseTo(13.5, 6);
    expect(t.plasterAreaM2).toBeCloseTo(13.5, 5); // iç sıva (1 yüz)
    expect(t.facadePlasterAreaM2).toBeCloseTo(13.5, 5); // dış cephe (1 yüz)
    expect(t.ceilingAreaM2).toBeCloseTo(16, 6);
    expect(t.paintAreaM2).toBeCloseTo(13.5 + 16, 5); // boya = iç sıva + tavan
  });

  it('iç bölme duvarı (iki odayı ayıran) → 2 iç yüz, 0 dış cephe', () => {
    // Ortak duvar x=400'de; iki 400×400 oda → duvar 2 odaya komşu → 2 iç sıva yüzü, dış cephe 0.
    const left: Space = { ...squareSpace, id: 'L' };
    const right: Space = { ...squareSpace, id: 'R', boundary: [{ x: 400, y: 0 }, { x: 800, y: 0 }, { x: 800, y: 400 }, { x: 400, y: 400 }] };
    const shared = wall('w', 400, 0, 400, 400); // 400cm, h=270
    const t = computeTakeoff([shared], [left, right], [], [], { storeyHeightCm: 270 });
    expect(t.plasterAreaM2).toBeCloseTo(2 * 4 * 2.7, 5); // 2 yüz × 4m × 2,7 = 21,6
    expect(t.facadePlasterAreaM2).toBeCloseTo(0, 5); // iç bölme → dış cephe yok
  });

  it('kapı sıva alanından (iki yüz) düşülür', () => {
    // 500 cm duvar h=270 = 27 m²; 90cm×210cm kapı iki yüz = 2×0,9×2,1 = 3,78 m² düşer.
    // Kapı KENDİ duvarında olmalı (door wallId='w') — duvarı 'w' kuruyoruz ki boşluk o duvardan düşülsün
    // (orphan boşluk artık düşülmez; süpürgelik testiyle tutarlı, çapraz-bulaşma yok).
    const t = computeTakeoff([wall('w', 0, 0, 500, 0)], [], [door('d', 90)], [], { storeyHeightCm: 270 });
    expect(t.plasterAreaM2).toBeCloseTo(27 - 3.78, 5);
  });

  it('bir duvardaki AŞIRI geniş boşluk komşu duvarın örgüsünü çalmaz (duvar-bazlı clamp)', () => {
    // Kısa duvar 'w' (100cm) + üstünde devasa kapı (500cm) → o duvarın örgüsü 0; komşu 500cm duvar etkilenmez.
    const short = wall('w', 0, 0, 100, 0);
    const long = wall('b', 0, 100, 500, 100);
    const t = computeTakeoff([short, long], [], [door('d', 500)], [], { storeyHeightCm: 270 });
    expect(t.wallElevationM2).toBeCloseTo(13.5, 5); // yalnız long: 5m×2,7; short = max(0, …) = 0
  });

  it('NaN duvar yüksekliği metrajı zehirlemez (sonlu kalır, kat yüksekliğine düşer)', () => {
    const bad: Wall = { ...wall('w', 0, 0, 500, 0), height: NaN };
    const t = computeTakeoff([bad], [], [], [], { storeyHeightCm: 270 });
    expect(Number.isFinite(t.wallElevationM2)).toBe(true);
    expect(Number.isFinite(t.plasterAreaM2)).toBe(true);
    expect(t.plasterAreaM2).toBeCloseTo(27, 5); // NaN → 270 kullanılır
  });

  it('döşeme = mahal alanı, süpürgelik = çevre − odanın kapı genişlikleri', () => {
    // Kapı, odanın ALT kenarındaki duvarda (orta) → o odanın süpürgeliğinden düşülür.
    const bottom = wall('w', 0, 0, 400, 0);
    const t = computeTakeoff([bottom], [squareSpace], [door('d', 90)]);
    expect(t.floorAreaM2).toBeCloseTo(16, 6); // 4×4
    // çevre 1600 cm = 16 m; kapı 90 cm = 0,9 m düşer → 15,1
    expect(t.skirtingM).toBeCloseTo(15.1, 6);
  });

  it('duvarı modelde olmayan kapı süpürgelikten DÜŞÜLMEZ (hangi odaya değdiği bilinemez)', () => {
    // door('d') wallId='w' ama walls=[] → eşleşme yok → 16 m (kesilmez). Eski global davranışın düzeltmesi.
    const t = computeTakeoff([], [squareSpace], [door('d', 90)]);
    expect(t.skirtingM).toBeCloseTo(16, 6);
  });

  it('paylaşılan iç kapı İKİ odanın da süpürgeliğinden düşülür (araştırma kararı)', () => {
    // İki 400×400 oda, ortak duvar x=400'de; kapı ortak duvarın ortasında (t=0.5 → (400,200)).
    const left: Space = { ...squareSpace, id: 'L', boundary: [{ x: 0, y: 0 }, { x: 400, y: 0 }, { x: 400, y: 400 }, { x: 0, y: 400 }] };
    const right: Space = { ...squareSpace, id: 'R', boundary: [{ x: 400, y: 0 }, { x: 800, y: 0 }, { x: 800, y: 400 }, { x: 400, y: 400 }] };
    const shared = wall('w', 400, 0, 400, 400);
    const t = computeTakeoff([shared], [left, right], [door('d', 90)]);
    // Her oda çevresi 16 m; ortak kapı her ikisinden de 0,9 düşer → (16−0,9)×2 = 30,2
    expect(t.skirtingM).toBeCloseTo(30.2, 5);
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

  it('duvar uzunluğu malzemeye göre gruplanır (atanmamış → Belirsiz)', () => {
    const brick: Wall = { ...wall('a', 0, 0, 300, 0), material: 'brick' };
    const plain = wall('b', 0, 0, 0, 200); // malzeme yok
    const t = computeTakeoff([brick, plain], [], []);
    const labels = t.wallByMaterial.map((r) => r.label);
    expect(labels).toContain('Tuğla');
    expect(labels).toContain('Belirsiz');
    const tugla = t.wallByMaterial.find((r) => r.label === 'Tuğla')!;
    expect(tugla.lengthM).toBeCloseTo(3);
  });

  it('varsayılan kat yüksekliği sabiti', () => {
    expect(DEFAULT_STOREY_HEIGHT_CM).toBe(270);
  });
});
