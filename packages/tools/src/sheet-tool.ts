import { Graphics } from 'pixi.js';
import type { Vec2 } from '@zynpparti/geometry';
import {
  AddEntity,
  createEntityId,
  sheetModelSize,
  type Sheet,
  type SheetOrientation,
  type SheetSize,
} from '@zynpparti/document';
import type { SceneTool, ScenePointer } from '@zynpparti/engine';
import type { ToolContext } from './context';

const PREVIEW_COLOR = 0xffb454;

/** Yeni pafta varsayılanları (panelden değiştirilir). */
const DEFAULT_SIZE: SheetSize = 'A3';
const DEFAULT_ORIENTATION: SheetOrientation = 'landscape';
const DEFAULT_SCALE = 50;

/**
 * Pafta (sheet) yerleştirme aracı: imleçte çerçeve boyutunu önizler, tıklayınca sol-üst köşesi o
 * noktaya gelecek şekilde varsayılan bir pafta ekler. Boyut/ölçek/antet sonra SheetPanel'den düzenlenir.
 */
export class SheetTool implements SceneTool {
  private readonly preview = new Graphics();
  private cursor: Vec2 | null = null;

  constructor(private readonly ctx: ToolContext) {
    this.ctx.overlay.addChild(this.preview);
  }

  private make(position: Vec2, id: string): Sheet {
    return {
      id,
      type: 'sheet',
      layerId: 'sheet',
      position,
      size: DEFAULT_SIZE,
      orientation: DEFAULT_ORIENTATION,
      scale: DEFAULT_SCALE,
      title: 'Pafta',
    };
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
