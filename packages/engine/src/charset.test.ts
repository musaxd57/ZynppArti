import { describe, it, expect } from 'vitest';
import { TR_CHARSET } from './charset';

describe('TR_CHARSET', () => {
  it('includes every required Turkish character', () => {
    for (const ch of 'çşğıİöüÇŞĞÖÜ') {
      expect(TR_CHARSET).toContain(ch);
    }
  });

  it('includes the m² superscript and ASCII letters', () => {
    expect(TR_CHARSET).toContain('²');
    expect(TR_CHARSET).toContain('A');
    expect(TR_CHARSET).toContain('z');
  });
});
