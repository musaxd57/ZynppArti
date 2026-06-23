'use client';

import { useEffect, useRef, useState } from 'react';
import type { EntityStore } from '@zynpparti/document';
import { createCollab, type CollabHandle } from '@zynpparti/collab';

/** Sync sunucusu adresi — yerel `pnpm sync` (varsayılan) ya da dağıtımda NEXT_PUBLIC_COLLAB_WS. */
const WS_URL = process.env.NEXT_PUBLIC_COLLAB_WS || 'ws://localhost:1234';

type Status = 'connecting' | 'connected' | 'disconnected';

/**
 * Canlı işbirliği kontrolü (Faz 3, ADR-0004). "Canlı Paylaş" → aynı odaya bağlanan sekmeler çizimi
 * paylaşır. Linki (#room=...) paylaş → 2. sekme otomatik katılır. Bağlantı durumu + kişi sayısı
 * gösterilir (sunucu kapalıysa kullanıcı anlar). Sync sunucusu çalışmalı (`pnpm sync`).
 */
export function CollabControl({ store }: { store: EntityStore }) {
  const [room, setRoom] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('connecting');
  const [peers, setPeers] = useState(1);
  const handleRef = useRef<CollabHandle | null>(null);

  const connect = (r: string): void => {
    if (handleRef.current) return;
    try {
      const h = createCollab(store, WS_URL, r);
      handleRef.current = h;
      setRoom(r);
      if (location.hash !== `#room=${r}`) location.hash = `room=${r}`;
      h.provider.on('status', (e: { status: Status }) => setStatus(e.status));
      const updatePeers = (): void => setPeers(Math.max(1, h.awareness.getStates().size));
      h.awareness.on('change', updatePeers);
      updatePeers();
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
    const dotColor =
      status === 'connected' ? 'bg-emerald-400' : status === 'connecting' ? 'bg-amber-400' : 'bg-red-400';
    const bg =
      status === 'connected' ? 'bg-emerald-700/90' : status === 'connecting' ? 'bg-amber-700/90' : 'bg-red-800/90';
    const label =
      status === 'connected'
        ? `Canlı · oda: ${room} · ${peers} kişi`
        : status === 'connecting'
          ? `Bağlanıyor… (${room})`
          : 'Sunucu yok — terminalde: pnpm sync';
    return (
      <div
        className={`fixed bottom-14 right-4 z-40 flex items-center gap-2 rounded-full ${bg} px-4 py-2 text-sm text-white shadow-lg`}
        title="Bu sekme canlı paylaşımda — URL'yi paylaşarak başkalarını davet et"
      >
        <span className={`h-2 w-2 rounded-full ${dotColor} ${status === 'connected' ? 'animate-pulse' : ''}`} />
        {label}
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
