import type { Vec2 } from './vec2';

/**
 * Konveks kabuk (Andrew monotone chain), CCW. Saf fonksiyon.
 * Koridor/oda genişliği gibi "minimum genişlik" hesapları için gerekir (polygonMinWidth).
 */
export function convexHull(points: readonly Vec2[]): Vec2[] {
  const pts = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  if (pts.length <= 2) return pts;

  const cross = (o: Vec2, a: Vec2, b: Vec2): number =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  const lower: Vec2[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }
  const upper: Vec2[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]!;
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

/**
 * Bir poligonun minimum genişliği (rotating calipers, konveks kabuk üzerinde).
 * Her kabuk kenarı için tüm köşelerin o kenara dik en büyük uzaklığını bulur; bunların
 * minimumu poligonun darboğaz genişliğidir. Dikdörtgen koridorda = kısa kenar.
 *
 * Sınır: konveks kabuk kullanır → L/T şekilli mekanlarda gerçek koridor darlığını değil,
 * kapsayıcı genişliği verir. Tohum (Faz 2) için yeterli; ileride iskelet/medial-axis ile sıkılaşır.
 */
export function polygonMinWidth(points: readonly Vec2[]): number {
  const hull = convexHull(points);
  if (hull.length < 3) return 0;

  let minWidth = Infinity;
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i]!;
    const b = hull[(i + 1) % hull.length]!;
    const ex = b.x - a.x;
    const ey = b.y - a.y;
    const len = Math.hypot(ex, ey);
    if (len < 1e-9) continue;
    let maxDist = 0;
    for (const p of hull) {
      const dist = Math.abs((p.x - a.x) * ey - (p.y - a.y) * ex) / len;
      if (dist > maxDist) maxDist = dist;
    }
    if (maxDist < minWidth) minWidth = maxDist;
  }
  return minWidth === Infinity ? 0 : minWidth;
}
