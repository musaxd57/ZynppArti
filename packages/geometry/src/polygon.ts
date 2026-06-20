import type { Vec2 } from './vec2';
import { distanceToSegment } from './segment';

/**
 * Bir poligonun alanı (Shoelace / Gauss formülü). İşaretsiz (pozitif) değer döner,
 * yani sarım yönünden (CW/CCW) bağımsızdır. 3'ten az köşe → 0.
 *
 * İleride mahal m² hesabının temeli budur (CLAUDE.md §8.5).
 */
export function polygonArea(points: readonly Vec2[]): number {
  const n = points.length;
  if (n < 3) return 0;

  let sum = 0;
  for (let i = 0; i < n; i++) {
    const a = points[i]!;
    const b = points[(i + 1) % n]!;
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

/**
 * Bir noktanın poligon SINIRINA (kenarlarına) en kısa uzaklığı. Nokta içeride de olsa kenara
 * olan mesafeyi verir (çekme/setback hesabı için: yapının parsel sınırına uzaklığı). 2'den az köşe → Infinity.
 */
export function distanceToPolygonBoundary(p: Vec2, polygon: readonly Vec2[]): number {
  const n = polygon.length;
  if (n < 2) return Infinity;
  let min = Infinity;
  for (let i = 0; i < n; i++) {
    const a = polygon[i]!;
    const b = polygon[(i + 1) % n]!;
    const d = distanceToSegment(p, a, b);
    if (d < min) min = d;
  }
  return min;
}
