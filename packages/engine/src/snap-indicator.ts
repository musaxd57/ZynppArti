import { Container, Graphics } from 'pixi.js';
import type { Vec2 } from '@zynpparti/geometry';

/** Snap göstergesinin rengi — dikkat çeken ama paleti bozmayan camgöbeği. */
const SNAP_COLOR = 0x39e0ff;

/**
 * Snap göstergesi (VISUAL-CRAFT §6 mikro-etkileşim): imleç bir uç noktaya yakalandığında o noktada
 * küçük bir eşkenar dörtgen işaret gösterir → kullanıcı tıklamadan önce nereye oturacağını görür.
 * Ekran-sabit (pixelSize); araç katmanına (overlay) eklenir.
 */
export function createSnapIndicator(container: Container): {
  show(point: Vec2, pixelSize: number): void;
  hide(): void;
  destroy(): void;
} {
  const g = new Graphics();
  container.addChild(g);
  return {
    show(point: Vec2, pixelSize: number): void {
      const r = 6 * pixelSize;
      g.clear();
      g.moveTo(point.x, point.y - r)
        .lineTo(point.x + r, point.y)
        .lineTo(point.x, point.y + r)
        .lineTo(point.x - r, point.y)
        .closePath()
        .stroke({ width: 1.5 * pixelSize, color: SNAP_COLOR, alpha: 0.95 });
    },
    hide(): void {
      g.clear();
    },
    destroy(): void {
      g.destroy();
    },
  };
}
