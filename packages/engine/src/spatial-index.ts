import RBush from 'rbush';
import type { EntityId } from '@zynpparti/document';

/** Eksen-hizalı sınır kutusu (axis-aligned bounding box). */
export interface AABB {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

interface IndexItem {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  id: EntityId;
}

/**
 * R-tree mekânsal indeks (rbush sarmalı) — ENGINEERING-NOTES §2.
 * "Şu kutudaki entity'ler" sorgusunu hızlandırır; hit-test (broad phase) ve viewport
 * culling burada. 500k entity'de saf döngü donar; bu zorunludur (CLAUDE.md §8.1).
 *
 * NOT: rbush varsayılan `remove` referans eşitliğiyle çalışır → eklenen item nesnesini
 * `items` haritasında saklayıp aynı referansla siliyoruz.
 */
export class SpatialIndex {
  private readonly tree = new RBush<IndexItem>();
  private readonly items = new Map<EntityId, IndexItem>();

  insert(id: EntityId, box: AABB): void {
    const item: IndexItem = { minX: box.minX, minY: box.minY, maxX: box.maxX, maxY: box.maxY, id };
    this.tree.insert(item);
    this.items.set(id, item);
  }

  remove(id: EntityId): void {
    const item = this.items.get(id);
    if (!item) return;
    this.tree.remove(item);
    this.items.delete(id);
  }

  update(id: EntityId, box: AABB): void {
    this.remove(id);
    this.insert(id, box);
  }

  /** İlk doldurma için toplu yükleme (tek tek insert'ten ~2-3x hızlı). */
  bulkLoad(entries: ReadonlyArray<{ id: EntityId; box: AABB }>): void {
    const items: IndexItem[] = entries.map(({ id, box }) => ({
      minX: box.minX,
      minY: box.minY,
      maxX: box.maxX,
      maxY: box.maxY,
      id,
    }));
    this.tree.load(items);
    for (const it of items) this.items.set(it.id, it);
  }

  /** Verilen kutuyla kesişen entity id'leri. */
  search(box: AABB): EntityId[] {
    return this.tree
      .search({ minX: box.minX, minY: box.minY, maxX: box.maxX, maxY: box.maxY })
      .map((it) => it.id);
  }

  get size(): number {
    return this.items.size;
  }

  /** Tüm entity'leri kapsayan birleşik AABB (boşsa null) — zoom-to-fit için. */
  bounds(): AABB | null {
    if (this.items.size === 0) return null;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const it of this.items.values()) {
      if (it.minX < minX) minX = it.minX;
      if (it.minY < minY) minY = it.minY;
      if (it.maxX > maxX) maxX = it.maxX;
      if (it.maxY > maxY) maxY = it.maxY;
    }
    return { minX, minY, maxX, maxY };
  }

  clear(): void {
    this.tree.clear();
    this.items.clear();
  }
}
