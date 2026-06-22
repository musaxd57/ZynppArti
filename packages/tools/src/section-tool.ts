import { Graphics } from 'pixi.js';
import type { Vec2 } from '@zynpparti/geometry';
import type { SceneTool, ScenePointer } from '@zynpparti/engine';
import type { ToolContext } from './context';

const SECTION_COLOR = 0xff7a59; // turuncu — kesit düzlemi çizgisi

/**
 * Kesit aracı (ADR-0016): planda iki nokta seçilerek bir **kesit çizgisi** çizilir; bu çizgiyi kesen
 * duvarlar şematik kesit görünümünde gösterilir (SectionPanel). İki tık → `ctx.onSectionLine(a, b)`.
 * Çizgi modeli değiştirmez (görünüm/önizleme), bu yüzden Command'e girmez.
 */
export class SectionTool implements SceneTool {
  private readonly preview = new Graphics();
  private p1: Vec2 | null = null;
  private cursor: Vec2 | null = null;

  constructor(private readonly ctx: ToolContext) {
    this.ctx.overlay.addChild(this.preview);
  }

  onPointerDown(p: ScenePointer): void {
    const at = this.ctx.snap(p.world);
    if (!this.p1) {
      this.p1 = at;
    } else {
      this.ctx.onSectionLine?.(this.p1, at);
      this.p1 = null;
    }
    this.render();
  }

  onPointerMove(p: ScenePointer): void {
    this.cursor = this.ctx.snap(p.world);
    this.render();
  }

  onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      this.p1 = null;
      this.render();
    }
  }

  onDeactivate(): void {
    this.p1 = null;
    this.cursor = null;
    this.preview.clear();
  }

  private render(): void {
    const px = this.ctx.pixelSize();
    this.preview.clear();
    for (const p of [this.p1, this.cursor]) {
      if (p) this.preview.circle(p.x, p.y, 4 * px).fill({ color: SECTION_COLOR });
    }
    if (this.p1 && this.cursor) {
      this.preview
        .moveTo(this.p1.x, this.p1.y)
        .lineTo(this.cursor.x, this.cursor.y)
        .stroke({ width: 1.5 * px, color: SECTION_COLOR, alpha: 0.9 });
    }
  }

  dispose(): void {
    this.preview.destroy();
  }
}
