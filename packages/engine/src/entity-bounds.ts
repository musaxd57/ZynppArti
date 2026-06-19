import type { Entity } from '@zynpparti/document';
import type { AABB } from './spatial-index';

/** Bir entity'nin eksen-hizalı sınır kutusu (AABB). Mekânsal indeks bunu kullanır. */
export function entityBounds(entity: Entity): AABB {
  switch (entity.type) {
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
