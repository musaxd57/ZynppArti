import { describe, it, expect } from 'vitest';
import * as Y from 'yjs';
import { EntityStore, type Wall, type Space } from '@zynpparti/document';
import { EntitySync } from './sync';

/** İki Y.Doc'u bellek-içi bağlar (gerçek ağ yerine update alışverişi) — iki istemciyi simüle eder. */
function connect(a: Y.Doc, b: Y.Doc): void {
  a.on('update', (u: Uint8Array, origin: unknown) => {
    if (origin !== 'net') Y.applyUpdate(b, u, 'net');
  });
  b.on('update', (u: Uint8Array, origin: unknown) => {
    if (origin !== 'net') Y.applyUpdate(a, u, 'net');
  });
}

function wall(id: string, x2: number, thickness = 20): Wall {
  return { id, type: 'wall', layerId: 'default', start: { x: 0, y: 0 }, end: { x: x2, y: 0 }, thickness };
}

describe('EntitySync — iki istemci', () => {
  it('eklenen duvar diğer istemciye yansır', () => {
    const s1 = new EntityStore();
    const s2 = new EntityStore();
    const d1 = new Y.Doc();
    const d2 = new Y.Doc();
    connect(d1, d2);
    new EntitySync(s1, d1);
    new EntitySync(s2, d2);

    const w = wall('w1', 100);
    s1.put(w);
    s1.emit({ added: ['w1'], updated: [], removed: [] });

    expect(s2.get('w1')).toEqual(w);
  });

  it('güncelleme ve silme yansır', () => {
    const s1 = new EntityStore();
    const s2 = new EntityStore();
    const d1 = new Y.Doc();
    const d2 = new Y.Doc();
    connect(d1, d2);
    new EntitySync(s1, d1);
    new EntitySync(s2, d2);

    s1.put(wall('w1', 100));
    s1.emit({ added: ['w1'], updated: [], removed: [] });
    s1.put(wall('w1', 100, 30));
    s1.emit({ added: [], updated: ['w1'], removed: [] });
    expect((s2.get('w1') as Wall).thickness).toBe(30);

    s1.delete('w1');
    s1.emit({ added: [], updated: [], removed: ['w1'] });
    expect(s2.has('w1')).toBe(false);
  });

  it('türetilmiş mahal (space) SENKRONLANMAZ (her client yerel türetir)', () => {
    const s1 = new EntityStore();
    const s2 = new EntityStore();
    const d1 = new Y.Doc();
    const d2 = new Y.Doc();
    connect(d1, d2);
    new EntitySync(s1, d1);
    new EntitySync(s2, d2);

    const space: Space = {
      id: 's1',
      type: 'space',
      layerId: 'rooms',
      name: 'Oda',
      boundary: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
      ],
    };
    s1.put(space);
    s1.emit({ added: ['s1'], updated: [], removed: [] });
    expect(s2.has('s1')).toBe(false);
  });

  it('pushLocalIfEmpty: boş odaya yerel çizimi iter, DOLU odaya itmez (host kirlenmez)', () => {
    // Boş oda → yerel çizim paylaşılır.
    const s = new EntityStore();
    s.put(wall('w1', 100)); // emit yok (seedDemo gibi) → abonelik tetiklenmez
    const d = new Y.Doc();
    const sync = new EntitySync(s, d);
    sync.pushLocalIfEmpty();
    expect(d.getMap<Wall>('entities').has('w1')).toBe(true);

    // Dolu oda (host verisi var) → katılanın yerel demo'su İTİLMEZ, host'unki alınır.
    const d2 = new Y.Doc();
    d2.getMap<Wall>('entities').set('host', wall('host', 500));
    const s2 = new EntityStore();
    s2.put(wall('local', 300));
    const sync2 = new EntitySync(s2, d2);
    sync2.pushLocalIfEmpty();
    expect(d2.getMap<Wall>('entities').has('local')).toBe(false); // host kirlenmedi
    expect(s2.has('host')).toBe(true); // host çizimi alındı
  });

  it('var olan odaya katılan istemci mevcut entity-leri alır', () => {
    const s1 = new EntityStore();
    const d1 = new Y.Doc();
    const d2 = new Y.Doc();
    new EntitySync(s1, d1); // s1 boş → Y boş
    s1.put(wall('w1', 200));
    s1.emit({ added: ['w1'], updated: [], removed: [] });

    // Şimdi d2 bağlanır (sonradan katılım): önce update alışverişi, sonra sync.
    connect(d1, d2);
    Y.applyUpdate(d2, Y.encodeStateAsUpdate(d1), 'net'); // mevcut durumu çek
    const s2 = new EntityStore();
    new EntitySync(s2, d2); // Y dolu → store'a uygula
    expect((s2.get('w1') as Wall).end.x).toBe(200);
  });
});
