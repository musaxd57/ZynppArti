import { BitmapText, Container, Graphics } from 'pixi.js';
import { COMMENT_PIN, COMMENT_TEXT_HEIGHT, commentScale, type Comment } from '@zynpparti/document';
import { ROOM_FONT } from './charset';

const PIN_COLOR = 0xffb454; // amber (yorum sıcaklığı)
const RESOLVED_COLOR = 0x5a6072; // soluk gri (çözülmüş yorum = "kapalı")
const DOT_COLOR = 0x15171c;

/**
 * Yorum/markup iğnesini çizer: amber bir 💬 baloncuk (kuyruğu `position` noktasında) + sağında
 * yorum metni. Çözülmüş yorum soluk gri + ✓ ön ekiyle çizilir. Dünya uzayında (cm) → zoom'la
 * ölçeklenir. labelLayer'a eklenir.
 */
export function buildComment(c: Comment): Container {
  const g = new Container();
  // Baloncuk + metin bir iç container'da kurulur, sonra boyut çarpanıyla ölçeklenir (kuyruk 0,0'da
  // kalır = iğne noktası). Çarpanı tüm geometriye tek tek dağıtmak yerine container scale kullanılır.
  const inner = new Container();
  const s = COMMENT_PIN;
  const color = c.resolved ? RESOLVED_COLOR : PIN_COLOR;
  const bubble = new Graphics();
  // Baloncuk gövdesi (üst-solda), kuyruk aşağıda (0,0) = iğne noktası.
  bubble.roundRect(0, -s, s, s * 0.8, 5).fill({ color });
  bubble.poly([3, -s * 0.2, 11, -s * 0.2, 3, 0]).fill({ color });
  if (c.resolved) {
    // Çözüldü onayı: baloncuk üstünde küçük ✓.
    bubble
      .moveTo(5, -s * 0.55)
      .lineTo(8, -s * 0.3)
      .lineTo(15, -s * 0.7)
      .stroke({ width: 1.6, color: DOT_COLOR });
  } else {
    for (const dx of [7, 13, 19]) bubble.circle(dx, -s * 0.6, 1.6).fill({ color: DOT_COLOR });
  }
  inner.addChild(bubble);

  const t = new BitmapText({
    text: c.resolved ? `✓ ${c.text}` : c.text,
    style: { fontFamily: ROOM_FONT, fontSize: COMMENT_TEXT_HEIGHT, align: 'left' },
  });
  t.tint = color;
  t.alpha = c.resolved ? 0.7 : 1;
  t.anchor.set(0, 0);
  t.position.set(s + 6, -s);
  inner.addChild(t);

  inner.scale.set(commentScale(c)); // kullanıcı boyut çarpanı (iğne noktası 0,0 sabit)
  g.addChild(inner);
  g.position.set(c.position.x, c.position.y);
  return g;
}
