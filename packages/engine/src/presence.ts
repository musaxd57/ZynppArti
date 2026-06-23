import { Container, Graphics } from 'pixi.js';

/** Uzak bir kullanıcının imleci (dünya koordinatı + renk). */
export interface RemoteCursor {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly color: number;
}

/**
 * Presence katmanı (Faz 3 multiplayer): uzak kullanıcıların imleçlerini dünya overlay'inde çizer
 * (kamera dönüşümü otomatik uygulanır). İmleç boyutu pixelSize ile ekran-sabit tutulur.
 */
export function createPresenceLayer(parent: Container): {
  update(cursors: readonly RemoteCursor[], pixelSize: number): void;
  destroy(): void;
} {
  const root = new Container();
  parent.addChild(root);
  const byId = new Map<string, Graphics>();

  function drawCursor(g: Graphics, color: number, px: number): void {
    g.clear();
    const s = 16 * px; // ekran-sabit imleç boyutu
    g.moveTo(0, 0)
      .lineTo(0, s)
      .lineTo(s * 0.3, s * 0.74)
      .lineTo(s * 0.66, s * 0.66)
      .closePath()
      .fill({ color, alpha: 0.95 })
      .stroke({ width: 1.4 * px, color: 0x0e0e10, alpha: 0.55 });
  }

  return {
    update(cursors: readonly RemoteCursor[], pixelSize: number): void {
      const seen = new Set<string>();
      for (const c of cursors) {
        seen.add(c.id);
        let g = byId.get(c.id);
        if (!g) {
          g = new Graphics();
          root.addChild(g);
          byId.set(c.id, g);
        }
        drawCursor(g, c.color, pixelSize);
        g.position.set(c.x, c.y);
      }
      for (const [id, g] of byId) {
        if (!seen.has(id)) {
          g.destroy();
          byId.delete(id);
        }
      }
    },
    destroy(): void {
      root.destroy({ children: true });
      byId.clear();
    },
  };
}
