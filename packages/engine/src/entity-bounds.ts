import { openingFrame, type Entity, type Opening, type Wall } from '@zynpparti/document';
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
export function entityBounds(entity: Entity): AABB {
  switch (entity.type) {
    case 'opening':
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    case 'wall': {
      const half = entity.thickness / 2;
      return {
        minX: Math.min(entity.start.x, entity.end.x) - half,
        minY: Math.min(entity.start.y, entity.end.y) - half,
        maxX: Math.max(entity.start.x, entity.end.x) + half,
        maxY: Math.max(entity.start.y, entity.end.y) + half,
      };
    }
    case 'space': {
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
  }
}
