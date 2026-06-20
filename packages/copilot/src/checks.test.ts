import { describe, expect, it } from 'vitest';
import type { Space } from '@zynpparti/document';
import { runCopilotChecks, type Finding } from './checks';
import { PARKING_REGULATION, REGULATIONS } from './regulations';

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

/** Otopark (info) dışındaki bulgular — koridor/alan denetimlerini izole test etmek için. */
function nonInfo(findings: Finding[]): Finding[] {
  return findings.filter((f) => f.severity !== 'info');
}

describe('runCopilotChecks — koridor genişliği (TS 9111)', () => {
  it('dar koridor → atıflı hata', () => {
    const findings = nonInfo(runCopilotChecks([rect('Koridor', 'circulation', 400, 90)], []));
    expect(findings).toHaveLength(1);
    expect(findings[0]!.severity).toBe('error');
    expect(findings[0]!.citation).toContain('TS 9111');
    expect(findings[0]!.message).toContain('120 cm');
    expect(findings[0]!.entityId).toBe('Koridor');
  });

  it('yeterli koridor → uygunsuzluk yok', () => {
    expect(nonInfo(runCopilotChecks([rect('Koridor', 'circulation', 400, 130)], []))).toHaveLength(
      0,
    );
  });

  it('sirkülasyon olmayan dar mekan → koridor kuralı uygulanmaz', () => {
    expect(nonInfo(runCopilotChecks([rect('Depo', 'service', 400, 90)], []))).toHaveLength(0);
  });
});

describe('runCopilotChecks — asgari alan (İmar)', () => {
  it('küçük yatak odası → uyarı', () => {
    // 250×300 cm = 7,5 m² < 9 m²
    const findings = nonInfo(runCopilotChecks([rect('Yatak', 'sleeping', 250, 300)], []));
    expect(findings).toHaveLength(1);
    expect(findings[0]!.severity).toBe('warning');
    expect(findings[0]!.citation).toContain('İmar');
    expect(REGULATIONS.bedroomMinArea.min).toBe(9);
  });

  it('yeterli oturma odası → uygunsuzluk yok', () => {
    // 400×400 = 16 m² > 12 m²
    expect(nonInfo(runCopilotChecks([rect('Salon', 'living', 400, 400)], []))).toHaveLength(0);
  });
});

describe('runCopilotChecks — otopark (Otopark Yönetmeliği, info)', () => {
  it('toplam alandan kaba otopark tahmini verir', () => {
    // 1000×1000 cm = 100 m² → 100/100 = 1 araç
    const all = runCopilotChecks([rect('Salon', 'living', 1000, 1000)], []);
    const parking = all.filter((f) => f.severity === 'info');
    expect(parking).toHaveLength(1);
    expect(parking[0]!.citation).toContain('Otopark');
    expect(parking[0]!.message).toContain('1 araç');
    expect(PARKING_REGULATION.areaPerSpaceM2).toBe(100);
  });

  it('mahal yoksa otopark bulgusu da yok', () => {
    expect(runCopilotChecks([], [])).toEqual([]);
  });
});

it('boş model → bulgu yok', () => {
  expect(runCopilotChecks([], [])).toEqual([]);
});
