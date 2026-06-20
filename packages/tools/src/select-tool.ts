import { setup, createActor, type ActorRefFrom } from 'xstate';
import { Graphics } from 'pixi.js';
import type { Vec2 } from '@zynpparti/geometry';
import {
  BatchCommand,
  RemoveEntity,
  UpdateEntity,
  dimensionGeometry,
  openingFrame,
  type Entity,
  type EntityId,
  type Wall,
} from '@zynpparti/document';
import { hitTest, type SceneTool, type ScenePointer } from '@zynpparti/engine';
import type { ToolContext } from './context';

const HIT_PX = 8;
const DRAG_PX = 4;
const SELECT_COLOR = 0xffb454;

/**
 * Pointer faz FSM'i (CLAUDE.md §8.3): idle → pressed → dragging. Makine yalnız fazı tutar;
 * hit-test/komut gibi efektler sınıfta yapılır (faz makineden okunur). Tek-tık = seçim,
 * eşik aşılınca = sürükleyerek taşıma.
 */
export const selectPhaseMachine = setup({
  types: {} as { events: { type: 'DOWN' } | { type: 'DRAG' } | { type: 'UP' } | { type: 'RESET' } },
}).createMachine({
  initial: 'idle',
  states: {
    idle: { on: { DOWN: 'pressed' } },
    pressed: { on: { DRAG: 'dragging', UP: 'idle', RESET: 'idle' } },
    dragging: { on: { UP: 'idle', RESET: 'idle' } },
  },
});

/** Seç (tıkla), taşı (sürükle), sil (Delete). */
export class SelectTool implements SceneTool {
  private readonly phase: ActorRefFrom<typeof selectPhaseMachine>;
  private readonly hoverGfx = new Graphics();
  private readonly selectionGfx = new Graphics();
  private readonly ghostGfx = new Graphics();

  private selectedId: EntityId | null = null;
  private hoveredId: EntityId | null = null;
  private downWorld: Vec2 | null = null;
  private original: Wall | null = null;

  constructor(private readonly ctx: ToolContext) {
    this.ctx.overlay.addChild(this.hoverGfx);
    this.ctx.overlay.addChild(this.selectionGfx);
    this.ctx.overlay.addChild(this.ghostGfx);
    this.phase = createActor(selectPhaseMachine);
    this.phase.start();
  }

  private get state(): 'idle' | 'pressed' | 'dragging' {
    return this.phase.getSnapshot().value as 'idle' | 'pressed' | 'dragging';
  }

  onPointerDown(p: ScenePointer): void {
    const id = hitTest(this.ctx.store, this.ctx.index, p.world, HIT_PX * this.ctx.pixelSize(), (lid) => !!this.ctx.isLayerHidden?.(lid) || !!this.ctx.isLayerLocked?.(lid));
    this.renderHover(null);
    this.select(id);
    if (id) {
      const e = this.ctx.store.get(id);
      this.original = e?.type === 'wall' ? e : null;
      this.downWorld = p.world;
      this.phase.send({ type: 'DOWN' });
    }
  }

  onPointerMove(p: ScenePointer): void {
    if (this.state === 'pressed' && this.downWorld) {
      const moved = Math.hypot(p.world.x - this.downWorld.x, p.world.y - this.downWorld.y);
      if (moved > DRAG_PX * this.ctx.pixelSize()) this.phase.send({ type: 'DRAG' });
    }
    if (this.state === 'dragging' && this.downWorld && this.original) {
      const dx = p.world.x - this.downWorld.x;
      const dy = p.world.y - this.downWorld.y;
      this.drawGhost(this.translate(this.original, dx, dy));
      return;
    }
    // Boştayken imleç altındaki entity'yi soluk vurgula (micro-interaction; VISUAL-CRAFT §5/§6).
    if (this.state === 'idle') {
      const id = hitTest(this.ctx.store, this.ctx.index, p.world, HIT_PX * this.ctx.pixelSize(), (lid) => !!this.ctx.isLayerHidden?.(lid) || !!this.ctx.isLayerLocked?.(lid));
      this.renderHover(id === this.selectedId ? null : id);
    }
  }

  onPointerUp(p: ScenePointer): void {
    if (this.state === 'dragging' && this.downWorld && this.original) {
      const dx = p.world.x - this.downWorld.x;
      const dy = p.world.y - this.downWorld.y;
      this.ctx.history.dispatch(new UpdateEntity(this.translate(this.original, dx, dy)));
    }
    this.ghostGfx.clear();
    this.downWorld = null;
    this.original = null;
    this.phase.send({ type: 'UP' });
    this.renderSelection();
  }

  onKeyDown(e: KeyboardEvent): void {
    if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedId) {
      const id = this.selectedId;
      this.select(null);
      this.deleteEntity(id);
    } else if (e.key === 'Escape') {
      this.select(null);
    }
  }

  /** Entity'yi siler; duvarsa bağlı boşlukları (kapı/pencere) tek undo'da birlikte siler. */
  private deleteEntity(id: EntityId): void {
    const entity = this.ctx.store.get(id);
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
    this.select(null);
    this.renderHover(null);
    this.ghostGfx.clear();
    this.phase.send({ type: 'RESET' });
  }

  private select(id: EntityId | null): void {
    this.selectedId = id;
    this.renderSelection();
  }

  private translate(wall: Wall, dx: number, dy: number): Wall {
    return {
      ...wall,
      start: { x: wall.start.x + dx, y: wall.start.y + dy },
      end: { x: wall.end.x + dx, y: wall.end.y + dy },
    };
  }

  private renderSelection(): void {
    this.selectionGfx.clear();
    if (!this.selectedId) return;
    const e = this.ctx.store.get(this.selectedId);
    if (e) this.highlight(this.selectionGfx, e, 0.9);
  }

  private renderHover(id: EntityId | null): void {
    if (id === this.hoveredId) return;
    this.hoveredId = id;
    this.hoverGfx.clear();
    if (!id) return;
    const e = this.ctx.store.get(id);
    if (e) this.highlight(this.hoverGfx, e, 0.35);
  }

  /** Bir entity'yi vurgu rengiyle çizer (seçim ve hover ortak; tüm tipler). */
  private highlight(g: Graphics, entity: Entity, alpha: number): void {
    const px = this.ctx.pixelSize();
    switch (entity.type) {
      case 'wall':
        g.moveTo(entity.start.x, entity.start.y)
          .lineTo(entity.end.x, entity.end.y)
          .stroke({ width: entity.thickness + 4 * px, color: SELECT_COLOR, alpha, cap: 'round' });
        break;
      case 'opening': {
        const w = this.ctx.store.get(entity.wallId);
        if (w?.type !== 'wall') break;
        const f = openingFrame(entity, w);
        const hx = f.normal.x * (f.thickness / 2);
        const hy = f.normal.y * (f.thickness / 2);
        g.poly([
          f.a.x + hx, f.a.y + hy, f.b.x + hx, f.b.y + hy,
          f.b.x - hx, f.b.y - hy, f.a.x - hx, f.a.y - hy,
        ]).stroke({ width: 2.5 * px, color: SELECT_COLOR, alpha });
        break;
      }
      case 'dimension': {
        const d = dimensionGeometry(entity);
        g.moveTo(d.da.x, d.da.y)
          .lineTo(d.db.x, d.db.y)
          .stroke({ width: 3 * px, color: SELECT_COLOR, alpha, cap: 'round' });
        break;
      }
      case 'space':
        break; // mahaller tıkla-seçilmez (çift tık = ad düzenle)
    }
  }

  private drawGhost(wall: Wall): void {
    this.ghostGfx.clear();
    this.highlight(this.ghostGfx, wall, 0.5);
  }

  dispose(): void {
    this.phase.stop();
    this.hoverGfx.destroy();
    this.selectionGfx.destroy();
    this.ghostGfx.destroy();
  }
}
