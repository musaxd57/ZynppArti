import { BitmapText } from 'pixi.js';
import type { Annotation } from '@zynpparti/document';
import { ROOM_FONT } from './charset';

/**
 * Açıklama metnini (annotation) dünya uzayında çizer. `fontSize` = metin yüksekliği (cm) →
 * mahal etiketleriyle aynı şekilde dünya birimidir, container zoom'uyla ölçeklenir. TR_CHARSET atlası.
 * Sol-üst köşeye demirlenir (entity.position = ekleme noktası).
 */
export function buildAnnotation(a: Annotation): BitmapText {
  const t = new BitmapText({
    text: a.text,
    style: { fontFamily: ROOM_FONT, fontSize: a.height, align: 'left' },
  });
  t.anchor.set(0, 0);
  t.position.set(a.position.x, a.position.y);
  if (a.color != null) t.tint = a.color; // içe-aktarma kaynak rengi (DXF metin rengi korunur)
  return t;
}
