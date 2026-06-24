'use client';

import { useEffect } from 'react';

/**
 * Yalnız /app (canvas) ekranında `body.app-shell` ekler → sayfa kaydırması + metin seçimi kapanır
 * (CAD davranışı). Bileşen kaldırılınca (başka sayfaya geçince) class'ı geri alır → pazarlama/yasal
 * sayfalar normal kaydırılır ve metin seçilebilir kalır. (globals.css `body.app-shell` kuralı.)
 */
export function AppBodyLock() {
  useEffect(() => {
    document.body.classList.add('app-shell');
    return () => document.body.classList.remove('app-shell');
  }, []);
  return null;
}
