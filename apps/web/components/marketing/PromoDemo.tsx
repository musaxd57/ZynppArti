'use client';

import { useEffect, useRef } from 'react';

/**
 * Pazarlama "ürün demosu" — gerçek video yerine, app'i canlandıran animasyonlu HTML promo'su
 * (public/promo.html). Kendi stilleri/scripti olduğu için iframe ile İZOLE gömülür (sayfa CSS'iyle
 * çatışmaz). 960×540 sabit sahne, container genişliğine göre ResizeObserver ile ölçeklenir.
 */
export function PromoDemo() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => el.style.setProperty('--promo-scale', String(el.clientWidth / 960));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-black shadow-[0_30px_80px_-44px_rgba(0,0,0,0.55)]"
      style={{ aspectRatio: '960 / 540' }}
    >
      <iframe
        src="/promo.html"
        title="Vesna ürün demosu — animasyon"
        loading="lazy"
        scrolling="no"
        className="absolute left-0 top-0 origin-top-left border-0"
        style={{ width: 960, height: 540, transform: 'scale(var(--promo-scale, 1))' }}
      />
    </div>
  );
}

export default PromoDemo;
