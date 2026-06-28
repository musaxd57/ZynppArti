import { describe, it, expect } from 'vitest';
import { importDxf } from './dxf-import';
import { exportDxf } from './dxf-export';

// $INSUNITS=4 (mm) + tek LINE 0,0 → 1000,0 (mm) → cm'de 0,0 → 100,0
const DXF_MM = [
  '0', 'SECTION', '2', 'HEADER',
  '9', '$INSUNITS', '70', '4',
  '0', 'ENDSEC',
  '0', 'SECTION', '2', 'ENTITIES',
  '0', 'LINE', '8', 'DUVAR',
  '10', '0.0', '20', '0.0', '30', '0.0',
  '11', '1000.0', '21', '0.0', '31', '0.0',
  '0', 'ENDSEC', '0', 'EOF',
].join('\n');

describe('importDxf', () => {
  it('imports a LINE and converts mm → cm via $INSUNITS', () => {
    const result = importDxf(DXF_MM);
    expect(result.unitScaleToCm).toBe(0.1);
    expect(result.walls).toHaveLength(1);
    expect(result.layers).toEqual(['DUVAR']);

    const w = result.walls[0]!;
    expect(w.type).toBe('wall');
    expect(w.layerId).toBe('DUVAR');
    expect(w.start.x).toBeCloseTo(0);
    expect(w.start.y).toBeCloseTo(0); // Y-flip: y=0 → -0 (görsel aynı; toBeCloseTo -0≈0)
    expect(w.end.x).toBeCloseTo(100);
    expect(w.end.y).toBeCloseTo(0);
  });

  it('throws on an unparseable file', () => {
    expect(() => importDxf('not a dxf at all')).toThrow();
  });

  it('entity rengini (ACI) içe aktarır — kaynak renk korunur', () => {
    // 62=1 → kırmızı (ACI). İçe aktarılan duvar color taşımalı (Rayon/AutoCAD: import = kaynak renk).
    const dxf = [
      '0', 'SECTION', '2', 'ENTITIES',
      '0', 'LINE', '8', 'A', '62', '1',
      '10', '0.0', '20', '0.0', '30', '0.0',
      '11', '100.0', '21', '0.0', '31', '0.0',
      '0', 'ENDSEC', '0', 'EOF',
    ].join('\n');
    const w = importDxf(dxf).walls[0]!;
    expect(w.color).toBe(0xff0000); // kırmızı
  });

  it('renksiz entity → color undefined (duvar poché kalır, native gibi)', () => {
    const dxf = [
      '0', 'SECTION', '2', 'ENTITIES',
      '0', 'LINE', '8', 'A',
      '10', '0.0', '20', '0.0', '11', '100.0', '21', '0.0',
      '0', 'ENDSEC', '0', 'EOF',
    ].join('\n');
    expect(importDxf(dxf).walls[0]!.color).toBeUndefined();
  });

  it('polyface/3B mesh POLYLINE atlanır (origin\'e çöp duvar üretmez)', () => {
    // 70=64 → polyface mesh; vertices'e yüz-kayıtları karışır → eski kod (0,0)'a çöp duvar çizerdi.
    const dxf = [
      '0', 'SECTION', '2', 'ENTITIES',
      '0', 'POLYLINE', '8', 'M', '66', '1', '70', '64',
      '0', 'VERTEX', '8', 'M', '10', '0.0', '20', '0.0',
      '0', 'VERTEX', '8', 'M', '10', '100.0', '20', '0.0',
      '0', 'SEQEND',
      '0', 'ENDSEC', '0', 'EOF',
    ].join('\n');
    expect(importDxf(dxf).walls).toHaveLength(0);
  });

  it('OCS −Z extrusion (ayna): ARC X-aynalı içe aktarılır', () => {
    // 230=-1 → eksenel −Z extrusion (MIRROR). Merkez (100,0) → WCS X-negate → x negatif olmalı.
    const dxf = [
      '0', 'SECTION', '2', 'ENTITIES',
      '0', 'ARC', '8', 'A',
      '10', '100.0', '20', '0.0', '30', '0.0',
      '40', '50.0', '50', '0.0', '51', '90.0',
      '210', '0.0', '220', '0.0', '230', '-1.0',
      '0', 'ENDSEC', '0', 'EOF',
    ].join('\n');
    const r = importDxf(dxf);
    expect(r.walls.length).toBeGreaterThanOrEqual(2);
    for (const w of r.walls) expect(w.start.x).toBeLessThan(0); // X-aynalı → tüm köşeler negatif x
  });

  it('Y-FLIP: DXF y-UP → iç model y-DOWN (AutoCAD ile aynı yön; eskiden dikey aynalıydı)', () => {
    // DXF'te yukarı = +y; bizde aşağı = +y. Pozitif DXF-y, NEGATİF iç-y olmalı (görsel aynalanma düzelir).
    const dxf = [
      '0', 'SECTION', '2', 'ENTITIES',
      '0', 'LINE', '8', 'L',
      '10', '0.0', '20', '0.0', '30', '0.0',
      '11', '0.0', '21', '100.0', '31', '0.0', // DXF'te yukarı doğru 100
      '0', 'ENDSEC', '0', 'EOF',
    ].join('\n');
    const w = importDxf(dxf).walls[0]!;
    expect(w.start.y).toBeCloseTo(0);
    expect(w.end.y).toBeCloseTo(-100); // yukarı (DXF +100) → iç modelde -100 (aşağı-pozitif sistemde "yukarı")
  });

  it('TEXT → Annotation (içerik + konum + yükseklik)', () => {
    const dxf = [
      '0', 'SECTION', '2', 'ENTITIES',
      '0', 'TEXT', '8', 'NOT',
      '10', '50.0', '20', '60.0', '30', '0.0',
      '40', '30.0',
      '1', 'Salon',
      '0', 'ENDSEC', '0', 'EOF',
    ].join('\n');
    const r = importDxf(dxf);
    expect(r.annotations).toHaveLength(1);
    const a = r.annotations[0]!;
    expect(a.text).toBe('Salon');
    expect(a.position).toEqual({ x: 50, y: -60 }); // Y-flip (IO sınırı): DXF y=60 → iç model y=-60
    expect(a.height).toBeCloseTo(30);
  });

  it('bozuk TEXT yüksekliği (devasa) tavanla kırpılır (zoom/bounds ele geçmesin)', () => {
    const dxf = [
      '0', 'SECTION', '2', 'ENTITIES',
      '0', 'TEXT', '8', 'NOT',
      '10', '0.0', '20', '0.0', '30', '0.0',
      '40', '1000000000.0', // 1e9 — bozuk
      '1', 'X',
      '0', 'ENDSEC', '0', 'EOF',
    ].join('\n');
    const a = importDxf(dxf).annotations[0]!;
    expect(a.height).toBeLessThanOrEqual(2000);
    expect(a.height).toBeGreaterThan(0);
  });

  it('CIRCLE → segmentlenmiş duvarlar (kapalı, çok parça)', () => {
    const dxf = [
      '0', 'SECTION', '2', 'ENTITIES',
      '0', 'CIRCLE', '8', 'C',
      '10', '0.0', '20', '0.0', '30', '0.0',
      '40', '100.0',
      '0', 'ENDSEC', '0', 'EOF',
    ].join('\n');
    const r = importDxf(dxf);
    // 2π / (π/12) = 24 segment
    expect(r.walls.length).toBeGreaterThanOrEqual(20);
    // tüm köşeler ~100 cm yarıçapta
    for (const w of r.walls) {
      expect(Math.hypot(w.start.x, w.start.y)).toBeCloseTo(100, 0);
    }
  });

  it('ARC → çeyrek yay segmentleri (uçlar doğru)', () => {
    const dxf = [
      '0', 'SECTION', '2', 'ENTITIES',
      '0', 'ARC', '8', 'A',
      '10', '0.0', '20', '0.0', '30', '0.0',
      '40', '100.0',
      '50', '0.0', '51', '90.0',
      '0', 'ENDSEC', '0', 'EOF',
    ].join('\n');
    const r = importDxf(dxf);
    expect(r.walls.length).toBeGreaterThanOrEqual(4);
    const first = r.walls[0]!;
    const last = r.walls[r.walls.length - 1]!;
    expect(first.start.x).toBeCloseTo(100); // 0° → (100,0)
    expect(first.start.y).toBeCloseTo(0);
    expect(last.end.x).toBeCloseTo(0, 0); // 90° → DXF (0,100) → Y-flip → iç model (0,-100)
    expect(last.end.y).toBeCloseTo(-100, 0);
  });

  it('LWPOLYLINE bulge → düz kiriş değil YAY olarak içe aktarılır', () => {
    // (100,0)→(0,100), merkez (0,0), 90° yay; bulge = tan(22.5°) ≈ 0.41421.
    const dxf = [
      '0', 'SECTION', '2', 'ENTITIES',
      '0', 'LWPOLYLINE', '8', 'A',
      '90', '2', '70', '0',
      '10', '100.0', '20', '0.0', '42', '0.41421356',
      '10', '0.0', '20', '100.0',
      '0', 'ENDSEC', '0', 'EOF',
    ].join('\n');
    const r = importDxf(dxf);
    // Düz olsaydı 1 segment; yay → tessellate (≥4). Tüm köşeler ~100 yarıçapta (orta nokta da).
    expect(r.walls.length).toBeGreaterThanOrEqual(4);
    for (const w of r.walls) {
      expect(Math.hypot(w.start.x, w.start.y)).toBeCloseTo(100, 0);
      expect(Math.hypot(w.end.x, w.end.y)).toBeCloseTo(100, 0);
    }
  });

  it('ELLIPSE → tessellate (düşmez); köşeler elips üstünde', () => {
    // merkez (0,0), büyük eksen ucu (100,0) → a=100, axisRatio 0.5 → b=50, tam elips.
    const dxf = [
      '0', 'SECTION', '2', 'ENTITIES',
      '0', 'ELLIPSE', '8', 'A',
      '10', '0.0', '20', '0.0', '30', '0.0',
      '11', '100.0', '21', '0.0', '31', '0.0',
      '40', '0.5',
      '41', '0.0', '42', '6.283185307',
      '0', 'ENDSEC', '0', 'EOF',
    ].join('\n');
    const r = importDxf(dxf);
    expect(r.walls.length).toBeGreaterThanOrEqual(4);
    // Her köşe elips denkleminde: (x/100)² + (y/50)² ≈ 1.
    for (const w of r.walls) {
      const v = (w.start.x / 100) ** 2 + (w.start.y / 50) ** 2;
      expect(v).toBeCloseTo(1, 1);
    }
  });

  it('round-trips through exportDxf (geometry preserved)', () => {
    const dxf = exportDxf([
      {
        id: 'w1',
        type: 'wall',
        layerId: 'A',
        start: { x: 0, y: 0 },
        end: { x: 250, y: 0 },
        thickness: 15,
      },
    ]);
    const back = importDxf(dxf);
    expect(back.walls).toHaveLength(1);
    // Y-flip simetrik (export -y, import -(-y)) → in-app round-trip geometriyi korur (-0≈0).
    expect(back.walls[0]!.start.x).toBeCloseTo(0);
    expect(back.walls[0]!.start.y).toBeCloseTo(0);
    expect(back.walls[0]!.end.x).toBeCloseTo(250);
    expect(back.walls[0]!.end.y).toBeCloseTo(0);
  });

  // BLOCK "KAPI" (LINE 0,0→100,0) + INSERT konum 200,50 → patlatılmış duvar 200,50→300,50.
  const blockDxf = (insertLines: string[]): string =>
    [
      '0', 'SECTION', '2', 'BLOCKS',
      '0', 'BLOCK', '8', '0', '2', 'KAPI', '10', '0.0', '20', '0.0', '30', '0.0', '3', 'KAPI',
      '0', 'LINE', '8', 'KAPILAR',
      '10', '0.0', '20', '0.0', '30', '0.0',
      '11', '100.0', '21', '0.0', '31', '0.0',
      '0', 'ENDBLK', '8', '0',
      '0', 'ENDSEC',
      '0', 'SECTION', '2', 'ENTITIES',
      ...insertLines,
      '0', 'ENDSEC', '0', 'EOF',
    ].join('\n');

  it('INSERT → blok içeriği konumla patlatılır (mobilya/sembol kaybolmaz)', () => {
    const r = importDxf(blockDxf(['0', 'INSERT', '8', '0', '2', 'KAPI', '10', '200.0', '20', '50.0', '30', '0.0']));
    expect(r.walls).toHaveLength(1);
    const w = r.walls[0]!;
    expect(w.layerId).toBe('KAPILAR'); // blok içi entity'nin katmanı korunur
    expect(w.start.x).toBeCloseTo(200);
    expect(w.start.y).toBeCloseTo(-50); // Y-flip (IO sınırı): DXF y=50 → iç model y=-50
    expect(w.end.x).toBeCloseTo(300);
    expect(w.end.y).toBeCloseTo(-50);
  });

  it('blok içi layer "0" entity INSERT katmanını MİRAS alır (AutoCAD layer-0 geleneği, L9)', () => {
    // Blok tanımındaki LINE layer "0"da → INSERT 'MOBILYA' katmanında. İçe-aktarımda "0"da kalmamalı.
    const dxf = [
      '0', 'SECTION', '2', 'BLOCKS',
      '0', 'BLOCK', '8', '0', '2', 'SANDALYE', '10', '0.0', '20', '0.0', '30', '0.0', '3', 'SANDALYE',
      '0', 'LINE', '8', '0',
      '10', '0.0', '20', '0.0', '30', '0.0',
      '11', '100.0', '21', '0.0', '31', '0.0',
      '0', 'ENDBLK', '8', '0',
      '0', 'ENDSEC',
      '0', 'SECTION', '2', 'ENTITIES',
      '0', 'INSERT', '8', 'MOBILYA', '2', 'SANDALYE', '10', '0.0', '20', '0.0', '30', '0.0',
      '0', 'ENDSEC', '0', 'EOF',
    ].join('\n');
    const r = importDxf(dxf);
    expect(r.walls).toHaveLength(1);
    expect(r.walls[0]!.layerId).toBe('MOBILYA'); // "0" değil → INSERT katmanı miras alındı
  });

  it('INSERT rotasyonu (90°) uygulanır', () => {
    // rotation kodu 50 = 90° → yerel (100,0) → DXF (0,100) → Y-flip → iç model (0,-100)
    const r = importDxf(blockDxf(['0', 'INSERT', '8', '0', '2', 'KAPI', '10', '0.0', '20', '0.0', '30', '0.0', '50', '90.0']));
    expect(r.walls).toHaveLength(1);
    const w = r.walls[0]!;
    expect(w.end.x).toBeCloseTo(0);
    expect(w.end.y).toBeCloseTo(-100);
  });
});
