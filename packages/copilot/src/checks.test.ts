import { describe, expect, it } from 'vitest';
import type { Opening, Space, Wall } from '@zynpparti/document';
import { runCopilotChecks, type Finding } from './checks';
import { PARKING_REGULATION, REGULATIONS } from './regulations';

function space(id: string, roomType: Space['roomType'], boundary: Space['boundary']): Space {
  return { id, type: 'space', layerId: 'rooms', name: id, roomType, boundary };
}

function wall(id: string, x1: number, y1: number, x2: number, y2: number, thickness = 20): Wall {
  return { id, type: 'wall', layerId: 'walls', start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness };
}

function windowOn(id: string, wallId: string, t: number, width = 100): Opening {
  return { id, type: 'opening', layerId: 'openings', wallId, t, width, kind: 'window' };
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

  it('KONKAV (L) koridorun dar kolunu yakalar (konveks kabuk kaçırırdı)', () => {
    // L koridoru: her iki kol 90 cm (< 120). Konveks-kabuk genişliği 90'ı GÖREMEZDİ (kapsayıcı);
    // konkav-duyarlı ölçüm dar kolu yakalar → atıflı koridor hatası.
    const L = space('LKoridor', 'circulation', [
      { x: 0, y: 0 },
      { x: 400, y: 0 },
      { x: 400, y: 90 },
      { x: 90, y: 90 },
      { x: 90, y: 400 },
      { x: 0, y: 400 },
    ]);
    const findings = nonInfo(runCopilotChecks([L], []));
    expect(findings).toHaveLength(1);
    expect(findings[0]!.severity).toBe('error');
    expect(findings[0]!.entityId).toBe('LKoridor');
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

  it('küçük mutfak → uyarı (İmar 3,3 m²)', () => {
    // 150×200 = 3,0 m² < 3,3
    const f = nonInfo(runCopilotChecks([rect('Mutfak', 'kitchen', 150, 200)], []));
    expect(f).toHaveLength(1);
    expect(f[0]!.citation).toContain('İmar');
  });
});

describe('runCopilotChecks — banyo erişilebilirlik (TS 9111, info)', () => {
  it('dar banyo → info dönüş alanı', () => {
    const info = runCopilotChecks([rect('Banyo', 'bathroom', 120, 300)], []).filter(
      (x) => x.severity === 'info' && x.citation.includes('TS 9111'),
    );
    expect(info).toHaveLength(1);
    expect(info[0]!.message).toContain('150 cm');
  });

  it('geniş banyo → dönüş uyarısı yok', () => {
    const info = runCopilotChecks([rect('Banyo', 'bathroom', 200, 300)], []).filter(
      (x) => x.severity === 'info' && x.citation.includes('TS 9111'),
    );
    expect(info).toHaveLength(0);
  });
});

describe('runCopilotChecks — kapı genişliği (TS 9111)', () => {
  const door = (id: string, width: number): import('@zynpparti/document').Opening => ({
    id,
    type: 'opening',
    layerId: 'default',
    wallId: 'w',
    t: 0.5,
    width,
    kind: 'door',
  });

  it('dar kapı → atıflı uyarı', () => {
    const findings = nonInfo(runCopilotChecks([], [], [door('K1', 75)]));
    expect(findings).toHaveLength(1);
    expect(findings[0]!.severity).toBe('warning');
    expect(findings[0]!.citation).toContain('TS 9111');
    expect(findings[0]!.entityId).toBe('K1');
  });

  it('yeterli kapı (90) → uygunsuzluk yok', () => {
    expect(nonInfo(runCopilotChecks([], [], [door('K1', 90)]))).toHaveLength(0);
  });

  it('pencere kapı kuralına girmez', () => {
    const win = { ...door('P1', 60), kind: 'window' as const };
    expect(nonInfo(runCopilotChecks([], [], [win]))).toHaveLength(0);
  });
});

describe('runCopilotChecks — çekme mesafesi (İmar, parsel)', () => {
  const parcel = (half: number): import('@zynpparti/document').Parcel => ({
    id: 'P',
    type: 'parcel',
    layerId: 'site',
    boundary: [
      { x: -half, y: -half },
      { x: half, y: -half },
      { x: half, y: half },
      { x: -half, y: half },
    ],
  });
  const wall = (x1: number, y1: number, x2: number, y2: number): import('@zynpparti/document').Wall => ({
    id: 'w',
    type: 'wall',
    layerId: 'default',
    start: { x: x1, y: y1 },
    end: { x: x2, y: y2 },
    thickness: 15,
  });

  it('yapı sınıra çok yakın → atıflı uyarı', () => {
    // parsel ±500; duvar x=400 → sınıra 100 cm < 300 → uyarı
    const f = nonInfo(runCopilotChecks([], [wall(400, -100, 400, 100)], [], [parcel(500)]));
    expect(f).toHaveLength(1);
    expect(f[0]!.severity).toBe('warning');
    expect(f[0]!.citation).toContain('İmar');
  });

  it('yeterli çekme → uygunsuzluk yok', () => {
    // duvar x=100 → sınıra 400 cm > 300
    expect(nonInfo(runCopilotChecks([], [wall(100, -100, 100, 100)], [], [parcel(500)]))).toHaveLength(0);
  });

  it('parsel yoksa çekme denetlenmez', () => {
    expect(nonInfo(runCopilotChecks([], [wall(490, -100, 490, 100)], [], []))).toHaveLength(0);
  });
});

// NOT: Bina-geneli "doğal aydınlatma" testi kaldırıldı — bina-geneli checkDaylight kasıtlı silindi
// (mahal-bazlı presence + oran kuralları yeterli; bkz. checks.ts notu + "mahal başına aydınlatma" testleri).

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

describe('runCopilotChecks — banyo asgari alanı (İmar, info)', () => {
  it('küçük banyo → İmar info', () => {
    // 100×200 = 2,0 m² < 2,25 (İmar m.29 dar kenar tabanı)
    const info = runCopilotChecks([rect('Banyo', 'bathroom', 100, 200)], []).filter(
      (x) => x.severity === 'info' && x.message.includes('banyo'),
    );
    expect(info).toHaveLength(1);
    expect(info[0]!.citation).toContain('İmar');
  });

  it('yeterli banyo → İmar alanı bulgusu yok', () => {
    // 200×200 = 4,0 m² > 2,25
    const info = runCopilotChecks([rect('Banyo', 'bathroom', 200, 200)], []).filter(
      (x) => x.severity === 'info' && x.message.includes('banyo'),
    );
    expect(info).toHaveLength(0);
  });
});

describe('runCopilotChecks — TAKS (İmar, info)', () => {
  const parcel = (side: number): import('@zynpparti/document').Parcel => ({
    id: 'P',
    type: 'parcel',
    layerId: 'site',
    boundary: [
      { x: 0, y: 0 },
      { x: side, y: 0 },
      { x: side, y: side },
      { x: 0, y: side },
    ],
  });

  it('tipik üst sınırı aşan TAKS → uyarı içerikli info', () => {
    // parsel 1000×1000 = 100 m²; mahal 700×700 = 49 m² → %49 > %40
    const taks = runCopilotChecks([rect('Salon', 'living', 700, 700)], [], [], [parcel(1000)]).filter(
      (x) => x.citation.includes('TAKS'),
    );
    expect(taks).toHaveLength(1);
    expect(taks[0]!.severity).toBe('info');
    expect(taks[0]!.message).toContain('%49');
    expect(taks[0]!.message).toContain('üst sınır');
  });

  it('parsel yoksa TAKS hesaplanmaz', () => {
    const taks = runCopilotChecks([rect('Salon', 'living', 700, 700)], []).filter((x) =>
      x.citation.includes('TAKS'),
    );
    expect(taks).toHaveLength(0);
  });
});

describe('runCopilotChecks — oda asgari genişliği (İmar, info)', () => {
  it('dar oda → atıflı genişlik bilgisi', () => {
    // 180×400: en dar 180 cm < 210
    const f = runCopilotChecks([rect('Yatak', 'sleeping', 180, 400)], []).filter(
      (x) => x.severity === 'info' && x.message.includes('net genişlik'),
    );
    expect(f).toHaveLength(1);
    expect(f[0]!.citation).toContain('İmar');
  });

  it('yeterli genişlik → bulgu yok', () => {
    // 250×400: en dar 250 ≥ 210
    const f = runCopilotChecks([rect('Yatak', 'sleeping', 250, 400)], []).filter((x) =>
      x.message.includes('net genişlik'),
    );
    expect(f).toHaveLength(0);
  });
});

describe('runCopilotChecks — parsel içinde kalma (İmar)', () => {
  const parcel: import('@zynpparti/document').Parcel = {
    id: 'P',
    type: 'parcel',
    layerId: 'site',
    boundary: [
      { x: 0, y: 0 },
      { x: 1000, y: 0 },
      { x: 1000, y: 1000 },
      { x: 0, y: 1000 },
    ],
  };
  const wall = (x1: number, y1: number, x2: number, y2: number): import('@zynpparti/document').Wall => ({
    id: 'w',
    type: 'wall',
    layerId: 'default',
    start: { x: x1, y: y1 },
    end: { x: x2, y: y2 },
    thickness: 15,
  });

  it('duvar parsel dışında → atıflı uyarı', () => {
    const f = runCopilotChecks([], [wall(1200, 500, 1300, 500)], [], [parcel]).filter((x) =>
      x.message.includes('parsel sınırının dışına'),
    );
    expect(f).toHaveLength(1);
    expect(f[0]!.severity).toBe('warning');
    expect(f[0]!.citation).toContain('İmar');
  });

  it('duvar parsel içinde → uyarı yok', () => {
    const f = runCopilotChecks([], [wall(200, 200, 800, 200)], [], [parcel]).filter((x) =>
      x.message.includes('parsel sınırının dışına'),
    );
    expect(f).toHaveLength(0);
  });

  it('parsel yoksa içerme denetlenmez', () => {
    const f = runCopilotChecks([], [wall(1200, 500, 1300, 500)], [], []).filter((x) =>
      x.message.includes('parsel sınırının dışına'),
    );
    expect(f).toHaveLength(0);
  });
});

describe('runCopilotChecks — kat yüksekliği (İmar, info)', () => {
  const wall = (h: number | undefined, id: string): import('@zynpparti/document').Wall => ({
    id,
    type: 'wall',
    layerId: 'default',
    start: { x: 0, y: 0 },
    end: { x: 100, y: 0 },
    thickness: 15,
    ...(h != null ? { height: h } : {}),
  });

  it('alçak duvar (yükseklik<260) → atıflı kat yüksekliği bilgisi', () => {
    const f = runCopilotChecks([], [wall(220, 'w')]).filter((x) =>
      x.message.includes('kat yüksekliği'),
    );
    expect(f).toHaveLength(1);
    expect(f[0]!.severity).toBe('info');
    expect(f[0]!.citation).toContain('İmar');
  });

  it('240–260 bandı (250 cm) → yeni eşikle bilgi verir', () => {
    // Eski eşik 240'tı; 250 cm artık 260 altında → uyarı tetiklenmeli (eşik değişimi regresyon testi).
    const f = runCopilotChecks([], [wall(250, 'w')]).filter((x) =>
      x.message.includes('kat yüksekliği'),
    );
    expect(f).toHaveLength(1);
  });

  it('yeterli/atanmamış yükseklik → bulgu yok', () => {
    const f = runCopilotChecks([], [wall(280, 'a'), wall(undefined, 'b')]).filter((x) =>
      x.message.includes('kat yüksekliği'),
    );
    expect(f).toHaveLength(0);
  });
});

describe('runCopilotChecks — mahal doğal aydınlatma (İmar, info)', () => {
  const room = rect('Salon', 'living', 400, 300); // 12 m²; sınır 0..400 × 0..300

  it('pencere var ama odaya değmiyorsa → "penceresiz" bilgisi', () => {
    const far = wall('wfar', 1000, 1000, 1400, 1000);
    const f = runCopilotChecks([room], [far], [windowOn('p', 'wfar', 0.5)]).filter((x) =>
      x.message.includes('pencere görünmüyor'),
    );
    expect(f).toHaveLength(1);
    expect(f[0]!.severity).toBe('info');
    expect(f[0]!.entityId).toBe('Salon');
    expect(f[0]!.citation).toContain('İmar');
  });

  it('odanın çevre duvarında pencere → bulgu yok', () => {
    const bottom = wall('wb', 0, 0, 400, 0); // odanın alt kenarı boyunca
    const f = runCopilotChecks([room], [bottom], [windowOn('p', 'wb', 0.5)]).filter((x) =>
      x.message.includes('pencere görünmüyor'),
    );
    expect(f).toHaveLength(0);
  });

  it('hiç pencere yoksa nag etmez', () => {
    const f = runCopilotChecks([room], [], []).filter((x) => x.message.includes('pencere görünmüyor'));
    expect(f).toHaveLength(0);
  });

  it('yaşam mahali olmayan (servis) penceresiz olsa da uyarılmaz', () => {
    const far = wall('wfar', 1000, 1000, 1400, 1000);
    const depo = rect('Depo', 'service', 300, 300);
    const f = runCopilotChecks([depo], [far], [windowOn('p', 'wfar', 0.5)]).filter((x) =>
      x.message.includes('pencere görünmüyor'),
    );
    expect(f).toHaveLength(0);
  });
});

describe('runCopilotChecks — ıslak hacim havalandırma (İmar, info)', () => {
  it('penceresiz banyo (başka boşluk varken) → havalandırma bilgisi', () => {
    const bath = rect('Banyo', 'bathroom', 200, 200);
    const far = wall('wfar', 1000, 1000, 1400, 1000);
    const f = runCopilotChecks([bath], [far], [windowOn('p', 'wfar', 0.5)]).filter((x) =>
      x.message.includes('havalandırma'),
    );
    expect(f).toHaveLength(1);
    expect(f[0]!.severity).toBe('info');
    expect(f[0]!.entityId).toBe('Banyo');
  });

  it('çevre duvarında penceresi olan banyo → bulgu yok', () => {
    const bath = rect('Banyo', 'bathroom', 200, 200);
    const bottom = wall('wb', 0, 0, 200, 0);
    const f = runCopilotChecks([bath], [bottom], [windowOn('p', 'wb', 0.5)]).filter((x) =>
      x.message.includes('havalandırma'),
    );
    expect(f).toHaveLength(0);
  });

  it('hiç boşluk yoksa nag etmez', () => {
    const f = runCopilotChecks([rect('Banyo', 'bathroom', 200, 200)], []).filter((x) =>
      x.message.includes('havalandırma'),
    );
    expect(f).toHaveLength(0);
  });
});

describe('runCopilotChecks — mahal başına aydınlatma oranı (İmar, info)', () => {
  it('penceresi olan ama küçük pencereli yaşam mahali → oran düşük bilgisi', () => {
    // 400×400 = 16 m²; 80cm pencere → 0,8×1,4 = 1,12 m² → %7 < %10
    const salon = rect('Salon', 'living', 400, 400);
    const bottom = wall('wb', 0, 0, 400, 0);
    // Mahal-başına bulgu (entityId'li). (Bina-geneli daylight kaldırıldı; artık tek "pencere/taban" kaynağı bu.)
    const f = runCopilotChecks([salon], [bottom], [windowOn('p', 'wb', 0.5, 80)]).filter(
      (x) => x.message.includes('pencere/taban') && x.entityId === 'Salon',
    );
    expect(f).toHaveLength(1);
    expect(f[0]!.severity).toBe('info');
  });

  it('yeterli pencereli mahal → oran bilgisi yok', () => {
    // 400×300 = 12 m²; 100cm pencere → 1,4 m² → ~%11,7 ≥ %10
    const salon = rect('Salon', 'living', 400, 300);
    const bottom = wall('wb', 0, 0, 400, 0);
    const f = runCopilotChecks([salon], [bottom], [windowOn('p', 'wb', 0.5, 100)]).filter(
      (x) => x.message.includes('pencere/taban') && x.entityId === 'Salon',
    );
    expect(f).toHaveLength(0);
  });
});

it('boş model → bulgu yok', () => {
  expect(runCopilotChecks([], [])).toEqual([]);
});
