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
 * Bir poligonun alan-ağırlıklı ağırlık merkezi (centroid). Köşe ortalamasından daha iyi bir
 * "iç nokta" verir (özellikle düzgün olmayan/L şekilli mahallerde etiket yerleşimi için).
 * Dejenere (alan ~0) veya 3'ten az köşede köşe ortalamasına düşer.
 *
 * Not: konkav (ör. U) poligonlarda alan-merkezi yine de dışarı düşebilir; tam "görsel merkez"
 * (pole of inaccessibility) gerekirse ileride eklenir. Bu, ortalamadan belirgin iyileştirmedir.
 */
export function polygonCentroid(points: readonly Vec2[]): Vec2 {
  const n = points.length;
  if (n === 0) return { x: 0, y: 0 };
  if (n < 3) return vertexAverage(points);

  let area2 = 0; // 2× işaretli alan
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < n; i++) {
    const a = points[i]!;
    const b = points[(i + 1) % n]!;
    const cross = a.x * b.y - b.x * a.y;
    area2 += cross;
    cx += (a.x + b.x) * cross;
    cy += (a.y + b.y) * cross;
  }
  if (Math.abs(area2) < 1e-9) return vertexAverage(points);
  return { x: cx / (3 * area2), y: cy / (3 * area2) };
}

function vertexAverage(points: readonly Vec2[]): Vec2 {
  let x = 0;
  let y = 0;
  for (const p of points) {
    x += p.x;
    y += p.y;
  }
  const n = points.length || 1;
  return { x: x / n, y: y / n };
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
