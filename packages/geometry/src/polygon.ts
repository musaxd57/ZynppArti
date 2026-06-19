import type { Vec2 } from './vec2';

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
