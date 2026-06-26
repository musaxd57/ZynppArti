'use client';

import { useEffect, useState } from 'react';

/**
 * Basit FPS sayacı (Moses isteği) — requestAnimationFrame delta'sından kare hızı. Motordan bağımsız,
 * ekrandaki gerçek akıcılığı yansıtır. Küçük + köşede + pointer-events yok (etkileşimi engellemez).
 * 55+ yeşil, 30+ sarı, altı kırmızı. (Detaylı ölçüm + sentetik yük için `?perf` HUD ayrı.)
 */
export function FpsCounter(): React.ReactElement {
  const [fps, setFps] = useState(0);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let frames = 0;
    let acc = 0;
    const tick = (now: number): void => {
      acc += now - last;
      last = now;
      frames++;
      if (acc >= 500) {
        // 0.5sn pencerede ortalama → titremesiz okunur değer.
        setFps(Math.round((frames * 1000) / acc));
        frames = 0;
        acc = 0;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const color = fps >= 55 ? '#34d399' : fps >= 30 ? '#fbbf24' : '#f87171';
  return (
    <div
      className="pointer-events-none absolute bottom-2 left-2 z-20 rounded bg-black/50 px-1.5 py-0.5 font-mono text-[10px] tabular-nums backdrop-blur-sm"
      style={{ color }}
      title="Kare hızı (FPS)"
    >
      {fps} FPS
    </div>
  );
}
