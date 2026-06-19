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
  }
}
