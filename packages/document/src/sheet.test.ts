import { describe, it, expect } from 'vitest';
import { sheetModelSize, sheetPaperMm, sheetTitleBlock } from './sheet';
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
