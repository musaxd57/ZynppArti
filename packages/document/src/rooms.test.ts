import { describe, it, expect } from 'vitest';
import { EntityStore } from './store';
import { RoomManager } from './rooms';
import type { Space, Wall } from './entities';

let n = 0;
function wall(x1: number, y1: number, x2: number, y2: number): Wall {
  return {
    id: `w${n++}`,
    type: 'wall',
    layerId: 'default',
    start: { x: x1, y: y1 },
    end: { x: x2, y: y2 },
    thickness: 10,
  };
}

/** 400×300 kapalı kare oluşturan 4 duvarı store'a koyar. */
function squareStore(): EntityStore {
  const store = new EntityStore();
  for (const w of [
    wall(0, 0, 400, 0),
    wall(400, 0, 400, 300),
    wall(400, 300, 0, 300),
    wall(0, 300, 0, 0),
  ]) {
    store.put(w);
  }
  return store;
}

function spaces(store: EntityStore): Space[] {
  return store.all().filter((e): e is Space => e.type === 'space');
}

describe('RoomManager', () => {
  it('kapalı duvar döngüsünden bir mahal türetir', () => {
    const store = squareStore();
    const rm = new RoomManager(store);
    expect(spaces(store)).toHaveLength(1);
    expect(spaces(store)[0]!.boundary.length).toBeGreaterThanOrEqual(4);
    rm.destroy();
  });

  it('ad/tip/malzemeyi recompute boyunca centroid eşleştirmeyle korur', () => {
    const store = squareStore();
    const rm = new RoomManager(store);
    const s = spaces(store)[0]!;
    // Kullanıcı atamasını simüle et (aynı id ile güncelle).
    store.put({ ...s, name: 'Salon', roomType: 'living', material: 'parke' });
    rm.recompute();
    const after = spaces(store)[0]!;
    expect(after.name).toBe('Salon');
    expect(after.roomType).toBe('living');
    expect(after.material).toBe('parke');
    rm.destroy();
  });

  it('oda ikiye bölününce eski ad SADECE bir çocuğa taşınır (Y1: çift kopya yok)', () => {
    // 180×100 oda (her iki çocuk centroid'i de eski centroid'in 50 cm toleransında kalır → bire-bir şart).
    const store = new EntityStore();
    for (const w of [wall(0, 0, 180, 0), wall(180, 0, 180, 100), wall(180, 100, 0, 100), wall(0, 100, 0, 0)]) {
      store.put(w);
    }
    const rm = new RoomManager(store);
    expect(spaces(store)).toHaveLength(1);
    const s = spaces(store)[0]!;
    store.put({ ...s, name: 'Salon', roomType: 'living' });
    // Ortadan dikey duvarla böl.
    const mid = wall(90, 0, 90, 100);
    store.put(mid);
    store.emit({ added: [mid.id], updated: [], removed: [] });
    const after = spaces(store);
    expect(after).toHaveLength(2);
    expect(after.filter((x) => x.name === 'Salon')).toHaveLength(1); // çift DEĞİL
    expect(after.filter((x) => x.name === 'Mahal')).toHaveLength(1);
    rm.destroy();
  });

  it('duvar açılınca (kapalı değil) mahal kaybolur', () => {
    const store = squareStore();
    const rm = new RoomManager(store);
    expect(spaces(store)).toHaveLength(1);
    // Bir duvarı sil → döngü açılır.
    const aWall = store.all().find((e) => e.type === 'wall')!;
    store.delete(aWall.id);
    rm.recompute();
    expect(spaces(store)).toHaveLength(0);
    rm.destroy();
  });

  it('duvar değişikliğine abonelik üzerinden tepki verir (canlı)', () => {
    const store = new EntityStore();
    const rm = new RoomManager(store);
    expect(spaces(store)).toHaveLength(0);
    // Kareyi ekle + değişikliği bildir → RoomManager kendiliğinden yeniden hesaplar.
    const walls = [
      wall(0, 0, 400, 0),
      wall(400, 0, 400, 300),
      wall(400, 300, 0, 300),
      wall(0, 300, 0, 0),
    ];
    for (const w of walls) store.put(w);
    store.emit({ added: walls.map((w) => w.id), updated: [], removed: [] });
    expect(spaces(store)).toHaveLength(1);
    rm.destroy();
  });

  it('destroy sonrası değişikliklere tepki vermez', () => {
    const store = squareStore();
    const rm = new RoomManager(store);
    rm.destroy();
    const before = spaces(store).length;
    const w = wall(1000, 1000, 1400, 1000);
    store.put(w);
    store.emit({ added: [w.id], updated: [], removed: [] });
    expect(spaces(store).length).toBe(before); // tepki yok
  });
});
