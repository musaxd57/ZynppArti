import { describe, it, expect } from 'vitest';
import { serializeModel, deserializeModel, MODEL_FORMAT_VERSION } from './serialize';
import type { Annotation, Entity, SectionLine, Wall } from './entities';

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

  it('boş model round-trip', () => {
    expect(deserializeModel(serializeModel([]))).toEqual([]);
  });
});
