import { describe, it, expect } from 'vitest';
import { REGULATIONS, allRegulations, citationOf } from './regulations';

describe('citationOf', () => {
  it('"Kaynak — kural" biçiminde atıf üretir', () => {
    const c = citationOf(REGULATIONS.corridorWidth);
    expect(c).toContain('TS 9111');
    expect(c).toContain('—');
    expect(c).toContain(REGULATIONS.corridorWidth.rule);
  });
});

describe('allRegulations', () => {
  it('bilgi tabanındaki tüm eşik kurallarını döndürür', () => {
    const all = allRegulations();
    expect(all.length).toBe(Object.keys(REGULATIONS).length);
  });

  it('her kuralın kaynak/kural/min/unit/status alanları geçerli', () => {
    for (const r of allRegulations()) {
      expect(r.source.length).toBeGreaterThan(0);
      expect(r.rule.length).toBeGreaterThan(0);
      expect(r.min).toBeGreaterThan(0);
      expect(['cm', 'm2']).toContain(r.unit);
      expect(['active', 'pending']).toContain(r.status);
    }
  });
});
