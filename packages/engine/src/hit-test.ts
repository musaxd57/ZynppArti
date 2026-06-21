import type { Vec2 } from '@zynpparti/geometry';
import { distanceToSegment, distanceToPolygonBoundary } from '@zynpparti/geometry';
import {
  dimensionGeometry,
  openingFrame,
  pointInAnnotation,
  pointInBlock,
  sheetModelSize,
  type EntityId,
  type EntityStore,
} from '@zynpparti/document';
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
  skipLayer?: (layerId: string) => boolean,
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
    if (skipLayer?.(entity.layerId)) continue; // gizli/kilitli katman seçilemez
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
    } else if (entity.type === 'parcel') {
      const d = distanceToPolygonBoundary(point, entity.boundary);
      if (d <= tolerance && d < bestDist) {
        bestDist = d;
        bestId = id;
      }
    } else if (entity.type === 'block') {
      // Ayak izinin içindeyse seç (dolu nesne); en küçük alanlı blok önceliği için merkez uzaklığı.
      if (pointInBlock(entity, point)) {
        const d = Math.hypot(point.x - entity.position.x, point.y - entity.position.y);
        if (d < bestDist) {
          bestDist = d;
          bestId = id;
        }
      }
    } else if (entity.type === 'annotation') {
      // Metin kutusunun içindeyse seç; köşe uzaklığını mesafe ölçütü olarak kullan.
      if (pointInAnnotation(entity, point)) {
        const d = Math.hypot(point.x - entity.position.x, point.y - entity.position.y);
        if (d < bestDist) {
          bestDist = d;
          bestId = id;
        }
      }
    } else if (entity.type === 'sheet') {
      // Pafta yalnız ÇERÇEVESİNDEN seçilir (iç alana tıklamak çizimi seçmeyi engellemesin).
      const { w, h } = sheetModelSize(entity);
      const o = entity.position;
      const corners = [
        o,
        { x: o.x + w, y: o.y },
        { x: o.x + w, y: o.y + h },
        { x: o.x, y: o.y + h },
      ];
      const d = distanceToPolygonBoundary(point, corners);
      if (d <= tolerance && d < bestDist) {
        bestDist = d;
        bestId = id;
      }
    }
  }
  return bestId;
}
