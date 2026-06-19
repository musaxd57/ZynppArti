import type { Vec2 } from './vec2';

/** `p` noktasının `[a, b]` doğru parçası üzerindeki en yakın noktası. */
export function closestPointOnSegment(p: Vec2, a: Vec2, b: Vec2): Vec2 {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const lenSq = abx * abx + aby * aby;
  if (lenSq === 0) return { x: a.x, y: a.y }; // dejenere (nokta) segment
  let t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return { x: a.x + t * abx, y: a.y + t * aby };
}

/** `p` noktasının `[a, b]` doğru parçasına uzaklığı (hit-test narrow phase). */
export function distanceToSegment(p: Vec2, a: Vec2, b: Vec2): number {
  const c = closestPointOnSegment(p, a, b);
  return Math.hypot(p.x - c.x, p.y - c.y);
}
