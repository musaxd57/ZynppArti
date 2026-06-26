'use client';

import { useState, useSyncExternalStore } from 'react';
import type { EntityStore } from '@zynpparti/document';

/**
 * Tuval boşken (türetilmiş mahaller hariç hiç öğe yok) merkezde nazik başlangıç ipucu.
 * pointer-events YOK → çizimi/etkileşimi engellemez. Çizim başlayınca kendiliğinden kaybolur.
 * Sağ üstteki ✕ ile elle de kapatılabilir (oturum-içi; Moses isteği).
 */
export function EmptyCanvasHint({ store }: { store: EntityStore }) {
  const [dismissed, setDismissed] = useState(false);
  const empty = useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => store.all().every((e) => e.type === 'space'),
    () => true,
  );
  if (!empty || dismissed) return null;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="relative max-w-xs rounded-xl bg-white/5 px-5 py-4 text-center text-sm text-white/55 ring-1 ring-white/10">
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="İpucunu kapat"
          title="Kapat"
          className="pointer-events-auto absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white/80"
        >
          ✕
        </button>
        <div className="mb-1 text-base font-medium text-white/75">Boş tuval</div>
        <p className="leading-relaxed">
          Başlamak için <span className="font-semibold text-white/80">Duvar (L)</span> aracını seç ve
          çizmeye başla — mahaller otomatik bulunur.
        </p>
        <p className="mt-2 leading-relaxed">
          Ya da üst araç çubuğundaki <span className="font-semibold text-white/80">Vesna → Çiz</span> ile
          tarif ederek AI'a plan çizdir.
        </p>
      </div>
    </div>
  );
}
