import type { Vec2 } from '@zynpparti/geometry';
import type { Entity, EntityId } from './entities';
import { createEntityId } from './id';

/**
 * Kopyala-yapıştır / çoğaltma için saf geometri yardımcıları (UI'dan bağımsız → test edilebilir).
 *
 * Mahal (space) duvarlardan **türetilir** (RoomManager) → kopyalanmaz; boşluk (opening) bir duvara
 * `t` ile bağlıdır → tek başına kopyalanması anlamsız. Geri kalan tipler serbest kopyalanır.
 */
export function isClonable(e: Entity): boolean {
  return (
    e.type === 'wall' ||
    e.type === 'block' ||
    e.type === 'annotation' ||
    e.type === 'dimension' ||
    e.type === 'parcel' ||
    e.type === 'sheet' ||
    e.type === 'section' ||
    e.type === 'comment'
  );
}

/** Bir entity'yi (dx,dy) kadar kaydırılmış kopyasını döndürür (id ve tip korunur). */
export function offsetEntity(e: Entity, dx: number, dy: number): Entity {
  switch (e.type) {
    case 'wall':
      return {
        ...e,
        start: { x: e.start.x + dx, y: e.start.y + dy },
        end: { x: e.end.x + dx, y: e.end.y + dy },
      };
    case 'block':
    case 'annotation':
    case 'sheet':
    case 'comment':
      return { ...e, position: { x: e.position.x + dx, y: e.position.y + dy } };
    case 'dimension':
    case 'section':
      return {
        ...e,
        a: { x: e.a.x + dx, y: e.a.y + dy },
        b: { x: e.b.x + dx, y: e.b.y + dy },
      };
    case 'parcel':
      return { ...e, boundary: e.boundary.map((p) => ({ x: p.x + dx, y: p.y + dy })) };
    // Türetilmiş/bağlı tipler kaydırılarak kopyalanmaz (isClonable false) → olduğu gibi döner.
    case 'space':
    case 'opening':
      return e;
  }
}

/**
 * Bir entity'yi `origin` etrafında `f` katı ölçekler (kalibrasyon — saf). Tek-tip benzerlik dönüşümü:
 * tüm koordinatlar origin'e göre ölçeklenir, gerçek uzunluk taşıyan skaler alanlar (duvar kalınlığı/
 * yüksekliği, boşluk genişliği, ölçü offset, metin yüksekliği) da çarpılır. Ölçü UZUNLUĞU a/b'den
 * türediği için kendiliğinden güncellenir (stored değer çarpılmaz → çift uygulama yok — araştırma 2026-06-25).
 * Türetilmiş `space` ÖLÇEKLENMEZ (RoomManager duvarlardan yeniden türetir). Blok ayak izi katalog-sabiti
 * olduğundan yalnız konumu taşınır (sembol boyutu korunur).
 */
export function scaleEntityAbout(e: Entity, f: number, origin: Vec2): Entity {
  const sp = (p: Vec2): Vec2 => ({ x: origin.x + (p.x - origin.x) * f, y: origin.y + (p.y - origin.y) * f });
  switch (e.type) {
    case 'wall':
      return {
        ...e,
        start: sp(e.start),
        end: sp(e.end),
        thickness: e.thickness * f,
        ...(e.height != null ? { height: e.height * f } : {}),
      };
    case 'opening':
      return { ...e, width: e.width * f }; // t parametrik → duvarıyla taşınır; yalnız net genişlik ölçeklenir
    case 'dimension':
      return { ...e, a: sp(e.a), b: sp(e.b), offset: e.offset * f };
    case 'section':
      return { ...e, a: sp(e.a), b: sp(e.b) };
    case 'parcel':
      return { ...e, boundary: e.boundary.map(sp) };
    case 'block':
    case 'sheet':
    case 'comment':
      return { ...e, position: sp(e.position) };
    case 'annotation':
      return { ...e, position: sp(e.position), height: e.height * f };
    case 'space':
      return e; // türetilmiş — ölçeklenmez (RoomManager yeniden hesaplar)
  }
}

/**
 * Bir entity grubunun kaydırılmış KOPYALARINI üretir (yapıştır/çoğalt). Her kopyaya yeni id verilir;
 * grup İÇİNDEKİ bir duvarın bağlı boşluğu (opening) da gruptaysa, boşluğun `wallId`'si yeni duvarın
 * id'sine yönlendirilir → bağ kopmaz (duvarı kopyalanan kapı/pencere yeni duvara oturur). Duvarı
 * grupta olmayan boşluk eski `wallId`'sinde kalır. Saf (UI'dan bağımsız → test edilebilir).
 */
export function offsetClone(entities: readonly Entity[], dx: number, dy: number): Entity[] {
  const idMap = new Map<EntityId, EntityId>();
  const clones = entities.map((e) => {
    const id = createEntityId();
    idMap.set(e.id, id);
    // opening offsetEntity'de değişmeden döner (t-parametrik, duvarıyla taşınır) — yalnız id/wallId yenilenir.
    return { ...offsetEntity(e, dx, dy), id };
  });
  return clones.map((c) =>
    c.type === 'opening' ? { ...c, wallId: idMap.get(c.wallId) ?? c.wallId } : c,
  );
}
