import { describe, it, expect } from 'vitest';
import * as Y from 'yjs';
import { EntityStore, type Space } from '@zynpparti/document';
import { RoomLabelSync, roomKey } from './room-labels';

function connect(a: Y.Doc, b: Y.Doc): void {
  a.on('update', (u: Uint8Array, origin: unknown) => {
    if (origin !== 'net') Y.applyUpdate(b, u, 'net');
  });
  b.on('update', (u: Uint8Array, origin: unknown) => {
    if (origin !== 'net') Y.applyUpdate(a, u, 'net');
  });
}

function space(id: string, name: string): Space {
  return {
    id,
    type: 'space',
    layerId: 'rooms',
    name,
    boundary: [
      { x: 0, y: 0 },
      { x: 400, y: 0 },
      { x: 400, y: 300 },
      { x: 0, y: 300 },
    ],
  };
}

describe('roomKey', () => {
  it('merkez ~10 cm ızgaraya yuvarlanır (client-bağımsız)', () => {
    expect(roomKey(space('a', 'X'))).toBe('20:15'); // merkez (200,150) → 20:15
  });
});

describe('RoomLabelSync — iki istemci', () => {
  it('bir client mahali adlandırınca diğerinde de adı değişir', () => {
    const s1 = new EntityStore();
    const s2 = new EntityStore();
    const d1 = new Y.Doc();
    const d2 = new Y.Doc();
    connect(d1, d2);
    // İki client de aynı geometride mahale sahip (duvarlardan türemiş gibi).
    s1.put(space('a', 'Mahal'));
    s2.put(space('b', 'Mahal'));
    new RoomLabelSync(s1, d1);
    new RoomLabelSync(s2, d2);

    // s1'de adlandır → s2'ye yansımalı.
    s1.put({ ...space('a', 'Salon') });
    s1.emit({ added: [], updated: ['a'], removed: [] });

    expect((s2.get('b') as Space).name).toBe('Salon');
  });

  it('sonradan türeyen mahale var olan etiket uygulanır', () => {
    const s1 = new EntityStore();
    const s2 = new EntityStore();
    const d1 = new Y.Doc();
    const d2 = new Y.Doc();
    connect(d1, d2);
    s1.put(space('a', 'Mahal'));
    new RoomLabelSync(s1, d1);
    s1.put({ ...space('a', 'Mutfak') });
    s1.emit({ added: [], updated: ['a'], removed: [] });

    // s2 etiket zaten doc'ta; mahal sonradan türüyor → ad uygulanmalı.
    new RoomLabelSync(s2, d2);
    s2.put(space('b', 'Mahal'));
    s2.emit({ added: ['b'], updated: [], removed: [] });
    expect((s2.get('b') as Space).name).toBe('Mutfak');
  });
});
