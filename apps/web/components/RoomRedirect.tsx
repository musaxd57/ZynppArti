'use client';

import { useEffect } from 'react';

/**
 * Geriye uyum: uygulama `/`'ten `/app`'e taşındı. Eski paylaşılan canlı-işbirliği linkleri
 * `vesna.design/#room=...` biçimindeydi (kök). Kök artık landing → bu component, kökte `#room=`
 * hash'i görürse kullanıcıyı `/app` + aynı hash'e yönlendirir (oturum kopmasın). Hash sunucuya
 * gitmediği için bu yönlendirme yalnız istemcide yapılabilir.
 */
export function RoomRedirect() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (/room=([\w-]+)/.test(window.location.hash)) {
      window.location.replace(`/app${window.location.hash}`);
    }
  }, []);
  return null;
}
