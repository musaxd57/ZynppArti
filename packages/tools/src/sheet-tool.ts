import { Graphics } from 'pixi.js';
import type { Vec2 } from '@zynpparti/geometry';
import { AddEntity, createEntityId, makeSheet, sheetModelSize, type Sheet } from '@zynpparti/document';
import type { SceneTool, ScenePointer } from '@zynpparti/engine';
import type { ToolContext } from './context';

const PREVIEW_COLOR = 0xffb454;

/**
 * Pafta (sheet) yerleştirme aracı: imleçte çerçeve boyutunu önizler, tıklayınca sol-üst köşesi o
 * noktaya gelecek şekilde varsayılan bir pafta ekler. Boyut/ölçek/antet sonra SheetPanel'den düzenlenir.
 * Varsayılanlar `makeSheet` (document) ile tek kaynaktan gelir — panel "+ Pafta ekle" ile tutarlı.
 */
export class SheetTool implements SceneTool {
  private readonly preview = new Graphics();
  private cursor: Vec2 | null = null;

  constructor(private readonly ctx: ToolContext) {
    this.ctx.overlay.addChild(this.preview);
  }

  private make(position: Vec2, id: string): Sheet {
    return { ...makeSheet(position), id };
  }

  onPointerMove(p: ScenePointer): void {
    this.cursor = this.ctx.snap(p.world);
    this.render();
  }

  onPointerDown(p: ScenePointer): void {
    const at = this.ctx.snap(p.world);
    this.ctx.history.dispatch(new AddEntity(this.make(at, createEntityId())));
  }

  onDeactivate(): void {
    this.cursor = null;
    this.preview.clear();
  }

  private render(): void {
    this.preview.clear();
    if (!this.cursor) return;
    const { w, h } = sheetModelSize(this.make(this.cursor, 'preview'));
    this.preview
      .rect(this.cursor.x, this.cursor.y, w, h)
      .stroke({ width: 1.5 * this.ctx.pixelSize(), color: PREVIEW_COLOR, alpha: 0.7 });
  }

  dispose(): void {
    this.preview.destroy();
  }
}
