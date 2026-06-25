import { describe, it, expect } from 'vitest';
import {
  sheetModelSize,
  sheetPaperMm,
  sheetTitleBlock,
  makeSheet,
  nextSheetPosition,
  nextSheetNo,
} from './sheet';
import type { Sheet } from './entities';

const make = (over: Partial<Sheet> = {}): Sheet => ({
  id: 's1',
  type: 'sheet',
  layerId: 'sheet',
  position: { x: 0, y: 0 },
  size: 'A3',
  orientation: 'landscape',
  scale: 50,
  title: 'Pafta',
  ...over,
});

describe('sheetPaperMm', () => {
  it('A4 düşey = 210×297, yatay = 297×210', () => {
    expect(sheetPaperMm('A4', 'portrait')).toEqual({ w: 210, h: 297 });
    expect(sheetPaperMm('A4', 'landscape')).toEqual({ w: 297, h: 210 });
  });

  it('A0 uzun kenar 1189 mm', () => {
    expect(sheetPaperMm('A0', 'landscape').w).toBe(1189);
  });
});

describe('sheetModelSize', () => {
  it('A3 yatay 1:50 → 2100×1485 cm (mm × scale / 10)', () => {
    // 297×210 mm × 50 / 10 = 1485×1050 cm... yatay: w=420? hayır A3=[297,420]
    // landscape → w=420, h=297 mm → ×5 = 2100×1485 cm
    expect(sheetModelSize(make())).toEqual({ w: 2100, h: 1485 });
  });

  it('ölçek büyüdükçe model kaplaması büyür', () => {
    expect(sheetModelSize(make({ scale: 100 })).w).toBe(sheetModelSize(make({ scale: 50 })).w * 2);
  });
});

describe('sheetTitleBlock', () => {
  it('antet pafta sağ-alt köşesinde, içeride', () => {
    const s = make();
    const size = sheetModelSize(s);
    const tb = sheetTitleBlock(s);
    // sağ kenara yakın
    expect(tb.x + tb.w).toBeLessThan(s.position.x + size.w);
    expect(tb.y + tb.h).toBeLessThan(s.position.y + size.h);
    expect(tb.w).toBeGreaterThan(0);
    expect(tb.h).toBeGreaterThan(0);
  });
});

describe('makeSheet', () => {
  it('varsayılanları uygular (A3/landscape/50/Pafta)', () => {
    const s = makeSheet({ x: 10, y: 20 });
    expect(s).toMatchObject({ type: 'sheet', layerId: 'sheet', position: { x: 10, y: 20 }, size: 'A3', orientation: 'landscape', scale: 50, title: 'Pafta' });
    expect('id' in s).toBe(false); // id çağıran tarafından verilir
  });
  it('override + opsiyonel alanlar (project/sheetNo)', () => {
    const s = makeSheet({ x: 0, y: 0 }, { size: 'A1', scale: 100, project: 'Ev', sheetNo: '2' });
    expect(s.size).toBe('A1');
    expect(s.scale).toBe(100);
    expect(s.project).toBe('Ev');
    expect(s.sheetNo).toBe('2');
  });
});

describe('nextSheetPosition (üst üste binmeyen otomatik yerleşim)', () => {
  it('pafta yoksa origin', () => {
    expect(nextSheetPosition([])).toEqual({ x: 0, y: 0 });
  });
  it('yeni paftayı mevcudun SAĞINA gap ile koyar (üst hizalı)', () => {
    const s: Sheet = { id: 's1', type: 'sheet', layerId: 'sheet', position: { x: 0, y: 0 }, size: 'A3', orientation: 'landscape', scale: 50, title: 'P' };
    const w = sheetModelSize(s).w; // 2100
    const pos = nextSheetPosition([s], 200);
    expect(pos).toEqual({ x: w + 200, y: 0 });
  });
  it('birden çok paftada en sağdakinin sağına koyar', () => {
    const base = { type: 'sheet' as const, layerId: 'sheet', size: 'A3' as const, orientation: 'landscape' as const, scale: 50, title: 'P' };
    const a: Sheet = { ...base, id: 'a', position: { x: 0, y: 0 } };
    const b: Sheet = { ...base, id: 'b', position: { x: 5000, y: 0 } };
    const pos = nextSheetPosition([a, b], 200);
    expect(pos.x).toBe(5000 + sheetModelSize(b).w + 200);
  });
});

describe('nextSheetNo', () => {
  it('N pafta → yeni numara N+1', () => {
    expect(nextSheetNo(0)).toBe('1');
    expect(nextSheetNo(4)).toBe('5');
  });
});
