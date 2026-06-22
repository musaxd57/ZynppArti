import { describe, it, expect } from 'vitest';
import type { Annotation, Block, Dimension, Parcel, Wall } from '@zynpparti/document';
import { exportDxf } from './dxf-export';

const wall = (id: string, x1: number, y1: number, x2: number, y2: number, layerId = 'default'): Wall => ({
  id,
  type: 'wall',
  layerId,
  start: { x: x1, y: y1 },
  end: { x: x2, y: y2 },
  thickness: 20,
});

describe('exportDxf', () => {
  it('ENTITIES bölümü + EOF ile sarmalar', () => {
    const dxf = exportDxf([]);
    expect(dxf).toContain('SECTION');
    expect(dxf).toContain('ENTITIES');
    expect(dxf).toContain('ENDSEC');
    expect(dxf.trimEnd().endsWith('EOF')).toBe(true);
  });

  it('her duvar için bir LINE entity yazar', () => {
    const dxf = exportDxf([wall('a', 0, 0, 100, 0), wall('b', 0, 0, 0, 50)]);
    const lines = dxf.split('\n').filter((l) => l === 'LINE');
    expect(lines).toHaveLength(2);
  });

  it('koordinatları (cm, 4 ondalık) ve katmanı korur', () => {
    const dxf = exportDxf([wall('a', 12.5, -3, 100, 0, 'Mimari')]);
    expect(dxf).toContain('12.5000'); // start.x
    expect(dxf).toContain('-3.0000'); // start.y
    expect(dxf).toContain('100.0000'); // end.x
    expect(dxf).toContain('Mimari'); // katman (kod 8)
  });

  it('boş girdi → geçerli ama LINE içermeyen DXF', () => {
    const dxf = exportDxf([]);
    expect(dxf.split('\n').filter((l) => l === 'LINE')).toHaveLength(0);
  });

  it('parsel → kapalı LWPOLYLINE (köşe sayısı + kapalı bayrak)', () => {
    const parcel: Parcel = {
      id: 'p',
      type: 'parcel',
      layerId: 'parcel',
      boundary: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 80 },
      ],
    };
    const dxf = exportDxf([parcel]);
    expect(dxf).toContain('LWPOLYLINE');
    const lines = dxf.split('\n');
    const i = lines.indexOf('LWPOLYLINE');
    // 90 (vertex count) → 3, 70 (closed) → 1
    expect(lines[lines.indexOf('90', i) + 1]).toBe('3');
    expect(lines[lines.indexOf('70', i) + 1]).toBe('1');
  });

  it('blok → ayak izi LWPOLYLINE (4 köşe)', () => {
    const block: Block = {
      id: 'b',
      type: 'block',
      layerId: 'furniture',
      kind: 'table',
      position: { x: 50, y: 50 },
      rotation: 0,
    };
    const dxf = exportDxf([block]);
    const lines = dxf.split('\n');
    const i = lines.indexOf('LWPOLYLINE');
    expect(i).toBeGreaterThanOrEqual(0);
    expect(lines[lines.indexOf('90', i) + 1]).toBe('4');
  });

  it('metin → TEXT entity (içerik kod 1)', () => {
    const ann: Annotation = {
      id: 'a',
      type: 'annotation',
      layerId: 'annotation',
      position: { x: 10, y: 20 },
      text: 'Salon',
      height: 30,
    };
    const dxf = exportDxf([ann]);
    expect(dxf).toContain('TEXT');
    expect(dxf).toContain('Salon');
  });

  it('çok satırlı metin → her satır için bir TEXT', () => {
    const ann: Annotation = {
      id: 'a',
      type: 'annotation',
      layerId: 'annotation',
      position: { x: 0, y: 0 },
      text: 'satır1\nsatır2',
      height: 30,
    };
    const dxf = exportDxf([ann]);
    expect(dxf.split('\n').filter((l) => l === 'TEXT')).toHaveLength(2);
  });

  it('ölçü → ölçü + 2 uzatma LINE + değer TEXT', () => {
    const dim: Dimension = {
      id: 'd',
      type: 'dimension',
      layerId: 'dimension',
      a: { x: 0, y: 0 },
      b: { x: 100, y: 0 },
      offset: 30,
    };
    const dxf = exportDxf([dim]);
    expect(dxf.split('\n').filter((l) => l === 'LINE')).toHaveLength(3);
    expect(dxf.split('\n').filter((l) => l === 'TEXT')).toHaveLength(1);
  });
});
