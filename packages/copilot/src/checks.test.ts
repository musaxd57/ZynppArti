import { describe, expect, it } from 'vitest';
import type { Space } from '@zynpparti/document';
import { runCopilotChecks } from './checks';
import { REGULATIONS } from './regulations';

function space(id: string, roomType: Space['roomType'], boundary: Space['boundary']): Space {
  return { id, type: 'space', layerId: 'rooms', name: id, roomType, boundary };
}

/** w×h cm dikdörtgen mahal. */
function rect(id: string, roomType: Space['roomType'], w: number, h: number): Space {
  return space(id, roomType, [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ]);
}

describe('runCopilotChecks — koridor genişliği (TS 9111)', () => {
  it('dar koridor → atıflı hata', () => {
    const findings = runCopilotChecks([rect('Koridor', 'circulation', 400, 90)], []);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.severity).toBe('error');
    expect(findings[0]!.citation).toContain('TS 9111');
    expect(findings[0]!.message).toContain('120 cm');
    expect(findings[0]!.entityId).toBe('Koridor');
  });

  it('yeterli koridor → bulgu yok', () => {
    expect(runCopilotChecks([rect('Koridor', 'circulation', 400, 130)], [])).toHaveLength(0);
  });

  it('sirkülasyon olmayan dar mekan → koridor kuralı uygulanmaz', () => {
    expect(runCopilotChecks([rect('Depo', 'service', 400, 90)], [])).toHaveLength(0);
  });
});

describe('runCopilotChecks — asgari alan (İmar)', () => {
  it('küçük yatak odası → uyarı', () => {
    // 250×300 cm = 7,5 m² < 9 m²
    const findings = runCopilotChecks([rect('Yatak', 'sleeping', 250, 300)], []);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.severity).toBe('warning');
    expect(findings[0]!.citation).toContain('İmar');
    expect(REGULATIONS.bedroomMinArea.min).toBe(9);
  });

  it('yeterli oturma odası → bulgu yok', () => {
    // 400×400 = 16 m² > 12 m²
    expect(runCopilotChecks([rect('Salon', 'living', 400, 400)], [])).toHaveLength(0);
  });
});

it('boş model → bulgu yok', () => {
  expect(runCopilotChecks([], [])).toEqual([]);
});
