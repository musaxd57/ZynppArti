import { Graphics } from 'pixi.js';
import type { Vec2 } from '@zynpparti/geometry';
import { AddEntity, createEntityId, type Dimension } from '@zynpparti/document';
import { drawDimension, type SceneTool, type ScenePointer } from '@zynpparti/engine';
import type { ToolContext } from './context';

export const DIMENSION_OFFSET = 40; // cm — ölçü çizgisinin ölçülen doğrudan varsayılan uzaklığı
const MIN_LEN = 1; // cm

/**
 * Ölçülendirme aracı: iki nokta tıkla → lineer ölçü oluştur (uçlar uç-noktalara snap'lenir).
 * İlk tıktan sonra imlece kadar canlı önizleme; ikinci tık ölçüyü ekler. Esc iptal eder.
 */
export class DimensionTool implements SceneTool {
  private readonly preview = new Graphics();
  private start: Vec2 | null = null;
  private cursor: Vec2 | null = null;

  constructor(private readonly ctx: ToolContext) {
    this.ctx.overlay.addChild(this.preview);
  }

  private make(a: Vec2, b: Vec2, id: string): Dimension {
    return { id, type: 'dimension', layerId: 'default', a, b, offset: DIMENSION_OFFSET };
  }

  onPointerDown(p: ScenePointer): void {
    const pt = this.ctx.snap(p.world);
    if (!this.start) {
      this.start = pt;
      return;
    }
    if (Math.hypot(pt.x - this.start.x, pt.y - this.start.y) >= MIN_LEN) {
      this.ctx.history.dispatch(new AddEntity(this.make(this.start, pt, createEntityId())));
    }
    this.start = null;
    this.preview.clear();
  }

  onPointerMove(p: ScenePointer): void {
    this.cursor = this.ctx.snap(p.world);
    this.render();
  }

  onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape' || e.key === 'Enter') {
      this.start = null;
      this.preview.clear();
    }
  }

  onDeactivate(): void {
    this.start = null;
    this.preview.clear();
  }

  private render(): void {
    this.preview.clear();
    if (!this.start || !this.cursor) return;
    drawDimension(this.preview, this.make(this.start, this.cursor, 'preview'), this.ctx.pixelSize());
    this.preview.alpha = 0.7;
  }

  dispose(): void {
    this.preview.destroy();
  }
}
