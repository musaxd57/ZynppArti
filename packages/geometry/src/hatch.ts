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
    clipLineToPolygon(anchor, d, n, s, polygon, out);
  }
  return out;
}

/**
 * `anchor + t·d` tarama doğrusunu (n ekseninde s ofsetli) poligon kenarlarıyla kesip İÇERİDE kalan
 * parçaları `out`'a ekler. KONKAV doğruluk: bir kenarın doğruyu kesip kesmediği KÖŞE-İZDÜŞÜMÜ
 * yarı-açık kuralıyla belirlenir — (p·n ≤ s) ≠ (q·n ≤ s). Bu, kenarın AÇI parametresine (u) bakan
 * eski kuralın aksine, bir kenar-ortak köşe taramaya tam denk geldiğinde pariteyi korur (köşe ya 0
 * ya 2 sayılır; tepe/çentik köşesinde fill/empty ters dönmez). t'ler sıralanıp ardışık ÇİFTLER iç
 * aralık olur. (Önceki u-tabanlı kural reflex köşeye denk gelen taramada bandı yanlış dolduruyordu.)
 */
function clipLineToPolygon(
  anchor: Vec2,
  d: Vec2,
  n: Vec2,
  s: number,
  poly: readonly Vec2[],
  out: HatchSegment[],
): void {
  const ts: number[] = [];
  const m = poly.length;
  for (let i = 0; i < m; i++) {
    const p = poly[i]!;
    const q = poly[(i + 1) % m]!;
    const pProj = p.x * n.x + p.y * n.y;
    const qProj = q.x * n.x + q.y * n.y;
    // Kenar, tarama doğrusunu (n·x = s) keser mi? Yarı-açık (≤ s) → ortak köşe tutarlı sayılır.
    if ((pProj <= s) === (qProj <= s)) continue;
    // Kesişim noktası: kenar boyunca f oranı, sonra ray parametresi t = (nokta − anchor)·d.
    const f = (s - pProj) / (qProj - pProj);
    const ix = p.x + f * (q.x - p.x);
    const iy = p.y + f * (q.y - p.y);
    ts.push((ix - anchor.x) * d.x + (iy - anchor.y) * d.y);
  }
  if (ts.length < 2) return;
  ts.sort((a, b) => a - b);
  // Ardışık çiftler = poligon içindeki dolu aralıklar (parite kuralı).
  for (let k = 0; k + 1 < ts.length; k += 2) {
    const tmin = ts[k]!;
    const tmax = ts[k + 1]!;
    if (tmax - tmin < 1e-9) continue;
    out.push({
      a: { x: anchor.x + d.x * tmin, y: anchor.y + d.y * tmin },
      b: { x: anchor.x + d.x * tmax, y: anchor.y + d.y * tmax },
    });
  }
}
