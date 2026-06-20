import { Graphics } from 'pixi.js';
import type { Parcel } from '@zynpparti/document';
import { LINEWEIGHTS, PALETTE } from './lineweights';
import { CHAIN, dashSegment } from './linetypes';

/**
 * Parsel sınırını **zincir (dash-dot) çizgi** ile çizer — mülk/arsa sınırı geleneği (VISUAL-CRAFT §2).
 * Ekran-sabit ince çizgi; zoom'da pixelSize ile yenilenir.
 */
export function drawParcel(g: Graphics, parcel: Parcel, pixelSize: number): void {
  g.clear();
  const b = parcel.boundary;
  if (b.length < 2) return;
  for (let i = 0; i < b.length; i++) {
    dashSegment(g, b[i]!, b[(i + 1) % b.length]!, CHAIN, pixelSize);
  }
  g.stroke({ width: LINEWEIGHTS.perimeter * pixelSize, color: PALETTE.parcel, alpha: 0.9 });
}
