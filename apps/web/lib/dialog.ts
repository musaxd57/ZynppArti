'use client';

/**
 * Hafif, bağımlılıksız imperatif dialog (alert/confirm/prompt) — tarayıcının çirkin/bloklayan yerel
 * diyalogları yerine uygulama temalı modal. Modül seviyesi store + abonelik; React dışından da
 * çağrılabilir (Promise döner). `<DialogHost/>` bir kez render edilir ve bu store'u dinler.
 */

export type DialogKind = 'alert' | 'confirm' | 'prompt';

export interface DialogState {
  readonly kind: DialogKind;
  readonly message: string;
  readonly defaultValue?: string;
  /** Sonucu çözer: confirm→boolean, prompt→string|null, alert→void. */
  readonly resolve: (value: unknown) => void;
}

let current: DialogState | null = null;
const listeners = new Set<() => void>();

function set(s: DialogState | null): void {
  current = s;
  for (const fn of listeners) fn();
}

export function getDialog(): DialogState | null {
  return current;
}

export function subscribeDialog(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Açık dialog'u verilen değerle kapatır (DialogHost düğmeleri çağırır). */
export function closeDialog(value: unknown): void {
  const c = current;
  set(null);
  c?.resolve(value);
}

export function alertDialog(message: string): Promise<void> {
  return new Promise((res) => set({ kind: 'alert', message, resolve: () => res() }));
}

export function confirmDialog(message: string): Promise<boolean> {
  return new Promise((res) => set({ kind: 'confirm', message, resolve: (v) => res(v === true) }));
}

export function promptDialog(message: string, defaultValue = ''): Promise<string | null> {
  return new Promise((res) =>
    set({ kind: 'prompt', message, defaultValue, resolve: (v) => res((v as string | null) ?? null) }),
  );
}
