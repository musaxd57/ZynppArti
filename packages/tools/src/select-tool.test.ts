import { describe, it, expect } from 'vitest';
import { createActor } from 'xstate';
import { selectPhaseMachine } from './select-tool';

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
