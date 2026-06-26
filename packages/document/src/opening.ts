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

/**
 * Boşluğun duvara SIĞMASI için `t`'yi kısar. Boşluk merkezli (genişlik `width`) olduğundan, duvar
 * ucundan taşmaması için t ∈ [yarı, 1−yarı] olmalı (yarı = (width/2)/wallLen). Genişlik duvardan
 * büyükse hiç sığmaz → `null` (yerleştirme reddedilir). Saf; tool yerleştirmede, frame render'da kullanır.
 */
export function fitOpeningT(wallLen: number, width: number, t: number): number | null {
  if (!(wallLen > 0) || !Number.isFinite(width) || width > wallLen) return null;
  const half = width / 2 / wallLen;
  const tt = Number.isFinite(t) ? t : 0.5;
  return Math.max(half, Math.min(1 - half, tt));
}

/** Boşluğun duvardan türetilmiş çerçevesini hesaplar. */
export function openingFrame(o: Opening, wall: Wall): OpeningFrame {
  const sx = wall.end.x - wall.start.x;
  const sy = wall.end.y - wall.start.y;
  const len = Math.hypot(sx, sy) || 1;
  const dx = sx / len;
  const dy = sy / len;
  // t kısma: boşluk duvar dışına taşmasın (sığmazsa ortala — render best-effort).
  // (Bozuk/elle düzenlenmiş modelde de savunma; serialize derin doğrulama yapmaz.)
  const t = fitOpeningT(len, o.width, o.t) ?? 0.5;
  const cx = wall.start.x + sx * t;
  const cy = wall.start.y + sy * t;
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
