import { describe, it, expect } from 'vitest';
import { EntityStore } from './src/store';
import { RoomManager } from './src/rooms';
import type { Space, Wall } from './src/entities';

let n = 0;
function wall(x1: number, y1: number, x2: number, y2: number): Wall {
  return { id: `w${n++}`, type: 'wall', layerId: 'default',
    start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: 10 };
}
function spaces(store: EntityStore): Space[] {
  return store.all().filter((e): e is Space => e.type === 'space');
}

describe('dup assignment', () => {
  it('subdividing a SMALL room propagates same name to both children', () => {
    const store = new EntityStore();
    // 80x80 small room (small enough that half-centroids fall within 50cm tol)
    for (const w of [
      wall(0, 0, 80, 0), wall(80, 0, 80, 80),
      wall(80, 80, 0, 80), wall(0, 80, 0, 0),
    ]) store.put(w);
    const rm = new RoomManager(store);
    expect(spaces(store)).toHaveLength(1);
    // name the room
    const s = spaces(store)[0]!;
    store.put({ ...s, name: 'Salon', roomType: 'living', material: 'parke' });
    // subdivide with a vertical wall at x=40
    const divider = wall(40, 0, 40, 80);
    store.put(divider);
    rm.recompute();
    const result = spaces(store);
    console.log('FACE COUNT:', result.length);
    for (const r of result) {
      const cx = r.boundary.reduce((a, p) => a + p.x, 0) / r.boundary.length;
      const cy = r.boundary.reduce((a, p) => a + p.y, 0) / r.boundary.length;
      console.log('  name=', r.name, 'roomType=', r.roomType, 'centroid=', cx.toFixed(1), cy.toFixed(1));
    }
    const named = result.filter((r) => r.name === 'Salon');
    console.log('NAMED-AS-SALON COUNT:', named.length);
    rm.destroy();
  });
});
