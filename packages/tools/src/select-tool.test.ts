import { describe, it, expect } from 'vitest';
import { createActor } from 'xstate';
import { Container } from 'pixi.js';
import { EntityStore, type Command, type History, type Block, type Wall } from '@zynpparti/document';
import { SpatialIndex } from '@zynpparti/engine';
import { SelectTool, selectPhaseMachine } from './select-tool';
import type { ToolContext } from './context';

describe('selectPhaseMachine', () => {
  it('idle → pressed → dragging → idle', () => {
    const actor = createActor(selectPhaseMachine);
    actor.start();
    expect(actor.getSnapshot().value).toBe('idle');
    actor.send({ type: 'DOWN' });
    expect(actor.getSnapshot().value).toBe('pressed');
    actor.send({ type: 'DRAG' });
    expect(actor.getSnapshot().value).toBe('dragging');
    actor.send({ type: 'UP' });
    expect(actor.getSnapshot().value).toBe('idle');
  });

  it('a click (DOWN then UP without DRAG) returns to idle', () => {
    const actor = createActor(selectPhaseMachine);
    actor.start();
    actor.send({ type: 'DOWN' });
    actor.send({ type: 'UP' });
    expect(actor.getSnapshot().value).toBe('idle');
  });

  it('RESET from any phase returns to idle', () => {
    const actor = createActor(selectPhaseMachine);
    actor.start();
    actor.send({ type: 'DOWN' });
    actor.send({ type: 'DRAG' });
    actor.send({ type: 'RESET' });
    expect(actor.getSnapshot().value).toBe('idle');
  });
});

/**
 * Kilit/gizli katman bypass koruması (denetim bulgusu): bir entity SEÇİLDİKTEN sonra katmanı
 * kilitlenirse, seçim kalır ama hiçbir mutasyon (it/sil/döndür/taşı) dispatch edilmemeli.
 */
describe('SelectTool — kilitli katman mutasyon koruması', () => {
  const wall: Wall = {
    id: 'w1',
    type: 'wall',
    layerId: 'L',
    start: { x: 0, y: 0 },
    end: { x: 100, y: 0 },
    thickness: 10,
  };
  const block: Block = {
    id: 'b1',
    type: 'block',
    layerId: 'L',
    kind: 'sofa',
    position: { x: 50, y: 50 },
    rotation: 0,
  };

  function makeTool(locked: boolean, seed: (Wall | Block)[]) {
    const store = new EntityStore();
    for (const e of seed) store.put(e);
    const dispatched: Command[] = [];
    const history = { dispatch: (c: Command) => dispatched.push(c) } as unknown as History;
    const ctx: ToolContext = {
      store,
      history,
      index: new SpatialIndex(),
      overlay: new Container(),
      pixelSize: () => 1,
      snap: (w) => w,
      isLayerHidden: () => false,
      isLayerLocked: (lid) => locked && lid === 'L',
    };
    const tool = new SelectTool(ctx);
    return { tool, dispatched };
  }

  const key = (k: string, shift = false): KeyboardEvent =>
    ({ key: k, shiftKey: shift, preventDefault() {} }) as unknown as KeyboardEvent;

  it('kilitliyken ok-tuşu itme dispatch ETMEZ', () => {
    const { tool, dispatched } = makeTool(true, [wall]);
    tool.selectMany(['w1']);
    tool.onKeyDown(key('ArrowRight'));
    expect(dispatched).toHaveLength(0);
  });

  it('kilitliyken Delete dispatch ETMEZ', () => {
    const { tool, dispatched } = makeTool(true, [wall]);
    tool.selectMany(['w1']);
    tool.onKeyDown(key('Delete'));
    expect(dispatched).toHaveLength(0);
  });

  it('kilitliyken blok döndürme (x) dispatch ETMEZ', () => {
    const { tool, dispatched } = makeTool(true, [block]);
    tool.selectMany(['b1']);
    tool.onKeyDown(key('x'));
    expect(dispatched).toHaveLength(0);
  });

  it('kilit AÇIKKEN aynı işlemler dispatch EDER (pozitif kontrol)', () => {
    const { tool, dispatched } = makeTool(false, [wall]);
    tool.selectMany(['w1']);
    tool.onKeyDown(key('ArrowRight'));
    expect(dispatched).toHaveLength(1);
    tool.onKeyDown(key('Delete'));
    expect(dispatched.length).toBeGreaterThanOrEqual(2);
  });
});
