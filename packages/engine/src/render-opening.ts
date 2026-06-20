import { Graphics } from 'pixi.js';
import { openingFrame, type Opening, type Wall } from '@zynpparti/document';
import { LINEWEIGHTS, PALETTE } from './lineweights';

/**
 * Kapı/pencere sembolünü çizer (VISUAL-CRAFT §1: ince çizgiler, açılış yayı en ince).
 * Önce duvarı boşluk kadar "keser" (zemin rengiyle doldurur), sonra mimari sembolü çizer.
 * Konum duvardan türetilir → duvar değişince boşluk takip eder (binding). Kontur ekran-sabit.
 */
export function drawOpening(g: Graphics, opening: Opening, wall: Wall, pixelSize: number): void {
  g.clear();
  const f = openingFrame(opening, wall);
  const hx = f.normal.x * (f.thickness / 2);
  const hy = f.normal.y * (f.thickness / 2);

  // 1) Duvar gövdesinde boşluk: zemin rengiyle dörtgen doldur (deliği aç).
  g.poly([
    f.a.x + hx,
    f.a.y + hy,
    f.b.x + hx,
    f.b.y + hy,
    f.b.x - hx,
    f.b.y - hy,
    f.a.x - hx,
    f.a.y - hy,
  ]).fill({ color: PALETTE.background });

  // 2) Jamb (kasa) kenarları — iki kısa çizgi, ince.
  const jamb = { width: LINEWEIGHTS.thin * pixelSize, color: PALETTE.wallEdge };
  g.moveTo(f.a.x + hx, f.a.y + hy).lineTo(f.a.x - hx, f.a.y - hy).stroke(jamb);
  g.moveTo(f.b.x + hx, f.b.y + hy).lineTo(f.b.x - hx, f.b.y - hy).stroke(jamb);

  if (opening.kind === 'door') {
    // 3a) Kapı kanadı + açılış yayı (kanat a'da menteşeli, normal yönüne açılır).
    const leafEnd = { x: f.a.x + f.normal.x * opening.width, y: f.a.y + f.normal.y * opening.width };
    g.moveTo(f.a.x, f.a.y)
      .lineTo(leafEnd.x, leafEnd.y)
      .stroke({ width: LINEWEIGHTS.thin * pixelSize, color: PALETTE.roomPerimeter });
    const start = Math.atan2(f.b.y - f.a.y, f.b.x - f.a.x);
    const end = Math.atan2(leafEnd.y - f.a.y, leafEnd.x - f.a.x);
    g.arc(f.a.x, f.a.y, opening.width, start, end)
      .stroke({ width: LINEWEIGHTS.hairline * pixelSize, color: PALETTE.roomPerimeter, alpha: 0.7 });
  } else {
    // 3b) Pencere: orta-çizgi boyunca cam çizgisi.
    g.moveTo(f.a.x, f.a.y)
      .lineTo(f.b.x, f.b.y)
      .stroke({ width: LINEWEIGHTS.thin * pixelSize, color: PALETTE.roomPerimeter });
  }
}
