import { BitmapText, Graphics } from 'pixi.js';
import { hatchPattern, polygonArea, polygonLabelPoint, type Vec2 } from '@zynpparti/geometry';
import { roomTypeColor, roomTypeOf, type Material, type Space } from '@zynpparti/document';
import { ROOM_FONT } from './charset';
import { LINEWEIGHTS, PALETTE } from './lineweights';

const LABEL_SIZE = 28; // cm (dünya birimi)

/**
 * Mahal dolgusunu (tipe göre renkli, yarı saydam poligon) çizer. Renk **document `roomTypeColor`**
 * tek kaynağından gelir (web lejantıyla aynı; VISUAL-CRAFT §5/§6 — kaymayan zoning renkleri).
 */
export function buildSpaceFill(space: Space): Graphics {
  const g = new Graphics();
  const b = space.boundary;
  if (b.length >= 3) {
    g.moveTo(b[0]!.x, b[0]!.y);
    for (let i = 1; i < b.length; i++) g.lineTo(b[i]!.x, b[i]!.y);
    g.closePath();
    g.fill({ color: roomTypeColor(roomTypeOf(space)), alpha: PALETTE.roomFillAlpha });
  }
  return g;
}

/**
 * Mahal çevre çizgisini (orta kalınlık, ekran-sabit) çizer. Hiyerarşide duvardan ince, ızgaradan
 * kalın → oda "tanımlı bir mekân" olarak okunur (VISUAL-CRAFT §1). Zoom'da `pixelSize` ile yenilenir.
 */
export function drawSpacePerimeter(g: Graphics, space: Space, pixelSize: number): void {
  g.clear();
  const b = space.boundary;
  if (b.length < 3) return;
  g.moveTo(b[0]!.x, b[0]!.y);
  for (let i = 1; i < b.length; i++) g.lineTo(b[i]!.x, b[i]!.y);
  g.closePath();
  g.stroke({ width: LINEWEIGHTS.perimeter * pixelSize, color: PALETTE.roomPerimeter, alignment: 0.5 });
}

/**
 * Mahal zemin tarama segmentleri (DÜNYA-uzaylı, cm; zoom'dan BAĞIMSIZ) — yalnız mahal/malzeme değişince
 * hesaplanır. `hatchPattern` poligon bandını tarayıp her kenara karşı klipler (O(çevre/aralık × kenar)) →
 * her zoom-kare'sinde tekrarı israftı (denetim M2, duvardaki buildWall/strokeWall ayrımının aynısı).
 */
export function buildSpaceMaterialSegs(space: Space, material: Material): { a: Vec2; b: Vec2 }[] {
  if (space.boundary.length < 3) return [];
  return hatchPattern(space.boundary, material.spacing, material.angle, material.kind);
}

/**
 * Önceden hesaplanmış tarama segmentlerini çizer — zoom'da YALNIZ bunu çağır (geometri math'i değil).
 * Kalınlık ekran-sabit (hairline × pixelSize) → zoom'da incelir.
 */
export function strokeSpaceMaterial(
  g: Graphics,
  segs: readonly { a: Vec2; b: Vec2 }[],
  color: number,
  pixelSize: number,
): void {
  g.clear();
  if (segs.length === 0) return;
  for (const s of segs) g.moveTo(s.a.x, s.a.y).lineTo(s.b.x, s.b.y);
  g.stroke({ width: LINEWEIGHTS.hairline * pixelSize, color, alpha: 0.55 });
}

/**
 * Mahal zemin malzemesini tarama deseniyle çizer (build + stroke tek seferde; VISUAL-CRAFT §3).
 * Zoom'da tekrar çizilen yerlerde `buildSpaceMaterialSegs`'i BİR KEZ yapıp `strokeSpaceMaterial`
 * kullan (EntityLayer böyle yapar) — geometri math'ini her kareye taşıma.
 */
export function drawSpaceMaterial(
  g: Graphics,
  space: Space,
  material: Material,
  pixelSize: number,
): void {
  strokeSpaceMaterial(g, buildSpaceMaterialSegs(space, material), material.color, pixelSize);
}

/** Mahal etiketini (ad + canlı m²) merkeze yerleştirir. BitmapText → TR_CHARSET atlası. */
export function buildSpaceLabel(space: Space): BitmapText | null {
  // Dejenere sınır (<3 nokta) → polygonArea/polygonLabelPoint NaN → label.position NaN olur (etiket kaybolur/
  // garip yere gider). fill/perimeter zaten <3'te erken döner; etiket de dönsün.
  if (space.boundary.length < 3) return null;
  const area = polygonArea(space.boundary) / 10000; // cm² → m²
  const label = new BitmapText({
    text: `${space.name}\n${formatArea(area)} m²`,
    style: { fontFamily: ROOM_FONT, fontSize: LABEL_SIZE, align: 'center' },
  });
  label.anchor.set(0.5);
  // Centroid yerine erişilemezlik-kutbu: konkav/L odada etiket komşunun üstüne binmesin (daima içeride).
  const c = polygonLabelPoint(space.boundary);
  label.position.set(c.x, c.y);
  return label;
}

function formatArea(m2: number): string {
  return m2.toFixed(1).replace('.', ','); // tr-TR ondalık
}
