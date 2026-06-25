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

type Pt = { readonly x: number; readonly y: number };

/**
 * Noktalardan TEK GEÇİŞTE AABB — `Math.min(...spread)` ve `.map()` ara dizileri YOK (hot-path:
 * her insert + her sürükle-kare'sinde `index.update` için çağrılır; 500k entity'de tahsis baskısını
 * azaltır). Herhangi bir koordinat NaN/Infinity ise güvenli dejenere kutu döner (rbush'ı bozmaz;
 * 99a504c'deki kilitli NaN-safe davranışını korur). `pad` kenar boşluğu (ör. duvar yarı-kalınlığı).
 */
function aabbOfPoints(pts: readonly Pt[], pad = 0): AABB {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  if (!Number.isFinite(minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0 }; // boş dizi
  return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad };
}

/** Boşluğun (kapı/pencere) duvardan türetilmiş AABB'si. Duvar çözümü gerektiğinden ayrı. */
export function openingBounds(opening: Opening, wall: Wall): AABB {
  const f = openingFrame(opening, wall);
  return aabbOfPoints([f.a, f.b], wall.thickness / 2);
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
    case 'dimension': {
      const g = dimensionGeometry(entity);
      return aabbOfPoints([g.a, g.b, g.da, g.db]);
    }
    case 'section': {
      // Yalnız kesim çizgisini sınırla; ok bayrakları/etiketler ekran-sabit dekordur (culling için yeterli).
      return aabbOfPoints([entity.a, entity.b]);
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
    case 'parcel':
      return aabbOfPoints(entity.boundary);
    case 'block':
      return aabbOfPoints(blockCorners(entity));
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
