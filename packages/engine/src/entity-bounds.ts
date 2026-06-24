import {
  annotationSize,
  commentSize,
  blockCorners,
  dimensionGeometry,
  openingFrame,
  sheetModelSize,
  type Entity,
  type Opening,
  type Wall,
} from '@zynpparti/document';
import type { AABB } from './spatial-index';

/** Boşluğun (kapı/pencere) duvardan türetilmiş AABB'si. Duvar çözümü gerektiğinden ayrı. */
export function openingBounds(opening: Opening, wall: Wall): AABB {
  const f = openingFrame(opening, wall);
  const half = wall.thickness / 2;
  const xs = [f.a.x, f.b.x];
  const ys = [f.a.y, f.b.y];
  return {
    minX: Math.min(...xs) - half,
    minY: Math.min(...ys) - half,
    maxX: Math.max(...xs) + half,
    maxY: Math.max(...ys) + half,
  };
}

/**
 * Bir entity'nin eksen-hizalı sınır kutusu (AABB). Mekânsal indeks bunu kullanır.
 * Boşluk (opening) duvara bağlı olduğundan gerçek kutusu `openingBounds` ile (duvar çözülerek)
 * EntityLayer'da hesaplanır; burada güvenli dejenere kutu döner.
 */
/** xs/ys'den AABB; NaN/Infinity varsa güvenli dejenere kutu (rbush index'i bozulmasın). */
function aabbFrom(xs: number[], ys: number[]): AABB {
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  return { minX, minY, maxX, maxY };
}

export function entityBounds(entity: Entity): AABB {
  switch (entity.type) {
    case 'opening':
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    case 'dimension': {
      const g = dimensionGeometry(entity);
      return aabbFrom([g.a.x, g.b.x, g.da.x, g.db.x], [g.a.y, g.b.y, g.da.y, g.db.y]);
    }
    case 'section': {
      // Yalnız kesim çizgisini sınırla; ok bayrakları/etiketler ekran-sabit dekordur (culling için yeterli).
      return aabbFrom([entity.a.x, entity.b.x], [entity.a.y, entity.b.y]);
    }
    case 'wall': {
      const half = entity.thickness / 2;
      return {
        minX: Math.min(entity.start.x, entity.end.x) - half,
        minY: Math.min(entity.start.y, entity.end.y) - half,
        maxX: Math.max(entity.start.x, entity.end.x) + half,
        maxY: Math.max(entity.start.y, entity.end.y) + half,
      };
    }
    case 'space':
    case 'parcel': {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const p of entity.boundary) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      }
      if (!Number.isFinite(minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
      return { minX, minY, maxX, maxY };
    }
    case 'block': {
      const corners = blockCorners(entity);
      return aabbFrom(corners.map((p) => p.x), corners.map((p) => p.y));
    }
    case 'annotation': {
      const { w, h } = annotationSize(entity);
      return {
        minX: entity.position.x,
        minY: entity.position.y,
        maxX: entity.position.x + w,
        maxY: entity.position.y + h,
      };
    }
    case 'comment': {
      // İğne (kuyruk) `position`ta; baloncuk+metin yukarıda → kutu position.y'den yukarı.
      const { w, h } = commentSize(entity);
      return {
        minX: entity.position.x,
        minY: entity.position.y - h,
        maxX: entity.position.x + w,
        maxY: entity.position.y,
      };
    }
    case 'sheet': {
      const { w, h } = sheetModelSize(entity);
      return {
        minX: entity.position.x,
        minY: entity.position.y,
        maxX: entity.position.x + w,
        maxY: entity.position.y + h,
      };
    }
  }
}
