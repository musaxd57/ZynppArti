import type { EntityId, Wall } from './entities';
import type { EntityStore } from './store';

/** Test için basit bir duvar üretir (birim: cm). */
export function makeWall(
  id: string,
  start = { x: 0, y: 0 },
  end = { x: 100, y: 0 },
  thickness = 10,
): Wall {
  return { id, type: 'wall', layerId: 'default', start, end, thickness };
}

/** Store'dan bir duvarı tip-daraltarak alır (test kolaylığı). */
export function wallOf(store: EntityStore, id: EntityId): Wall {
  const e = store.get(id);
  if (!e || e.type !== 'wall') throw new Error(`wall bulunamadı: ${id}`);
  return e;
}
