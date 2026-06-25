import { describe, it, expect } from 'vitest';
import { WALL_MATERIALS, wallMaterialById } from './wall-material';

describe('WALL_MATERIALS kataloğu', () => {
  it('boş değil ve id benzersiz', () => {
    expect(WALL_MATERIALS.length).toBeGreaterThan(0);
    const ids = WALL_MATERIALS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('her malzeme geçerli alanlara sahip (etiket + pozitif sonlu yoğunluk)', () => {
    for (const m of WALL_MATERIALS) {
      expect(m.label.length).toBeGreaterThan(0);
      expect(Number.isFinite(m.densityKgM3)).toBe(true);
      expect(m.densityKgM3).toBeGreaterThan(0);
    }
  });
});

describe('wallMaterialById', () => {
  it('var olan id → malzeme', () => {
    const first = WALL_MATERIALS[0]!;
    expect(wallMaterialById(first.id)).toBe(first);
  });

  it('bilinmeyen id / undefined → undefined', () => {
    expect(wallMaterialById('yok-böyle')).toBeUndefined();
    expect(wallMaterialById(undefined)).toBeUndefined();
  });
});
