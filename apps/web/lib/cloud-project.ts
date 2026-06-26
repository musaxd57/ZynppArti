'use client';

import { useSyncExternalStore } from 'react';

/**
 * Açık BULUT projesinin id'si — paylaşılan modül-store (project-name deseni). CloudMenu "Buluta
 * kaydet (üzerine yaz)" bunu kullanır. KRİTİK: doküman CloudMenu DIŞINDA değiştirilince ("Yeni" /
 * yerel "Aç") SIFIRLANMALI; yoksa kullanıcı ilgisiz bir çizimi yanlış bulut projesinin üstüne yazar
 * (veri kaybı — denetim bulgusu). Bu yüzden id global tutulur, Toolbar.onNewModel/onOpenJson temizler.
 */

let currentId: string | undefined;
const listeners = new Set<() => void>();

function emit(): void {
  for (const fn of listeners) fn();
}

export function getCloudProjectId(): string | undefined {
  return currentId;
}

/** Bulut projesini ayarlar (bulut Kaydet/Aç sonrası). undefined = yeni/bağsız → sonraki kaydet YENİ proje. */
export function setCloudProjectId(id: string | undefined): void {
  if (id === currentId) return;
  currentId = id;
  emit();
}

/** Doküman bulut-dışı değiştirildiğinde (Yeni / yerel Aç) bağı kopar → kazara üzerine yazma olmaz. */
export function clearCloudProjectId(): void {
  setCloudProjectId(undefined);
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Açık bulut projesi id'si (değişince yeniden render). */
export function useCloudProjectId(): string | undefined {
  return useSyncExternalStore(subscribe, getCloudProjectId, () => undefined);
}
