import type { Vec2 } from './vec2';

/**
 * Tarama (hatch) çizgileri — bir poligonun içini dolduran paralel çizgi parçaları (VISUAL-CRAFT §3:
 * malzeme/poché). Saf, yeniden kullanılabilir (duvar poché, ileride malzeme hatch/section).
 * `spacing` ve `angle` dünya birimindedir; çizgiler poligona kırpılır. Konveks olmayan poligonlarda
 * kabaca çalışır (kabuk bazlı değil; basit kenar-kesişim), ince dış bükey/iç bükey kenarlarda taşma olabilir.
 */
export interface HatchSegment {
  readonly a: Vec2;
  readonly b: Vec2;
}

/** Tarama deseni türü: tek yön (paralel) veya çapraz (iki dik yön = ızgara/cross-hatch). */
export type HatchKind = 'single' | 'cross';

/**
 * Malzeme tarama deseni: tek yön veya çapraz. `single` doğrudan `hatchLines`; `cross` ise aynı
 * desene dik ikinci bir set ekler (fayans/ızgara hissi). Saf; malzeme hatch render'ı bunu kullanır.
 */
export function hatchPattern(
  polygon: readonly Vec2[],
  spacing: number,
  angle: number,
  kind: HatchKind = 'single',
): HatchSegment[] {
  const first = hatchLines(polygon, spacing, angle);
  if (kind !== 'cross') return first;
  return [...first, ...hatchLines(polygon, spacing, angle + Math.PI / 2)];
}

export function hatchLines(
  polygon: readonly Vec2[],
  spacing: number,
  angle: number,
): HatchSegment[] {
  if (polygon.length < 3 || !(spacing > 0) || !Number.isFinite(spacing)) return [];
  const d = { x: Math.cos(angle), y: Math.sin(angle) }; // çizgi yönü
  const n = { x: -Math.sin(angle), y: Math.cos(angle) }; // dik (çizgileri ötelediğimiz eksen)

  // Köşeleri n eksenine izdüşür → tarama bandının aralığı.
  let minP = Infinity;
  let maxP = -Infinity;
  for (const p of polygon) {
    const proj = p.x * n.x + p.y * n.y;
    if (proj < minP) minP = proj;
    if (proj > maxP) maxP = proj;
  }

  const out: HatchSegment[] = [];
  for (let s = minP + spacing / 2; s < maxP; s += spacing) {
    const anchor = { x: n.x * s, y: n.y * s };
    const seg = clipLineToPolygon(anchor, d, polygon);
    if (seg) out.push(seg);
  }
  return out;
}

/** Sonsuz `anchor + t·d` doğrusunu poligon kenarlarıyla kesip [tmin,tmax] parçasını döndürür. */
function clipLineToPolygon(anchor: Vec2, d: Vec2, poly: readonly Vec2[]): HatchSegment | null {
  const ts: number[] = [];
  const m = poly.length;
  for (let i = 0; i < m; i++) {
    const p = poly[i]!;
    const q = poly[(i + 1) % m]!;
    const ex = q.x - p.x;
    const ey = q.y - p.y;
    const det = -d.x * ey + ex * d.y;
    if (Math.abs(det) < 1e-9) continue; // doğru ile kenar paralel
    const bx = p.x - anchor.x;
    const by = p.y - anchor.y;
    const t = (-bx * ey + ex * by) / det;
    const u = (d.x * by - d.y * bx) / det;
    if (u >= -1e-9 && u <= 1 + 1e-9) ts.push(t);
  }
  if (ts.length < 2) return null;
  const tmin = Math.min(...ts);
  const tmax = Math.max(...ts);
  if (tmax - tmin < 1e-9) return null;
  return {
    a: { x: anchor.x + d.x * tmin, y: anchor.y + d.y * tmin },
    b: { x: anchor.x + d.x * tmax, y: anchor.y + d.y * tmax },
  };
}
