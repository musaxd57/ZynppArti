'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';

/**
 * Giriş/kayıt kontrolleri (Supabase Auth, ADR-0047). Oturum yoksa "Giriş Yap" + "Kaydol" (→ /giris);
 * oturum varsa avatar + açılır menü (Uygulamaya git / Bulut projelerim / Çıkış).
 * ADDİTİF: anahtar yoksa hiç render etmez (anonim akış aynen çalışır). Uygulamayı kapı arkasına ALMAZ.
 */
export function AuthButtons() {
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setReady(true);
      return;
    }
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setEmail(data.user?.email ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Menü açılınca ilk öğeye odak (a11y — klavye kullanıcısı menüye girsin).
  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }, [open]);

  // Dışarı tıkla / Esc → menüyü kapat.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent): void {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Anahtar yoksa (getSupabaseBrowser null) ya da henüz yüklenmediyse → boş (yanıp sönme olmasın).
  if (!getSupabaseBrowser() || !ready) return null;

  if (email) {
    const initial = email[0]?.toUpperCase() ?? '?';
    return (
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 rounded-full p-0.5 transition-colors hover:bg-[rgba(128,128,128,0.15)]"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls="account-menu"
          aria-label="Hesap menüsü"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white"
            style={{ background: 'var(--accent, #5B5BD6)' }}
          >
            {initial}
          </span>
        </button>

        {open && (
          <div
            id="account-menu"
            role="menu"
            className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-2)] py-1 shadow-[var(--shadow)]"
          >
            <div className="border-b border-[var(--border)] px-3 py-2">
              <div className="text-xs text-[var(--text-3)]">Giriş yapıldı</div>
              <div className="truncate text-sm font-medium text-[var(--text)]" title={email}>
                {email}
              </div>
            </div>
            <Link
              href="/app"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm text-[var(--text)] transition-colors hover:bg-[rgba(128,128,128,0.12)]"
            >
              Uygulamaya git
            </Link>
            <Link
              href="/app?bulut=1"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm text-[var(--text)] transition-colors hover:bg-[rgba(128,128,128,0.12)]"
            >
              Bulut projelerim
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                void getSupabaseBrowser()
                  ?.auth.signOut()
                  .then(() => window.location.reload());
              }}
              className="block w-full px-3 py-2 text-left text-sm text-[var(--danger,#ff6b6b)] transition-colors hover:bg-[rgba(128,128,128,0.12)]"
            >
              Çıkış
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <Link
        href="/giris"
        className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[rgba(128,128,128,0.15)]"
        style={{ color: 'var(--text, #e8e8ea)' }}
      >
        Giriş Yap
      </Link>
      <Link
        href="/giris?mod=kayit"
        className="rounded-md px-3 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: 'var(--accent, #5B5BD6)' }}
      >
        Kaydol
      </Link>
    </>
  );
}
