'use client';

import { useSyncExternalStore } from 'react';
import type { EntityStore } from '@zynpparti/document';

/**
 * Tuval boşken (türetilmiş mahaller hariç hiç öğe yok) merkezde nazik başlangıç ipucu.
 * pointer-events YOK → çizimi/etkileşimi engellemez. Çizim başlayınca kendiliğinden kaybolur.
 */
export function EmptyCanvasHint({ store }: { store: EntityStore }) {
  const empty = useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => store.all().every((e) => e.type === 'space'),
    () => true,
  );
  if (!empty) return null;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="max-w-xs rounded-xl bg-white/5 px-5 py-4 text-center text-sm text-white/55 ring-1 ring-white/10">
        <div className="mb-1 text-base font-medium text-white/75">Boş tuval</div>
        <p className="leading-relaxed">
          Başlamak için <span className="font-semibold text-white/80">Duvar (L)</span> aracını seç ve
          çizmeye başla — mahaller otomatik bulunur.
        </p>
        <p className="mt-2 leading-relaxed">
          Ya da sol-alttaki <span className="font-semibold text-white/80">Arki → Çiz</span> ile tarif
          ederek AI'a plan çizdir.
        </p>
      </div>
    </div>
  );
}
