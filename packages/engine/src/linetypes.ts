import type { Graphics, StrokeStyle } from 'pixi.js';
import type { Vec2 } from '@zynpparti/geometry';

/**
 * Çizgi tipleri (VISUAL-CRAFT §2): sürekli/kesik/noktalı/zincir. Kalınlık kadar TİP de anlam taşır
 * (kesik = gizli, zincir = kesit düzlemi). PixiJS'te yerleşik dash yok → desen geometrisini elle
 * üretiriz. Desen uzunlukları **ekran px**'tir (pixelSize ile dünya birimine çevrilir; her zoom'da
 * aynı görünür). İleride GPU shader'a taşınabilir (CLAUDE.md §8.1).
 */

/** Desen: dolu/boş uzunluk dizisi (ekran px). Örn. kesik = [6,4]; nokta = [1,3]; zincir = [12,4,2,4]. */
export type DashPattern = readonly number[];

export const DASH: DashPattern = [6, 4];
export const DOT: DashPattern = [1, 3];
/** Zincir (dash-dot) — kesit düzlemi çizgisi için. */
export const CHAIN: DashPattern = [12, 4, 2, 4];

/** Bir doğru parçasını desenli olarak `g`'ye ekler (stroke çağrılmaz — toplu stroke için path kurar). */
export function dashSegment(
  g: Graphics,
  a: Vec2,
  b: Vec2,
  pattern: DashPattern,
  pixelSize: number,
): void {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6 || pattern.length === 0) return;
  const ux = dx / len;
  const uy = dy / len;

  // PERF GÜVENLİĞİ: yoğun zoom-in'de pixelSize→0 → desen adımı dünya-uzayında küçülür ve uzun bir
  // kenar binlerce alt-piksel dash üretir (kare başına binlerce moveTo/lineTo → takılma). Desen tekrarı
  // bir sınırı aşarsa dash'ler zaten alt-piksel/görsel olarak dolu demektir → tek katı çizgiye düş.
  const MAX_REPEATS = 1000;
  const patternWorld = pattern.reduce((s, v) => s + (v > 0 ? v : 0), 0) * pixelSize;
  if (patternWorld <= 0 || len / patternWorld > MAX_REPEATS) {
    g.moveTo(a.x, a.y).lineTo(b.x, b.y);
    return;
  }

  let dist = 0;
  let i = 0;
  let on = true; // desen dolu ile başlar
  while (dist < len) {
    const seg = pattern[i % pattern.length]! * pixelSize;
    if (seg <= 0) {
      i++;
      on = !on;
      continue;
    }
    const end = Math.min(dist + seg, len);
    if (on) {
      g.moveTo(a.x + ux * dist, a.y + uy * dist).lineTo(a.x + ux * end, a.y + uy * end);
    }
    dist = end;
    i++;
    on = !on;
  }
}

/** Bir doğru parçasını desenli çizer + verilen stroke ile boyar (tek çağrı kolaylığı). */
export function strokeDashedLine(
  g: Graphics,
  a: Vec2,
  b: Vec2,
  pattern: DashPattern,
  stroke: StrokeStyle,
  pixelSize: number,
): void {
  dashSegment(g, a, b, pattern, pixelSize);
  g.stroke(stroke);
}
