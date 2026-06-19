import type { EntityId } from './entities';

/**
 * Yeni benzersiz entity id'si (runtime kullanım için).
 * Testler deterministik olsun diye id'leri açıkça verir; bu yardımcıyı kullanmaz.
 */
export function createEntityId(): EntityId {
  return crypto.randomUUID();
}
