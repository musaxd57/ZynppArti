import { BitmapText, Container, Graphics } from 'pixi.js';
import { COMMENT_PIN, COMMENT_TEXT_HEIGHT, type Comment } from '@zynpparti/document';
import { ROOM_FONT } from './charset';

const PIN_COLOR = 0xffb454; // amber (yorum sıcaklığı)
const DOT_COLOR = 0x15171c;

/**
 * Yorum/markup iğnesini çizer: amber bir 💬 baloncuk (kuyruğu `position` noktasında) + sağında
 * yorum metni. Dünya uzayında (cm) → zoom'la ölçeklenir. labelLayer'a eklenir.
 */
export function buildComment(c: Comment): Container {
  const g = new Container();
  const s = COMMENT_PIN;
  const bubble = new Graphics();
  // Baloncuk gövdesi (üst-solda), kuyruk aşağıda (0,0) = iğne noktası.
  bubble.roundRect(0, -s, s, s * 0.8, 5).fill({ color: PIN_COLOR });
  bubble.poly([3, -s * 0.2, 11, -s * 0.2, 3, 0]).fill({ color: PIN_COLOR });
  for (const dx of [7, 13, 19]) bubble.circle(dx, -s * 0.6, 1.6).fill({ color: DOT_COLOR });
  g.addChild(bubble);

  const t = new BitmapText({
    text: c.text,
    style: { fontFamily: ROOM_FONT, fontSize: COMMENT_TEXT_HEIGHT, align: 'left' },
  });
  t.tint = PIN_COLOR;
  t.anchor.set(0, 0);
  t.position.set(s + 6, -s);
  g.addChild(t);

  g.position.set(c.position.x, c.position.y);
  return g;
}
