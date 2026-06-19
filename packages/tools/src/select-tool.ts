import { setup, createActor, type ActorRefFrom } from 'xstate';
import { Graphics } from 'pixi.js';
import type { Vec2 } from '@zynpparti/geometry';
import { RemoveEntity, UpdateEntity, type EntityId, type Wall } from '@zynpparti/document';
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
  private readonly selectionGfx = new Graphics();
  private readonly ghostGfx = new Graphics();

  private selectedId: EntityId | null = null;
  private downWorld: Vec2 | null = null;
  private original: Wall | null = null;

  constructor(private readonly ctx: ToolContext) {
    this.ctx.overlay.addChild(this.selectionGfx);
    this.ctx.overlay.addChild(this.ghostGfx);
    this.phase = createActor(selectPhaseMachine);
    this.phase.start();
  }

  private get state(): 'idle' | 'pressed' | 'dragging' {
    return this.phase.getSnapshot().value as 'idle' | 'pressed' | 'dragging';
  }

  onPointerDown(p: ScenePointer): void {
    const id = hitTest(this.ctx.store, this.ctx.index, p.world, HIT_PX * this.ctx.pixelSize());
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
      this.ctx.history.dispatch(new RemoveEntity(id));
    } else if (e.key === 'Escape') {
      this.select(null);
    }
  }

  onDeactivate(): void {
    this.select(null);
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
    if (e?.type === 'wall') this.strokeWall(this.selectionGfx, e, 0.9);
  }

  private drawGhost(wall: Wall): void {
    this.ghostGfx.clear();
    this.strokeWall(this.ghostGfx, wall, 0.5);
  }

  private strokeWall(g: Graphics, wall: Wall, alpha: number): void {
    g.moveTo(wall.start.x, wall.start.y)
      .lineTo(wall.end.x, wall.end.y)
      .stroke({ width: wall.thickness + 4 * this.ctx.pixelSize(), color: SELECT_COLOR, alpha, cap: 'round' });
  }

  dispose(): void {
    this.phase.stop();
    this.selectionGfx.destroy();
    this.ghostGfx.destroy();
  }
}
