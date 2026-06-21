import { Graphics } from 'pixi.js';
import { BatchCommand, RemoveEntity, type EntityId } from '@zynpparti/document';
import { hitTest, highlightEntity, type SceneTool, type ScenePointer } from '@zynpparti/engine';
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
    this.hoveredId = hitTest(this.ctx.store, this.ctx.index, p.world, HIT_PX * this.ctx.pixelSize(), (lid) => !!this.ctx.isLayerHidden?.(lid) || !!this.ctx.isLayerLocked?.(lid));
    this.renderHover();
  }

  onPointerDown(p: ScenePointer): void {
    const id = hitTest(this.ctx.store, this.ctx.index, p.world, HIT_PX * this.ctx.pixelSize(), (lid) => !!this.ctx.isLayerHidden?.(lid) || !!this.ctx.isLayerLocked?.(lid));
    if (!id) return;
    this.hoveredId = null;
    this.hoverGfx.clear();

    const entity = this.ctx.store.get(id);
    // Duvar silinince üstündeki boşluklar (kapı/pencere) öksüz kalmasın → tek undo'da birlikte sil.
    if (entity?.type === 'wall') {
      const bound = this.ctx.store
        .all()
        .filter((e) => e.type === 'opening' && e.wallId === id)
        .map((e) => new RemoveEntity(e.id));
      if (bound.length > 0) {
        this.ctx.history.dispatch(
          new BatchCommand('Duvar + boşlukları sil', [new RemoveEntity(id), ...bound]),
        );
        return;
      }
    }
    this.ctx.history.dispatch(new RemoveEntity(id));
  }

  onDeactivate(): void {
    this.hoveredId = null;
    this.hoverGfx.clear();
  }

  private renderHover(): void {
    this.hoverGfx.clear();
    if (!this.hoveredId) return;
    const e = this.ctx.store.get(this.hoveredId);
    // Tüm silinebilir tipler için kırmızı önizleme (ortak highlightEntity; eskiden yalnız duvar).
    if (e) highlightEntity(this.hoverGfx, e, this.ctx.store, ERASE_COLOR, 0.7, this.ctx.pixelSize());
  }

  dispose(): void {
    this.hoverGfx.destroy();
  }
}
