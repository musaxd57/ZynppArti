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
const MAX_INSERT_DEPTH = 6; // iç içe blok özyineleme sınırı (döngüsel referans koruması)

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

/** Bir DXF noktasını (blok-yerel) dünya koordinatına çeviren dönüşüm (INSERT zincirleri için). */
type Tf = (p: XY) => XY;
const IDENTITY: Tf = (p) => p;

/** INSERT (blok yerleştirme) için yeni dönüşüm: blok-yerel → dünya. Üst dönüşümle zincirlenir. */
function insertTf(
  ins: { position?: XY; xScale?: number; yScale?: number; rotation?: number },
  base: XY | undefined,
  parent: Tf,
): Tf {
  const sx = ins.xScale ?? 1;
  const sy = ins.yScale ?? 1;
  const rot = ((ins.rotation ?? 0) * Math.PI) / 180;
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const ox = ins.position?.x ?? 0;
  const oy = ins.position?.y ?? 0;
  const bx = base?.x ?? 0;
  const by = base?.y ?? 0;
  return (p) => {
    // 1) blok taban noktasını çıkar, 2) ölçekle, 3) döndür, 4) ekleme noktasına taşı, 5) üst dönüşüm.
    const lx = (p.x - bx) * sx;
    const ly = (p.y - by) * sy;
    return parent({ x: ox + lx * c - ly * s, y: oy + lx * s + ly * c });
  };
}

interface BlockLike {
  entities?: unknown[];
  position?: XY;
}

/**
 * DXF metnini ayrıştırır; LINE/LWPOLYLINE/POLYLINE → Wall, CIRCLE/ARC → segmentlenmiş Wall
 * (eğri entity'miz yok), TEXT/MTEXT → Annotation. **INSERT (blok)** referansları çözülüp blok
 * içeriği konum/ölçek/rotasyon dönüşümüyle patlatılır (iç içe bloklar dahil) — mobilya/sembol
 * blokları artık kaybolmaz. Katman adları korunur; birim $INSUNITS'ten cm'e çevrilir (yoksa 1 →
 * 2-nokta kalibrasyonla düzeltilir, ADR-0008). Gerçek DXF'ler dağınık olabilir → toleranslı.
 */
export function importDxf(text: string): DxfImportResult {
  const dxf = new DxfParser().parseSync(text);
  if (!dxf) throw new Error('DXF ayrıştırılamadı (geçersiz dosya).');

  const rawUnits = dxf.header?.['$INSUNITS'];
  const factor = typeof rawUnits === 'number' ? (INSUNITS_TO_CM[rawUnits] ?? 1) : 1;
  const blocks = (dxf.blocks ?? {}) as Record<string, BlockLike>;

  const walls: Wall[] = [];
  const annotations: Annotation[] = [];
  const layers = new Set<string>();

  const process = (e: { type?: string; layer?: string }, tf: Tf, fallbackLayer: string, depth: number): void => {
    const layer = e.layer || fallbackLayer;
    // Tek bir bozuk entity tüm import'u öldürmesin → entity başına izole et, hatalıyı atla.
    try {
      if (e.type === 'LINE') {
        const v = (e as ILineEntity).vertices;
        if (v.length >= 2) {
          walls.push(makeWall(tf(v[0]!), tf(v[1]!), factor, layer));
          layers.add(layer);
        }
      } else if (e.type === 'LWPOLYLINE') {
        const pl = e as ILwpolylineEntity;
        if (pushPolyline(pl.vertices, pl.shape, factor, layer, walls, tf)) layers.add(layer);
      } else if (e.type === 'POLYLINE') {
        const pl = e as IPolylineEntity;
        if (pushPolyline(pl.vertices, pl.shape, factor, layer, walls, tf)) layers.add(layer);
      } else if (e.type === 'CIRCLE') {
        const c = e as ICircleEntity;
        tessellateArc(c.center, c.radius, 0, Math.PI * 2, factor, layer, walls, tf);
        layers.add(layer);
      } else if (e.type === 'ARC') {
        const a = e as IArcEntity;
        tessellateArc(a.center, a.radius, a.startAngle, a.endAngle, factor, layer, walls, tf);
        layers.add(layer);
      } else if (e.type === 'TEXT') {
        const t = e as ITextEntity;
        const ann = makeAnnotation(t.startPoint ? tf(t.startPoint) : undefined, t.text, t.textHeight, factor, layer);
        if (ann) {
          annotations.push(ann);
          layers.add(layer);
        }
      } else if (e.type === 'MTEXT') {
        const t = e as IMtextEntity;
        const ann = makeAnnotation(t.position ? tf(t.position) : undefined, stripMtext(t.text), t.height, factor, layer);
        if (ann) {
          annotations.push(ann);
          layers.add(layer);
        }
      } else if (e.type === 'INSERT' && depth < MAX_INSERT_DEPTH) {
        // Blok referansını çöz → içeriğini dönüşümle patlat (özyinelemeli).
        const ins = e as { name?: string; position?: XY; xScale?: number; yScale?: number; rotation?: number };
        const block = ins.name ? blocks[ins.name] : undefined;
        if (block?.entities && block.entities.length > 0) {
          const childTf = insertTf(ins, block.position, tf);
          for (const be of block.entities) {
            process(be as { type?: string; layer?: string }, childTf, layer, depth + 1);
          }
        }
      }
    } catch (err) {
      console.warn('DXF: bozuk entity atlandı', e.type, err);
    }
  };

  for (const e of dxf.entities ?? []) {
    process(e, IDENTITY, e.layer || 'default', 0);
  }

  return { walls, annotations, unitScaleToCm: factor, layers: [...layers] };
}

function pushPolyline(
  verts: ReadonlyArray<XY>,
  closed: boolean,
  factor: number,
  layer: string,
  out: Wall[],
  tf: Tf,
): boolean {
  for (let i = 0; i + 1 < verts.length; i++) {
    out.push(makeWall(tf(verts[i]!), tf(verts[i + 1]!), factor, layer));
  }
  if (closed && verts.length > 2) {
    out.push(makeWall(tf(verts[verts.length - 1]!), tf(verts[0]!), factor, layer));
  }
  return verts.length > 0;
}

/** Çember/yayı küçük doğru parçalarına böler; her örnek nokta dönüşümle (INSERT) dünyaya taşınır. */
function tessellateArc(
  center: XY,
  radius: number,
  startAngle: number,
  endAngle: number,
  factor: number,
  layer: string,
  out: Wall[],
  tf: Tf,
): void {
  if (!(radius > 0)) return;
  let sweep = endAngle - startAngle;
  if (sweep <= 0) sweep += Math.PI * 2; // CCW normalize (kapalı çember için 2π)
  const steps = Math.max(2, Math.ceil(sweep / ARC_STEP));
  const at = (ang: number): XY =>
    tf({ x: center.x + radius * Math.cos(ang), y: center.y + radius * Math.sin(ang) });
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
  // Gerçek yükseklik kaynak biriminde → cm'ye ölçekle (×factor). Varsayılan ZATEN cm → ölçekleme.
  // (Aksi halde mm dosyada factor=0.1 ile varsayılan 25 cm → 2,5 cm'ye düşüp metin görünmez olurdu.)
  const h = height && height > 0 ? height * factor : DEFAULT_TEXT_HEIGHT;
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
