import type { Vec2 } from '@zynpparti/geometry';
import type { Dimension } from './entities';

/**
 * Ölçülendirme geometrisi — saf fonksiyonlar (UI yok). Ölçü çizgisi, ölçülen doğruya `offset`
 * kadar dik kaydırılmış paralel bir çizgidir; uçlardan uzatma (extension) çizgileri iner.
 */

export interface DimensionGeometry {
  readonly a: Vec2;
  readonly b: Vec2;
  /** Ölçü çizgisinin uçları (offset uygulanmış). */
  readonly da: Vec2;
  readonly db: Vec2;
  /** Ölçü çizgisinin ortası (metin için). */
  readonly mid: Vec2;
  readonly dir: Vec2;
  readonly normal: Vec2;
  /** Ölçülen uzunluk (cm). */
  readonly length: number;
}

export function dimensionGeometry(d: Dimension): DimensionGeometry {
  const dx = d.b.x - d.a.x;
  const dy = d.b.y - d.a.y;
  const len = Math.hypot(dx, dy) || 1;
  const dir = { x: dx / len, y: dy / len };
  const normal = { x: -dir.y, y: dir.x };
  const ox = normal.x * d.offset;
  const oy = normal.y * d.offset;
  const da = { x: d.a.x + ox, y: d.a.y + oy };
  const db = { x: d.b.x + ox, y: d.b.y + oy };
  return {
    a: d.a,
    b: d.b,
    da,
    db,
    mid: { x: (da.x + db.x) / 2, y: (da.y + db.y) / 2 },
    dir,
    normal,
    length: Math.hypot(dx, dy),
  };
}

/** Uzunluğu yerel biçimde döndürür: ≥100 cm ise metre (3,50 m), değilse cm (85 cm). */
export function formatLength(cm: number): string {
  if (cm >= 100) return `${(cm / 100).toFixed(2).replace('.', ',')} m`;
  return `${Math.round(cm)} cm`;
}
