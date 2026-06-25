import { describe, it, expect } from 'vitest';
import { isClonable, offsetClone, offsetEntity, scaleEntityAbout } from './clone';
import type {
  Annotation,
  Block,
  Dimension,
  Opening,
  Parcel,
  SectionLine,
  Sheet,
  Space,
  Wall,
} from './entities';

const sheet: Sheet = {
  id: 'sh',
  type: 'sheet',
  layerId: 'sheet',
  position: { x: 10, y: 20 },
  size: 'A3',
  orientation: 'landscape',
  scale: 50,
  title: 'P',
};

const wall: Wall = {
  id: 'w',
  type: 'wall',
  layerId: 'default',
  start: { x: 0, y: 0 },
  end: { x: 100, y: 0 },
  thickness: 15,
};
const block: Block = {
  id: 'b',
  type: 'block',
  layerId: 'furniture',
  kind: 'table',
  position: { x: 10, y: 20 },
  rotation: 0,
};
const annotation: Annotation = {
  id: 'a',
  type: 'annotation',
  layerId: 'annotation',
  position: { x: 5, y: 5 },
  text: 'Not',
  height: 25,
};
const dimension: Dimension = {
  id: 'd',
  type: 'dimension',
  layerId: 'default',
  a: { x: 0, y: 0 },
  b: { x: 200, y: 0 },
  offset: 30,
};
const parcel: Parcel = {
  id: 'p',
  type: 'parcel',
  layerId: 'site',
  boundary: [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
  ],
};
const space: Space = {
  id: 's',
  type: 'space',
  layerId: 'rooms',
  name: 'Oda',
  boundary: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
  ],
};
const opening: Opening = {
  id: 'o',
  type: 'opening',
  layerId: 'default',
  wallId: 'w',
  t: 0.5,
  width: 90,
  kind: 'door',
};
const section: SectionLine = {
  id: 'sec',
  type: 'section',
  layerId: 'section',
  a: { x: 0, y: 0 },
  b: { x: 300, y: 0 },
  label: 'A',
};

describe('isClonable', () => {
  it('serbest tipler kopyalanabilir', () => {
    for (const e of [wall, block, annotation, dimension, parcel, sheet, section]) {
      expect(isClonable(e)).toBe(true);
    }
  });
  it('türetilmiş/bağlı tipler kopyalanamaz', () => {
    expect(isClonable(space)).toBe(false);
    expect(isClonable(opening)).toBe(false);
  });
});

describe('offsetEntity', () => {
  it('duvarın iki ucunu da kaydırır', () => {
    const w = offsetEntity(wall, 10, 5) as Wall;
    expect(w.start).toEqual({ x: 10, y: 5 });
    expect(w.end).toEqual({ x: 110, y: 5 });
    expect(w.thickness).toBe(15); // geometri dışı alan korunur
  });

  it('blok/metin/pafta konumunu kaydırır', () => {
    expect((offsetEntity(block, 5, 5) as Block).position).toEqual({ x: 15, y: 25 });
    expect((offsetEntity(annotation, -5, 0) as Annotation).position).toEqual({ x: 0, y: 5 });
    expect((offsetEntity(sheet, 10, 10) as Sheet).position).toEqual({ x: 20, y: 30 });
  });

  it('ölçünün a/b uçlarını kaydırır, offset değişmez', () => {
    const d = offsetEntity(dimension, 0, 10) as Dimension;
    expect(d.a).toEqual({ x: 0, y: 10 });
    expect(d.b).toEqual({ x: 200, y: 10 });
    expect(d.offset).toBe(30);
  });

  it('kesit çizgisinin a/b uçlarını kaydırır, etiket korunur', () => {
    const s = offsetEntity(section, 10, 20) as SectionLine;
    expect(s.a).toEqual({ x: 10, y: 20 });
    expect(s.b).toEqual({ x: 310, y: 20 });
    expect(s.label).toBe('A');
  });

  it('parselin tüm köşelerini kaydırır', () => {
    const p = offsetEntity(parcel, 1, 2) as Parcel;
    expect(p.boundary).toEqual([
      { x: 1, y: 2 },
      { x: 101, y: 2 },
      { x: 101, y: 102 },
    ]);
  });

  it('immutable — orijinali değiştirmez', () => {
    offsetEntity(block, 99, 99);
    expect(block.position).toEqual({ x: 10, y: 20 });
  });
});

describe('offsetClone (yapıştır — bağlı boşluk remap)', () => {
  it('her kopyaya yeni id verir, geometriyi kaydırır', () => {
    const out = offsetClone([wall, block], 10, 0);
    expect(out).toHaveLength(2);
    expect(out[0]!.id).not.toBe('w');
    expect(out[1]!.id).not.toBe('b');
    expect((out[0] as Wall).start).toEqual({ x: 10, y: 0 });
  });

  it('duvarla birlikte kopyalanan boşluğun wallId-si YENİ duvara bağlanır', () => {
    const out = offsetClone([wall, opening], 50, 0);
    const newWall = out.find((e) => e.type === 'wall')!;
    const newOpening = out.find((e) => e.type === 'opening') as Opening;
    expect(newOpening.wallId).toBe(newWall.id); // bağ korundu (eski 'w' değil)
    expect(newOpening.wallId).not.toBe('w');
    expect(newOpening.t).toBe(0.5); // t-parametrik konum aynı
  });

  it('duvarı grupta OLMAYAN boşluk eski wallId-sinde kalır', () => {
    const out = offsetClone([opening], 50, 0); // yalnız boşluk
    expect((out[0] as Opening).wallId).toBe('w');
  });
});

describe('scaleEntityAbout (kalibrasyon — tek-tip ölçek)', () => {
  const O = { x: 0, y: 0 };

  it('duvarı origin etrafında ölçekler + kalınlık/yükseklik çarpılır', () => {
    const w: Wall = { ...wall, start: { x: 10, y: 0 }, end: { x: 110, y: 0 }, thickness: 15, height: 270 };
    const s = scaleEntityAbout(w, 2, O) as Wall;
    expect(s.start).toEqual({ x: 20, y: 0 });
    expect(s.end).toEqual({ x: 220, y: 0 });
    expect(s.thickness).toBe(30);
    expect(s.height).toBe(540);
  });

  it('ölçü a/b ölçeklenir, offset çarpılır (uzunluk a/b-den türer → çift uygulama yok)', () => {
    const d = scaleEntityAbout(dimension, 3, O) as Dimension;
    expect(d.b).toEqual({ x: 600, y: 0 }); // 200×3
    expect(d.offset).toBe(90); // 30×3
  });

  it('boşluk: net genişlik ölçeklenir, t korunur (duvarıyla taşınır)', () => {
    const s = scaleEntityAbout(opening, 2, O) as Opening;
    expect(s.width).toBe(180); // 90×2
    expect(s.t).toBe(0.5); // değişmez
  });

  it('metin: konum ölçeklenir + yükseklik çarpılır', () => {
    const a = scaleEntityAbout(annotation, 2, O) as Annotation;
    expect(a.position).toEqual({ x: 10, y: 10 }); // (5,5)×2
    expect(a.height).toBe(50); // 25×2
  });

  it('türetilmiş space ölçeklenmez (RoomManager yeniden türetir)', () => {
    expect(scaleEntityAbout(space, 5, O)).toBe(space);
  });

  it('origin merkez alınır (origin sabit kalır)', () => {
    const w: Wall = { ...wall, start: { x: 100, y: 100 }, end: { x: 200, y: 100 } };
    const s = scaleEntityAbout(w, 2, { x: 100, y: 100 }) as Wall;
    expect(s.start).toEqual({ x: 100, y: 100 }); // origin sabit
    expect(s.end).toEqual({ x: 300, y: 100 });
  });
});
