'use client';

/**
 * Ölçek kalibrasyonu için temalı, canlı diyalog (window.prompt yerine). Tool ölçülen mesafeyi (çizim
 * birimi) verir; kullanıcı gerçek cm girer; diyalog ölçek oranını canlı gösterir. dialog.ts ile aynı
 * modül-store deseni → React dışından (tool) çağrılabilir.
 */

export interface CalibrateRequest {
  /** Seçilen iki nokta arası ölçülen mesafe (çizim birimi = cm). */
  readonly measured: number;
  readonly resolve: (realCm: number | null) => void;
}

let current: CalibrateRequest | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const fn of listeners) fn();
}

export function getCalibrate(): CalibrateRequest | null {
  return current;
}

export function subscribeCalibrate(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Tool çağırır: ölçülen mesafeyi ver, gerçek cm (veya iptal=null) döner. */
export function requestCalibration(measured: number): Promise<number | null> {
  return new Promise((resolve) => {
    current?.resolve(null); // bekleyen istek varsa yetim bırakma
    current = { measured, resolve };
    emit();
  });
}

/** Diyalog kapanırken (Tamam/İptal) çağrılır. */
export function resolveCalibration(value: number | null): void {
  const c = current;
  current = null;
  emit();
  c?.resolve(value);
}
