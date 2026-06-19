import type { Vec2 } from '@zynpparti/geometry';
import { distance } from '@zynpparti/geometry';
import type { Wall } from '@zynpparti/document';

/**
 * 2-nokta kalibrasyon ölçek çarpanı: çizimde ölçülen mesafe `realDistance` olmalıysa
 * tüm çizim bu çarpanla ölçeklenir (ADR-0008).
 */
export function computeScaleFactor(p1: Vec2, p2: Vec2, realDistance: number): number {
  const measured = distance(p1, p2);
  if (measured === 0) throw new Error('İki kalibrasyon noktası aynı; ölçek hesaplanamaz.');
  return realDistance / measured;
}

/** Bir noktayı `origin` etrafında `factor` ile ölçekler. */
export function scalePoint(p: Vec2, factor: number, origin: Vec2): Vec2 {
  return {
    x: origin.x + (p.x - origin.x) * factor,
    y: origin.y + (p.y - origin.y) * factor,
  };
}

/** Bir duvarı `origin` etrafında ölçekler (kalınlık dahil). */
export function scaleWall(wall: Wall, factor: number, origin: Vec2): Wall {
  return {
    ...wall,
    start: scalePoint(wall.start, factor, origin),
    end: scalePoint(wall.end, factor, origin),
    thickness: wall.thickness * factor,
  };
}
