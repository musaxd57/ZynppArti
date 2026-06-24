import { findFaces, type Segment, type Vec2 } from '@zynpparti/geometry';
import type { EntityStore, StoreChange } from './store';
import type { EntityId, Space, Wall } from './entities';
import { AddEntity, RemoveEntity } from './command';
import { createEntityId } from './id';

const CENTROID_MATCH_TOL = 50; // cm — eski mahalin adını yeni yüze taşımak için

/**
 * Duvarlardan mahalleri otomatik bulur ve store'u günceller (ENGINEERING-NOTES §1).
 * Duvarlar değişince yeniden hesaplar (canlı m²).
 *
 * Mahaller TÜRETİLMİŞ veridir → undo geçmişini kirletmemek için doğrudan store'a (Command.apply)
 * uygulanır, History'ye girmez. Yeniden-giriş, `recomputing` bayrağıyla engellenir (ADR-0012).
 */
export class RoomManager {
  private knownWalls = new Set<EntityId>();
  private recomputing = false;
  private readonly unsubscribe: () => void;

  constructor(private readonly store: EntityStore) {
    this.unsubscribe = store.subscribe((c) => this.onChange(c));
    this.recompute();
  }

  private onChange(change: StoreChange): void {
    if (this.recomputing) return;
    const wallsTouched =
      change.removed.some((id) => this.knownWalls.has(id)) ||
      [...change.added, ...change.updated].some((id) => this.store.get(id)?.type === 'wall');
    if (wallsTouched) this.recompute();
  }

  /** Mahalleri yeniden hesapla ve store'a yansıt. */
  recompute(): void {
    const walls = this.store.all().filter((e): e is Wall => e.type === 'wall');
    this.knownWalls = new Set(walls.map((w) => w.id));

    const segments: Segment[] = walls.map((w) => ({ a: w.start, b: w.end }));
    let faces: Vec2[][];
    try {
      faces = findFaces(segments);
    } catch (err) {
      // Dejenere/bozuk geometri yüz-bulmayı patlatırsa: eski mahalleri KORU, app'i kilitleme.
      console.error('RoomManager: mahal yeniden-hesabı başarısız, eski mahaller korunuyor.', err);
      return;
    }

    const oldSpaces = this.store.all().filter((e): e is Space => e.type === 'space');

    // BİRE-BİR eşleştirme: her eski mahal en fazla BİR yeni yüze ad/tip/malzeme verir. Aksi halde bir oda
    // ikiye bölününce ve iki çocuk centroid'i de eski centroid'in toleransındaysa, aynı eski mahal iki
    // çocuğa birden kopyalanır (Y1). Açgözlü en-yakın-önce: tüm (yüz, eskiMahal) çiftlerini mesafeye göre
    // sırala; ikisi de boştaysa eşle, ikisini de tüketilmiş işaretle.
    const faceCentroids = faces.map((b) => centroid(b));
    const oldValid = oldSpaces
      .map((s, i) => ({ i, c: centroid(s.boundary), ok: s.boundary.length >= 3 }))
      .filter((o) => o.ok);
    const pairs: Array<{ fi: number; oi: number; d: number }> = [];
    for (let fi = 0; fi < faces.length; fi++) {
      if (faces[fi]!.length < 3) continue;
      for (const o of oldValid) {
        const d = dist(o.c, faceCentroids[fi]!);
        if (d < CENTROID_MATCH_TOL) pairs.push({ fi, oi: o.i, d });
      }
    }
    pairs.sort((a, b) => a.d - b.d);
    const matchOf = new Map<number, Space>(); // faceIdx → eski mahal
    const usedFace = new Set<number>();
    const usedOld = new Set<number>();
    for (const p of pairs) {
      if (usedFace.has(p.fi) || usedOld.has(p.oi)) continue;
      usedFace.add(p.fi);
      usedOld.add(p.oi);
      matchOf.set(p.fi, oldSpaces[p.oi]!);
    }

    const newSpaces: Space[] = faces.map((boundary, fi) => {
      const match = matchOf.get(fi);
      return {
        id: createEntityId(),
        type: 'space',
        layerId: 'rooms',
        name: match?.name ?? 'Mahal',
        // Ad gibi tip + malzeme de eski yüzden yeni yüze taşınır (kullanıcı ataması kaybolmasın).
        roomType: match?.roomType,
        material: match?.material,
        boundary,
      };
    });

    // try/finally: store ops/emit patlasa bile `recomputing` sıfırlansın (yoksa manager zombi olur —
    // bir daha hiç mahal hesaplamaz). Denetim bulgusu.
    this.recomputing = true;
    try {
      for (const s of oldSpaces) new RemoveEntity(s.id).apply(this.store);
      for (const s of newSpaces) new AddEntity(s).apply(this.store);
      this.store.emit({
        added: newSpaces.map((s) => s.id),
        updated: [],
        removed: oldSpaces.map((s) => s.id),
      });
    } finally {
      this.recomputing = false;
    }
  }

  destroy(): void {
    this.unsubscribe();
  }
}

function centroid(poly: readonly Vec2[]): Vec2 {
  let x = 0;
  let y = 0;
  for (const p of poly) {
    x += p.x;
    y += p.y;
  }
  const n = poly.length || 1;
  return { x: x / n, y: y / n };
}

function dist(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
