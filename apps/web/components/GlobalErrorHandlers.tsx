'use client';

import { useEffect } from 'react';

/** Basit, bağımlılıksız toast — sağ altta 5 sn görünür. */
function toast(message: string): void {
  if (typeof document === 'undefined') return;
  const el = document.createElement('div');
  el.textContent = message;
  el.setAttribute('role', 'alert'); // ekran okuyucuya hemen (assertive) duyur
  el.className =
    'fixed bottom-4 right-4 z-[100] max-w-sm rounded-lg bg-red-600/90 px-4 py-2 text-sm text-white shadow-lg';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 5000);
}

/**
 * Yakalanmamış hataları (uncaught error + unhandledrejection) tek yerde toplar: konsola yazar +
 * kullanıcıya kısa bir uyarı (toast) gösterir. Böylece sessiz başarısızlık olmaz, app sürer.
 * Görsel çıktısı yok (null döner); yalnız global dinleyici kurar.
 */
export function GlobalErrorHandlers(): null {
  useEffect(() => {
    const onError = (e: ErrorEvent): void => {
      // CORS kaynaklı "Script error." gürültüsünü atla.
      if (!e.message || e.message === 'Script error.') return;
      console.error('Global hata:', e.error ?? e.message);
      toast('Hata: ' + e.message);
    };
    const onRejection = (e: PromiseRejectionEvent): void => {
      const reason = e.reason instanceof Error ? e.reason.message : String(e.reason);
      console.error('Yakalanmamış Promise hatası:', e.reason);
      toast('Hata: ' + reason);
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);
  return null;
}
