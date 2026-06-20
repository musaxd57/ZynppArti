import { Graphics } from 'pixi.js';
import type { Vec2 } from '@zynpparti/geometry';
import {
  AddEntity,
  createEntityId,
  projectToWall,
  type Opening,
  type Wall,
} from '@zynpparti/document';
import { drawOpening, type SceneTool, type ScenePointer } from '@zynpparti/engine';
import type { ToolContext } from './context';

export const DOOR_WIDTH = 90; // cm — TS 9111 uyumlu varsayılan net geçiş
const SNAP_PX = 14; // ekran pikseli — bu kadar yakındaki duvara kapı oturur

/**
 * Kapı yerleştirme aracı: imleç bir duvara yaklaşınca o duvar üzerinde önizleme gösterir,
 * tıklayınca duvara bağlı (binding) bir kapı boşluğu ekler. Konum duvar boyunca `t` ile parametrik.
 */
export class DoorTool implements SceneTool {
  private readonly preview = new Graphics();
  private candidate: { wall: Wall; t: number } | null = null;

  constructor(private readonly ctx: ToolContext) {
    this.ctx.overlay.addChild(this.preview);
  }

  /** İmlece en yakın duvarı (erişim mesafesinde) ve üzerindeki konumu bulur. */
  private findWall(world: Vec2): { wall: Wall; t: number } | null {
    const r = 30 * this.ctx.pixelSize();
    const ids = this.ctx.index.search({
      minX: world.x - r,
      minY: world.y - r,
      maxX: world.x + r,
      maxY: world.y + r,
    });
    let best: { wall: Wall; t: number } | null = null;
    let bestD = Infinity;
    for (const id of ids) {
      const e = this.ctx.store.get(id);
      if (e?.type !== 'wall') continue;
      const { t, dist } = projectToWall(world, e);
      const reach = e.thickness / 2 + SNAP_PX * this.ctx.pixelSize();
      if (dist <= reach && dist < bestD) {
        bestD = dist;
        best = { wall: e, t };
      }
    }
    return best;
  }

  onPointerMove(p: ScenePointer): void {
    this.candidate = this.findWall(p.world);
    this.render();
  }

  onPointerDown(p: ScenePointer): void {
    const hit = this.findWall(p.world);
    if (!hit) return;
    const opening: Opening = {
      id: createEntityId(),
      type: 'opening',
      layerId: 'default',
      wallId: hit.wall.id,
      t: hit.t,
      width: DOOR_WIDTH,
      kind: 'door',
    };
    this.ctx.history.dispatch(new AddEntity(opening));
  }

  onDeactivate(): void {
    this.candidate = null;
    this.preview.clear();
  }

  private render(): void {
    this.preview.clear();
    if (!this.candidate) return;
    const preview: Opening = {
      id: 'preview',
      type: 'opening',
      layerId: 'default',
      wallId: this.candidate.wall.id,
      t: this.candidate.t,
      width: DOOR_WIDTH,
      kind: 'door',
    };
    drawOpening(this.preview, preview, this.candidate.wall, this.ctx.pixelSize());
    this.preview.alpha = 0.6;
  }

  dispose(): void {
    this.preview.destroy();
  }
}
