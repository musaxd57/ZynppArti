import { Graphics } from 'pixi.js';
import type { Vec2 } from '@zynpparti/geometry';
import { AddEntity, createEntityId, type Parcel } from '@zynpparti/document';
import type { SceneTool, ScenePointer } from '@zynpparti/engine';
import type { ToolContext } from './context';

const PREVIEW_COLOR = 0x6fbf73;
const CLOSE_PX = 12; // ilk noktaya bu kadar yakın tık → poligonu kapat

/**
 * Parsel (arsa) sınırı çizme aracı — poligon: noktaları tıkla; ilk noktaya tıkla ya da Enter ile
 * kapat. Esc (ToolManager) Seç'e döner ve iptal eder. Tek bir parsel poligonu üretir.
 */
export class ParcelTool implements SceneTool {
  private readonly preview = new Graphics();
  private points: Vec2[] = [];
  private cursor: Vec2 | null = null;

  constructor(private readonly ctx: ToolContext) {
    this.ctx.overlay.addChild(this.preview);
  }

  onPointerDown(p: ScenePointer): void {
    const pt = this.ctx.snap(p.world);
    if (this.points.length >= 3) {
      const f = this.points[0]!;
      if (Math.hypot(pt.x - f.x, pt.y - f.y) <= CLOSE_PX * this.ctx.pixelSize()) {
        this.commit();
        return;
      }
    }
    this.points.push(pt);
    this.render();
  }

  onPointerMove(p: ScenePointer): void {
    this.cursor = this.ctx.snap(p.world);
    this.render();
  }

  onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter') this.commit();
  }

  private commit(): void {
    if (this.points.length >= 3) {
      const parcel: Parcel = {
        id: createEntityId(),
        type: 'parcel',
        layerId: 'site',
        boundary: this.points,
      };
      this.ctx.history.dispatch(new AddEntity(parcel));
    }
    this.reset();
  }

  private reset(): void {
    this.points = [];
    this.preview.clear();
  }

  onDeactivate(): void {
    this.reset();
  }

  private render(): void {
    const px = this.ctx.pixelSize();
    this.preview.clear();
    if (this.points.length === 0) return;

    // Mevcut kenarlar + imlece kadar olan bacak.
    this.preview.moveTo(this.points[0]!.x, this.points[0]!.y);
    for (let i = 1; i < this.points.length; i++) {
      this.preview.lineTo(this.points[i]!.x, this.points[i]!.y);
    }
    if (this.cursor) this.preview.lineTo(this.cursor.x, this.cursor.y);
    this.preview.stroke({ width: 1.2 * px, color: PREVIEW_COLOR, alpha: 0.9 });

    // Köşe işaretleri; ilk nokta kapatılabilirse vurgulu.
    for (const pt of this.points) {
      this.preview.circle(pt.x, pt.y, 4 * px).fill({ color: PREVIEW_COLOR, alpha: 0.9 });
    }
    if (this.points.length >= 3) {
      this.preview.circle(this.points[0]!.x, this.points[0]!.y, 7 * px).stroke({
        width: 1.5 * px,
        color: PREVIEW_COLOR,
        alpha: 0.9,
      });
    }
  }

  dispose(): void {
    this.preview.destroy();
  }
}
