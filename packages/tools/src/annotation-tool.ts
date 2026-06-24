import { Graphics } from 'pixi.js';
import type { Vec2 } from '@zynpparti/geometry';
import {
  AddEntity,
  DEFAULT_ANNOTATION_HEIGHT,
  createEntityId,
  type Annotation,
} from '@zynpparti/document';
import type { SceneTool, ScenePointer } from '@zynpparti/engine';
import type { ToolContext } from './context';

const MARK_COLOR = 0xffb454;

/**
 * Açıklama/metin aracı: tıkla → metni gir → o noktaya etiket ekle. Metin temalı diyalogtan
 * (`ctx.requestText`) alınır; enjekte edilmemişse `window.prompt`'a düşer. Diyalog asenkron →
 * metin gelince entity eklenir. Etiketler 'annotation' katmanına eklenir → LayerPanel'den gizlenebilir.
 */
export class AnnotationTool implements SceneTool {
  private readonly preview = new Graphics();
  private cursor: Vec2 | null = null;
  // Asenkron metin diyaloğu için nesil (generation) jetonu: araç değişince (onDeactivate) artar →
  // bekleyen diyalog geç çözülse bile artık aktif olmayan araca entity EKLENMEZ (yanlış-context yarışı).
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
    const myGen = this.gen; // bu tıklamanın nesli; araç değişirse geçersiz olur
    // Temalı diyalog (yoksa window.prompt yedeği). Asenkron → metin gelince ekle.
    const ask: Promise<string | null> = this.ctx.requestText
      ? this.ctx.requestText('Metin:')
      : Promise.resolve(typeof window !== 'undefined' ? window.prompt('Metin:') : null);
    ask
      .then((text) => {
        if (this.gen !== myGen) return; // araç değişti → bu sonucu yoksay
        if (text == null) return;
        const trimmed = text.trim();
        if (!trimmed) return;
        const annotation: Annotation = {
          id: createEntityId(),
          type: 'annotation',
          layerId: 'annotation',
          position: at,
          text: trimmed,
          height: DEFAULT_ANNOTATION_HEIGHT,
        };
        this.ctx.history.dispatch(new AddEntity(annotation));
      })
      .catch((err) => console.error('Metin diyaloğu hatası:', err));
  }

  onDeactivate(): void {
    this.gen++; // bekleyen metin diyaloglarını geçersiz kıl
    this.cursor = null;
    this.preview.clear();
  }

  private render(): void {
    this.preview.clear();
    if (!this.cursor) return;
    // Ekleme noktasını küçük artı ile göster.
    const r = 5 * this.ctx.pixelSize();
    const w = 1 * this.ctx.pixelSize();
    this.preview
      .moveTo(this.cursor.x - r, this.cursor.y)
      .lineTo(this.cursor.x + r, this.cursor.y)
      .moveTo(this.cursor.x, this.cursor.y - r)
      .lineTo(this.cursor.x, this.cursor.y + r)
      .stroke({ width: w, color: MARK_COLOR, alpha: 0.8 });
  }

  dispose(): void {
    this.preview.destroy();
  }
}
