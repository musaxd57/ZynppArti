import type { Entity } from './entities';

/**
 * Kopyala-yapıştır / çoğaltma için saf geometri yardımcıları (UI'dan bağımsız → test edilebilir).
 *
 * Mahal (space) duvarlardan **türetilir** (RoomManager) → kopyalanmaz; boşluk (opening) bir duvara
 * `t` ile bağlıdır → tek başına kopyalanması anlamsız. Geri kalan tipler serbest kopyalanır.
 */
export function isClonable(e: Entity): boolean {
  return (
    e.type === 'wall' ||
    e.type === 'block' ||
    e.type === 'annotation' ||
    e.type === 'dimension' ||
    e.type === 'parcel' ||
    e.type === 'sheet' ||
    e.type === 'section' ||
    e.type === 'comment'
  );
}

/** Bir entity'yi (dx,dy) kadar kaydırılmış kopyasını döndürür (id ve tip korunur). */
export function offsetEntity(e: Entity, dx: number, dy: number): Entity {
  switch (e.type) {
    case 'wall':
      return {
        ...e,
        start: { x: e.start.x + dx, y: e.start.y + dy },
        end: { x: e.end.x + dx, y: e.end.y + dy },
      };
    case 'block':
    case 'annotation':
    case 'sheet':
    case 'comment':
      return { ...e, position: { x: e.position.x + dx, y: e.position.y + dy } };
    case 'dimension':
    case 'section':
      return {
        ...e,
        a: { x: e.a.x + dx, y: e.a.y + dy },
        b: { x: e.b.x + dx, y: e.b.y + dy },
      };
    case 'parcel':
      return { ...e, boundary: e.boundary.map((p) => ({ x: p.x + dx, y: p.y + dy })) };
    // Türetilmiş/bağlı tipler kaydırılarak kopyalanmaz (isClonable false) → olduğu gibi döner.
    case 'space':
    case 'opening':
      return e;
  }
}
