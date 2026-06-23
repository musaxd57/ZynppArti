import type { Graphics } from 'pixi.js';
import {
  annotationSize,
  blockCorners,
  commentSize,
  dimensionGeometry,
  openingFrame,
  sheetModelSize,
  type Entity,
  type EntityStore,
} from '@zynpparti/document';

/**
 * Bir entity'yi tek renkle vurgular (seçim / hover / ghost / silme önizlemesi ortak). Tüm entity
 * tipleri için çalışır → SelectTool ve EraseTool aynı kodu kullanır (VISUAL-CRAFT §5/§6 tutarlılığı).
 * `g.stroke` çağrılır; çağıran isterse önce `g.clear()` yapar. Kalınlıklar ekran-sabit (pixelSize).
 */
export function highlightEntity(
  g: Graphics,
  entity: Entity,
  store: EntityStore,
  color: number,
  alpha: number,
  pixelSize: number,
): void {
  const px = pixelSize;
  switch (entity.type) {
    case 'wall':
      g.moveTo(entity.start.x, entity.start.y)
        .lineTo(entity.end.x, entity.end.y)
        .stroke({ width: entity.thickness + 4 * px, color, alpha, cap: 'round' });
      break;
    case 'opening': {
      const w = store.get(entity.wallId);
      if (w?.type !== 'wall') break;
      const f = openingFrame(entity, w);
      const hx = f.normal.x * (f.thickness / 2);
      const hy = f.normal.y * (f.thickness / 2);
      g.poly([
        f.a.x + hx, f.a.y + hy, f.b.x + hx, f.b.y + hy,
        f.b.x - hx, f.b.y - hy, f.a.x - hx, f.a.y - hy,
      ]).stroke({ width: 2.5 * px, color, alpha });
      break;
    }
    case 'dimension': {
      const d = dimensionGeometry(entity);
      g.moveTo(d.da.x, d.da.y)
        .lineTo(d.db.x, d.db.y)
        .stroke({ width: 3 * px, color, alpha, cap: 'round' });
      break;
    }
    case 'section':
      g.moveTo(entity.a.x, entity.a.y)
        .lineTo(entity.b.x, entity.b.y)
        .stroke({ width: 3 * px, color, alpha, cap: 'round' });
      break;
    case 'parcel': {
      const b = entity.boundary;
      if (b.length >= 2) {
        g.moveTo(b[0]!.x, b[0]!.y);
        for (let i = 1; i < b.length; i++) g.lineTo(b[i]!.x, b[i]!.y);
        g.closePath();
        g.stroke({ width: 2 * px, color, alpha });
      }
      break;
    }
    case 'block': {
      const c = blockCorners(entity);
      g.poly(c.flatMap((p) => [p.x, p.y])).stroke({ width: 2 * px, color, alpha });
      break;
    }
    case 'annotation': {
      const { w, h } = annotationSize(entity);
      g.rect(entity.position.x, entity.position.y, w, h).stroke({ width: 1.5 * px, color, alpha });
      break;
    }
    case 'sheet': {
      const { w, h } = sheetModelSize(entity);
      g.rect(entity.position.x, entity.position.y, w, h).stroke({ width: 2 * px, color, alpha });
      break;
    }
    case 'comment': {
      // İğne `position`ta; baloncuk+metin YUKARI doğru (bounds/hit-test ile aynı kutu).
      const { w, h } = commentSize(entity);
      g.rect(entity.position.x, entity.position.y - h, w, h).stroke({ width: 1.5 * px, color, alpha });
      break;
    }
    case 'space':
      break; // mahaller tıkla-seçilmez/silinmez
  }
}
