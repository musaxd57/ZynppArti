import type { Vec2 } from '@zynpparti/geometry';
import type { Opening, Wall } from './entities';

/**
 * Boşluk (kapı/pencere) geometrisi — saf fonksiyonlar (UI yok). Boşluk duvara parametriktir
 * (`t`), gerçek konum duvardan türetilir → duvar değişince boşluk uyumlu kalır (binding).
 */

export interface OpeningFrame {
  /** Boşluğun orta-çizgi üzerindeki merkezi. */
  readonly center: Vec2;
  /** Duvar yönü (birim). */
  readonly dir: Vec2;
  /** Duvara dik birim vektör. */
  readonly normal: Vec2;
  /** Boşluk kenarları (jamb) — orta-çizgi üzerinde. */
  readonly a: Vec2;
  readonly b: Vec2;
  readonly thickness: number;
}

/** Boşluğun duvardan türetilmiş çerçevesini hesaplar. */
export function openingFrame(o: Opening, wall: Wall): OpeningFrame {
  const sx = wall.end.x - wall.start.x;
  const sy = wall.end.y - wall.start.y;
  const len = Math.hypot(sx, sy) || 1;
  const dx = sx / len;
  const dy = sy / len;
  const cx = wall.start.x + sx * o.t;
  const cy = wall.start.y + sy * o.t;
  const half = o.width / 2;
  return {
    center: { x: cx, y: cy },
    dir: { x: dx, y: dy },
    normal: { x: -dy, y: dx },
    a: { x: cx - dx * half, y: cy - dy * half },
    b: { x: cx + dx * half, y: cy + dy * half },
    thickness: wall.thickness,
  };
}

/** Bir noktayı duvar orta-çizgisine izdüşürür → konum oranı `t∈[0,1]` + uzaklık (cm). */
export function projectToWall(p: Vec2, wall: Wall): { t: number; dist: number } {
  const sx = wall.end.x - wall.start.x;
  const sy = wall.end.y - wall.start.y;
  const len2 = sx * sx + sy * sy || 1;
  let t = ((p.x - wall.start.x) * sx + (p.y - wall.start.y) * sy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = wall.start.x + sx * t;
  const cy = wall.start.y + sy * t;
  return { t, dist: Math.hypot(p.x - cx, p.y - cy) };
}
