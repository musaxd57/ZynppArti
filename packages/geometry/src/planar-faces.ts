import type { Vec2 } from './vec2';
import { polygonArea } from './polygon';

export interface Segment {
  a: Vec2;
  b: Vec2;
}

/**
 * Duvar segmentlerinden kapalı bölgeleri (oda poligonlarını) bulur — planar graf yüz-bulma,
 * YAPAY ZEKA DEĞİL (ENGINEERING-NOTES §1). Adımlar:
 *  1. Uçları toleransla yapıştır (snap).
 *  2. Kesişimlerden böl (X-çaprazları ve T-bağlantıları).
 *  3. Düzlemsel graf kur; her düğümde kenarları açıya göre sırala.
 *  4. Half-edge dolaşımıyla minimal döngüleri (yüzleri) çıkar.
 *  5. En büyük alanlı yüz = dış sınır → atılır; kalan iç yüzler = odalar.
 *
 * Dönen poligonlar CCW (pozitif alan) yönünde, son köşe tekrar edilmeden verilir.
 * `snapTol` ve `minArea` cm/cm² cinsindendir (iç birim, ADR-0008).
 */
export function findFaces(segments: readonly Segment[], snapTol = 1, minArea = 1): Vec2[][] {
  const verts: Vec2[] = [];
  // Hücre → o hücredeki düğüm id'leri. Saf ızgara-eşitliği (tek id/hücre) snapTol İÇİNDE ama hücre
  // sınırını çapraz aşan iki ucu birleştirmiyordu (köşe kapanmaz, oda sessizce kaybolur — denetim).
  // Bu yüzden ev + 8 komşu hücrede GERÇEK mesafeyle (≤ snapTol) en yakın mevcut düğümü ara.
  const vkey = new Map<string, number[]>();
  const q = (n: number): number => Math.round(n / snapTol);
  const tol2 = snapTol * snapTol;
  const vid = (p: Vec2): number => {
    const cx = q(p.x);
    const cy = q(p.y);
    let best = -1;
    let bestD = tol2;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const ids = vkey.get(`${cx + dx},${cy + dy}`);
        if (!ids) continue;
        for (const id of ids) {
          const v = verts[id]!;
          const d = (v.x - p.x) * (v.x - p.x) + (v.y - p.y) * (v.y - p.y);
          if (d <= bestD) {
            bestD = d;
            best = id;
          }
        }
      }
    }
    if (best >= 0) return best;
    const id = verts.length;
    verts.push({ x: p.x, y: p.y });
    const key = `${cx},${cy}`;
    const arr = vkey.get(key);
    if (arr) arr.push(id);
    else vkey.set(key, [id]);
    return id;
  };

  // 1. Segment uçlarını düğümlere bağla (sıfır uzunlukluları at).
  const segs = segments
    .map((s) => ({ a: vid(s.a), b: vid(s.b) }))
    .filter((s) => s.a !== s.b);

  // Her segment için sınırlayıcı kutu (AABB) — pahalı testlerden önce ucuz eleme için (perf).
  const bx0: number[] = [];
  const bx1: number[] = [];
  const by0: number[] = [];
  const by1: number[] = [];
  for (const s of segs) {
    const a = verts[s.a]!;
    const b = verts[s.b]!;
    bx0.push(Math.min(a.x, b.x));
    bx1.push(Math.max(a.x, b.x));
    by0.push(Math.min(a.y, b.y));
    by1.push(Math.max(a.y, b.y));
  }

  // 2a. Proper (iç) kesişim noktalarını düğüm olarak ekle. AABB ön-eleme: kutuları kesişmeyen
  // çiftler asla kesişemez → pahalı properIntersection çağrısını atla (büyük planda ~birkaç kat hız).
  for (let i = 0; i < segs.length; i++) {
    for (let j = i + 1; j < segs.length; j++) {
      if (bx0[j]! > bx1[i]! || bx1[j]! < bx0[i]! || by0[j]! > by1[i]! || by1[j]! < by0[i]!) continue;
      const p = properIntersection(
        verts[segs[i]!.a]!,
        verts[segs[i]!.b]!,
        verts[segs[j]!.a]!,
        verts[segs[j]!.b]!,
      );
      if (p) vid(p);
    }
  }

  // 2b. Her segmenti, üzerinde duran tüm düğümlerden böl → tekil kenarlar.
  const edgeSet = new Set<string>();
  const edges: [number, number][] = [];
  const addEdge = (u: number, v: number): void => {
    if (u === v) return;
    const k = u < v ? `${u}-${v}` : `${v}-${u}`;
    if (!edgeSet.has(k)) {
      edgeSet.add(k);
      edges.push([u, v]);
    }
  };
  for (let si = 0; si < segs.length; si++) {
    const s = segs[si]!;
    const A = verts[s.a]!;
    const B = verts[s.b]!;
    // AABB ön-eleme (snapTol payıyla): kutu dışındaki düğüm bu segment üzerinde olamaz → paramOnSegment'i atla.
    const minx = bx0[si]! - snapTol;
    const maxx = bx1[si]! + snapTol;
    const miny = by0[si]! - snapTol;
    const maxy = by1[si]! + snapTol;
    const on: { id: number; t: number }[] = [];
    for (let k = 0; k < verts.length; k++) {
      const vk = verts[k]!;
      if (vk.x < minx || vk.x > maxx || vk.y < miny || vk.y > maxy) continue;
      const t = paramOnSegment(vk, A, B, snapTol);
      if (t !== null) on.push({ id: k, t });
    }
    on.sort((p, r) => p.t - r.t);
    for (let k = 0; k + 1 < on.length; k++) addEdge(on[k]!.id, on[k + 1]!.id);
  }

  // 3. Komşuluk (her düğümde kenarlar açıya göre sıralı).
  const adj = new Map<number, { to: number; ang: number }[]>();
  const push = (u: number, to: number): void => {
    const ang = Math.atan2(verts[to]!.y - verts[u]!.y, verts[to]!.x - verts[u]!.x);
    const list = adj.get(u);
    if (list) list.push({ to, ang });
    else adj.set(u, [{ to, ang }]);
  };
  for (const [u, v] of edges) {
    push(u, v);
    push(v, u);
  }
  for (const list of adj.values()) list.sort((a, b) => a.ang - b.ang);

  // 3b. Bağlı bileşenler (union-find). Kopuk iç döngüler (ör. bir mahalin İÇİNDE serbest duran
  // kapalı kolon/çekirdek halkası) ayrı bir bileşendir; her bileşenin KENDİ dış sınırı vardır.
  // Tek global "en büyük yüz = dış sınır" varsayımı yalnız bir bileşeni atar → diğer bileşenlerin
  // dış halkaları hayalet (çift) mahal olarak kalırdı. Bileşen başına dış sınırı atmak bunu çözer.
  const parent = Array.from({ length: verts.length }, (_, i) => i);
  const find = (x: number): number => {
    let r = x;
    while (parent[r] !== r) r = parent[r]!;
    while (parent[x] !== r) {
      const next = parent[x]!;
      parent[x] = r;
      x = next;
    }
    return r;
  };
  for (const [u, v] of edges) parent[find(u)] = find(v);

  // 4. Half-edge dolaşımı → yüzler.
  const visited = new Set<string>();
  const rings: Vec2[][] = [];
  const ringComp: number[] = []; // her ring'in bağlı bileşeni (dış-sınır atımı bileşen başına)
  const nextHalf = (u: number, v: number): [number, number] => {
    const list = adj.get(v)!;
    const idx = list.findIndex((e) => e.to === u); // ters kenar v->u
    const nIdx = (idx - 1 + list.length) % list.length; // saat yönünde bir sonraki
    return [v, list[nIdx]!.to];
  };
  const startHalves: [number, number][] = [];
  for (const [a, b] of edges) {
    startHalves.push([a, b], [b, a]);
  }
  for (const [u0, v0] of startHalves) {
    if (visited.has(`${u0}->${v0}`)) continue;
    const ring: number[] = [];
    let u = u0;
    let v = v0;
    let guard = 0;
    do {
      visited.add(`${u}->${v}`);
      ring.push(u);
      [u, v] = nextHalf(u, v);
      if (++guard > edges.length * 4 + 8) break; // güvenlik
    } while (!(u === u0 && v === v0));
    if (ring.length >= 3) {
      ringComp.push(find(ring[0]!));
      rings.push(ring.map((i) => verts[i]!));
    }
  }

  // 5. Her bağlı bileşenin dış sınırını (o bileşendeki en büyük |alan|) at; kalanları minArea ile
  // süz, CCW'ye normalize et. (Tek bileşenli — yaygın — planda bu, eski "tek en-büyüğü at" ile birebir aynı.)
  const faces = rings
    .map((poly, idx) => ({ poly, comp: ringComp[idx]!, area: polygonArea(poly), signed: signedArea(poly) }))
    .filter((f) => f.area >= minArea);
  if (faces.length === 0) return [];
  const outerByComp = new Map<number, number>(); // bileşen → o bileşendeki en büyük alanlı yüz indeksi
  faces.forEach((f, i) => {
    const cur = outerByComp.get(f.comp);
    if (cur === undefined || f.area > faces[cur]!.area) outerByComp.set(f.comp, i);
  });
  const outers = new Set(outerByComp.values());

  return faces
    .filter((_, i) => !outers.has(i))
    .map((f) => (f.signed < 0 ? [...f.poly].reverse() : f.poly));
}

function signedArea(poly: readonly Vec2[]): number {
  let s = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!;
    const b = poly[(i + 1) % poly.length]!;
    s += a.x * b.y - b.x * a.y;
  }
  return s / 2;
}

/** `p`, `[a,b]` üzerinde mi? Üzerindeyse parametre t∈[0,1], değilse null. */
function paramOnSegment(p: Vec2, a: Vec2, b: Vec2, tol: number): number | null {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const len2 = abx * abx + aby * aby;
  if (len2 === 0) return null;
  const t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / len2;
  if (t < -1e-9 || t > 1 + 1e-9) return null;
  const dx = p.x - (a.x + t * abx);
  const dy = p.y - (a.y + t * aby);
  if (Math.hypot(dx, dy) > tol) return null;
  return Math.max(0, Math.min(1, t));
}

/** İki segmentin yalnız İÇ (proper) kesişimi; uçlarda değme sayılmaz. */
function properIntersection(p1: Vec2, p2: Vec2, p3: Vec2, p4: Vec2): Vec2 | null {
  const rx = p2.x - p1.x;
  const ry = p2.y - p1.y;
  const sx = p4.x - p3.x;
  const sy = p4.y - p3.y;
  const denom = rx * sy - ry * sx;
  if (Math.abs(denom) < 1e-12) return null; // paralel / çakışık
  const qpx = p3.x - p1.x;
  const qpy = p3.y - p1.y;
  const t = (qpx * sy - qpy * sx) / denom;
  const u = (qpx * ry - qpy * rx) / denom;
  const e = 1e-9;
  if (t > e && t < 1 - e && u > e && u < 1 - e) {
    const x = p1.x + t * rx;
    const y = p1.y + t * ry;
    // Dejenere/taşkın girdi NaN/Infinity üretebilir → bozuk kesişimi yut (yüz-bulmayı kilitlemesin).
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return { x, y };
  }
  return null;
}
