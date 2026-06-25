'use client';

import { useEffect, useState } from 'react';
import { CanvasStage } from './CanvasStage';
import { StartScreen } from './StartScreen';

/**
 * Uygulama kapısı: açılışta karşılama ekranını (StartScreen) gösterir; kullanıcı "Yeni/Aç" seçince
 * CanvasStage'e geçer. İSTİSNA — collab odası linki (`#room=`) veya landing "Çiz" devri (`?ciz=`)
 * ile gelenler karşılama ekranını ATLAR (doğrudan uygulamaya girer; paylaşılan linkler/AI devri bozulmaz).
 *
 * Tüm karar `useEffect`'te (istemci) → SSR'de boş render, hidrasyon uyumsuzluğu yok. PixiJS zaten istemci-only.
 */
export function AppGate() {
  const [phase, setPhase] = useState<'loading' | 'start' | 'app'>('loading');

  useEffect(() => {
    const isRoom = /room=[\w-]+/.test(window.location.hash);
    const isCiz = new URLSearchParams(window.location.search).has('ciz');
    setPhase(isRoom || isCiz ? 'app' : 'start');
  }, []);

  if (phase === 'loading') return null; // ilk paint: nötr (hidrasyon güvenli)
  if (phase === 'start') return <StartScreen onStart={() => setPhase('app')} />;
  return <CanvasStage />;
}
