import { describe, it, expect } from 'vitest';
import { EntityStore } from './store';
import { History } from './history';
import { AddEntity, UpdateEntity, RemoveEntity } from './command';
import { makeWall, wallOf } from './test-helpers';

describe('History', () => {
  it('dispatch → undo → redo round-trips an add', () => {
    const store = new EntityStore();
    const history = new History(store);
    const w = makeWall('w1');

    history.dispatch(new AddEntity(w));
    expect(store.size).toBe(1);
    expect(history.canUndo).toBe(true);
    expect(history.canRedo).toBe(false);

    history.undo();
    expect(store.has('w1')).toBe(false);
    expect(history.canRedo).toBe(true);

    history.redo();
    expect(store.get('w1')).toEqual(w);
  });

  it('undoes an update back to the previous value', () => {
    const store = new EntityStore();
    const history = new History(store);
    const w = makeWall('w1', { x: 0, y: 0 }, { x: 100, y: 0 });

    history.dispatch(new AddEntity(w));
    history.dispatch(new UpdateEntity({ ...w, start: { x: 50, y: 50 } }));
    expect(wallOf(store, 'w1').start).toEqual({ x: 50, y: 50 });

    history.undo();
    expect(wallOf(store, 'w1').start).toEqual({ x: 0, y: 0 });
  });

  it('clears the redo stack after a new dispatch', () => {
    const store = new EntityStore();
    const history = new History(store);

    history.dispatch(new AddEntity(makeWall('w1')));
    history.undo();
    expect(history.canRedo).toBe(true);

    history.dispatch(new AddEntity(makeWall('w2')));
    expect(history.canRedo).toBe(false);
  });

  it('no-ops undo/redo on empty stacks', () => {
    const store = new EntityStore();
    const history = new History(store);
    expect(() => history.undo()).not.toThrow();
    expect(() => history.redo()).not.toThrow();
    expect(store.size).toBe(0);
  });

  it('uzak peer hedef entity\'yi silince undo/dispatch ÇÖKMEZ ve stack bozulmaz (§6.4)', () => {
    const store = new EntityStore();
    const history = new History(store);
    const w = makeWall('w1', { x: 0, y: 0 }, { x: 100, y: 0 });
    history.dispatch(new AddEntity(w));
    history.dispatch(new UpdateEntity({ ...w, start: { x: 50, y: 50 } })); // undoStack: [Remove, Update(w_prev)]

    // Uzak peer w1'i sildi (collab onRemote → store.delete, History dışı).
    store.delete('w1');

    // Update'i geri almak invert'te "entity bulunamadı" fırlatırdı → artık atlanır, çökme yok.
    expect(() => history.undo()).not.toThrow();
    expect(store.has('w1')).toBe(false); // zombie diriltilmedi
    // Bozuk girdi düşürüldü; sıradaki undo (Add'in tersi = Remove) hâlâ güvenli çalışır.
    expect(() => history.undo()).not.toThrow();

    // Silinmiş entity'ye dispatch de çökmemeli (no-op).
    expect(() => history.dispatch(new RemoveEntity('w1'))).not.toThrow();
  });

  it('emits a change on every mutation', () => {
    const store = new EntityStore();
    const history = new History(store);
    const changes: string[] = [];
    store.subscribe((c) => changes.push(`+${c.added.length} ~${c.updated.length} -${c.removed.length}`));

    history.dispatch(new AddEntity(makeWall('w1')));
    history.undo();
    history.redo();

    expect(changes).toEqual(['+1 ~0 -0', '+0 ~0 -1', '+1 ~0 -0']);
  });
});
