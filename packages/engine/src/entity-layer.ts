import { Container, Graphics } from 'pixi.js';
import type { Entity, EntityId, EntityStore, StoreChange } from '@zynpparti/document';
import { SpatialIndex, type AABB } from './spatial-index';
import { entityBounds } from './entity-bounds';
import { drawWall } from './render-wall';

/**
 * Store'a abone olup entity'leri PixiJS'te çizen katman + mekânsal indeks (rbush).
 *
 * - **Dirty-render:** yalnız değişen entity'leri yeniden çizer (store change olaylarıyla).
 * - **Viewport culling:** yalnız görünür kutuyla kesişenleri `visible` yapar.
 *
 * Model değiştikçe (Command → History → store.emit) bu katman kendini günceller (CLAUDE.md §6.2).
 */
export class EntityLayer {
  readonly container = new Container();
  readonly index = new SpatialIndex();
  private readonly graphics = new Map<EntityId, Graphics>();
  private readonly unsubscribe: () => void;

  constructor(private readonly store: EntityStore) {
    // Var olan entity'leri çiz + indeksi toplu doldur.
    const entries: { id: EntityId; box: AABB }[] = [];
    for (const entity of store.all()) {
      this.draw(entity);
      entries.push({ id: entity.id, box: entityBounds(entity) });
    }
    this.index.bulkLoad(entries);

    this.unsubscribe = store.subscribe((change) => this.onChange(change));
  }

  private onChange(change: StoreChange): void {
    for (const id of change.removed) this.removeEntity(id);
    for (const id of change.added) this.upsert(id, true);
    for (const id of change.updated) this.upsert(id, false);
  }

  private upsert(id: EntityId, isNew: boolean): void {
    const entity = this.store.get(id);
    if (!entity) return;
    this.draw(entity);
    const box = entityBounds(entity);
    if (isNew) this.index.insert(id, box);
    else this.index.update(id, box);
  }

  private draw(entity: Entity): void {
    let g = this.graphics.get(entity.id);
    if (!g) {
      g = new Graphics();
      this.graphics.set(entity.id, g);
      this.container.addChild(g);
    }
    if (entity.type === 'wall') drawWall(g, entity);
  }

  private removeEntity(id: EntityId): void {
    const g = this.graphics.get(id);
    if (g) {
      g.destroy();
      this.graphics.delete(id);
    }
    this.index.remove(id);
  }

  /**
   * Viewport (dünya kutusu) dışındaki entity'leri gizle.
   * NOT (Faz 1): görünürlüğü her çağrıda tüm grafiklerde günceller (O(n)). 500k için
   * yalnız değişen görünürlükleri güncelleyen sürüme geçilecek (ENGINEERING-NOTES §2, §9).
   */
  cull(viewport: AABB): void {
    const visibleIds = new Set(this.index.search(viewport));
    for (const [id, g] of this.graphics) {
      g.visible = visibleIds.has(id);
    }
  }

  destroy(): void {
    this.unsubscribe();
    for (const g of this.graphics.values()) g.destroy();
    this.graphics.clear();
    this.index.clear();
    this.container.destroy({ children: true });
  }
}
