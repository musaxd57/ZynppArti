import type { Wall } from './entities';

/** Test için basit bir duvar üretir (birim: cm). */
export function makeWall(
  id: string,
  start = { x: 0, y: 0 },
  end = { x: 100, y: 0 },
  thickness = 10,
): Wall {
  return { id, type: 'wall', layerId: 'default', start, end, thickness };
}
