import DxfParser, {
  type ILineEntity,
  type ILwpolylineEntity,
  type IPolylineEntity,
} from 'dxf-parser';
import { createEntityId, type Wall } from '@zynpparti/document';

const DEFAULT_THICKNESS = 15; // cm — DXF çizgilerinde kalınlık yok, varsayılan atanır

// $INSUNITS kodu → cm çarpanı (1=inch, 2=feet, 4=mm, 5=cm, 6=m).
const INSUNITS_TO_CM: Record<number, number> = { 1: 2.54, 2: 30.48, 4: 0.1, 5: 1, 6: 100 };

export interface DxfImportResult {
  walls: Wall[];
  /** Uygulanan birim→cm çarpanı (bilinmiyorsa 1; kalibrasyon ayrıca düzeltir). */
  unitScaleToCm: number;
  layers: string[];
}

interface XY {
  x: number;
  y: number;
}

/**
 * DXF metnini ayrıştırır; LINE/LWPOLYLINE/POLYLINE → Wall, katman adlarını korur.
 * Birim $INSUNITS'ten cm'e çevrilir; bilinmiyorsa 1 kabul edilir ve 2-nokta kalibrasyonla
 * düzeltilir (ADR-0008, ENGINEERING-NOTES §4). Gerçek DXF'ler dağınık olabilir → toleranslı.
 */
export function importDxf(text: string): DxfImportResult {
  const dxf = new DxfParser().parseSync(text);
  if (!dxf) throw new Error('DXF ayrıştırılamadı (geçersiz dosya).');

  const rawUnits = dxf.header?.['$INSUNITS'];
  const factor = typeof rawUnits === 'number' ? (INSUNITS_TO_CM[rawUnits] ?? 1) : 1;

  const walls: Wall[] = [];
  const layers = new Set<string>();

  for (const e of dxf.entities ?? []) {
    const layer = e.layer || 'default';
    if (e.type === 'LINE') {
      const v = (e as ILineEntity).vertices;
      if (v.length >= 2) {
        walls.push(makeWall(v[0]!, v[1]!, factor, layer));
        layers.add(layer);
      }
    } else if (e.type === 'LWPOLYLINE') {
      const pl = e as ILwpolylineEntity;
      if (pushPolyline(pl.vertices, pl.shape, factor, layer, walls)) layers.add(layer);
    } else if (e.type === 'POLYLINE') {
      const pl = e as IPolylineEntity;
      if (pushPolyline(pl.vertices, pl.shape, factor, layer, walls)) layers.add(layer);
    }
  }

  return { walls, unitScaleToCm: factor, layers: [...layers] };
}

function pushPolyline(
  verts: ReadonlyArray<XY>,
  closed: boolean,
  factor: number,
  layer: string,
  out: Wall[],
): boolean {
  for (let i = 0; i + 1 < verts.length; i++) {
    out.push(makeWall(verts[i]!, verts[i + 1]!, factor, layer));
  }
  if (closed && verts.length > 2) {
    out.push(makeWall(verts[verts.length - 1]!, verts[0]!, factor, layer));
  }
  return verts.length > 0;
}

function makeWall(a: XY, b: XY, factor: number, layer: string): Wall {
  return {
    id: createEntityId(),
    type: 'wall',
    layerId: layer,
    start: { x: a.x * factor, y: a.y * factor },
    end: { x: b.x * factor, y: b.y * factor },
    thickness: DEFAULT_THICKNESS,
  };
}
