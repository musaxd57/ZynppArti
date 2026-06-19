import type { Entity, EntityId } from './entities';
import type { EntityStore, StoreChange } from './store';

/**
 * Modeli değiştiren atomik işlem (CLAUDE.md §6.3 — "model yalnız Command ile değişir").
 *
 * - `apply(store)`: değişikliği uygular ve neyi değiştirdiğini döner.
 * - `invert(store)`: bu komutun TERSİNİ üretir. History tarafından, komut uygulanmadan ÖNCE
 *   çağrılır; böylece güncel durumdan ters komut yakalanır (undo/redo bunun üstüne kurulu).
 */
export interface Command {
  readonly label: string;
  apply(store: EntityStore): StoreChange;
  invert(store: EntityStore): Command;
}

/** Yeni bir entity ekler. */
export class AddEntity implements Command {
  readonly label = 'Add';
  constructor(private readonly entity: Entity) {}

  apply(store: EntityStore): StoreChange {
    store.put(this.entity);
    return { added: [this.entity.id], updated: [], removed: [] };
  }

  invert(_store: EntityStore): Command {
    return new RemoveEntity(this.entity.id);
  }
}

/** Var olan bir entity'yi siler. */
export class RemoveEntity implements Command {
  readonly label = 'Remove';
  constructor(private readonly id: EntityId) {}

  apply(store: EntityStore): StoreChange {
    store.delete(this.id);
    return { added: [], updated: [], removed: [this.id] };
  }

  invert(store: EntityStore): Command {
    const prev = store.get(this.id);
    if (!prev) throw new Error(`RemoveEntity.invert: entity bulunamadı: ${this.id}`);
    return new AddEntity(prev);
  }
}

/** Bir entity'yi yeni haliyle değiştirir (taşı/yeniden adlandır/kalınlık vb.). */
export class UpdateEntity implements Command {
  readonly label = 'Update';
  constructor(private readonly next: Entity) {}

  apply(store: EntityStore): StoreChange {
    store.put(this.next);
    return { added: [], updated: [this.next.id], removed: [] };
  }

  invert(store: EntityStore): Command {
    const prev = store.get(this.next.id);
    if (!prev) throw new Error(`UpdateEntity.invert: entity bulunamadı: ${this.next.id}`);
    return new UpdateEntity(prev);
  }
}
