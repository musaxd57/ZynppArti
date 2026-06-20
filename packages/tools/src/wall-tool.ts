import { setup, assign, createActor, type ActorRefFrom } from 'xstate';
import { Graphics } from 'pixi.js';
import type { Vec2 } from '@zynpparti/geometry';
import { AddEntity, createEntityId, type Wall } from '@zynpparti/document';
import { DASH, strokeDashedLine, type SceneTool, type ScenePointer } from '@zynpparti/engine';
import type { ToolContext } from './context';

export const WALL_THICKNESS = 15; // cm
const PREVIEW_COLOR = 0x6aa9ff;
const MIN_LEN = 1; // cm — bundan kısa segment yok sayılır

interface WallCtx {
  start: Vec2 | null;
  cursor: Vec2 | null;
  onCommit: (a: Vec2, b: Vec2) => void;
}

type WallEvent = { type: 'POINT'; at: Vec2 } | { type: 'MOVE'; at: Vec2 } | { type: 'CANCEL' };

/**
 * Duvar çizim FSM'i (CLAUDE.md §8.3): idle → (tıkla) → drawing → (tıkla) zincir devam.
 * Side-effect (segment ekleme) `commit` aksiyonunda, input ile verilen callback üzerinden olur;
 * böylece makine durumun tek kaynağı kalır, efekt test edilebilir tutulur.
 */
export const wallToolMachine = setup({
  types: {} as { context: WallCtx; events: WallEvent; input: { onCommit: WallCtx['onCommit'] } },
  actions: {
    setCursor: assign({ cursor: ({ event }) => (event.type === 'MOVE' ? event.at : null) }),
    setStart: assign({ start: ({ event }) => (event.type === 'POINT' ? event.at : null) }),
    chain: assign({ start: ({ event }) => (event.type === 'POINT' ? event.at : null) }),
    reset: assign({ start: () => null }),
    commit: ({ context, event }) => {
      if (event.type === 'POINT' && context.start) context.onCommit(context.start, event.at);
    },
  },
}).createMachine({
  context: ({ input }) => ({ start: null, cursor: null, onCommit: input.onCommit }),
  initial: 'idle',
  states: {
    idle: {
      on: {
        MOVE: { actions: 'setCursor' },
        POINT: { target: 'drawing', actions: 'setStart' },
      },
    },
    drawing: {
      on: {
        MOVE: { actions: 'setCursor' },
        POINT: { actions: ['commit', 'chain'] },
        CANCEL: { target: 'idle', actions: 'reset' },
      },
    },
  },
});

/** Tıkla-tıkla duvar çizen araç. Esc/Enter zinciri bitirir. */
export class WallTool implements SceneTool {
  private readonly actor: ActorRefFrom<typeof wallToolMachine>;
  private readonly preview = new Graphics();

  constructor(private readonly ctx: ToolContext) {
    this.ctx.overlay.addChild(this.preview);
    this.actor = createActor(wallToolMachine, {
      input: { onCommit: (a, b) => this.commit(a, b) },
    });
    this.actor.subscribe(() => this.render());
    this.actor.start();
  }

  private commit(a: Vec2, b: Vec2): void {
    if (Math.hypot(b.x - a.x, b.y - a.y) < MIN_LEN) return;
    const wall: Wall = {
      id: createEntityId(),
      type: 'wall',
      layerId: 'default',
      start: a,
      end: b,
      thickness: WALL_THICKNESS,
    };
    this.ctx.history.dispatch(new AddEntity(wall));
  }

  onPointerDown(p: ScenePointer): void {
    this.actor.send({ type: 'POINT', at: this.ctx.snap(p.world) });
  }

  onPointerMove(p: ScenePointer): void {
    this.actor.send({ type: 'MOVE', at: this.ctx.snap(p.world) });
  }

  onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape' || e.key === 'Enter') this.actor.send({ type: 'CANCEL' });
  }

  onDeactivate(): void {
    this.actor.send({ type: 'CANCEL' });
    this.preview.clear();
  }

  private render(): void {
    const { start, cursor } = this.actor.getSnapshot().context;
    const px = this.ctx.pixelSize();
    this.preview.clear();
    if (start && cursor) {
      // Kalınlık önizlemesi (soluk dolu bant) + provisional kesik orta-çizgi (çizgi tipi).
      this.preview
        .moveTo(start.x, start.y)
        .lineTo(cursor.x, cursor.y)
        .stroke({ width: WALL_THICKNESS, color: PREVIEW_COLOR, alpha: 0.25, cap: 'butt' });
      strokeDashedLine(
        this.preview,
        start,
        cursor,
        DASH,
        { width: 1.1 * px, color: PREVIEW_COLOR, alpha: 0.95 },
        px,
      );
    }
    if (cursor) {
      this.preview.circle(cursor.x, cursor.y, 4 * px).fill({ color: PREVIEW_COLOR, alpha: 0.9 });
    }
  }

  dispose(): void {
    this.actor.stop();
    this.preview.destroy();
  }
}
