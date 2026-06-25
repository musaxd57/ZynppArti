import { polygonCentroid, type Vec2 } from '@zynpparti/geometry';
import {
  blockCorners,
  dimensionGeometry,
  formatLength,
  openingFrame,
  roomTypeColor,
  solidBands,
  toHexColor,
  type Entity,
  type EntityId,
  type Section,
  type Wall,
} from '@zynpparti/document';

/**
 * Çizimi vektör SVG'ye dışa aktarır (baskı / Illustrator / web için). Koordinatlar cm (iç birim);
 * SVG ekran gibi y-aşağı olduğundan tuvaldeki yerleşim korunur. viewBox tüm entity'leri çevreler.
 *
 * Çizim sırası katman hissini kurar: mahal dolgusu → parsel → duvar → boşluk (beyaz kesim) →
 * blok → ölçü → metin. Saf TS (yalnız document'e bağımlı; engine/DOM yok).
 */
export function exportSvg(
  entities: readonly Entity[],
  /**
   * Opsiyonel görünüm bölgesi (model cm). Verilirse viewBox bu olur (kırpma) — çok-sayfa PDF'de her
   * paftanın kendi dikdörtgenini ayrı sayfaya basmak için. Verilmezse tüm entity'leri çevreler (eski).
   */
  region?: { minX: number; minY: number; w: number; h: number },
): string {
  const walls = new Map<EntityId, Wall>();
  for (const e of entities) if (e.type === 'wall') walls.set(e.id, e);

  let minX: number;
  let minY: number;
  let w: number;
  let h: number;
  if (region) {
    ({ minX, minY, w, h } = region);
  } else {
    const bounds = computeBounds(entities, walls);
    if (!bounds) {
      return '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"></svg>\n';
    }
    const margin = 50;
    minX = bounds.minX - margin;
    minY = bounds.minY - margin;
    w = bounds.maxX - bounds.minX + margin * 2;
    h = bounds.maxY - bounds.minY + margin * 2;
  }
  if (!(w > 0 && h > 0)) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"></svg>\n';
  }

  const body: string[] = [];
  // mahal dolgusu + ad
  for (const e of entities) {
    if (e.type !== 'space' || e.boundary.length < 3) continue;
    const fill = toHexColor(roomTypeColor(e.roomType ?? 'other'));
    body.push(`<polygon points="${pts(e.boundary)}" fill="${fill}" fill-opacity="0.16" />`);
    const c = polygonCentroid(e.boundary);
    if (e.name) body.push(label(c, e.name, 24, 'middle'));
  }
  // parsel (kesik mülk sınırı)
  for (const e of entities) {
    if (e.type !== 'parcel' || e.boundary.length < 2) continue;
    body.push(
      `<polygon points="${pts(e.boundary)}" fill="none" stroke="#888" stroke-width="2" stroke-dasharray="24 8 4 8" />`,
    );
  }
  // duvar (kalınlık = stroke)
  for (const e of entities) {
    if (e.type !== 'wall') continue;
    body.push(
      `<line x1="${num(e.start.x)}" y1="${num(e.start.y)}" x2="${num(e.end.x)}" y2="${num(e.end.y)}" stroke="#1a1a1a" stroke-width="${num(e.thickness)}" stroke-linecap="square" />`,
    );
  }
  // boşluk (duvarı beyazla kes + kanat/cam işareti)
  for (const e of entities) {
    if (e.type !== 'opening') continue;
    const wall = walls.get(e.wallId);
    if (!wall) continue;
    const f = openingFrame(e, wall);
    body.push(
      `<line x1="${num(f.a.x)}" y1="${num(f.a.y)}" x2="${num(f.b.x)}" y2="${num(f.b.y)}" stroke="#ffffff" stroke-width="${num(wall.thickness + 1)}" stroke-linecap="butt" />`,
    );
    body.push(
      `<line x1="${num(f.a.x)}" y1="${num(f.a.y)}" x2="${num(f.b.x)}" y2="${num(f.b.y)}" stroke="#1a1a1a" stroke-width="1" stroke-dasharray="${e.kind === 'window' ? '0' : '6 4'}" />`,
    );
  }
  // blok (ayak izi + etiket)
  for (const e of entities) {
    if (e.type !== 'block') continue;
    const corners = blockCorners(e);
    body.push(`<polygon points="${pts(corners)}" fill="none" stroke="#444" stroke-width="1.5" />`);
  }
  // ölçü (çizgiler + değer)
  for (const e of entities) {
    if (e.type !== 'dimension') continue;
    const g = dimensionGeometry(e);
    body.push(seg(g.da, g.db, '#c0392b', 1.5));
    body.push(seg(g.a, g.da, '#c0392b', 0.75));
    body.push(seg(g.b, g.db, '#c0392b', 0.75));
    body.push(label(g.mid, formatLength(g.length), 20, 'middle', '#c0392b'));
  }
  // serbest metin
  for (const e of entities) {
    if (e.type !== 'annotation') continue;
    e.text.split('\n').forEach((ln, i) => {
      body.push(label({ x: e.position.x, y: e.position.y + (i + 0.8) * e.height }, ln, e.height, 'start'));
    });
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${num(minX)} ${num(minY)} ${num(w)} ${num(h)}" ` +
    `width="${num(w)}" height="${num(h)}">\n` +
    `<rect x="${num(minX)}" y="${num(minY)}" width="${num(w)}" height="${num(h)}" fill="#ffffff" />\n` +
    body.join('\n') +
    `\n</svg>\n`
  );
}

/**
 * Şematik kesiti vektör SVG'ye aktarır (ADR-0016/0037). Kesilen duvarlar kat tabanından
 * yüksekliğine kadar dikdörtgen; altta zemin çizgisi. cm birimi (1 birim = 1 cm), y-aşağı.
 */
export function exportSectionSvg(section: Section): string {
  const { lengthCm, maxHeightCm, cuts } = section;
  const margin = 50;
  if (cuts.length === 0 || lengthCm <= 0) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"></svg>\n';
  }
  const W = lengthCm + margin * 2;
  const H = maxHeightCm + margin * 2;
  const floorY = margin + maxHeightCm;
  const body: string[] = [];
  body.push(
    `<line x1="${num(margin)}" y1="${num(floorY)}" x2="${num(margin + lengthCm)}" y2="${num(floorY)}" stroke="#1a1a1a" stroke-width="2" />`,
  );
  for (const c of cuts) {
    const x = margin + c.offsetCm - c.widthCm / 2;
    // Dolu bantlar (kapı/pencere boşluğu açıklık olarak çıkarılır).
    for (const band of solidBands(c)) {
      body.push(
        `<rect x="${num(x)}" y="${num(floorY - band.to)}" width="${num(c.widthCm)}" height="${num(band.to - band.from)}" fill="#cfcfd6" stroke="#1a1a1a" stroke-width="1" />`,
      );
    }
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${num(W)} ${num(H)}" width="${num(W)}" height="${num(H)}">\n` +
    `<rect x="0" y="0" width="${num(W)}" height="${num(H)}" fill="#ffffff" />\n` +
    body.join('\n') +
    `\n</svg>\n`
  );
}

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function computeBounds(entities: readonly Entity[], walls: Map<EntityId, Wall>): Bounds | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const add = (p: Vec2): void => {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return; // NaN/Infinity nokta bounds'u bozmasın
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  };
  for (const e of entities) {
    switch (e.type) {
      case 'wall': {
        const t = e.thickness / 2;
        add({ x: e.start.x - t, y: e.start.y - t });
        add({ x: e.start.x + t, y: e.start.y + t });
        add({ x: e.end.x - t, y: e.end.y - t });
        add({ x: e.end.x + t, y: e.end.y + t });
        break;
      }
      case 'space':
      case 'parcel':
        for (const p of e.boundary) add(p);
        break;
      case 'block':
        for (const p of blockCorners(e)) add(p);
        break;
      case 'dimension': {
        const g = dimensionGeometry(e);
        add(g.a);
        add(g.b);
        add(g.da);
        add(g.db);
        break;
      }
      case 'opening': {
        const wall = walls.get(e.wallId);
        if (wall) {
          const f = openingFrame(e, wall);
          add(f.a);
          add(f.b);
        }
        break;
      }
      case 'annotation': {
        const lines = e.text.split('\n');
        const wEst = Math.max(1, ...lines.map((l) => l.length)) * e.height * 0.6;
        add(e.position);
        add({ x: e.position.x + wEst, y: e.position.y + lines.length * e.height * 1.2 });
        break;
      }
      case 'sheet':
        break;
    }
  }
  if (![minX, minY, maxX, maxY].every(Number.isFinite)) return null;
  return { minX, minY, maxX, maxY };
}

function pts(poly: readonly Vec2[]): string {
  return poly.map((p) => `${num(p.x)},${num(p.y)}`).join(' ');
}

function seg(a: Vec2, b: Vec2, color: string, width: number): string {
  return `<line x1="${num(a.x)}" y1="${num(a.y)}" x2="${num(b.x)}" y2="${num(b.y)}" stroke="${color}" stroke-width="${width}" />`;
}

function label(p: Vec2, value: string, size: number, anchor: 'start' | 'middle', color = '#1a1a1a'): string {
  return `<text x="${num(p.x)}" y="${num(p.y)}" font-family="sans-serif" font-size="${num(size)}" fill="${color}" text-anchor="${anchor}">${esc(value)}</text>`;
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function num(n: number): string {
  // Bozuk koordinat (NaN/Infinity) SVG'yi geçersiz kılmasın → 0.
  return Number.isFinite(n) ? Number(n.toFixed(2)).toString() : '0';
}
