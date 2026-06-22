import { polygonCentroid, type Vec2 } from '@zynpparti/geometry';
import {
  blockCorners,
  dimensionGeometry,
  formatLength,
  openingFrame,
  type Entity,
  type EntityId,
  type Wall,
} from '@zynpparti/document';

/**
 * Çizimi minimal (R12 tarzı) DXF metnine dışa aktarır. Duvar/ölçü → LINE, parsel/blok → kapalı
 * LWPOLYLINE, metin → TEXT, boşluk (kapı/pencere) → duvar üzerinde işaret LINE'ı. Katman adı
 * korunur; koordinatlar cm cinsindendir (iç birim, ADR-0008) ve kendi içe-aktarıcımızla yuvarlanır.
 *
 * Geriye uyumlu: `readonly Wall[]` da `readonly Entity[]` olarak geçerlidir.
 */
export function exportDxf(entities: readonly Entity[]): string {
  const out: string[] = ['0', 'SECTION', '2', 'ENTITIES'];

  // Boşlukları konumlandırmak için duvar haritası (binding çözümü).
  const walls = new Map<EntityId, Wall>();
  for (const e of entities) if (e.type === 'wall') walls.set(e.id, e);

  for (const e of entities) {
    switch (e.type) {
      case 'wall':
        line(out, e.layerId, e.start, e.end);
        break;
      case 'parcel':
        polyline(out, e.layerId, e.boundary, true);
        break;
      case 'block':
        polyline(out, e.layerId, blockCorners(e), true);
        break;
      case 'annotation': {
        // TEXT tek satır → çok satırlıyı satır satır aşağı dök.
        const lines = e.text.split('\n');
        lines.forEach((ln, i) => {
          text(out, e.layerId, { x: e.position.x, y: e.position.y + i * e.height * 1.4 }, e.height, ln);
        });
        break;
      }
      case 'dimension': {
        const g = dimensionGeometry(e);
        line(out, e.layerId, g.da, g.db); // ölçü çizgisi
        line(out, e.layerId, g.a, g.da); // uzatma çizgisi (a)
        line(out, e.layerId, g.b, g.db); // uzatma çizgisi (b)
        text(out, e.layerId, g.mid, 20, formatLength(g.length));
        break;
      }
      case 'opening': {
        const wall = walls.get(e.wallId);
        if (wall) {
          const f = openingFrame(e, wall);
          line(out, e.layerId, f.a, f.b); // duvar üzerinde boşluk açıklığı
        }
        break;
      }
      case 'space':
        // Mahal sınırı duvarlardan zaten gelir; yalnız adını merkeze TEXT olarak yaz (AutoCAD'de oda etiketi).
        if (e.name && e.boundary.length >= 3) {
          text(out, e.layerId, polygonCentroid(e.boundary), 20, e.name);
        }
        break;
      // Pafta (baskı çerçevesi) DXF model uzayına yazılmaz.
      case 'sheet':
        break;
    }
  }

  out.push('0', 'ENDSEC', '0', 'EOF');
  return out.join('\n') + '\n';
}

function line(out: string[], layer: string, a: Vec2, b: Vec2): void {
  out.push(
    '0', 'LINE',
    '8', layer,
    '10', fmt(a.x), '20', fmt(a.y), '30', '0',
    '11', fmt(b.x), '21', fmt(b.y), '31', '0',
  );
}

function polyline(out: string[], layer: string, pts: readonly Vec2[], closed: boolean): void {
  if (pts.length === 0) return;
  out.push('0', 'LWPOLYLINE', '8', layer, '90', String(pts.length), '70', closed ? '1' : '0');
  for (const p of pts) out.push('10', fmt(p.x), '20', fmt(p.y));
}

function text(out: string[], layer: string, pos: Vec2, height: number, value: string): void {
  out.push(
    '0', 'TEXT',
    '8', layer,
    '10', fmt(pos.x), '20', fmt(pos.y), '30', '0',
    '40', fmt(height),
    '1', value,
  );
}

function fmt(n: number): string {
  return n.toFixed(4);
}
