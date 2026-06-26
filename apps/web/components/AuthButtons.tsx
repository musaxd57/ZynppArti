'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';

/**
 * Giriş/kayıt kontrolleri (Supabase Auth, ADR-0047). Oturum yoksa "Giriş Yap" + "Kaydol" (→ /giris);
 * oturum varsa e-posta + "Çıkış". ADDİTİF: anahtar yoksa hiç render etmez (anonim akış aynen çalışır).
 * Uygulamayı kapı arkasına ALMAZ — yalnız hesap girişi (ücretsiz katman hesap istemez).
 */
export function AuthButtons() {
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

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

  // Anahtar yoksa (getSupabaseBrowser null) ya da henüz yüklenmediyse → boş (yanıp sönme olmasın).
  if (!getSupabaseBrowser() || !ready) return null;

  if (email) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden max-w-[160px] truncate text-sm text-[var(--text-2)] sm:inline" title={email}>
          {email}
        </span>
        <button
          type="button"
          onClick={() => {
            void getSupabaseBrowser()
              ?.auth.signOut()
              .then(() => window.location.reload());
          }}
          className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[rgba(128,128,128,0.15)]"
          style={{ color: 'var(--text, #e8e8ea)' }}
        >
          Çıkış
        </button>
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
