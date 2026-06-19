import type { Vec2 } from '@zynpparti/geometry';

/**
 * Kamera: dünya ↔ ekran dönüşümünü tanımlar.
 * - `zoom`: ölçek (1 = birebir).
 * - `x`, `y`: dünya orijininin ekrandaki (piksel) konumu (pan ofseti).
 *
 * Eşleme: ekran = dünya * zoom + (x, y).
 * Bu saf matematik; PixiJS'in `Container.position/scale` değerleriyle birebir örtüşür.
 */
export interface Camera {
  readonly x: number;
  readonly y: number;
  readonly zoom: number;
}

export const DEFAULT_CAMERA: Camera = { x: 0, y: 0, zoom: 1 };

/** Ekran (piksel) → dünya koordinatı. */
export function screenToWorld(screen: Vec2, camera: Camera): Vec2 {
  return {
    x: (screen.x - camera.x) / camera.zoom,
    y: (screen.y - camera.y) / camera.zoom,
  };
}

/** Dünya → ekran (piksel) koordinatı. */
export function worldToScreen(world: Vec2, camera: Camera): Vec2 {
  return {
    x: world.x * camera.zoom + camera.x,
    y: world.y * camera.zoom + camera.y,
  };
}

/**
 * İmleç-merkezli zoom: `screenPivot` ekran noktası sabit kalacak şekilde yeni zoom uygular.
 * (CLAUDE.md §8.1 — koordinat hizalamasını bozmadan zoom yapmanın doğru yolu.)
 */
export function zoomAt(camera: Camera, screenPivot: Vec2, newZoom: number): Camera {
  const worldPivot = screenToWorld(screenPivot, camera);
  return {
    zoom: newZoom,
    x: screenPivot.x - worldPivot.x * newZoom,
    y: screenPivot.y - worldPivot.y * newZoom,
  };
}

/** Bir sayıyı [min, max] aralığına kıstır. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
