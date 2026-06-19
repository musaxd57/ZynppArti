import { describe, it, expect } from 'vitest';
import { createActor } from 'xstate';
import { wallToolMachine } from './wall-tool';
import type { Vec2 } from '@zynpparti/geometry';

describe('wallToolMachine', () => {
  it('starts idle and enters drawing on first POINT', () => {
    const actor = createActor(wallToolMachine, { input: { onCommit: () => {} } });
    actor.start();
    expect(actor.getSnapshot().value).toBe('idle');

    actor.send({ type: 'POINT', at: { x: 0, y: 0 } });
    expect(actor.getSnapshot().value).toBe('drawing');
    expect(actor.getSnapshot().context.start).toEqual({ x: 0, y: 0 });
  });

  it('commits a segment on the second POINT and chains from it', () => {
    const commits: [Vec2, Vec2][] = [];
    const actor = createActor(wallToolMachine, {
      input: { onCommit: (a, b) => commits.push([a, b]) },
    });
    actor.start();

    actor.send({ type: 'POINT', at: { x: 0, y: 0 } });
    actor.send({ type: 'POINT', at: { x: 100, y: 0 } });

    expect(commits).toEqual([[{ x: 0, y: 0 }, { x: 100, y: 0 }]]);
    expect(actor.getSnapshot().context.start).toEqual({ x: 100, y: 0 }); // zincir
    expect(actor.getSnapshot().value).toBe('drawing');
  });

  it('tracks the cursor via MOVE', () => {
    const actor = createActor(wallToolMachine, { input: { onCommit: () => {} } });
    actor.start();
    actor.send({ type: 'MOVE', at: { x: 7, y: 9 } });
    expect(actor.getSnapshot().context.cursor).toEqual({ x: 7, y: 9 });
  });

  it('CANCEL returns to idle and clears the start point', () => {
    const actor = createActor(wallToolMachine, { input: { onCommit: () => {} } });
    actor.start();
    actor.send({ type: 'POINT', at: { x: 0, y: 0 } });
    actor.send({ type: 'CANCEL' });
    expect(actor.getSnapshot().value).toBe('idle');
    expect(actor.getSnapshot().context.start).toBeNull();
  });
});
