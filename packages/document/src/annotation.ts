import type { Annotation } from './entities';

/** Varsayılan metin yüksekliği — cm (dünya birimi). */
export const DEFAULT_ANNOTATION_HEIGHT = 25;

/**
 * Metnin kaba eksen-hizalı boyutu (cm) — hit-test + AABB için. Gerçek glyph ölçümü engine'de
 * (BitmapText) yapılır; bu saf yaklaşım broad-phase ve tıklama kutusu için yeterli (geniş tutulur).
 * Genişlik = en uzun satır × yükseklik × ortalama karakter-en oranı; yükseklik = satır sayısı × satır aralığı.
 */
export function annotationSize(a: Annotation): { w: number; h: number } {
  const lines = a.text.length ? a.text.split('\n') : [''];
  const cols = Math.max(1, ...lines.map((l) => l.length));
  return { w: cols * a.height * 0.6, h: lines.length * a.height * 1.2 };
}

/** Nokta annotation kutusunun içinde mi? (sol-üst köşeden +genişlik/+yükseklik). */
export function pointInAnnotation(a: Annotation, p: { x: number; y: number }): boolean {
  const { w, h } = annotationSize(a);
  return p.x >= a.position.x && p.x <= a.position.x + w && p.y >= a.position.y && p.y <= a.position.y + h;
}
