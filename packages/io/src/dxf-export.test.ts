import { describe, it, expect } from 'vitest';
import type { Wall } from '@zynpparti/document';
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
});
