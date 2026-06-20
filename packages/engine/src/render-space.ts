import { BitmapText, Graphics } from 'pixi.js';
import { polygonArea, type Vec2 } from '@zynpparti/geometry';
import { roomTypeOf, type RoomType, type Space } from '@zynpparti/document';
import { ROOM_FONT } from './charset';
import { LINEWEIGHTS, PALETTE } from './lineweights';

const LABEL_SIZE = 28; // cm (dünya birimi)

/**
 * Mahal tipine göre dolgu rengi (zoning/imar diyagramı hissi; VISUAL-CRAFT §5 — renkle okunabilirlik).
 * Koyu tuvalde soluk tint. Tip kullanıcı atar (RoomList); değişince mahal yeniden çizilir.
 */
const ROOM_TYPE_FILL: Record<RoomType, number> = {
  living: 0xd9a14a, // yaşam — sıcak amber
  wet: 0x4ec9d9, // ıslak hacim — camgöbeği
  sleeping: 0x9a7fd9, // yatma — mor
  circulation: 0x8a8a8a, // sirkülasyon — nötr gri
  service: 0x6fbf73, // servis — yeşil
  other: PALETTE.roomFill, // diğer — varsayılan mavi
};

/** Mahal dolgusunu (tipe göre renkli, yarı saydam poligon) çizer. */
export function buildSpaceFill(space: Space): Graphics {
  const g = new Graphics();
  const b = space.boundary;
  if (b.length >= 3) {
    g.moveTo(b[0]!.x, b[0]!.y);
    for (let i = 1; i < b.length; i++) g.lineTo(b[i]!.x, b[i]!.y);
    g.closePath();
    g.fill({ color: ROOM_TYPE_FILL[roomTypeOf(space)], alpha: PALETTE.roomFillAlpha });
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

/** Mahal etiketini (ad + canlı m²) merkeze yerleştirir. BitmapText → TR_CHARSET atlası. */
export function buildSpaceLabel(space: Space): BitmapText {
  const area = polygonArea(space.boundary) / 10000; // cm² → m²
  const label = new BitmapText({
    text: `${space.name}\n${formatArea(area)} m²`,
    style: { fontFamily: ROOM_FONT, fontSize: LABEL_SIZE, align: 'center' },
  });
  label.anchor.set(0.5);
  const c = centroid(space.boundary);
  label.position.set(c.x, c.y);
  return label;
}

function formatArea(m2: number): string {
  return m2.toFixed(1).replace('.', ','); // tr-TR ondalık
}

function centroid(poly: readonly Vec2[]): Vec2 {
  let x = 0;
  let y = 0;
  for (const p of poly) {
    x += p.x;
    y += p.y;
  }
  const n = poly.length || 1;
  return { x: x / n, y: y / n };
}
