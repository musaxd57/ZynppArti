import { BitmapText, Graphics } from 'pixi.js';
import { dimensionGeometry, formatLength, type Dimension } from '@zynpparti/document';
import { LINEWEIGHTS, PALETTE } from './lineweights';
import { ROOM_FONT } from './charset';

const TEXT_SIZE = 22; // cm (dünya birimi)

/**
 * Ölçülendirmeyi çizer (VISUAL-CRAFT §1: ince çizgiler): uzatma çizgileri + ölçü çizgisi +
 * uçlarda 45° mimari "tik" işaretleri. Konturlar ekran-sabit (pixelSize). Metin ayrı (BitmapText).
 */
export function drawDimension(g: Graphics, dim: Dimension, pixelSize: number): void {
  g.clear();
  const t = dimensionGeometry(dim);
  const gap = 4 * pixelSize; // ölçülen noktadan uzatma çizgisi başlangıç boşluğu
  const over = 6 * pixelSize; // ölçü çizgisini biraz aşan uzatma

  // Uzatma çizgileri (a→da, b→db) — küçük boşluk + taşma ile.
  ext(g, t.a, t.normal, dim.offset, gap, over);
  ext(g, t.b, t.normal, dim.offset, gap, over);

  // Ölçü çizgisi.
  g.moveTo(t.da.x, t.da.y).lineTo(t.db.x, t.db.y);

  // 45° tik işaretleri (mimari) uçlarda.
  const tk = 7 * pixelSize;
  const diag = norm(t.dir.x + t.normal.x, t.dir.y + t.normal.y);
  tick(g, t.da, diag, tk);
  tick(g, t.db, diag, tk);

  g.stroke({ width: LINEWEIGHTS.thin * pixelSize, color: PALETTE.dimension });
}

/** Ölçü metnini (uzunluk) ölçü çizgisinin ortasına yerleştirir (yatay, okunur). */
export function buildDimensionLabel(dim: Dimension): BitmapText {
  const t = dimensionGeometry(dim);
  const label = new BitmapText({
    text: formatLength(t.length),
    style: { fontFamily: ROOM_FONT, fontSize: TEXT_SIZE, align: 'center' },
  });
  label.anchor.set(0.5);
  // Metni ölçü çizgisinin DIŞINA kaydır — offset yönünü takip et (ext() gibi). Negatif offset'te düz
  // +normal, metni ölçü çizgisiyle ölçülen geometri arasına sokup çakıştırırdı.
  const s = dim.offset >= 0 ? 1 : -1;
  label.position.set(t.mid.x + t.normal.x * TEXT_SIZE * 0.9 * s, t.mid.y + t.normal.y * TEXT_SIZE * 0.9 * s);
  return label;
}

function ext(
  g: Graphics,
  p: { x: number; y: number },
  normal: { x: number; y: number },
  offset: number,
  gap: number,
  over: number,
): void {
  const sign = offset >= 0 ? 1 : -1;
  const start = { x: p.x + normal.x * gap * sign, y: p.y + normal.y * gap * sign };
  const end = { x: p.x + normal.x * (offset + over * sign), y: p.y + normal.y * (offset + over * sign) };
  g.moveTo(start.x, start.y).lineTo(end.x, end.y);
}

function tick(g: Graphics, p: { x: number; y: number }, diag: { x: number; y: number }, len: number): void {
  g.moveTo(p.x - diag.x * len, p.y - diag.y * len).lineTo(p.x + diag.x * len, p.y + diag.y * len);
}

function norm(x: number, y: number): { x: number; y: number } {
  const l = Math.hypot(x, y) || 1;
  return { x: x / l, y: y / l };
}
