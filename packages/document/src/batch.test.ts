import { describe, it, expect } from 'vitest';
import { EntityStore } from './store';
import { History } from './history';
import { AddEntity, UpdateEntity, RemoveEntity, BatchCommand } from './command';
import { makeWall, wallOf } from './test-helpers';

describe('BatchCommand', () => {
  it('applies many adds as a single undo step', () => {
    const store = new EntityStore();
    const history = new History(store);

    history.dispatch(
      new BatchCommand('import', [
        new AddEntity(makeWall('w1')),
        new AddEntity(makeWall('w2')),
        new AddEntity(makeWall('w3')),
      ]),
    );
    expect(store.size).toBe(3);

    history.undo();
    expect(store.size).toBe(0); // hepsi tek undo ile gitti

    history.redo();
    expect(store.size).toBe(3);
  });

  it('undoes a batch of independent updates back to original', () => {
    const store = new EntityStore();
    const history = new History(store);
    const a = makeWall('a', { x: 0, y: 0 }, { x: 100, y: 0 });
    const b = makeWall('b', { x: 0, y: 0 }, { x: 0, y: 100 });
    history.dispatch(new BatchCommand('seed', [new AddEntity(a), new AddEntity(b)]));

    history.dispatch(
      new BatchCommand('scale', [
        new UpdateEntity({ ...a, end: { x: 200, y: 0 } }),
        new UpdateEntity({ ...b, end: { x: 0, y: 200 } }),
      ]),
    );
    expect(wallOf(store, 'a').end).toEqual({ x: 200, y: 0 });
    expect(wallOf(store, 'b').end).toEqual({ x: 0, y: 200 });

    history.undo();
    expect(wallOf(store, 'a').end).toEqual({ x: 100, y: 0 });
    expect(wallOf(store, 'b').end).toEqual({ x: 0, y: 100 });
  });

  it('ayni entity iki kez dokunan batch yapim aninda reddedilir (fail-fast)', () => {
    const a = makeWall('a');
    // Update + Remove aynı id → terslenemez; net hata (undo'da gizemli throw yerine).
    expect(
      () => new BatchCommand('bozuk', [new UpdateEntity(a), new RemoveEntity('a')]),
    ).toThrow(/aynı entity/);
    // İç içe batch (id'siz) güvenli — duplicate denetimi onları atlar.
    expect(
      () => new BatchCommand('dış', [new BatchCommand('iç', [new AddEntity(a)])]),
    ).not.toThrow();
  });
});
