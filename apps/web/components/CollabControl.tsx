'use client';

import { useEffect, useRef, useState } from 'react';
import type { EntityStore } from '@zynpparti/document';
import { createCollab, type CollabHandle } from '@zynpparti/collab';

/** Sync sunucusu adresi — yerel `pnpm sync` (varsayılan) ya da dağıtımda NEXT_PUBLIC_COLLAB_WS. */
const WS_URL = process.env.NEXT_PUBLIC_COLLAB_WS || 'ws://localhost:1234';

/**
 * Canlı işbirliği kontrolü (Faz 3, ADR-0004). "Canlı Paylaş" → aynı odaya bağlanan sekmeler çizimi
 * paylaşır. Linki (URL'deki #room=...) paylaş → 2. sekme otomatik katılır. Sync sunucusu çalışmalı
 * (`pnpm sync`). v1 temel: duvar/kapı vb. senkronlanır (mahaller yerel türetilir, ADR notu).
 */
export function CollabControl({ store }: { store: EntityStore }) {
  const [room, setRoom] = useState<string | null>(null);
  const handleRef = useRef<CollabHandle | null>(null);

  const connect = (r: string): void => {
    if (handleRef.current) return;
    try {
      handleRef.current = createCollab(store, WS_URL, r);
      setRoom(r);
      if (location.hash !== `#room=${r}`) location.hash = `room=${r}`;
    } catch (e) {
      console.error('Canlı işbirliğine bağlanılamadı:', e);
    }
  };

  // 2. sekme: paylaşılan linki (#room=...) açınca otomatik katıl. Sökülünce bağlantıyı kapat.
  useEffect(() => {
    const m = location.hash.match(/room=([\w-]+)/);
    if (m && m[1]) connect(m[1]);
    return () => {
      handleRef.current?.destroy();
      handleRef.current = null;
    };
  }, []);

  const start = (): void => {
    const fromHash = location.hash.match(/room=([\w-]+)/)?.[1];
    connect(room ?? fromHash ?? `oda-${Math.random().toString(36).slice(2, 8)}`);
  };

  if (room) {
    return (
      <div
        className="fixed bottom-14 right-4 z-40 flex items-center gap-2 rounded-full bg-emerald-700/90 px-4 py-2 text-sm text-white shadow-lg"
        title="Bu sekme canlı paylaşımda — URL'yi paylaşarak başkalarını davet et"
      >
        <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
        Canlı · oda: {room}
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={start}
      className="fixed bottom-14 right-4 z-40 rounded-full bg-white/10 px-4 py-2 text-sm shadow-lg backdrop-blur hover:bg-white/20"
      title="Canlı işbirliği başlat (sync sunucusu çalışmalı: terminalde 'pnpm sync')"
    >
      👥 Canlı Paylaş
    </button>
  );
}
