'use client';

import { useEffect } from 'react';
import { isCloudSignedIn } from '@/lib/cloud-save';

/**
 * Giriş yapmış kullanıcı kökte (`/`) pazarlama landing'ine + "hemen başla/ücretsiz" CTA'larına takılmasın
 * → doğrudan proje galerisine (`/app`) götürülür (Moses: "vesna.design yazınca direk projelerini görsün").
 * Anonim kullanıcı landing'i normal görür. `#room=` hash'i varsa dokunma — onu RoomRedirect /app#room'a
 * taşır. Pazarlama sayfaları (/fiyatlandirma, /giris…) doğrudan erişilebilir kalır (yalnız KÖK yönlenir).
 */
export function AppRedirect() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (/room=([\w-]+)/.test(window.location.hash)) return; // canlı-işbirliği linki → RoomRedirect ilgilenir
    let active = true;
    void isCloudSignedIn().then((yes) => {
      if (active && yes) window.location.replace('/app');
    });
    return () => {
      active = false;
    };
  }, []);
  return null;
}
