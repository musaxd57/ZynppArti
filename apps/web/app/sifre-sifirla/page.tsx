'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { supabaseEnabled } from '@/lib/supabase/env';

/**
 * Parola sıfırlama hedefi (Supabase Auth, ADR-0047). Kullanıcı e-postadaki bağlantıdan /auth/callback
 * üzerinden buraya gelir (kod→recovery oturumu orada kuruldu). Yeni parolayı belirler → /app'e geçer.
 * Oturum yoksa (doğrudan/expired link) bilgilendirir + girişe yönlendirir.
 */
export default function SifreSifirlaPage(): React.ReactElement {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [msg, setMsg] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null);
  const pwRef = useRef<HTMLInputElement>(null);

  const supabase = getSupabaseBrowser();

  useEffect(() => {
    if (!supabase) {
      setHasSession(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session));
    });
  }, [supabase]);

  useEffect(() => {
    if (hasSession) pwRef.current?.focus();
  }, [hasSession]);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (password !== confirm) {
      setMsg({ kind: 'error', text: 'Parolalar eşleşmiyor.' });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const { error } = await supabase!.auth.updateUser({ password });
      if (error) throw error;
      setMsg({ kind: 'ok', text: 'Parolan güncellendi. Uygulamaya yönlendiriliyorsun…' });
      setTimeout(() => {
        router.push('/app');
        router.refresh();
      }, 1200);
    } catch (err) {
      const m = (err as { message?: string })?.message ?? '';
      setMsg({
        kind: 'error',
        text: /should be at least|password|weak/i.test(m) ? 'Parola en az 6 karakter olmalı.' : m || 'Bir hata oluştu.',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-6 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--bg-2)] p-7 shadow-[var(--shadow)] ring-1 ring-black/5">
        <Link href="/" className="mb-6 inline-flex items-center gap-2.5">
          <Image src="/vesna-logo.png" alt="Vesna" width={32} height={32} className="rounded-lg" priority />
          <span className="text-lg font-semibold tracking-tight text-[var(--text)]">Vesna</span>
        </Link>
        <h1 className="mb-1 text-2xl font-semibold text-[var(--text)]">Yeni parola belirle</h1>

        {!supabaseEnabled || hasSession === false ? (
          <>
            <p className="mb-4 mt-1 text-sm text-[var(--text-2)]">
              Sıfırlama bağlantısı geçersiz ya da süresi dolmuş. Lütfen tekrar dene.
            </p>
            <Link
              href="/giris"
              className="inline-block rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-2)]"
            >
              Girişe dön
            </Link>
          </>
        ) : hasSession === null ? (
          <p className="mt-2 text-sm text-[var(--text-2)]">Bağlantı doğrulanıyor…</p>
        ) : (
          <>
            <p className="mb-6 mt-1 text-sm text-[var(--text-2)]">Hesabın için yeni bir parola gir.</p>
            <form onSubmit={submit} className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-sm text-[var(--text-2)]">Yeni parola</span>
                <input
                  ref={pwRef}
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm text-[var(--text-2)]">Parola (tekrar)</span>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                />
              </label>

              {msg && (
                <p
                  role={msg.kind === 'error' ? 'alert' : 'status'}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    msg.kind === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                  }`}
                >
                  {msg.text}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-2)] disabled:opacity-50"
              >
                {busy && (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {busy ? 'Güncelleniyor…' : 'Parolayı güncelle'}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
