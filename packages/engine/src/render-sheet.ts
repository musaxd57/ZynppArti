import { BitmapText, Container, Graphics } from 'pixi.js';
import { sheetModelSize, sheetTitleBlock, sheetMmToModelCm, type Sheet } from '@zynpparti/document';
import { ROOM_FONT } from './charset';
import { LINEWEIGHTS } from './lineweights';

/** Pafta çerçeve/antet renkleri — koyu tuvalde "kağıt" hissi (açık gri kenar). */
const SHEET_BORDER = 0xd8d8d8;
const SHEET_INNER = 0x9aa0a8;
const SHEET_TEXT = 0xe8e8e8;

/**
 * Pafta çerçeve + antet ÇİZGİLERİ (kontur) — yalnız Graphics'e yazar. Çizgi kalınlığı ekran-sabit
 * (pixelSize = 1/zoom) → zoom'da DEĞİŞİR. Bu yüzden geometriden ayrıldı: zoom'da metinler (dünya-ölçekli)
 * yeniden kurulmaz, yalnız bu fonksiyon `g.clear()` sonrası tekrar koşar (build/stroke ayrımı, perf).
 */
export function strokeSheet(g: Graphics, sheet: Sheet, pixelSize: number): void {
  g.clear();
  const size = sheetModelSize(sheet);
  const f = sheetMmToModelCm(sheet.scale);

  // Dış çerçeve.
  g.rect(sheet.position.x, sheet.position.y, size.w, size.h).stroke({
    width: LINEWEIGHTS.cut * pixelSize,
    color: SHEET_BORDER,
  });
  // İç kenar boşluğu (çizim alanı sınırı) — 10 mm.
  const m = 10 * f;
  g.rect(sheet.position.x + m, sheet.position.y + m, size.w - 2 * m, size.h - 2 * m).stroke({
    width: LINEWEIGHTS.thin * pixelSize,
    color: SHEET_INNER,
    alpha: 0.7,
  });

  // Sade sayfa: antet/başlık çizme — sadece sayfa çerçevesi.
  if (sheet.plain) return;

  // Antet kutusu + bölme çizgileri.
  const tb = sheetTitleBlock(sheet);
  g.rect(tb.x, tb.y, tb.w, tb.h).stroke({ width: LINEWEIGHTS.thin * pixelSize, color: SHEET_BORDER });
  const rowH = tb.h / 3;
  for (let i = 1; i < 3; i++) {
    g.moveTo(tb.x, tb.y + i * rowH)
      .lineTo(tb.x + tb.w, tb.y + i * rowH)
      .stroke({ width: LINEWEIGHTS.hairline * pixelSize, color: SHEET_INNER, alpha: 0.6 });
  }
}

/**
 * Pafta (sheet) çizer: dış çerçeve + iç kenar boşluğu (margin) + sağ-alt antet kutusu ve metinleri
 * (CLAUDE.md §8.6). Kağıt boyutu/ölçeği model uzayına ölçeklenir (sheet.ts). Pafta en altta render
 * edilir → çizimi kapatmaz. Container'ın İLK çocuğu kontur Graphics'idir (zoom'da `strokeSheet` ile
 * yenilenir); metinler (dünya-ölçekli BitmapText) bir kez kurulur, zoom'da dokunulmaz.
 */
export function buildSheet(sheet: Sheet, pixelSize: number): Container {
  const c = new Container();
  const g = new Graphics();
  strokeSheet(g, sheet, pixelSize);
  c.addChild(g); // İLK çocuk: kontur (entity-layer zoom'da children[0]'ı re-stroke eder)

  if (sheet.plain) return c;

  // Antet metinleri (dünya-ölçekli; satır yüksekliğinin ~%55'i) — pixelSize'dan BAĞIMSIZ.
  const f = sheetMmToModelCm(sheet.scale);
  const tb = sheetTitleBlock(sheet);
  const rowH = tb.h / 3;
  const fontSize = rowH * 0.55;
  const pad = 3 * f;
  const line = (text: string, row: number): void => {
    const t = new BitmapText({ text, style: { fontFamily: ROOM_FONT, fontSize } });
    t.anchor.set(0, 0.5);
    t.position.set(tb.x + pad, tb.y + row * rowH + rowH / 2);
    t.tint = SHEET_TEXT;
    c.addChild(t);
  };
  line(sheet.title || 'Pafta', 0);
  const row1 = [sheet.project, sheet.date].filter(Boolean).join('  ·  ');
  if (row1) line(row1, 1);
  const orient = sheet.orientation === 'landscape' ? 'yatay' : 'düşey';
  const row2 = `Ölçek 1:${sheet.scale}  ·  ${sheet.size} ${orient}${sheet.sheetNo ? '  ·  ' + sheet.sheetNo : ''}`;
  line(row2, 2);

  return c;
}
