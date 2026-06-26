import { Graphics } from 'pixi.js';
import type { Vec2 } from '@zynpparti/geometry';
import {
  AddEntity,
  createEntityId,
  fitOpeningT,
  projectToWall,
  type Opening,
  type Wall,
} from '@zynpparti/document';
import { distance } from '@zynpparti/geometry';
import { drawOpening, type SceneTool, type ScenePointer } from '@zynpparti/engine';
import type { ToolContext } from './context';

export const DOOR_WIDTH = 90; // cm — TS 9111 uyumlu varsayılan kapı net geçişi
export const WINDOW_WIDTH = 120; // cm — varsayılan pencere genişliği
const SNAP_PX = 14; // ekran pikseli — bu kadar yakındaki duvara boşluk oturur

/**
 * Boşluk (kapı/pencere) yerleştirme aracı: imleç bir duvara yaklaşınca o duvar üzerinde önizleme
 * gösterir, tıklayınca duvara bağlı (binding) boşluk ekler. Konum duvar boyunca `t` ile parametrik.
 * Kapı ve pencere aynı mantık → tek sınıf, `kind`/`width` ile parametrize.
 */
export class OpeningTool implements SceneTool {
  private readonly preview = new Graphics();
  private candidate: { wall: Wall; t: number } | null = null;

  constructor(
    private readonly ctx: ToolContext,
    private readonly kind: Opening['kind'],
    private readonly width: number,
  ) {
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
      // Kilitli/gizli katmandaki duvara boşluk açmak o duvarın görünümünü düzenler = kilit ihlali
      // (seç/sil araçları bu kuralı uygular; boşluk aracı da uymalı — denetim bulgusu).
      if (this.ctx.isLayerLocked?.(e.layerId) || this.ctx.isLayerHidden?.(e.layerId)) continue;
      const { t, dist } = projectToWall(world, e);
      const reach = e.thickness / 2 + SNAP_PX * this.ctx.pixelSize();
      if (dist > reach || dist >= bestD) continue;
      // Boşluk bu duvara sığmıyorsa (genişlik > duvar boyu) aday değil; sığıyorsa t'yi içeride tut.
      const len = distance(e.start, e.end);
      const fitted = fitOpeningT(len, this.width, t);
      if (fitted === null) continue;
      bestD = dist;
      best = { wall: e, t: fitted };
    }
    return best;
  }

  private makeOpening(wall: Wall, t: number, id: string): Opening {
    return { id, type: 'opening', layerId: 'default', wallId: wall.id, t, width: this.width, kind: this.kind };
  }

  onPointerMove(p: ScenePointer): void {
    this.candidate = this.findWall(p.world);
    this.render();
  }

  onPointerDown(p: ScenePointer): void {
    const hit = this.findWall(p.world);
    if (!hit) return;
    this.ctx.history.dispatch(new AddEntity(this.makeOpening(hit.wall, hit.t, createEntityId())));
  }

  onDeactivate(): void {
    this.candidate = null;
    this.preview.clear();
  }

  private render(): void {
    this.preview.clear();
    if (!this.candidate) return;
    drawOpening(
      this.preview,
      this.makeOpening(this.candidate.wall, this.candidate.t, 'preview'),
      this.candidate.wall,
      this.ctx.pixelSize(),
    );
    this.preview.alpha = 0.6;
  }

  dispose(): void {
    this.preview.destroy();
  }
}
