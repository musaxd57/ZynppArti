import type { Comment } from './entities';

/** Yorum iğnesi (💬) baloncuk boyutu — cm (dünya birimi). */
export const COMMENT_PIN = 26;
/** Yorum metni satır yüksekliği — cm. */
export const COMMENT_TEXT_HEIGHT = 22;

/** Yorumun (iğne + metin) yaklaşık sınır kutusu boyutu (cm) — bounds/hit-test için. */
export function commentSize(c: Comment): { w: number; h: number } {
  const lines = c.text.split('\n');
  const longest = lines.reduce((m, l) => Math.max(m, l.length), 0);
  const textW = longest * COMMENT_TEXT_HEIGHT * 0.55;
  const h = Math.max(COMMENT_PIN, lines.length * COMMENT_TEXT_HEIGHT);
  return { w: COMMENT_PIN + 6 + textW, h };
}
