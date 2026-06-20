import { Graphics } from 'pixi.js';
import type { Vec2 } from '@zynpparti/geometry';
import { AddEntity, createEntityId, type Dimension } from '@zynpparti/document';
import { drawDimension, type SceneTool, type ScenePointer } from '@zynpparti/engine';
import type { ToolContext } from './context';

export const DIMENSION_OFFSET = 40; // cm — offset belirlenmeden önceki varsayılan önizleme uzaklığı
const MIN_LEN = 1; // cm

/**
 * Ölçülendirme aracı — üç tık: (1) ilk nokta, (2) ikinci nokta, (3) ölçü çizgisinin yerini (offset)
 * belirle. 2. tıktan sonra imleç dik mesafeye göre offset'i canlı ayarlar; 3. tık ölçüyü ekler.
 * Uçlar uç-noktalara snap'lenir. Esc iptal eder.
 */
export class DimensionTool implements SceneTool {
  private readonly preview = new Graphics();
  private a: Vec2 | null = null;
  private b: Vec2 | null = null;
  private cursor: Vec2 | null = null;

  constructor(private readonly ctx: ToolContext) {
    this.ctx.overlay.addChild(this.preview);
  }

  /** İmlecin ölçülen doğruya işaretli dik uzaklığı (offset). a,b yoksa varsayılan. */
  private offsetFromCursor(): number {
    if (!this.a || !this.b || !this.cursor) return DIMENSION_OFFSET;
    const dx = this.b.x - this.a.x;
    const dy = this.b.y - this.a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    return (this.cursor.x - this.a.x) * nx + (this.cursor.y - this.a.y) * ny;
  }

  private make(a: Vec2, b: Vec2, offset: number, id: string): Dimension {
    return { id, type: 'dimension', layerId: 'default', a, b, offset };
  }

  onPointerDown(p: ScenePointer): void {
    const pt = this.ctx.snap(p.world);
    if (!this.a) {
      this.a = pt;
      return;
    }
    if (!this.b) {
      // İkinci nokta — çok kısaysa yok say.
      if (Math.hypot(pt.x - this.a.x, pt.y - this.a.y) >= MIN_LEN) this.b = pt;
      return;
    }
    // Üçüncü tık — offset'i sabitle ve ölçüyü ekle.
    this.ctx.history.dispatch(
      new AddEntity(this.make(this.a, this.b, this.offsetFromCursor(), createEntityId())),
    );
    this.reset();
  }

  onPointerMove(p: ScenePointer): void {
    this.cursor = this.ctx.snap(p.world);
    this.render();
  }

  onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape' || e.key === 'Enter') this.reset();
  }

  onDeactivate(): void {
    this.reset();
  }

  private reset(): void {
    this.a = null;
    this.b = null;
    this.preview.clear();
  }

  private render(): void {
    this.preview.clear();
    if (!this.a || !this.cursor) return;
    const px = this.ctx.pixelSize();
    if (!this.b) {
      // 1→2 arası: ölçülecek doğru önizlemesi (ince çizgi + uç).
      this.preview
        .moveTo(this.a.x, this.a.y)
        .lineTo(this.cursor.x, this.cursor.y)
        .stroke({ width: 1.1 * px, color: 0x6aa9ff, alpha: 0.9 });
      this.preview.circle(this.cursor.x, this.cursor.y, 4 * px).fill({ color: 0x6aa9ff, alpha: 0.9 });
      return;
    }
    // 2→3 arası: tam ölçü önizlemesi (offset imlece göre).
    drawDimension(this.preview, this.make(this.a, this.b, this.offsetFromCursor(), 'preview'), px);
    this.preview.alpha = 0.7;
  }

  dispose(): void {
    this.preview.destroy();
  }
}
