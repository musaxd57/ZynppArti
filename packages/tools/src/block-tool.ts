import { Graphics } from 'pixi.js';
import type { Vec2 } from '@zynpparti/geometry';
import { AddEntity, createEntityId, type Block, type BlockKind } from '@zynpparti/document';
import { drawBlock, type SceneTool, type ScenePointer } from '@zynpparti/engine';
import type { ToolContext } from './context';

/**
 * Blok (mobilya) yerleştirme aracı: seçili blok tipini imleçte önizler, tıklayınca ekler.
 * 'x' tuşu yerleştirmeden önce 90° döndürür. Tip `setKind` ile (palet) değişir.
 */
export class BlockTool implements SceneTool {
  private readonly preview = new Graphics();
  private kind: BlockKind = 'table';
  private rotation = 0;
  private cursor: Vec2 | null = null;

  constructor(private readonly ctx: ToolContext) {
    this.ctx.overlay.addChild(this.preview);
  }

  setKind(kind: BlockKind): void {
    this.kind = kind;
    this.render();
  }

  private make(position: Vec2, id: string): Block {
    // Mobilya kendi katmanında → LayerPanel'den toplu gizlenip kilitlenebilir.
    return { id, type: 'block', layerId: 'furniture', kind: this.kind, position, rotation: this.rotation };
  }

  onPointerMove(p: ScenePointer): void {
    this.cursor = this.ctx.snap(p.world);
    this.render();
  }

  onPointerDown(p: ScenePointer): void {
    const pt = this.ctx.snap(p.world);
    this.ctx.history.dispatch(new AddEntity(this.make(pt, createEntityId())));
  }

  onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'x' || e.key === 'X') {
      this.rotation = (this.rotation + Math.PI / 2) % (Math.PI * 2);
      this.render();
    }
  }

  onDeactivate(): void {
    this.preview.clear();
  }

  private render(): void {
    this.preview.clear();
    if (!this.cursor) return;
    drawBlock(this.preview, this.make(this.cursor, 'preview'), this.ctx.pixelSize());
    this.preview.alpha = 0.6;
  }

  dispose(): void {
    this.preview.destroy();
  }
}
