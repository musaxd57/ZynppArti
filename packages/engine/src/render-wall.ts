import { Graphics } from 'pixi.js';
import type { Wall } from '@zynpparti/document';
import { LINEWEIGHTS, PALETTE } from './lineweights';

/**
 * Duvarı **poché gövde + kesit konturu** olarak çizer (VISUAL-CRAFT §1/§3).
 * Gövde, segmentin kalınlık kadar diklemesine genişletilmiş dörtgenidir (cm, dünya birimi →
 * gerçek kalınlık, zoom'la ölçeklenir). Kontur ekran-sabittir (`pixelSize` ile): kesit çizgisi
 * hiyerarşinin en kalını ama her zoom'da aynı ekran kalınlığında kalır.
 */
export function drawWall(g: Graphics, wall: Wall, pixelSize: number): void {
  g.clear();
  const quad = wallQuad(wall);
  g.poly(quad)
    .fill({ color: PALETTE.wallBody })
    .stroke({ width: LINEWEIGHTS.cut * pixelSize, color: PALETTE.wallEdge, alignment: 0.5 });
}

/** Segment + kalınlıktan dörtgen köşeleri (düz dizi: x0,y0,x1,y1,...). */
function wallQuad(w: Wall): number[] {
  const dx = w.end.x - w.start.x;
  const dy = w.end.y - w.start.y;
  const len = Math.hypot(dx, dy) || 1;
  const half = w.thickness / 2;
  const nx = (-dy / len) * half; // birim dik × yarı kalınlık
  const ny = (dx / len) * half;
  return [
    w.start.x + nx,
    w.start.y + ny,
    w.end.x + nx,
    w.end.y + ny,
    w.end.x - nx,
    w.end.y - ny,
    w.start.x - nx,
    w.start.y - ny,
  ];
}
