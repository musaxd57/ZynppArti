import { describe, it, expect } from 'vitest';
import { computeScaleFactor, scalePoint, scaleWall } from './calibrate';
import type { Wall } from '@zynpparti/document';

describe('computeScaleFactor', () => {
  it('returns realDistance / measuredDistance', () => {
    // çizimde 50 birim ölçülüyor ama gerçekte 500 cm olmalı → 10x
    expect(computeScaleFactor({ x: 0, y: 0 }, { x: 50, y: 0 }, 500)).toBe(10);
  });

  it('throws when the two points coincide', () => {
    expect(() => computeScaleFactor({ x: 1, y: 1 }, { x: 1, y: 1 }, 100)).toThrow();
  });
});

describe('scalePoint / scaleWall', () => {
  it('scales a point about the origin', () => {
    expect(scalePoint({ x: 10, y: 0 }, 2, { x: 0, y: 0 })).toEqual({ x: 20, y: 0 });
    expect(scalePoint({ x: 10, y: 0 }, 2, { x: 10, y: 0 })).toEqual({ x: 10, y: 0 });
  });

  it('scales a wall including thickness, about an origin', () => {
    const wall: Wall = {
      id: 'w1',
      type: 'wall',
      layerId: 'default',
      start: { x: 0, y: 0 },
      end: { x: 50, y: 0 },
      thickness: 15,
    };
    const scaled = scaleWall(wall, 10, { x: 0, y: 0 });
    expect(scaled.end.x).toBe(500);
    expect(scaled.thickness).toBe(150);
  });
});
