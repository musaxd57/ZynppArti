'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/**
 * Mobil gezinme — masaüstü nav `sm:hidden` olduğundan mobilde Özellikler/Fiyatlandırma'ya erişim
 * kalmıyordu. Hamburger → açılır menü. Yalnız `sm` altında görünür (sm:hidden).
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  // Escape ile kapat (a11y): açık menü klavyeyle kapatılabilmeli.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  const linkCls =
    'block rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--text-2)] transition hover:bg-[var(--bg-3)] hover:text-[var(--text)]';
  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Menüyü kapat' : 'Menüyü aç'}
        aria-expanded={open}
        className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border border-[var(--border)] bg-[var(--bg-2)] text-[var(--text-2)] transition hover:text-[var(--text)]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div
            className="absolute right-4 top-[60px] z-50 flex w-56 flex-col gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-2)] p-2 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)]"
            role="menu"
          >
            <Link href="/#ozellikler" className={linkCls} onClick={() => setOpen(false)} role="menuitem">
              Özellikler
            </Link>
            <Link href="/fiyatlandirma" className={linkCls} onClick={() => setOpen(false)} role="menuitem">
              Fiyatlandırma
            </Link>
            <Link
              href="/app"
              className="mt-1 block rounded-lg bg-[var(--accent)] px-3 py-2.5 text-center text-sm font-semibold text-white"
              onClick={() => setOpen(false)}
              role="menuitem"
            >
              Uygulamayı Aç
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
