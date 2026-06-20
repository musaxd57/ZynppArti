import type { Vec2 } from '@zynpparti/geometry';
import { distanceToSegment } from '@zynpparti/geometry';
import { dimensionGeometry, openingFrame, type EntityId, type EntityStore } from '@zynpparti/document';
import type { SpatialIndex } from './spatial-index';

/**
 * Bir dünya noktasının altındaki entity'yi bulur (ENGINEERING-NOTES §2):
 * broad phase (rbush AABB ile aday topla) → narrow phase (kesin geometri).
 * Birden çok aday varsa en yakını döner. `tolerance` dünya birimidir (cm).
 */
export function hitTest(
  store: EntityStore,
  index: SpatialIndex,
  point: Vec2,
  tolerance = 5,
): EntityId | null {
  const candidates = index.search({
    minX: point.x - tolerance,
    minY: point.y - tolerance,
    maxX: point.x + tolerance,
    maxY: point.y + tolerance,
  });

  let bestId: EntityId | null = null;
  let bestDist = Infinity;

  for (const id of candidates) {
    const entity = store.get(id);
    if (!entity) continue;
    if (entity.type === 'wall') {
      const d = distanceToSegment(point, entity.start, entity.end);
      const reach = entity.thickness / 2 + tolerance;
      if (d <= reach && d < bestDist) {
        bestDist = d;
        bestId = id;
      }
    } else if (entity.type === 'opening') {
      const wall = store.get(entity.wallId);
      if (wall?.type === 'wall') {
        const f = openingFrame(entity, wall);
        const d = Math.hypot(point.x - f.center.x, point.y - f.center.y);
        const reach = entity.width / 2 + tolerance;
        if (d <= reach && d < bestDist) {
          bestDist = d;
          bestId = id;
        }
      }
    } else if (entity.type === 'dimension') {
      const g = dimensionGeometry(entity);
      const d = distanceToSegment(point, g.da, g.db);
      if (d <= tolerance && d < bestDist) {
        bestDist = d;
        bestId = id;
      }
    }
  }
  return bestId;
}
