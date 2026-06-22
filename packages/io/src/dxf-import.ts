import DxfParser, {
  type IArcEntity,
  type ICircleEntity,
  type ILineEntity,
  type ILwpolylineEntity,
  type IMtextEntity,
  type IPolylineEntity,
  type ITextEntity,
} from 'dxf-parser';
import { createEntityId, type Annotation, type Wall } from '@zynpparti/document';

const DEFAULT_THICKNESS = 15; // cm — DXF çizgilerinde kalınlık yok, varsayılan atanır
const DEFAULT_TEXT_HEIGHT = 25; // cm — metin yüksekliği yoksa
const ARC_STEP = Math.PI / 12; // ~15° → eğri başına segment çözünürlüğü

// $INSUNITS kodu → cm çarpanı (1=inch, 2=feet, 4=mm, 5=cm, 6=m).
const INSUNITS_TO_CM: Record<number, number> = { 1: 2.54, 2: 30.48, 4: 0.1, 5: 1, 6: 100 };

export interface DxfImportResult {
  walls: Wall[];
  /** TEXT/MTEXT → serbest metin notları. */
  annotations: Annotation[];
  /** Uygulanan birim→cm çarpanı (bilinmiyorsa 1; kalibrasyon ayrıca düzeltir). */
  unitScaleToCm: number;
  layers: string[];
}

interface XY {
  x: number;
  y: number;
}

/**
 * DXF metnini ayrıştırır; LINE/LWPOLYLINE/POLYLINE → Wall, CIRCLE/ARC → segmentlenmiş Wall
 * (eğri entity'miz yok), TEXT/MTEXT → Annotation. Katman adlarını korur. Birim $INSUNITS'ten cm'e
 * çevrilir; bilinmiyorsa 1 kabul edilir ve 2-nokta kalibrasyonla düzeltilir (ADR-0008,
 * ENGINEERING-NOTES §4). Gerçek DXF'ler dağınık olabilir → toleranslı.
 */
export function importDxf(text: string): DxfImportResult {
  const dxf = new DxfParser().parseSync(text);
  if (!dxf) throw new Error('DXF ayrıştırılamadı (geçersiz dosya).');

  const rawUnits = dxf.header?.['$INSUNITS'];
  const factor = typeof rawUnits === 'number' ? (INSUNITS_TO_CM[rawUnits] ?? 1) : 1;

  const walls: Wall[] = [];
  const annotations: Annotation[] = [];
  const layers = new Set<string>();

  for (const e of dxf.entities ?? []) {
    const layer = e.layer || 'default';
    // Tek bir bozuk entity tüm import'u öldürmesin → entity başına izole et, hatalıyı atla.
    try {
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
      } else if (e.type === 'CIRCLE') {
        const c = e as ICircleEntity;
        tessellateArc(c.center, c.radius, 0, Math.PI * 2, factor, layer, walls);
        layers.add(layer);
      } else if (e.type === 'ARC') {
        const a = e as IArcEntity;
        tessellateArc(a.center, a.radius, a.startAngle, a.endAngle, factor, layer, walls);
        layers.add(layer);
      } else if (e.type === 'TEXT') {
        const t = e as ITextEntity;
        const ann = makeAnnotation(t.startPoint, t.text, t.textHeight, factor, layer);
        if (ann) {
          annotations.push(ann);
          layers.add(layer);
        }
      } else if (e.type === 'MTEXT') {
        const t = e as IMtextEntity;
        const ann = makeAnnotation(t.position, stripMtext(t.text), t.height, factor, layer);
        if (ann) {
          annotations.push(ann);
          layers.add(layer);
        }
      }
    } catch (err) {
      console.warn('DXF: bozuk entity atlandı', e.type, err);
    }
  }

  return { walls, annotations, unitScaleToCm: factor, layers: [...layers] };
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

/** Çember/yayı küçük doğru parçalarına böler (eğri entity yok → Wall segmentleri). */
function tessellateArc(
  center: XY,
  radius: number,
  startAngle: number,
  endAngle: number,
  factor: number,
  layer: string,
  out: Wall[],
): void {
  if (!(radius > 0)) return;
  let sweep = endAngle - startAngle;
  if (sweep <= 0) sweep += Math.PI * 2; // CCW normalize (kapalı çember için 2π)
  const steps = Math.max(2, Math.ceil(sweep / ARC_STEP));
  const at = (ang: number): XY => ({
    x: center.x + radius * Math.cos(ang),
    y: center.y + radius * Math.sin(ang),
  });
  let prev = at(startAngle);
  for (let i = 1; i <= steps; i++) {
    const cur = at(startAngle + (sweep * i) / steps);
    out.push(makeWall(prev, cur, factor, layer));
    prev = cur;
  }
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

function makeAnnotation(
  pos: XY | undefined,
  text: string | undefined,
  height: number | undefined,
  factor: number,
  layer: string,
): Annotation | null {
  const value = (text ?? '').trim();
  if (!pos || value === '') return null;
  const h = (height && height > 0 ? height : DEFAULT_TEXT_HEIGHT) * factor;
  return {
    id: createEntityId(),
    type: 'annotation',
    layerId: layer,
    position: { x: pos.x * factor, y: pos.y * factor },
    text: value,
    height: h,
  };
}

/** MTEXT içindeki kaba biçimlendirme kodlarını temizler (\P satır sonu → \n; \f.., {} vb. atılır). */
function stripMtext(raw: string): string {
  return raw
    .replace(/\\P/g, '\n')
    .replace(/\\[A-Za-z][^;]*;/g, '')
    .replace(/[{}]/g, '')
    .trim();
}
