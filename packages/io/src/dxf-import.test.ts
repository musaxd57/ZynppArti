import { describe, it, expect } from 'vitest';
import { importDxf } from './dxf-import';
import { exportDxf } from './dxf-export';

// $INSUNITS=4 (mm) + tek LINE 0,0 → 1000,0 (mm) → cm'de 0,0 → 100,0
const DXF_MM = [
  '0', 'SECTION', '2', 'HEADER',
  '9', '$INSUNITS', '70', '4',
  '0', 'ENDSEC',
  '0', 'SECTION', '2', 'ENTITIES',
  '0', 'LINE', '8', 'DUVAR',
  '10', '0.0', '20', '0.0', '30', '0.0',
  '11', '1000.0', '21', '0.0', '31', '0.0',
  '0', 'ENDSEC', '0', 'EOF',
].join('\n');

describe('importDxf', () => {
  it('imports a LINE and converts mm → cm via $INSUNITS', () => {
    const result = importDxf(DXF_MM);
    expect(result.unitScaleToCm).toBe(0.1);
    expect(result.walls).toHaveLength(1);
    expect(result.layers).toEqual(['DUVAR']);

    const w = result.walls[0]!;
    expect(w.type).toBe('wall');
    expect(w.layerId).toBe('DUVAR');
    expect(w.start).toEqual({ x: 0, y: 0 });
    expect(w.end.x).toBeCloseTo(100);
    expect(w.end.y).toBeCloseTo(0);
  });

  it('throws on an unparseable file', () => {
    expect(() => importDxf('not a dxf at all')).toThrow();
  });

  it('round-trips through exportDxf (geometry preserved)', () => {
    const dxf = exportDxf([
      {
        id: 'w1',
        type: 'wall',
        layerId: 'A',
        start: { x: 0, y: 0 },
        end: { x: 250, y: 0 },
        thickness: 15,
      },
    ]);
    const back = importDxf(dxf);
    expect(back.walls).toHaveLength(1);
    expect(back.walls[0]!.start).toEqual({ x: 0, y: 0 });
    expect(back.walls[0]!.end.x).toBeCloseTo(250);
  });
});
