import type { Entity, EntityId } from './entities';

/** Bir mutasyonun neyi değiştirdiğini özetler (engine dirty-render için kullanır). */
export interface StoreChange {
  readonly added: readonly EntityId[];
  readonly updated: readonly EntityId[];
  readonly removed: readonly EntityId[];
}

export type StoreListener = (change: StoreChange) => void;

/**
 * Entity store — doküman verisinin doğruluk kaynağı (CLAUDE.md §6.1).
 * Saf veri + abonelik; DOM/render/ağ YOK (§0.8).
 *
 * `put`/`delete` düşük seviye primitiflerdir; yalnızca Command'ler çağırır (§6.3).
 * Uygulama kodu store'a doğrudan yazmaz — her şey History.dispatch üzerinden geçer.
 */
export class EntityStore {
  private readonly entities = new Map<EntityId, Entity>();
  private readonly listeners = new Set<StoreListener>();

  get(id: EntityId): Entity | undefined {
    return this.entities.get(id);
  }

  has(id: EntityId): boolean {
    return this.entities.has(id);
  }

  all(): readonly Entity[] {
    return [...this.entities.values()];
  }

  get size(): number {
    return this.entities.size;
  }

  /** Düşük seviye: bir entity'yi ekle/değiştir. (Command tarafından çağrılır.) */
  put(entity: Entity): void {
    this.entities.set(entity.id, entity);
  }

  /** Düşük seviye: bir entity'yi sil. (Command tarafından çağrılır.) */
  delete(id: EntityId): void {
    this.entities.delete(id);
  }

  /** Değişiklik aboneliği; abonelikten çıkmak için dönen fonksiyonu çağır. */
  subscribe(listener: StoreListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Abonelere bir değişikliği bildir. (History, komut uygulandıktan sonra çağırır.) */
  emit(change: StoreChange): void {
    for (const listener of this.listeners) listener(change);
  }
}
