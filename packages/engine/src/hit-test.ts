import type { Vec2 } from '@zynpparti/geometry';
import { distanceToSegment, distanceToPolygonBoundary, segmentIntersection, pointInPolygon } from '@zynpparti/geometry';
import {
  commentSize,
  dimensionGeometry,
  openingFrame,
  pointInAnnotation,
  pointInBlock,
  sheetModelSize,
  type EntityId,
  type EntityStore,
} from '@zynpparti/document';
import type { SpatialIndex } from './spatial-index';
import { entityBounds } from './entity-bounds';

interface Rect {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function pointInRect(p: Vec2, r: Rect): boolean {
  return p.x >= r.minX && p.x <= r.maxX && p.y >= r.minY && p.y <= r.maxY;
}

/** Eksen-hizalı dikdörtgenin köşeleri (kesişim testleri için). */
function rectCorners(r: Rect): Vec2[] {
  return [
    { x: r.minX, y: r.minY },
    { x: r.maxX, y: r.minY },
    { x: r.maxX, y: r.maxY },
    { x: r.minX, y: r.maxY },
  ];
}

/** [a,b] segmenti dikdörtgeni kesiyor mu (ucu içeride ya da bir kenarı kesiyor)? */
function segmentIntersectsRect(a: Vec2, b: Vec2, r: Rect): boolean {
  if (pointInRect(a, r) || pointInRect(b, r)) return true;
  const c = rectCorners(r);
  for (let i = 0; i < 4; i++) {
    if (segmentIntersection(a, b, c[i]!, c[(i + 1) % 4]!)) return true;
  }
  return false;
}

/** Poligon dikdörtgenle örtüşüyor mu (köşe içeride / kenar kesişiyor / dikdörtgen poligon içinde)? */
function polygonIntersectsRect(ring: readonly Vec2[], r: Rect): boolean {
  for (const v of ring) if (pointInRect(v, r)) return true;
  for (const c of rectCorners(r)) if (pointInPolygon(c, ring)) return true;
  for (let i = 0; i < ring.length; i++) {
    if (segmentIntersectsRect(ring[i]!, ring[(i + 1) % ring.length]!, r)) return true;
  }
  return false;
}

function aabbOverlapsRect(e: Parameters<typeof entityBounds>[0], r: Rect): boolean {
  const b = entityBounds(e);
  return b.minX <= r.maxX && b.maxX >= r.minX && b.minY <= r.maxY && b.maxY >= r.minY;
}

/**
 * Kutu-seçim (marquee) narrow-phase: rbush AABB (broad) adaylarından gerçek geometrisi dikdörtgenle
 * kesişenleri döner. Eski kod yalnız broad-phase'di → çapraz bir duvarın BÜYÜK AABB'si, duvardan uzak
 * boş bir köşeye çizilen kutuda bile onu seçtiriyordu (denetim). Segment-bazlı tipler için kesin
 * segment-dikdörtgen testi; kutu-bazlı (eksen-hizalı) tipler için AABB zaten kesin.
 */
export function marqueeHitTest(
  store: EntityStore,
  index: SpatialIndex,
  rect: Rect,
  skipLayer?: (layerId: string) => boolean,
): EntityId[] {
  const out: EntityId[] = [];
  for (const id of index.search(rect)) {
    const e = store.get(id);
    if (!e || e.type === 'space') continue;
    if (skipLayer?.(e.layerId)) continue;
    let hit = false;
    if (e.type === 'wall') hit = segmentIntersectsRect(e.start, e.end, rect);
    else if (e.type === 'section') hit = segmentIntersectsRect(e.a, e.b, rect);
    else if (e.type === 'dimension') {
      const g = dimensionGeometry(e);
      hit = segmentIntersectsRect(g.da, g.db, rect);
    } else if (e.type === 'opening') {
      const wall = store.get(e.wallId);
      hit = wall?.type === 'wall' ? pointInRect(openingFrame(e, wall).center, rect) : false;
    } else if (e.type === 'parcel') hit = polygonIntersectsRect(e.boundary, rect);
    else if (e.type === 'block') {
      // Dönebilen blok: ayak izi köşelerinden biri kutuda VEYA kutu köşesi blok içinde.
      hit = pointInRect(e.position, rect) || rectCorners(rect).some((c) => pointInBlock(e, c));
    } else {
      // annotation/comment/sheet: eksen-hizalı kutu → AABB örtüşmesi kesin.
      hit = aabbOverlapsRect(e, rect);
    }
    if (hit) out.push(id);
  }
  return out;
}

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
    } else if (entity.type === 'section') {
      const d = distanceToSegment(point, entity.a, entity.b);
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
    } else if (entity.type === 'comment') {
      // Yorum baloncuğu position'ın YUKARISINDA → kutu testi.
      const { w, h } = commentSize(entity);
      const px = entity.position.x;
      const py = entity.position.y;
      if (point.x >= px && point.x <= px + w && point.y >= py - h && point.y <= py) {
        const d = Math.hypot(point.x - px, point.y - py);
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
