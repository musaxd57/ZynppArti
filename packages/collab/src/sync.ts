import * as Y from 'yjs';
import { isValidEntity } from '@zynpparti/document';
import type { Entity, EntityId, EntityStore, StoreChange } from '@zynpparti/document';

/**
 * Gerçek-zamanlı işbirliği çekirdeği (Faz 3, ADR-0004): EntityStore ↔ Yjs `Y.Map` çift-yönlü ayna.
 * Yjs CRDT senkron/birleştirmeyi (presence, offline) sağlar; bu sınıf store ile Y.Map'i echo-güvenli
 * biçimde eşler.
 *
 * **KARAR:** Türetilmiş `space` (mahal) entity'leri SENKRONLANMAZ — her client kendi duvarlarından
 * RoomManager ile yerel türetir (yoksa çift mahal olur). Bu nedenle mahal ADLARI v1'de yereldir
 * (senkron değil) — ileride çözülür. Duvar/boşluk/blok/ölçü/parsel/pafta/kesit senkronlanır.
 *
 * **v1 SINIRI (CLAUDE §6.4):** Bu, store-aynası bir TEMELDİR. Tam multiplayer için Command-tabanlı
 * undo köşe durumları, katman-döngü invariant'ı (sunucu otoritesi) ve çakışma çözümü ARCHITECTURE.md'de
 * tanımlanıp eklenecek. Şu an: iki istemci aynı odada çizince duvarlar anında eşleşir.
 */
export class EntitySync {
  private readonly ymap: Y.Map<Entity>;
  private applyingRemote = false;
  private readonly unsubStore: () => void;
  private readonly observer: (event: Y.YMapEvent<Entity>, tx: Y.Transaction) => void;

  constructor(
    private readonly store: EntityStore,
    private readonly doc: Y.Doc,
  ) {
    this.ymap = doc.getMap<Entity>('entities');

    // Doc kurulurken zaten veri varsa (nadir, eşzamanlı) store'a uygula. Asıl ilk-eşitleme
    // `pushLocalIfEmpty` ile İLK SYNC SONRASI yapılır (geç katılan, kendi demo'sunu odaya itmesin).
    if (this.ymap.size > 0) this.applyAllFromY();

    this.unsubStore = this.store.subscribe((c) => this.onStoreChange(c));
    this.observer = (event, tx) => {
      if (tx.origin !== this) this.onRemote(event); // kendi yazdığımız değişikliği (origin=this) yok say
    };
    this.ymap.observe(this.observer);
  }

  /**
   * İlk sync TAMAMLANDIKTAN sonra çağrılır (createCollab → provider 'sync'): oda HÂLÂ boşsa (taze
   * oda) yerel çizimi Y'ye iter. Oda doluysa (var olan odaya katılım) İTMEZ → katılan sekmenin
   * yerel/demo entity'leri host'u kirletmez (yalnız host'unkini alır, onRemote ile).
   */
  pushLocalIfEmpty(): void {
    if (this.ymap.size > 0) return;
    this.doc.transact(() => {
      for (const e of this.store.all()) if (isSyncable(e)) this.ymap.set(e.id, e);
    }, this);
  }

  /** Mevcut tüm Y.Map entity'lerini store'a uygular (echo-güvenli; geçersiz/uyumsuz olanı karantinaya alır). */
  private applyAllFromY(): void {
    this.applyRemote(() => {
      const added: EntityId[] = [];
      this.ymap.forEach((e, id) => {
        if (!this.acceptRemote(e, id)) return;
        this.store.put(e);
        added.push(id);
      });
      if (added.length) this.store.emit({ added, updated: [], removed: [] });
    });
  }

  /**
   * KARANTİNA (CLAUDE §6.4): uzak veriyi store'a koymadan ÖNCE doğrula. Bozuk/kötücül bir peer
   * (NaN koordinat, eksik alan, sarkık binding, beklenmeyen tip) tüm peer'ların store'unu zehirleyip
   * RoomManager/render'ı NaN'le düşürebilir. Geçersiz veya senkronlanamaz (türetilmiş space) entity
   * sessizce reddedilir (log'lanır) — diğer geçerli değişiklikler uygulanmaya devam eder.
   */
  private acceptRemote(e: unknown, id: string): boolean {
    if (!isValidEntity(e) || !isSyncable(e)) {
      console.warn(`EntitySync: geçersiz/uyumsuz uzak entity reddedildi (karantina): ${id}`);
      return false;
    }
    return true;
  }

  private applyRemote(fn: () => void): void {
    this.applyingRemote = true;
    try {
      fn();
    } finally {
      this.applyingRemote = false;
    }
  }

  /** Yerel store değişikliği → Y.Map (echo değilse). Türetilmiş mahaller atlanır. */
  private onStoreChange(c: StoreChange): void {
    if (this.applyingRemote) return;
    this.doc.transact(() => {
      for (const id of c.added) this.setIfSyncable(id);
      for (const id of c.updated) this.setIfSyncable(id);
      for (const id of c.removed) this.ymap.delete(id);
    }, this);
  }

  private setIfSyncable(id: EntityId): void {
    const e = this.store.get(id);
    if (e && isSyncable(e)) this.ymap.set(id, e);
  }

  /** Uzak Y.Map değişikliği → store (put/delete + emit). RoomManager mahalleri yeniden türetir. */
  private onRemote(event: Y.YMapEvent<Entity>): void {
    const added: EntityId[] = [];
    const updated: EntityId[] = [];
    const removed: EntityId[] = [];
    this.applyRemote(() => {
      event.changes.keys.forEach((change, id) => {
        if (change.action === 'delete') {
          this.store.delete(id);
          removed.push(id);
        } else {
          const e = this.ymap.get(id);
          if (e && this.acceptRemote(e, id)) {
            this.store.put(e);
            (change.action === 'add' ? added : updated).push(id);
          }
        }
      });
      if (added.length || updated.length || removed.length) {
        this.store.emit({ added, updated, removed });
      }
    });
  }

  destroy(): void {
    this.unsubStore();
    this.ymap.unobserve(this.observer);
  }
}

/** Senkronlanabilir mi? Türetilmiş mahal (space) hariç her şey (mahaller yerel türetilir). */
function isSyncable(e: Entity): boolean {
  return e.type !== 'space';
}
