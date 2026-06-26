import { describe, it, expect } from 'vitest';
import { serializeModel, deserializeModel, MODEL_FORMAT_VERSION } from './serialize';
import { createEntityId } from './id';
import type { Annotation, Block, Dimension, Entity, SectionLine, Sheet, Wall } from './entities';

const wall: Wall = {
  id: 'w1',
  type: 'wall',
  layerId: 'default',
  start: { x: 0, y: 0 },
  end: { x: 100, y: 0 },
  thickness: 15,
};
const ann: Annotation = {
  id: 'a1',
  type: 'annotation',
  layerId: 'annotation',
  position: { x: 10, y: 20 },
  text: 'Salon',
  height: 30,
};

const section: SectionLine = {
  id: 'sec1',
  type: 'section',
  layerId: 'section',
  a: { x: 0, y: 0 },
  b: { x: 500, y: 0 },
  label: 'A',
};

describe('serializeModel / deserializeModel', () => {
  it('round-trips entities losslessly', () => {
    const json = serializeModel([wall, ann]);
    const back = deserializeModel(json);
    expect(back).toHaveLength(2);
    expect(back).toEqual([wall, ann]);
  });

  it('crypto.randomUUID id save→load round-trip boyunca KORUNUR (id üretilmez)', () => {
    const id = createEntityId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i); // UUID v4 biçimi
    const w: Wall = { id, type: 'wall', layerId: 'default', start: { x: 0, y: 0 }, end: { x: 50, y: 0 }, thickness: 10 };
    const back = deserializeModel(serializeModel([w]));
    expect(back).toHaveLength(1);
    expect(back[0]!.id).toBe(id); // aynı id geri döner (deserializeModel id'yi yeniden üretmez)
  });

  it('kesit (section) entity round-trip (kalıcılık)', () => {
    const back = deserializeModel(serializeModel([wall, section]));
    expect(back).toHaveLength(2);
    expect(back).toContainEqual(section);
  });

  it('writes a versioned envelope', () => {
    const parsed = JSON.parse(serializeModel([wall]));
    expect(parsed.format).toBe('zynpparti-model');
    expect(parsed.version).toBe(MODEL_FORMAT_VERSION);
    expect(parsed.entities).toHaveLength(1);
  });

  it('bozuk JSON → hata', () => {
    expect(() => deserializeModel('{ not json')).toThrow();
  });

  it('yanlış format → hata', () => {
    expect(() => deserializeModel(JSON.stringify({ foo: 'bar' }))).toThrow();
  });

  it('daha yeni sürüm → reddeder (sessiz veri kaybı yerine net hata)', () => {
    const future = JSON.stringify({ format: 'zynpparti-model', version: MODEL_FORMAT_VERSION + 1, entities: [] });
    expect(() => deserializeModel(future)).toThrow(/daha yeni/);
  });

  it('eksik/eski sürüm = v1 kabul (mevcut dosyalar açılır)', () => {
    const noVer = JSON.stringify({ format: 'zynpparti-model', entities: [] });
    expect(deserializeModel(noVer)).toEqual([]);
  });

  it('bilinmeyen/eksik entity atlanır (toleranslı)', () => {
    const json = JSON.stringify({
      format: 'zynpparti-model',
      version: 1,
      entities: [
        wall,
        { id: 'x', type: 'unicorn', layerId: 'l' }, // bilinmeyen tip → atla
        { type: 'wall', layerId: 'l' }, // id yok → atla
        ann,
      ],
    });
    const back = deserializeModel(json);
    expect(back).toHaveLength(2);
    expect(back.map((e: Entity) => e.id)).toEqual(['w1', 'a1']);
  });

  it('NaN/bozuk alanlı entity atlanır (derin doğrulama)', () => {
    const json = JSON.stringify({
      format: 'zynpparti-model',
      version: 1,
      entities: [
        wall, // sağlam
        { id: 'b1', type: 'wall', layerId: 'l', start: { x: NaN, y: 0 }, end: { x: 1, y: 1 }, thickness: 10 }, // NaN koord
        { id: 'b2', type: 'wall', layerId: 'l', start: { x: 0, y: 0 }, end: { x: 1, y: 1 } }, // thickness yok
        { id: 'b3', type: 'space', layerId: 'l', name: 'X', boundary: [{ x: 0, y: 0 }, { x: 1, y: 1 }] }, // <3 köşe
        { id: 'b4', type: 'opening', layerId: 'l', wallId: 'w', kind: 'door', t: 0.5, width: 'çok' }, // width sayı değil
      ],
    });
    const back = deserializeModel(json);
    expect(back.map((e: Entity) => e.id)).toEqual(['w1']); // yalnız sağlam olan kalır
  });

  it('boş model round-trip', () => {
    expect(deserializeModel(serializeModel([]))).toEqual([]);
  });

  // KÜME 4 — kalan tiplerin derin doğrulaması (Sheet/Annotation/Section/Block/Dimension)
  const block: Block = {
    id: 'bl1',
    type: 'block',
    layerId: 'furniture',
    kind: 'sofa',
    position: { x: 50, y: 50 },
    rotation: 0,
  };
  const sheet: Sheet = {
    id: 'sh1',
    type: 'sheet',
    layerId: 'sheets',
    position: { x: 0, y: 0 },
    size: 'A3',
    orientation: 'landscape',
    scale: 50,
    title: 'Kat Planı',
  };
  const dim: Dimension = {
    id: 'd1',
    type: 'dimension',
    layerId: 'default',
    a: { x: 0, y: 0 },
    b: { x: 500, y: 0 },
    offset: 100,
  };

  it('block/sheet/dimension geçerli round-trip', () => {
    const back = deserializeModel(serializeModel([block, sheet, dim]));
    expect(back).toHaveLength(3);
    expect(back).toContainEqual(block);
    expect(back).toContainEqual(sheet);
    expect(back).toContainEqual(dim);
  });

  it('kalan tiplerin bozuk alanları atlanır (derin doğrulama genişletmesi)', () => {
    const json = JSON.stringify({
      format: 'zynpparti-model',
      version: 1,
      entities: [
        wall, // sağlam
        { ...block, kind: 'uydurma-blok' }, // BLOCK_DEFS'te yok → atla
        { ...sheet, size: 'A9' }, // geçersiz kağıt boyutu → atla
        { ...sheet, id: 'sh2', orientation: 'diagonal' }, // geçersiz yönelim → atla
        { ...sheet, id: 'sh3', scale: 0 }, // ölçek > 0 olmalı → atla
        { ...dim, offset: NaN }, // NaN offset → atla
        { ...section, label: 123 }, // label string değil → atla
        { ...ann, height: NaN }, // NaN yükseklik → atla
      ],
    });
    const back = deserializeModel(json);
    expect(back.map((e: Entity) => e.id)).toEqual(['w1']); // yalnız sağlam duvar kalır
  });
});
