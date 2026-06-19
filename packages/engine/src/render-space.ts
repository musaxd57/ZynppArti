import { BitmapText, Graphics } from 'pixi.js';
import { polygonArea, type Vec2 } from '@zynpparti/geometry';
import type { Space } from '@zynpparti/document';
import { ROOM_FONT } from './charset';

const FILL_COLOR = 0x4a90d9;
const LABEL_SIZE = 28; // cm (dünya birimi)

/** Mahal dolgusunu (yarı saydam poligon) çizer. */
export function buildSpaceFill(space: Space): Graphics {
  const g = new Graphics();
  const b = space.boundary;
  if (b.length >= 3) {
    g.moveTo(b[0]!.x, b[0]!.y);
    for (let i = 1; i < b.length; i++) g.lineTo(b[i]!.x, b[i]!.y);
    g.closePath();
    g.fill({ color: FILL_COLOR, alpha: 0.12 });
  }
  return g;
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
