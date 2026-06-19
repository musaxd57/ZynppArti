import { describe, it, expect } from 'vitest';
import { screenToWorld, worldToScreen, zoomAt, clamp, DEFAULT_CAMERA } from './transform';

describe('camera transforms', () => {
  it('screenToWorld and worldToScreen are inverses', () => {
    const cam = { x: 100, y: 50, zoom: 2 };
    const world = { x: 12, y: 34 };
    const screen = worldToScreen(world, cam);
    const back = screenToWorld(screen, cam);
    expect(back.x).toBeCloseTo(world.x);
    expect(back.y).toBeCloseTo(world.y);
  });

  it('identity camera maps a screen point to itself', () => {
    const p = { x: 7, y: 9 };
    expect(screenToWorld(p, DEFAULT_CAMERA)).toEqual(p);
  });

  it('zoomAt keeps the pivot point stationary on screen', () => {
    const cam = { x: 0, y: 0, zoom: 1 };
    const pivot = { x: 200, y: 150 };
    const zoomed = zoomAt(cam, pivot, 3);

    // Pivotun dünya karşılığı, zoom sonrası yine aynı ekran noktasına düşmeli.
    const worldPivot = screenToWorld(pivot, cam);
    const screenAfter = worldToScreen(worldPivot, zoomed);
    expect(screenAfter.x).toBeCloseTo(pivot.x);
    expect(screenAfter.y).toBeCloseTo(pivot.y);
    expect(zoomed.zoom).toBe(3);
  });
});

describe('clamp', () => {
  it('bounds a value to the given range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(42, 0, 10)).toBe(10);
  });
});
