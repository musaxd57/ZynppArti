import { Graphics } from 'pixi.js';
import type { Vec2 } from '@zynpparti/geometry';
import { distance } from '@zynpparti/geometry';
import { AddEntity, createEntityId, type EntityStore, type SectionLine } from '@zynpparti/document';
import { SECTION_COLOR, type SceneTool, type ScenePointer } from '@zynpparti/engine';
import type { ToolContext } from './context';

const MIN_LEN = 5; // cm — bu kadar kısa çizgi (yanlış çift-tık) kesit oluşturmaz

/**
 * Kesit aracı (ADR-0016/0039): planda iki nokta seçilerek bir **kesit çizgisi** çizilir; bu çizgiyi
 * kesen duvarlar şematik kesit görünümünde gösterilir (SectionPanel). İki tık → kalıcı bir `section`
 * entity'si oluşturulur (`AddEntity` → undo'lanır, kaydet/aç'a girer). Eskiden geçici görünümdü.
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
      if (distance(this.p1, at) >= MIN_LEN) {
        const section: SectionLine = {
          id: createEntityId(),
          type: 'section',
          layerId: 'section',
          a: this.p1,
          b: at,
          label: nextLabel(this.ctx.store),
        };
        this.ctx.history.dispatch(new AddEntity(section));
      }
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

/**
 * Sıradaki kesit etiketi: kullanımdaki ilk boş büyük harf (A, B, C…). Sayaç yerine "boş harf"
 * seçilir → bir kesit silinince etiket çakışması olmaz (silinen harf yeniden kullanılır). 26 harf
 * dolarsa A'ya düşer (nadir; çakışma kabul).
 */
function nextLabel(store: EntityStore): string {
  const used = new Set(
    store.byType('section').map((s) => s.label),
  );
  for (let i = 0; i < 26; i++) {
    const letter = String.fromCharCode(65 + i);
    if (!used.has(letter)) return letter;
  }
  return 'A';
}
