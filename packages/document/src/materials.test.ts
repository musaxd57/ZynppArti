import { describe, it, expect } from 'vitest';
import { MATERIALS, materialById } from './materials';

describe('MATERIALS kataloğu', () => {
  it('boş değil ve id benzersiz', () => {
    expect(MATERIALS.length).toBeGreaterThan(0);
    const ids = MATERIALS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('her malzeme geçerli alanlara sahip', () => {
    for (const m of MATERIALS) {
      expect(m.label.length).toBeGreaterThan(0);
      expect(m.spacing).toBeGreaterThan(0);
      expect(['single', 'cross']).toContain(m.kind);
      expect(Number.isFinite(m.color)).toBe(true);
    }
  });
});

describe('materialById', () => {
  it('var olan id → malzeme', () => {
    const first = MATERIALS[0]!;
    expect(materialById(first.id)).toBe(first);
  });

  it('bilinmeyen id / undefined → undefined', () => {
    expect(materialById('yok-böyle')).toBeUndefined();
    expect(materialById(undefined)).toBeUndefined();
  });
});
