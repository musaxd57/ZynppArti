'use client';

/**
 * Hafif, bağımlılıksız toast (anlık bildirim) — export/import/AI gibi async işlemlerin sonucunu
 * (başarı/hata/bilgi) kısa süre gösterir. `dialog.ts` ile aynı modül-store deseni; React dışından
 * da çağrılabilir. `<Toaster/>` bir kez render edilir ve bu store'u dinler.
 */

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  readonly id: number;
  readonly kind: ToastKind;
  readonly message: string;
}

let toasts: Toast[] = [];
const listeners = new Set<() => void>();
let seq = 0;

function emit(): void {
  for (const fn of listeners) fn();
}

export function getToasts(): Toast[] {
  return toasts;
}

export function subscribeToasts(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Bir toast gösterir; `ms` sonra kendini kaldırır. */
export function toast(message: string, kind: ToastKind = 'info', ms = 3200): void {
  const id = ++seq;
  toasts = [...toasts, { id, kind, message }];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, ms);
}
