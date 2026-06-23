import { describe, it, expect } from 'vitest';
import { buildSystemPrompt, formatContext, COPILOT_SYSTEM_BASE } from './prompt';

describe('formatContext', () => {
  it('boş bağlam → boş metin', () => {
    expect(formatContext({})).toBe('');
  });

  it('mahalleri ad/tip/alan ile listeler', () => {
    const out = formatContext({ rooms: [{ name: 'Salon', type: 'living', areaM2: 18.4 }] });
    expect(out).toContain('MAHALLER (1)');
    expect(out).toContain('Salon (living): 18,4 m²');
  });

  it('bulguları atıfla listeler', () => {
    const out = formatContext({
      findings: [{ severity: 'warning', message: 'Dar koridor', citation: 'TS 9111' }],
    });
    expect(out).toContain('[warning] Dar koridor');
    expect(out).toContain('Kaynak: TS 9111');
  });

  it('metrik + seçim bölümleri', () => {
    const out = formatContext({ metrics: ['Toplam 80 m²'], selection: 'Duvar' });
    expect(out).toContain('METRİKLER');
    expect(out).toContain('Toplam 80 m²');
    expect(out).toContain('SEÇİLİ: Duvar');
  });
});

describe('buildSystemPrompt', () => {
  it('persona her zaman içerilir', () => {
    expect(buildSystemPrompt({})).toContain(COPILOT_SYSTEM_BASE);
  });

  it('bağlam boşsa veri-yok notu ekler', () => {
    expect(buildSystemPrompt({})).toContain('bağlam verisi yok');
  });

  it('bağlam varsa PROJE BAĞLAMI bölümü eklenir', () => {
    const out = buildSystemPrompt({ rooms: [{ name: 'Salon', areaM2: 12 }] });
    expect(out).toContain('=== PROJE BAĞLAMI ===');
    expect(out).toContain('Salon');
  });
});
