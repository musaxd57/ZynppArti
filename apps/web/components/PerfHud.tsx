'use client';

import { useEffect, useState } from 'react';
import {
  AddEntity,
  BatchCommand,
  RemoveEntity,
  createEntityId,
  type EntityStore,
  type History,
  type Wall,
} from '@zynpparti/document';

/**
 * Geliştirme ölçüm paneli (PERF HUD) — yalnız `?perf` query param'ı varken görünür. Canlı/üretimde
 * kapalı. İki işi var: (1) FPS + kare-süresi (ms) canlı göstergesi (rAF tabanlı, motordan bağımsız);
 * (2) sentetik "N duvar" sahnesi yükleyici → perf iyileştirmelerini ÖNCE/SONRA ölçmek için. RoomManager
 * 8000+ duvarda mahal türetmeyi atladığından büyük sahne donmadan yüklenir. Kalıcı dev aracı.
 */
export function isPerfEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has('perf');
}

/** Sentetik test sahnesi: ızgarada N kısa kopuk duvar (render/cull/pan/zoom stresi; oda oluşturmaz). */
function genWalls(n: number): Wall[] {
  const out: Wall[] = [];
  const cols = Math.max(1, Math.ceil(Math.sqrt(n)));
  const gap = 120; // cm
  for (let i = 0; i < n; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const x = c * gap;
    const y = r * gap;
    out.push({
      id: createEntityId(),
      type: 'wall',
      layerId: 'default',
      start: { x, y },
      end: { x: x + 60, y },
      thickness: 10,
    });
  }
  return out;
}

export function PerfHud({ store, history }: { store: EntityStore; history: History }): React.ReactNode {
  const [fps, setFps] = useState(0);
  const [ms, setMs] = useState(0);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);

  // FPS / kare-süresi ölçer (rAF). Ekrandaki gerçek kare hızını yansıtır → ağır render düşüşü görünür.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let frames = 0;
    let acc = 0;
    const tick = (now: number): void => {
      const dt = now - last;
      last = now;
      frames++;
      acc += dt;
      if (acc >= 500) {
        setFps(Math.round((frames * 1000) / acc));
        setMs(Math.round((acc / frames) * 10) / 10);
        frames = 0;
        acc = 0;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const refreshCount = (): void => setCount(store.all().length);
  useEffect(refreshCount, [store]);

  const load = (n: number): void => {
    setBusy(true);
    // setTimeout → "yükleniyor" göstergesi boyansın, sonra ağır ekleme yapılsın (UI kilitlenmesi belli olsun).
    setTimeout(() => {
      const walls = genWalls(n);
      history.dispatch(new BatchCommand(`Perf +${n} duvar`, walls.map((w) => new AddEntity(w))));
      refreshCount();
      setBusy(false);
    }, 16);
  };

  const clear = (): void => {
    setBusy(true);
    setTimeout(() => {
      const ids = store
        .all()
        .filter((e) => e.type === 'wall')
        .map((e) => e.id);
      if (ids.length > 0) history.dispatch(new BatchCommand('Perf temizle', ids.map((id) => new RemoveEntity(id))));
      refreshCount();
      setBusy(false);
    }, 16);
  };

  const fpsColor = fps >= 55 ? '#34d399' : fps >= 30 ? '#fbbf24' : '#f87171';

  return (
    <div className="pointer-events-auto rounded-md border border-white/10 bg-black/70 px-3 py-2 font-mono text-[11px] text-white shadow-lg backdrop-blur">
      <div className="flex items-center gap-3">
        <span style={{ color: fpsColor }}>{fps} FPS</span>
        <span className="opacity-70">{ms} ms</span>
        <span className="opacity-70">{count.toLocaleString('tr-TR')} entity</span>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        {[1000, 10000, 50000, 100000].map((n) => (
          <button
            key={n}
            type="button"
            disabled={busy}
            onClick={() => load(n)}
            className="rounded bg-white/10 px-1.5 py-0.5 hover:bg-white/20 disabled:opacity-40"
          >
            +{n >= 1000 ? `${n / 1000}k` : n}
          </button>
        ))}
        <button
          type="button"
          disabled={busy}
          onClick={clear}
          className="rounded bg-red-500/20 px-1.5 py-0.5 hover:bg-red-500/30 disabled:opacity-40"
        >
          Temizle
        </button>
      </div>
      {busy && <div className="mt-1 opacity-60">yükleniyor…</div>}
    </div>
  );
}
