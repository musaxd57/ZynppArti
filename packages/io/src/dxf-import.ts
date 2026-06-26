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
const MAX_TEXT_HEIGHT = 2000; // cm — bozuk MTEXT (ör. 1e9) zoom/bounds'u ele geçirmesin diye tavan
const ARC_STEP = Math.PI / 12; // ~15° → eğri başına segment çözünürlüğü
const MAX_INSERT_DEPTH = 6; // iç içe blok özyineleme sınırı (döngüsel referans koruması)

// $INSUNITS kodu → cm çarpanı. ISO/AutoCAD birim kodları (0=birimsiz → 1, kalibrasyona bırakılır).
// 1=inch 2=feet 3=mile 4=mm 5=cm 6=m 7=km 8=microinch 9=mil 10=yard 11=Å 12=nm 13=µm 14=dm 15=dam 16=hm 17=Gm.
const INSUNITS_TO_CM: Record<number, number> = {
  1: 2.54, // inch
  2: 30.48, // feet
  3: 160934.4, // mile
  4: 0.1, // mm
  5: 1, // cm
  6: 100, // m
  7: 100000, // km
  8: 2.54e-4, // microinch
  9: 2.54e-3, // mil
  10: 91.44, // yard
  14: 10, // decimeter
  15: 1000, // dekameter
  16: 10000, // hectometer
};

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
 * OCS düzeltmesi: DXF entity koordinatları nesne-koordinat-sisteminde (OCS) saklanır. AutoCAD MIRROR'la
 * üretilmiş entity'lerde extrusion (0,0,−1) olur ve koordinatlar X-aynalı saklanır. Eksenel −Z durumunda
 * (arbitrary-axis eksenel hali) WCS = (−x, y) → tf'i X-negate ile sararız; aksi (+Z / eksenel-olmayan 3B)
 * dokunmayız. Nokta-katmanında yansıma yay örneklerini ve polyline köşelerini doğru aynalar. (Denetim.)
 */
function ocsTf(
  e: { extrusionDirectionX?: number; extrusionDirectionY?: number; extrusionDirectionZ?: number; extrusionDirection?: { x?: number; y?: number; z?: number } },
  tf: Tf,
): Tf {
  const ex = e.extrusionDirectionX ?? e.extrusionDirection?.x ?? 0;
  const ey = e.extrusionDirectionY ?? e.extrusionDirection?.y ?? 0;
  const ez = e.extrusionDirectionZ ?? e.extrusionDirection?.z ?? 1;
  if (ez < 0 && Math.abs(ex) < 1e-9 && Math.abs(ey) < 1e-9) {
    return (p) => tf({ x: -p.x, y: p.y });
  }
  return tf;
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
        // Bozuk LINE (vertices yok / <2 nokta) throw'a düşmesin → açıkça guard'la (Array.isArray).
        if (Array.isArray(v) && v.length >= 2) {
          const w = makeWall(tf(v[0]!), tf(v[1]!), factor, layer);
          if (w) {
            walls.push(w);
            layers.add(layer);
          }
        }
      } else if (e.type === 'LWPOLYLINE') {
        const pl = e as ILwpolylineEntity;
        if (pushPolyline(pl.vertices, pl.shape, factor, layer, walls, ocsTf(pl, tf))) layers.add(layer);
      } else if (e.type === 'POLYLINE') {
        const pl = e as IPolylineEntity & { isPolyfaceMesh?: boolean; is3dPolygonMesh?: boolean };
        // Polyface/3B mesh POLYLINE'da vertices'e YÜZ-tanım kayıtları (koordinatsız, x=y=0) karışır →
        // ardışık bağlamak origin'e/ızgaraya çöp duvar üretir (bounds + indeks bozulur). Mesh'i ATLA
        // (2B plan duvar konturu değildir). Saf çizgi-polyline normal işlenir. (Denetim bulgusu.)
        if (!pl.isPolyfaceMesh && !pl.is3dPolygonMesh) {
          if (pushPolyline(pl.vertices, pl.shape, factor, layer, walls, ocsTf(pl, tf))) layers.add(layer);
        }
      } else if (e.type === 'CIRCLE') {
        const c = e as ICircleEntity;
        tessellateArc(c.center, c.radius, 0, Math.PI * 2, factor, layer, walls, tf);
        layers.add(layer);
      } else if (e.type === 'ARC') {
        const a = e as IArcEntity;
        tessellateArc(a.center, a.radius, a.startAngle, a.endAngle, factor, layer, walls, ocsTf(a, tf));
        layers.add(layer);
      } else if (e.type === 'ELLIPSE') {
        // Mimari DXF'te kemerli boşluk/oval mekan; eskiden sessizce DÜŞÜYORDU (denetim).
        const el = e as {
          center?: XY;
          majorAxisEndPoint?: XY;
          axisRatio?: number;
          startAngle?: number;
          endAngle?: number;
        };
        if (el.center && el.majorAxisEndPoint && tessellateEllipse(el.center, el.majorAxisEndPoint, el.axisRatio ?? 1, el.startAngle ?? 0, el.endAngle ?? Math.PI * 2, factor, layer, walls, tf)) {
          layers.add(layer);
        }
      } else if (e.type === 'SPLINE') {
        // Serbest/eğri duvar; fit noktaları (eğri üstünde) tercih, yoksa kontrol poligonu (kaba). Düştü yerine yaklaş.
        const sp = e as { fitPoints?: XY[]; controlPoints?: XY[] };
        const pts = (sp.fitPoints && sp.fitPoints.length >= 2 ? sp.fitPoints : sp.controlPoints) ?? [];
        if (pts.length >= 2 && pushPolyline(pts, false, factor, layer, walls, tf)) layers.add(layer);
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

/** LWPOLYLINE/POLYLINE köşesi — opsiyonel `bulge` (yay) ile (dxf-parser grup kodu 42). */
type PolyVertex = { x: number; y: number; bulge?: number };

function pushPolyline(
  verts: ReadonlyArray<PolyVertex>,
  closed: boolean,
  factor: number,
  layer: string,
  out: Wall[],
  tf: Tf,
): boolean {
  for (let i = 0; i + 1 < verts.length; i++) {
    pushPolySegment(verts[i]!, verts[i + 1]!, factor, layer, out, tf);
  }
  if (closed && verts.length > 2) {
    pushPolySegment(verts[verts.length - 1]!, verts[0]!, factor, layer, out, tf);
  }
  return verts.length > 0;
}

/**
 * Bir polyline kenarı: köşedeki `bulge` sıfır/yok/NaN ise düz çizgi; aksi halde YAY (mimari DXF'te
 * eğri duvar/balkon/pah çok yaygın). Standalone ARC/CIRCLE zaten tessellate ediliyordu; bulge'lu
 * segment de aynı yola sokulur → tutarlı (eskiden düz kirişe düşüyordu, m²/konum bozuluyordu). Denetim.
 */
function pushPolySegment(p1: PolyVertex, p2: PolyVertex, factor: number, layer: string, out: Wall[], tf: Tf): void {
  const b = p1.bulge;
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const chord = Math.hypot(dx, dy);
  if (b == null || !Number.isFinite(b) || b === 0 || !(chord > 0)) {
    pushWall(out, tf(p1), tf(p2), factor, layer);
    return;
  }
  // bulge = tan(θ/4). c-faktör merkez (CAD standardı; çeyrek-daire ile doğrulandı):
  const c = (1 - b * b) / (2 * b);
  const cx = (p1.x + p2.x) / 2 - (c * (p2.y - p1.y)) / 2;
  const cy = (p1.y + p2.y) / 2 + (c * (p2.x - p1.x)) / 2;
  const radius = Math.hypot(p1.x - cx, p1.y - cy);
  let a1 = Math.atan2(p1.y - cy, p1.x - cx);
  let a2 = Math.atan2(p2.y - cy, p2.x - cx);
  // tessellateArc CCW süpürür; pozitif bulge = CCW, negatif = CW → uçları takasla (CW eşdeğeri).
  if (b < 0) {
    const t = a1;
    a1 = a2;
    a2 = t;
  }
  tessellateArc({ x: cx, y: cy }, radius, a1, a2, factor, layer, out, tf);
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
  // Bozuk DXF: NaN/Infinity merkez/yarıçap/açı → NaN duvar üretip bounds/index'i bozar. Hepsini ele.
  if (
    !(radius > 0) ||
    !Number.isFinite(radius) ||
    !Number.isFinite(center.x) ||
    !Number.isFinite(center.y) ||
    !Number.isFinite(startAngle) ||
    !Number.isFinite(endAngle)
  ) {
    return;
  }
  let sweep = endAngle - startAngle;
  if (sweep <= 0) sweep += Math.PI * 2; // CCW normalize (kapalı çember için 2π)
  const steps = Math.max(2, Math.ceil(sweep / ARC_STEP));
  const at = (ang: number): XY =>
    tf({ x: center.x + radius * Math.cos(ang), y: center.y + radius * Math.sin(ang) });
  let prev = at(startAngle);
  for (let i = 1; i <= steps; i++) {
    const cur = at(startAngle + (sweep * i) / steps);
    pushWall(out, prev, cur, factor, layer);
    prev = cur;
  }
}

/**
 * Elipsi küçük doğru parçalarına böler. `majorEnd` merkeze göre büyük-eksen UÇ vektörü; a=|majorEnd|,
 * b=a·axisRatio, φ=eksenin açısı. startAngle/endAngle RADYANDIR (ARC'ın derecesinden farklı). NaN/dejenere
 * → false. Her örnek nokta tf ile dünyaya taşınır.
 */
function tessellateEllipse(
  center: XY,
  majorEnd: XY,
  axisRatio: number,
  startAngle: number,
  endAngle: number,
  factor: number,
  layer: string,
  out: Wall[],
  tf: Tf,
): boolean {
  const a = Math.hypot(majorEnd.x, majorEnd.y);
  if (
    !(a > 0) || !Number.isFinite(a) || !Number.isFinite(axisRatio) ||
    !Number.isFinite(center.x) || !Number.isFinite(center.y) ||
    !Number.isFinite(startAngle) || !Number.isFinite(endAngle)
  ) {
    return false;
  }
  const b = a * axisRatio;
  const phi = Math.atan2(majorEnd.y, majorEnd.x);
  const cphi = Math.cos(phi);
  const sphi = Math.sin(phi);
  let sweep = endAngle - startAngle;
  if (sweep <= 0) sweep += Math.PI * 2; // CCW normalize (tam elips için 2π)
  const steps = Math.max(2, Math.ceil(sweep / ARC_STEP));
  const at = (t: number): XY => {
    const ca = Math.cos(t) * a;
    const sb = Math.sin(t) * b;
    return tf({ x: center.x + ca * cphi - sb * sphi, y: center.y + ca * sphi + sb * cphi });
  };
  let prev = at(startAngle);
  for (let i = 1; i <= steps; i++) {
    const cur = at(startAngle + (sweep * i) / steps);
    pushWall(out, prev, cur, factor, layer);
    prev = cur;
  }
  return true;
}

/**
 * NaN/Infinity koordinat → null (bozuk DXF bounds/index'i bozmasın).
 * Y-FLIP (IO sınırı): DXF y-UP, iç modelimiz y-DOWN → import'ta Y negate edilir ki çizim AutoCAD'deki
 * yönüyle AYNI görünsün (eskiden dikey aynalıydı). Tüm entity tipleri (LINE/ARC/ELLIPSE/SPLINE/INSERT)
 * son koordinatı buradan geçirir → tek noktada flip yeter. İç model dokunulmaz; yalnız sınırda çevrilir.
 */
function makeWall(a: XY, b: XY, factor: number, layer: string): Wall | null {
  const sx = a.x * factor;
  const sy = -a.y * factor;
  const ex = b.x * factor;
  const ey = -b.y * factor;
  if (!Number.isFinite(sx) || !Number.isFinite(sy) || !Number.isFinite(ex) || !Number.isFinite(ey)) {
    return null;
  }
  return {
    id: createEntityId(),
    type: 'wall',
    layerId: layer,
    start: { x: sx, y: sy },
    end: { x: ex, y: ey },
    thickness: DEFAULT_THICKNESS,
  };
}

/** makeWall + geçerliyse out'a ekle (bozuk koordinatlı segmenti atlar). */
function pushWall(out: Wall[], a: XY, b: XY, factor: number, layer: string): void {
  const w = makeWall(a, b, factor, layer);
  if (w) out.push(w);
}

function makeAnnotation(
  pos: XY | undefined,
  text: string | undefined,
  height: number | undefined,
  factor: number,
  layer: string,
): Annotation | null {
  const value = (text ?? '').trim();
  // Konum sonlu değilse (bozuk DXF) atla — NaN konum bounds/index'i bozar (makeWall ile tutarlı).
  if (!pos || value === '' || !Number.isFinite(pos.x) || !Number.isFinite(pos.y)) return null;
  // Gerçek yükseklik kaynak biriminde → cm'ye ölçekle (×factor). Varsayılan ZATEN cm → ölçekleme.
  // (Aksi halde mm dosyada factor=0.1 ile varsayılan 25 cm → 2,5 cm'ye düşüp metin görünmez olurdu.)
  // Tavan: bozuk MTEXT'in devasa height'i (zoom/bounds'u ele geçirir) MAX_TEXT_HEIGHT'e kırpılır.
  const scaled = height && height > 0 ? height * factor : DEFAULT_TEXT_HEIGHT;
  const h = Math.min(Math.max(scaled, 1), MAX_TEXT_HEIGHT);
  return {
    id: createEntityId(),
    type: 'annotation',
    layerId: layer,
    position: { x: pos.x * factor, y: -pos.y * factor }, // Y-flip (IO sınırı, makeWall ile tutarlı)
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
