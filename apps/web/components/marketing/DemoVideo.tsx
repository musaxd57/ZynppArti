'use client';

import { useRef, useState, type ReactNode } from 'react';

/**
 * Pazarlama demo videosu yuvası — gerçek ürün ekran kaydı için. İki mod:
 *  - 'ambient'  : hero arka plan demosu; otomatik oynar, SESSİZ, döngülü, kontrol yok (dikkat dağıtmaz).
 *  - 'player'   : tıkla-oynat; poster + oynat düğmesi, sonra native kontroller.
 *
 * DÜRÜSTLÜK (Moses kuralı): video YOKSA sahte "oynat" düğmesi/boş kutu GÖSTERME. `fallback` verilirse
 * onu (ör. gerçek ürün illüstrasyonu CadMockup) çizer; verilmezse nötr "demo yakında" notu. Yani
 * kullanıcı, var olmayan bir içeriği varmış gibi görmez. Videolar `apps/web/public/videos/`'a konur.
 *
 * Performans: lazy (preload=metadata), poster ilk boyamada görünür, ambient yalnız görünürken oynar
 * gibi davransın diye küçük tutulmalı (bkz. docs/VIDEO-PLAN.md spesifikasyonları).
 */
export interface DemoVideoProps {
  /** /videos/xx.mp4 (public kökünden). Boşsa fallback/placeholder gösterilir. */
  readonly src?: string;
  /** İsteğe bağlı webm (daha küçük; tarayıcı destekliyorsa onu seçer). */
  readonly srcWebm?: string;
  /** Poster görseli (/videos/xx-poster.jpg) — video yüklenmeden gösterilir. */
  readonly poster?: string;
  /** En-boy oranı (varsayılan 16:9). */
  readonly aspect?: number;
  readonly mode?: 'ambient' | 'player';
  /** Erişilebilirlik/SEO açıklaması. */
  readonly label?: string;
  /** Video yokken çizilecek dürüst içerik (ör. <CadMockup/>). */
  readonly fallback?: ReactNode;
}

export function DemoVideo({
  src,
  srcWebm,
  poster,
  aspect = 16 / 9,
  mode = 'player',
  label = 'Vesna ürün demosu',
  fallback,
}: DemoVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(mode === 'ambient');

  const frame = {
    position: 'relative' as const,
    width: '100%',
    aspectRatio: String(aspect),
    borderRadius: 16,
    overflow: 'hidden',
    border: '1px solid var(--border)',
    background: 'var(--bg-3)',
    boxShadow: '0 40px 120px -40px rgba(0,0,0,0.55)',
  };

  // 1) Video YOK → dürüst yedek (illüstrasyon) ya da nötr not.
  if (!src) {
    if (fallback) return <>{fallback}</>;
    return (
      <div style={{ ...frame, display: 'grid', placeItems: 'center' }}>
        <span style={{ fontSize: 14, color: 'var(--text-3)' }}>Ürün demosu yakında</span>
      </div>
    );
  }

  // 2) Ambient: sessiz, döngülü, otomatik — kontrol yok.
  if (mode === 'ambient') {
    return (
      <div style={frame}>
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={poster}
          aria-label={label}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        >
          {srcWebm && <source src={srcWebm} type="video/webm" />}
          <source src={src} type="video/mp4" />
        </video>
      </div>
    );
  }

  // 3) Player: poster + büyük oynat düğmesi → tıklayınca oynat + native kontroller.
  return (
    <div style={frame}>
      <video
        ref={videoRef}
        controls={started}
        playsInline
        preload="metadata"
        poster={poster}
        aria-label={label}
        onPlay={() => setStarted(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      >
        {srcWebm && <source src={srcWebm} type="video/webm" />}
        <source src={src} type="video/mp4" />
      </video>
      {!started && (
        <button
          type="button"
          onClick={() => {
            setStarted(true);
            void videoRef.current?.play();
          }}
          aria-label="Demoyu oynat"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(0,0,0,0.18)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <span
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'var(--accent)',
              display: 'grid',
              placeItems: 'center',
              boxShadow: '0 8px 28px rgba(0,0,0,0.35)',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff" style={{ marginLeft: 3 }}>
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}
