import { describe, it, expect, vi } from 'vitest';
import { EntityStore } from './store';
import { makeWall } from './test-helpers';

describe('EntityStore', () => {
  it('puts, gets and reports presence/size', () => {
    const store = new EntityStore();
    expect(store.size).toBe(0);

    const w = makeWall('w1');
    store.put(w);

    expect(store.size).toBe(1);
    expect(store.has('w1')).toBe(true);
    expect(store.get('w1')).toEqual(w);
    expect(store.all()).toEqual([w]);
  });

  it('overwrites an entity with the same id', () => {
    const store = new EntityStore();
    store.put(makeWall('w1'));
    store.put(makeWall('w1', { x: 0, y: 0 }, { x: 200, y: 0 }));
    expect(store.size).toBe(1);
    expect(store.get('w1')?.end).toEqual({ x: 200, y: 0 });
  });

  it('deletes an entity', () => {
    const store = new EntityStore();
    store.put(makeWall('w1'));
    store.delete('w1');
    expect(store.has('w1')).toBe(false);
    expect(store.size).toBe(0);
  });

  it('notifies subscribers and supports unsubscribe', () => {
    const store = new EntityStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.emit({ added: ['w1'], updated: [], removed: [] });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ added: ['w1'], updated: [], removed: [] });

    unsubscribe();
    store.emit({ added: ['w2'], updated: [], removed: [] });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
