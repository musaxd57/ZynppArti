import { describe, it, expect } from 'vitest';
import { EntityStore } from './store';
import { AddEntity, RemoveEntity, UpdateEntity } from './command';
import { makeWall } from './test-helpers';

describe('AddEntity', () => {
  it('adds and reports the change; inverts to RemoveEntity', () => {
    const store = new EntityStore();
    const cmd = new AddEntity(makeWall('w1'));

    const change = cmd.apply(store);
    expect(change).toEqual({ added: ['w1'], updated: [], removed: [] });
    expect(store.has('w1')).toBe(true);

    const inverse = cmd.invert(store);
    inverse.apply(store);
    expect(store.has('w1')).toBe(false);
  });
});

describe('RemoveEntity', () => {
  it('captures the removed entity in its inverse (called before apply)', () => {
    const store = new EntityStore();
    const w = makeWall('w1');
    store.put(w);

    const cmd = new RemoveEntity('w1');
    const inverse = cmd.invert(store); // güncel durumdan yakalanır
    cmd.apply(store);
    expect(store.has('w1')).toBe(false);

    inverse.apply(store); // geri ekler
    expect(store.get('w1')).toEqual(w);
  });

  it('throws if inverting a missing entity', () => {
    const store = new EntityStore();
    expect(() => new RemoveEntity('nope').invert(store)).toThrow();
  });
});

describe('UpdateEntity', () => {
  it('replaces an entity; inverse restores the previous value', () => {
    const store = new EntityStore();
    const w = makeWall('w1', { x: 0, y: 0 }, { x: 100, y: 0 });
    store.put(w);

    const moved = { ...w, start: { x: 50, y: 50 } };
    const cmd = new UpdateEntity(moved);
    const inverse = cmd.invert(store);
    cmd.apply(store);
    expect(store.get('w1')?.start).toEqual({ x: 50, y: 50 });

    inverse.apply(store);
    expect(store.get('w1')?.start).toEqual({ x: 0, y: 0 });
  });
});
