import { describe, it, expect } from 'vitest';
import type { Wall } from '@zynpparti/document';
import { entityBounds } from './entity-bounds';

describe('entityBounds', () => {
  it('expands a wall AABB by half its thickness', () => {
    const wall: Wall = {
      id: 'w1',
      type: 'wall',
      layerId: 'default',
      start: { x: 0, y: 0 },
      end: { x: 100, y: 0 },
      thickness: 20,
    };
    expect(entityBounds(wall)).toEqual({ minX: -10, minY: -10, maxX: 110, maxY: 10 });
  });

  it('handles a diagonal wall', () => {
    const wall: Wall = {
      id: 'w2',
      type: 'wall',
      layerId: 'default',
      start: { x: 50, y: 80 },
      end: { x: 10, y: 20 },
      thickness: 4,
    };
    expect(entityBounds(wall)).toEqual({ minX: 8, minY: 18, maxX: 52, maxY: 82 });
  });
});
