import { describe, it, expect } from 'vitest';
import type { Annotation, Block, Dimension, Parcel, Space, Wall } from '@zynpparti/document';
import { exportDxf } from './dxf-export';

const wall = (id: string, x1: number, y1: number, x2: number, y2: number, layerId = 'default'): Wall => ({
  id,
  type: 'wall',
  layerId,
  start: { x: x1, y: y1 },
  end: { x: x2, y: y2 },
  thickness: 20,
});

describe('exportDxf', () => {
  it('ENTITIES bölümü + EOF ile sarmalar', () => {
    const dxf = exportDxf([]);
    expect(dxf).toContain('SECTION');
    expect(dxf).toContain('ENTITIES');
    expect(dxf).toContain('ENDSEC');
    expect(dxf.trimEnd().endsWith('EOF')).toBe(true);
  });

  it('her duvar için bir LINE entity yazar', () => {
    const dxf = exportDxf([wall('a', 0, 0, 100, 0), wall('b', 0, 0, 0, 50)]);
    const lines = dxf.split('\n').filter((l) => l === 'LINE');
    expect(lines).toHaveLength(2);
  });

  it('$ACADVER = AC1015 (LWPOLYLINE + $INSUNITS kullandığımız için R12 değil; denetim L8)', () => {
    const rows = exportDxf([wall('a', 0, 0, 100, 0)]).split('\n');
    const i = rows.indexOf('$ACADVER');
    expect(i).toBeGreaterThan(-1);
    expect(rows[i + 2]).toBe('AC1015'); // 9 $ACADVER / 1 / AC1015
    expect(rows).not.toContain('AC1009'); // R12 başlığı yok
  });

  it('HEADER $INSUNITS=5 (cm) + kullanılan katmanlar için LAYER tablosu yazar', () => {
    const dxf = exportDxf([wall('a', 0, 0, 100, 0, 'Mimari')]);
    expect(dxf).toContain('$INSUNITS');
    expect(dxf).toContain('HEADER');
    expect(dxf).toContain('TABLE');
    // $INSUNITS değerinin 5 (cm) olduğunu doğrula.
    const rows = dxf.split('\n');
    const ui = rows.indexOf('$INSUNITS');
    expect(rows[ui + 2]).toBe('5'); // 9 $INSUNITS / 70 / 5
    // Katman tanımı: bir '0 LAYER 2 Mimari ...' girişi olmalı (sadece kenar code-8 değil).
    const layerDefs = rows.filter((r, k) => r === 'LAYER' && rows[k - 1] === '0');
    expect(layerDefs.length).toBeGreaterThanOrEqual(1);
    expect(dxf).toContain('CONTINUOUS');
  });

  it('koordinatları (cm, 4 ondalık) ve katmanı korur', () => {
    const dxf = exportDxf([wall('a', 12.5, -3, 100, 0, 'Mimari')]);
    expect(dxf).toContain('12.5000'); // start.x
    expect(dxf).toContain('3.0000'); // start.y: iç model -3 → Y-flip export → DXF +3 (y-UP)
    expect(dxf).toContain('100.0000'); // end.x
    expect(dxf).toContain('Mimari'); // katman (kod 8)
  });

  it('boş girdi → geçerli ama LINE içermeyen DXF', () => {
    const dxf = exportDxf([]);
    expect(dxf.split('\n').filter((l) => l === 'LINE')).toHaveLength(0);
  });

  it('parsel → kapalı LWPOLYLINE (köşe sayısı + kapalı bayrak)', () => {
    const parcel: Parcel = {
      id: 'p',
      type: 'parcel',
      layerId: 'parcel',
      boundary: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 80 },
      ],
    };
    const dxf = exportDxf([parcel]);
    expect(dxf).toContain('LWPOLYLINE');
    const lines = dxf.split('\n');
    const i = lines.indexOf('LWPOLYLINE');
    // 90 (vertex count) → 3, 70 (closed) → 1
    expect(lines[lines.indexOf('90', i) + 1]).toBe('3');
    expect(lines[lines.indexOf('70', i) + 1]).toBe('1');
  });

  it('blok → ayak izi LWPOLYLINE (4 köşe)', () => {
    const block: Block = {
      id: 'b',
      type: 'block',
      layerId: 'furniture',
      kind: 'table',
      position: { x: 50, y: 50 },
      rotation: 0,
    };
    const dxf = exportDxf([block]);
    const lines = dxf.split('\n');
    const i = lines.indexOf('LWPOLYLINE');
    expect(i).toBeGreaterThanOrEqual(0);
    expect(lines[lines.indexOf('90', i) + 1]).toBe('4');
  });

  it('metin → TEXT entity (içerik kod 1)', () => {
    const ann: Annotation = {
      id: 'a',
      type: 'annotation',
      layerId: 'annotation',
      position: { x: 10, y: 20 },
      text: 'Salon',
      height: 30,
    };
    const dxf = exportDxf([ann]);
    expect(dxf).toContain('TEXT');
    expect(dxf).toContain('Salon');
  });

  it('çok satırlı metin → her satır için bir TEXT', () => {
    const ann: Annotation = {
      id: 'a',
      type: 'annotation',
      layerId: 'annotation',
      position: { x: 0, y: 0 },
      text: 'satır1\nsatır2',
      height: 30,
    };
    const dxf = exportDxf([ann]);
    expect(dxf.split('\n').filter((l) => l === 'TEXT')).toHaveLength(2);
  });

  it('mahal → ad merkeze TEXT (sınır duvarlardan gelir)', () => {
    const space: Space = {
      id: 's',
      type: 'space',
      layerId: 'rooms',
      name: 'Salon',
      boundary: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 80 },
        { x: 0, y: 80 },
      ],
    };
    const dxf = exportDxf([space]);
    expect(dxf).toContain('TEXT');
    expect(dxf).toContain('Salon');
    // poligon değil (LWPOLYLINE yazılmaz — sınır duvar işidir)
    expect(dxf).not.toContain('LWPOLYLINE');
  });

  it('ölçü → ölçü + 2 uzatma LINE + değer TEXT', () => {
    const dim: Dimension = {
      id: 'd',
      type: 'dimension',
      layerId: 'dimension',
      a: { x: 0, y: 0 },
      b: { x: 100, y: 0 },
      offset: 30,
    };
    const dxf = exportDxf([dim]);
    expect(dxf.split('\n').filter((l) => l === 'LINE')).toHaveLength(3);
    expect(dxf.split('\n').filter((l) => l === 'TEXT')).toHaveLength(1);
  });

  // DXF satır-bazlı format → metin/katman içindeki newline tüm dosyayı bozar (escaping bug fix).
  it('mahal adındaki newline dosyayı BOZMAZ (kontrol karakteri boşluğa indirilir)', () => {
    const space: Space = {
      id: 's',
      type: 'space',
      layerId: 'rooms',
      name: 'Salon\n(net)',
      boundary: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
      ],
    };
    const dxf = exportDxf([space]);
    const lines = dxf.split('\n');
    // "(net)" kendi başına bir satır olmamalı (olsaydı group code olarak ayrıştırılıp dosyayı bozardı).
    expect(lines).not.toContain('(net)');
    expect(dxf).toContain('Salon (net)'); // newline → boşluk
  });

  it('katman adındaki yasak/kontrol karakterleri _ ile değişir', () => {
    const dxf = exportDxf([wall('a', 0, 0, 100, 0, 'Arch/Wall:1')]);
    expect(dxf).toContain('Arch_Wall_1');
    expect(dxf).not.toContain('Arch/Wall:1');
  });

  it('çok-satırlı açıklama her satırı ayrı TEXT yapar, gömülü newline kalmaz', () => {
    const ann: Annotation = {
      id: 'an',
      type: 'annotation',
      layerId: 'annotation',
      position: { x: 0, y: 0 },
      text: 'Üst kat\r\nplan',
      height: 20,
    };
    const dxf = exportDxf([ann]);
    // \r\n iki satıra bölünür ('Üst kat' ve 'plan'); hiçbir TEXT değeri \r içermemeli.
    expect(dxf).not.toMatch(/\r/);
    expect(dxf).toContain('Üst kat');
    expect(dxf).toContain('plan');
  });
});
