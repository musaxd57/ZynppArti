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
  /** Komutun dokunduğu entity (varsa). BatchCommand bağımsızlık (tek-id) denetimi için kullanır. */
  readonly targetId?: EntityId;
  apply(store: EntityStore): StoreChange;
  invert(store: EntityStore): Command;
}

/** Yeni bir entity ekler. */
export class AddEntity implements Command {
  readonly label = 'Add';
  readonly targetId: EntityId;
  constructor(private readonly entity: Entity) {
    this.targetId = entity.id;
  }

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
  readonly targetId: EntityId;
  constructor(private readonly id: EntityId) {
    this.targetId = id;
  }

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
  readonly targetId: EntityId;
  constructor(private readonly next: Entity) {
    this.targetId = next.id;
  }

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

/**
 * Birden çok komutu tek bir undo/redo adımı olarak uygular (ör. DXF import, ölçek kalibrasyonu).
 *
 * KISIT: Alt komutlar **bağımsız** olmalı (her biri farklı bir entity'ye dokunmalı). Bu sayede
 * tersler ön-durumdan toplu yakalanabilir. Aynı entity'yi iki kez değiştiren batch desteklenmez.
 */
export class BatchCommand implements Command {
  constructor(
    readonly label: string,
    private readonly commands: readonly Command[],
  ) {
    // KISIT denetimi (fail-fast): aynı entity'ye iki kez dokunan batch terslenemez — alt-komut
    // tersleri apply ÖNCESİ ortak durumdan yakalanır, bu yüzden id başına en çok bir komut olmalı.
    // (Bağlı duvar+boşluk batch'leri farklı id'lere dokunur → güvenli.) Net hata, undo'da gizemli
    // "entity bulunamadı" yerine geliştirme anında yakalanır.
    const seen = new Set<EntityId>();
    for (const c of commands) {
      const id = c.targetId;
      if (id === undefined) continue; // iç içe batch / id'siz komut → atla
      if (seen.has(id)) {
        throw new Error(
          `BatchCommand "${label}": aynı entity (${id}) tek batch'te iki kez değiştirilemez ` +
            `(alt komutlar bağımsız olmalı; undo/redo için tersi ön-durumdan yakalanır).`,
        );
      }
      seen.add(id);
    }
  }

  apply(store: EntityStore): StoreChange {
    const added: EntityId[] = [];
    const updated: EntityId[] = [];
    const removed: EntityId[] = [];
    for (const c of this.commands) {
      const ch = c.apply(store);
      added.push(...ch.added);
      updated.push(...ch.updated);
      removed.push(...ch.removed);
    }
    return { added, updated, removed };
  }

  invert(store: EntityStore): Command {
    const inverses = this.commands.map((c) => c.invert(store)).reverse();
    return new BatchCommand(this.label, inverses);
  }
}
