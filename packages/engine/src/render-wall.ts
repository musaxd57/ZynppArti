import { Graphics } from 'pixi.js';
import { hatchLines, type Vec2 } from '@zynpparti/geometry';
import type { Wall } from '@zynpparti/document';
import { LINEWEIGHTS, PALETTE } from './lineweights';

const HATCH_SPACING = 9; // cm (dünya) — poché tarama aralığı; fiziksel (zoom'la ölçeklenir)
const HATCH_ANGLE = Math.PI / 4; // 45° (kesilen malzeme geleneği)

/**
 * Duvarın DÜNYA-UZAYLI geometrisi: poligon (flat [x,y,…]) + 45° tarama segmentleri. Bunlar zoom'dan
 * BAĞIMSIZDIR (cm cinsinden), yalnız duvar değişince hesaplanır → her zoom-kare'sinde yeniden
 * hesaplamak israftı (wallQuad + hatchLines tahsisleri). `strokeWall` bunu yalnız yeni kalınlıkla çizer.
 */
export interface WallGeom {
  readonly flat: number[];
  readonly hatch: readonly { a: Vec2; b: Vec2 }[];
}

/** Duvar geometrisini (poligon + tarama) bir kez hesaplar — duvar değişince çağrılır, zoom'da DEĞİL. */
export function buildWall(wall: Wall): WallGeom {
  const quad = wallQuad(wall);
  return { flat: quad.flatMap((p) => [p.x, p.y]), hatch: hatchLines(quad, HATCH_SPACING, HATCH_ANGLE) };
}

/**
 * Önceden hesaplanmış geometriyi **poché gövde + 45° tarama + kesit konturu** olarak çizer
 * (VISUAL-CRAFT §1/§3). Yalnız stroke genişliği `pixelSize`'a (zoom) bağlı → zoom'da geometri math'i yok.
 */
export function strokeWall(g: Graphics, geom: WallGeom, pixelSize: number): void {
  g.clear();
  // 1) Poché gövde dolgusu.
  g.poly(geom.flat).fill({ color: PALETTE.wallBody });
  // 2) 45° tarama (hairline, soluk) — kesilen malzeme.
  for (const seg of geom.hatch) g.moveTo(seg.a.x, seg.a.y).lineTo(seg.b.x, seg.b.y);
  g.stroke({ width: LINEWEIGHTS.hairline * pixelSize, color: PALETTE.wallHatch, alpha: 0.5 });
  // 3) Kesit konturu (en kalın, ekran-sabit).
  g.poly(geom.flat).stroke({ width: LINEWEIGHTS.cut * pixelSize, color: PALETTE.wallEdge, alignment: 0.5 });
}

/**
 * Duvarı tek seferde çizer (build + stroke). Zoom'da tekrar çizilen yerlerde `buildWall`'u BİR KEZ
 * yapıp kapamada `strokeWall` kullan (geometri math'ini her kareye taşıma — EntityLayer böyle yapar).
 */
export function drawWall(g: Graphics, wall: Wall, pixelSize: number): void {
  strokeWall(g, buildWall(wall), pixelSize);
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
