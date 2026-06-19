import { Graphics } from 'pixi.js';
import type { Wall } from '@zynpparti/document';

const WALL_COLOR = 0xe0e0e0;

/**
 * Bir duvarı kalınlıklı segment olarak verilen Graphics'e çizer (önce temizler).
 * Kalınlık dünya birimidir (cm) → world container ile birlikte ölçeklenir (gerçek kalınlık).
 */
export function drawWall(g: Graphics, wall: Wall): void {
  g.clear();
  g.moveTo(wall.start.x, wall.start.y)
    .lineTo(wall.end.x, wall.end.y)
    .stroke({ width: wall.thickness, color: WALL_COLOR, cap: 'butt' });
}
