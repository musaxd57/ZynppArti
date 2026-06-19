import { Graphics } from 'pixi.js';
import { RemoveEntity, type EntityId, type Wall } from '@zynpparti/document';
import { hitTest, type SceneTool, type ScenePointer } from '@zynpparti/engine';
import type { ToolContext } from './context';

const HIT_PX = 8;
const ERASE_COLOR = 0xff5a5a;

/** Tıkla-sil aracı: imlecin altındaki entity'yi vurgular, tıklayınca siler. */
export class EraseTool implements SceneTool {
  private readonly hoverGfx = new Graphics();
  private hoveredId: EntityId | null = null;

  constructor(private readonly ctx: ToolContext) {
    this.ctx.overlay.addChild(this.hoverGfx);
  }

  onPointerMove(p: ScenePointer): void {
    this.hoveredId = hitTest(this.ctx.store, this.ctx.index, p.world, HIT_PX * this.ctx.pixelSize());
    this.renderHover();
  }

  onPointerDown(p: ScenePointer): void {
    const id = hitTest(this.ctx.store, this.ctx.index, p.world, HIT_PX * this.ctx.pixelSize());
    if (id) {
      this.hoveredId = null;
      this.hoverGfx.clear();
      this.ctx.history.dispatch(new RemoveEntity(id));
    }
  }

  onDeactivate(): void {
    this.hoveredId = null;
    this.hoverGfx.clear();
  }

  private renderHover(): void {
    this.hoverGfx.clear();
    if (!this.hoveredId) return;
    const e = this.ctx.store.get(this.hoveredId);
    if (e?.type === 'wall') this.strokeWall(e);
  }

  private strokeWall(wall: Wall): void {
    this.hoverGfx
      .moveTo(wall.start.x, wall.start.y)
      .lineTo(wall.end.x, wall.end.y)
      .stroke({ width: wall.thickness + 4 * this.ctx.pixelSize(), color: ERASE_COLOR, alpha: 0.7, cap: 'round' });
  }

  dispose(): void {
    this.hoverGfx.destroy();
  }
}
