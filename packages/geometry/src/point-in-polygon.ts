import type { Vec2 } from './vec2';

/**
 * Ray-casting ile nokta-poligon içi testi. `ring` kapalı bir poligonun köşeleridir
 * (ilk = son köşeyi tekrar etmeye gerek yok). Tam kenar üstü davranışı tanımsızdır (epsilon işi).
 */
export function pointInPolygon(p: Vec2, ring: readonly Vec2[]): boolean {
  let inside = false;
  const n = ring.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const vi = ring[i]!;
    const vj = ring[j]!;
    const intersect =
      vi.y > p.y !== vj.y > p.y &&
      p.x < ((vj.x - vi.x) * (p.y - vi.y)) / (vj.y - vi.y) + vi.x;
    if (intersect) inside = !inside;
  }
  return inside;
}
