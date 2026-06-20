import { Graphics } from 'pixi.js';
import { hatchLines, type Vec2 } from '@zynpparti/geometry';
import type { Wall } from '@zynpparti/document';
import { LINEWEIGHTS, PALETTE } from './lineweights';

const HATCH_SPACING = 9; // cm (dünya) — poché tarama aralığı; fiziksel (zoom'la ölçeklenir)
const HATCH_ANGLE = Math.PI / 4; // 45° (kesilen malzeme geleneği)

/**
 * Duvarı **poché gövde + 45° tarama (hatch) + kesit konturu** olarak çizer (VISUAL-CRAFT §1/§3).
 * Gövde, segmentin kalınlık kadar diklemesine genişletilmiş dörtgenidir (cm → gerçek kalınlık).
 * Tarama "kesilen malzeme" hissi verir (en ince hairline). Kontur ekran-sabit (kesit en kalın).
 */
export function drawWall(g: Graphics, wall: Wall, pixelSize: number): void {
  g.clear();
  const quad = wallQuad(wall);
  const flat = quad.flatMap((p) => [p.x, p.y]);

  // 1) Poché gövde dolgusu.
  g.poly(flat).fill({ color: PALETTE.wallBody });

  // 2) 45° tarama (hairline, soluk) — kesilen malzeme.
  for (const seg of hatchLines(quad, HATCH_SPACING, HATCH_ANGLE)) {
    g.moveTo(seg.a.x, seg.a.y).lineTo(seg.b.x, seg.b.y);
  }
  g.stroke({ width: LINEWEIGHTS.hairline * pixelSize, color: PALETTE.wallHatch, alpha: 0.5 });

  // 3) Kesit konturu (en kalın, ekran-sabit).
  g.poly(flat).stroke({ width: LINEWEIGHTS.cut * pixelSize, color: PALETTE.wallEdge, alignment: 0.5 });
}

/** Segment + kalınlıktan dörtgen köşeleri (Vec2 dizisi). */
function wallQuad(w: Wall): Vec2[] {
  const dx = w.end.x - w.start.x;
  const dy = w.end.y - w.start.y;
  const len = Math.hypot(dx, dy) || 1;
  const half = w.thickness / 2;
  const nx = (-dy / len) * half; // birim dik × yarı kalınlık
  const ny = (dx / len) * half;
  return [
    { x: w.start.x + nx, y: w.start.y + ny },
    { x: w.end.x + nx, y: w.end.y + ny },
    { x: w.end.x - nx, y: w.end.y - ny },
    { x: w.start.x - nx, y: w.start.y - ny },
  ];
}
