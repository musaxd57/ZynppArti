import type { Vec2 } from './vec2';

/** `p` noktasının `[a, b]` doğru parçası üzerindeki en yakın noktası. */
export function closestPointOnSegment(p: Vec2, a: Vec2, b: Vec2): Vec2 {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const lenSq = abx * abx + aby * aby;
  if (lenSq < 1e-12) return { x: a.x, y: a.y }; // dejenere/sıfıra-yakın (nokta) segment → sıfıra-bölme yok
  let t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return { x: a.x + t * abx, y: a.y + t * aby };
}

/** `p` noktasının `[a, b]` doğru parçasına uzaklığı (hit-test narrow phase). */
export function distanceToSegment(p: Vec2, a: Vec2, b: Vec2): number {
  const c = closestPointOnSegment(p, a, b);
  return Math.hypot(p.x - c.x, p.y - c.y);
}

/**
 * İki doğru parçasının ([p1,p2] ve [p3,p4]) kesişim noktası; kesişmiyorlarsa (veya paralel/
 * eş-doğrusal) `null`. Yalnız **gerçek** parça kesişimi döner (sonsuz doğru değil) → snapping'de
 * iki duvarın görünür çaprazını yakalamak için. Epsilon ile paralellik korunur.
 */
export function segmentIntersection(p1: Vec2, p2: Vec2, p3: Vec2, p4: Vec2): Vec2 | null {
  const d1x = p2.x - p1.x;
  const d1y = p2.y - p1.y;
  const d2x = p4.x - p3.x;
  const d2y = p4.y - p3.y;
  const denom = d1x * d2y - d1y * d2x;
  if (Math.abs(denom) < 1e-9) return null; // paralel / eş-doğrusal
  const t = ((p3.x - p1.x) * d2y - (p3.y - p1.y) * d2x) / denom;
  const u = ((p3.x - p1.x) * d1y - (p3.y - p1.y) * d1x) / denom;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null; // parça sınırları dışında
  return { x: p1.x + t * d1x, y: p1.y + t * d1y };
}
