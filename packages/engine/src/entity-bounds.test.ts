import { describe, it, expect } from 'vitest';
import {
  sheetModelSize,
  type Annotation,
  type Block,
  type Parcel,
  type Sheet,
  type Wall,
} from '@zynpparti/document';
import { entityBounds } from './entity-bounds';

describe('entityBounds', () => {
  it('expands a wall AABB by half its thickness', () => {
    const wall: Wall = {
      id: 'w1',
      type: 'wall',
      layerId: 'default',
      start: { x: 0, y: 0 },
      end: { x: 100, y: 0 },
      thickness: 20,
    };
    expect(entityBounds(wall)).toEqual({ minX: -10, minY: -10, maxX: 110, maxY: 10 });
  });

  it('handles a diagonal wall', () => {
    const wall: Wall = {
      id: 'w2',
      type: 'wall',
      layerId: 'default',
      start: { x: 50, y: 80 },
      end: { x: 10, y: 20 },
      thickness: 4,
    };
    expect(entityBounds(wall)).toEqual({ minX: 8, minY: 18, maxX: 52, maxY: 82 });
  });

  it('parcel AABB = sınır kutusu', () => {
    const parcel: Parcel = {
      id: 'p',
      type: 'parcel',
      layerId: 'site',
      boundary: [
        { x: 10, y: 20 },
        { x: 110, y: 20 },
        { x: 60, y: 90 },
      ],
    };
    expect(entityBounds(parcel)).toEqual({ minX: 10, minY: 20, maxX: 110, maxY: 90 });
  });

  it('blok AABB döndürülmüş ayak izini kapsar', () => {
    const block: Block = {
      id: 'b',
      type: 'block',
      layerId: 'furniture',
      kind: 'table', // 120×80
      position: { x: 0, y: 0 },
      rotation: 0,
    };
    expect(entityBounds(block)).toEqual({ minX: -60, minY: -40, maxX: 60, maxY: 40 });
  });

  it('annotation AABB sol-üstten +genişlik/+yükseklik', () => {
    const a: Annotation = {
      id: 'a',
      type: 'annotation',
      layerId: 'annotation',
      position: { x: 100, y: 50 },
      text: 'AB',
      height: 20,
    };
    const b = entityBounds(a);
    expect(b.minX).toBe(100);
    expect(b.minY).toBe(50);
    expect(b.maxX).toBeGreaterThan(100);
    expect(b.maxY).toBeGreaterThan(50);
  });

  it('sheet AABB = model boyutu (kağıt × ölçek)', () => {
    const sheet: Sheet = {
      id: 's',
      type: 'sheet',
      layerId: 'sheet',
      position: { x: 0, y: 0 },
      size: 'A3',
      orientation: 'landscape',
      scale: 50,
      title: 'P',
    };
    const { w, h } = sheetModelSize(sheet);
    expect(entityBounds(sheet)).toEqual({ minX: 0, minY: 0, maxX: w, maxY: h });
  });
});
