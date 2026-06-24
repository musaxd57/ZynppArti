import { Graphics } from 'pixi.js';
import type { Vec2 } from '@zynpparti/geometry';
import { AddEntity, createEntityId, type Comment } from '@zynpparti/document';
import type { SceneTool, ScenePointer } from '@zynpparti/engine';
import type { ToolContext } from './context';

const MARK_COLOR = 0xffb454;

/**
 * Yorum/markup aracı (Faz 3): tıkla → yorum metnini gir → o noktaya 💬 iğnesi ekle. Comment entity
 * normal (türetilmemiş) olduğu için Yjs ile otomatik senkronlanır → işbirliğinde herkes görür.
 * 'comment' katmanına eklenir (LayerPanel'den gizlenebilir).
 */
export class CommentTool implements SceneTool {
  private readonly preview = new Graphics();
  private cursor: Vec2 | null = null;
  // Araç değişince artar → bekleyen yorum diyaloğu geç çözülse bile yanlış-context'e iğne eklenmez.
  private gen = 0;

  constructor(private readonly ctx: ToolContext) {
    this.ctx.overlay.addChild(this.preview);
  }

  onPointerMove(p: ScenePointer): void {
    this.cursor = this.ctx.snap(p.world);
    this.render();
  }

  onPointerDown(p: ScenePointer): void {
    const at = this.ctx.snap(p.world);
    const myGen = this.gen;
    // Temalı diyalog (yoksa window.prompt yedeği). Asenkron → metin gelince iğne ekle.
    const ask: Promise<string | null> = this.ctx.requestText
      ? this.ctx.requestText('Yorum:')
      : Promise.resolve(typeof window !== 'undefined' ? window.prompt('Yorum:') : null);
    ask
      .then((text) => {
        if (this.gen !== myGen) return; // araç değişti → yoksay
        if (text == null) return;
        const trimmed = text.trim();
        if (!trimmed) return;
        const comment: Comment = {
          id: createEntityId(),
          type: 'comment',
          layerId: 'comment',
          position: at,
          text: trimmed,
        };
        this.ctx.history.dispatch(new AddEntity(comment));
      })
      .catch((err) => console.error('Yorum metni isteği başarısız:', err));
  }

  onDeactivate(): void {
    this.cursor = null;
    this.preview.clear();
  }

  private render(): void {
    this.preview.clear();
    if (!this.cursor) return;
    const r = 5 * this.ctx.pixelSize();
    this.preview.circle(this.cursor.x, this.cursor.y, r).stroke({
      width: 1.5 * this.ctx.pixelSize(),
      color: MARK_COLOR,
      alpha: 0.85,
    });
  }

  dispose(): void {
    this.preview.destroy();
  }
}
