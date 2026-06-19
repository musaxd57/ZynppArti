import { Container, Graphics } from 'pixi.js';
import type { Entity, EntityId, EntityStore, StoreChange } from '@zynpparti/document';
import { SpatialIndex, type AABB } from './spatial-index';
import { entityBounds } from './entity-bounds';
import { drawWall } from './render-wall';
import { buildSpaceFill, buildSpaceLabel } from './render-space';

/**
 * Store'a abone olup entity'leri PixiJS'te çizen katman + mekânsal indeks (rbush).
 * Z-sırası: mahal dolguları (altta) → duvarlar (ortada) → etiketler (üstte).
 *
 * - **Dirty-render:** yalnız değişen entity'nin görsellerini yeniden kurar.
 * - **Viewport culling:** yalnız görünür kutuyla kesişenleri `visible` yapar.
 */
export class EntityLayer {
  readonly container = new Container();
  readonly index = new SpatialIndex();
  private readonly spaceFill = new Container();
  private readonly wallLayer = new Container();
  private readonly labelLayer = new Container();
  private readonly objects = new Map<EntityId, Container[]>();
  private readonly unsubscribe: () => void;

  constructor(private readonly store: EntityStore) {
    this.container.addChild(this.spaceFill, this.wallLayer, this.labelLayer);

    const entries: { id: EntityId; box: AABB }[] = [];
    for (const e of store.all()) {
      this.render(e);
      entries.push({ id: e.id, box: entityBounds(e) });
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
    this.render(entity);
    const box = entityBounds(entity);
    if (isNew) this.index.insert(id, box);
    else this.index.update(id, box);
  }

  /** Entity'nin görsellerini (sil-yeniden kur) ilgili z-katmanlarına yerleştirir. */
  private render(entity: Entity): void {
    this.destroyObjects(entity.id);
    const objs: Container[] = [];
    if (entity.type === 'wall') {
      const g = new Graphics();
      drawWall(g, entity);
      this.wallLayer.addChild(g);
      objs.push(g);
    } else {
      const fill = buildSpaceFill(entity);
      this.spaceFill.addChild(fill);
      objs.push(fill);
      const label = buildSpaceLabel(entity);
      this.labelLayer.addChild(label);
      objs.push(label);
    }
    this.objects.set(entity.id, objs);
  }

  private removeEntity(id: EntityId): void {
    this.destroyObjects(id);
    this.index.remove(id);
  }

  private destroyObjects(id: EntityId): void {
    const objs = this.objects.get(id);
    if (objs) {
      for (const o of objs) o.destroy();
      this.objects.delete(id);
    }
  }

  /** Viewport (dünya kutusu) dışındaki entity'leri gizle (Faz 1: O(n); ileride artımlı). */
  cull(viewport: AABB): void {
    const visibleIds = new Set(this.index.search(viewport));
    for (const [id, objs] of this.objects) {
      const visible = visibleIds.has(id);
      for (const o of objs) o.visible = visible;
    }
  }

  destroy(): void {
    this.unsubscribe();
    for (const objs of this.objects.values()) for (const o of objs) o.destroy();
    this.objects.clear();
    this.index.clear();
    this.container.destroy({ children: true });
  }
}
