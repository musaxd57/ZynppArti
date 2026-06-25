'use client';

import { useSyncExternalStore } from 'react';
import { getToasts, subscribeToasts, type ToastKind } from '@/lib/toast';

const STYLE: Record<ToastKind, string> = {
  success: 'bg-emerald-600',
  error: 'bg-red-600',
  info: 'bg-neutral-700',
};

const ICON: Record<ToastKind, string> = {
  success: '✓',
  error: '⚠',
  info: 'ℹ',
};

/** Ekranın alt-ortasında yığılan anlık bildirimler (toast). Bir kez render edilir (layout). */
export function Toaster() {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts, getToasts);
  if (toasts.length === 0) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          // Hata toast'ı ekran okuyucuya hemen (assertive) okunsun; diğerleri kibar (status).
          role={t.kind === 'error' ? 'alert' : 'status'}
          className={`msg-in pointer-events-auto flex items-center gap-2 rounded-lg ${STYLE[t.kind]} px-4 py-2 text-sm text-white shadow-lg`}
        >
          <span aria-hidden>{ICON[t.kind]}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}
