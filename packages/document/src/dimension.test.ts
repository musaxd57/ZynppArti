import { describe, expect, it } from 'vitest';
import { dimensionGeometry, formatLength } from './dimension';
import type { Dimension } from './entities';

function dim(ax: number, ay: number, bx: number, by: number, offset: number): Dimension {
  return { id: 'd', type: 'dimension', layerId: 'default', a: { x: ax, y: ay }, b: { x: bx, y: by }, offset };
}

describe('dimensionGeometry', () => {
  it('yatay ölçüde uzunluk ve offset uygulanır', () => {
    const g = dimensionGeometry(dim(0, 0, 300, 0, 40));
    expect(g.length).toBeCloseTo(300, 6);
    // a→b yönü +x, normal = (-0,1) → offset y'de +40
    expect(g.da).toEqual({ x: 0, y: 40 });
    expect(g.db).toEqual({ x: 300, y: 40 });
    expect(g.mid).toEqual({ x: 150, y: 40 });
  });
});

describe('formatLength', () => {
  it('≥100 cm → metre (virgüllü)', () => {
    expect(formatLength(350)).toBe('3,50 m');
    expect(formatLength(100)).toBe('1,00 m');
  });
  it('<100 cm → cm', () => {
    expect(formatLength(85)).toBe('85 cm');
    expect(formatLength(85.4)).toBe('85 cm');
  });
});
