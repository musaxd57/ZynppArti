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

  it('çok büyük modelde (>8000 duvar) mahal türetmeyi atlar (O(n²) donma koruması)', () => {
    // 8001 kısa kopuk duvar — findFaces çağrılsaydı dakikalarca sürerdi; guard atlar → hızlı + 0 mahal.
    const store = new EntityStore();
    for (let i = 0; i < 8001; i++) {
      store.put({
        id: `bw${i}`,
        type: 'wall',
        layerId: 'default',
        start: { x: i * 10, y: 0 },
        end: { x: i * 10 + 5, y: 0 },
        thickness: 10,
      });
    }
    const rm = new RoomManager(store); // recompute çağrılır ama guard ile atlanır
    expect(spaces(store)).toHaveLength(0); // mahal türetilmedi
    rm.destroy();
  });

  it('yüklenen mahali TOHUM verince ad/tip/malzeme geri gelir (kaydet→aç veri kaybı, denetim H0)', () => {
    // Taze oturum: store'da yalnız duvarlar var (mahaller kaydedilirken çıkarıldı). Kaydedilmiş mahal
    // tohum verilir → recompute centroid eşleşmesiyle adı/tipi/malzemeyi yeni türetilen yüze taşır.
    const store = squareStore();
    const seeded: Space = {
      id: 'old',
      type: 'space',
      layerId: 'rooms',
      name: 'Mutfak',
      roomType: 'kitchen',
      material: 'seramik',
      boundary: [
        { x: 0, y: 0 },
        { x: 400, y: 0 },
        { x: 400, y: 300 },
        { x: 0, y: 300 },
      ],
    };
    const rm = new RoomManager(store, [seeded]);
    const after = spaces(store)[0]!;
    expect(after.name).toBe('Mutfak');
    expect(after.roomType).toBe('kitchen');
    expect(after.material).toBe('seramik');
    expect(after.id).not.toBe('old'); // türetilmiş yeni mahal — tohum store'a yazılmadı
    rm.destroy();
  });

  it('seedSpaces sonra duvar değişimi adı geri getirir ve tohum bir kez tüketilir', () => {
    const store = new EntityStore();
    const rm = new RoomManager(store); // boş başla
    rm.seedSpaces([
      {
        id: 'old',
        type: 'space',
        layerId: 'rooms',
        name: 'Banyo',
        boundary: [
          { x: 0, y: 0 },
          { x: 400, y: 0 },
          { x: 400, y: 300 },
          { x: 0, y: 300 },
        ],
      },
    ]);
    const walls = [wall(0, 0, 400, 0), wall(400, 0, 400, 300), wall(400, 300, 0, 300), wall(0, 300, 0, 0)];
    for (const w of walls) store.put(w);
    store.emit({ added: walls.map((w) => w.id), updated: [], removed: [] });
    expect(spaces(store)[0]!.name).toBe('Banyo');
    // Tohum tüketildi: store'daki adı değiştir + recompute → eski tohum yeniden uygulanmamalı.
    store.put({ ...spaces(store)[0]!, name: 'Banyo 2' });
    rm.recompute();
    expect(spaces(store)[0]!.name).toBe('Banyo 2');
    rm.destroy();
  });

  it('bir kenar çok alt-bölünse de ad eşleşir (alan-ağırlıklı centroid, denetim M0)', () => {
    // Tohum sınırının alt kenarında fazladan colinear noktalar var → KÖŞE-ortalaması (200,~55) yüz
    // centroid'inden (200,150) >50 cm kayar ve eski yöntem eşleşmezdi; ALAN-ağırlıklı centroid (200,150)
    // sabit kalır → ad korunur.
    const store = squareStore();
    const seeded: Space = {
      id: 'old',
      type: 'space',
      layerId: 'rooms',
      name: 'Oda',
      boundary: [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 100, y: 0 },
        { x: 150, y: 0 },
        { x: 200, y: 0 },
        { x: 250, y: 0 },
        { x: 300, y: 0 },
        { x: 350, y: 0 },
        { x: 400, y: 0 },
        { x: 400, y: 300 },
        { x: 0, y: 300 },
      ],
    };
    const rm = new RoomManager(store, [seeded]);
    expect(spaces(store)[0]!.name).toBe('Oda');
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
