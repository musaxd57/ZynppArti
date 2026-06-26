'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { supabaseEnabled } from '@/lib/supabase/env';

/**
 * Giriş / Kayıt sayfası (Supabase Auth, ADR-0047). E-posta+parola ve Google (OAuth). `?mod=kayit`
 * kayıt modunda açılır. Başarıda /app'e döner. Anahtar yoksa bilgilendirir (uygulama anonim çalışır).
 */
function GirisForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [signup, setSignup] = useState(params.get('mod') === 'kayit');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null);

  const supabase = getSupabaseBrowser();

  if (!supabaseEnabled || !supabase) {
    return (
      <p className="text-sm text-[var(--text-2)]">
        Giriş şu an yapılandırılmamış. Uygulamayı hesapsız da kullanabilirsin —{' '}
        <Link href="/app" className="text-[var(--accent)] underline">
          Uygulamayı Aç
        </Link>
        .
      </p>
    );
  }

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (signup) {
        const { error } = await supabase!.auth.signUp({ email, password });
        if (error) throw error;
        setMsg({ kind: 'ok', text: 'Kayıt alındı. E-postanı doğrulaman gerekebilir, sonra giriş yap.' });
      } else {
        const { error } = await supabase!.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/app');
        router.refresh();
      }
    } catch (err) {
      setMsg({ kind: 'error', text: errText(err) });
    } finally {
      setBusy(false);
    }
  }

  async function google(): Promise<void> {
    setBusy(true);
    setMsg(null);
    const { error } = await supabase!.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/app` },
    });
    if (error) {
      setMsg({ kind: 'error', text: errText(error) });
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="mb-1 text-2xl font-semibold text-[var(--text)]">
        {signup ? 'Hesap oluştur' : 'Giriş yap'}
      </h1>
      <p className="mb-6 text-sm text-[var(--text-2)]">
        {signup ? 'Projelerini buluta kaydet ve paylaş.' : 'Vesna hesabınla devam et.'}
      </p>

      <button
        type="button"
        onClick={google}
        disabled={busy}
        className="mb-4 flex w-full items-center justify-center gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm font-medium text-[var(--text)] transition hover:bg-[var(--surface-3)] disabled:opacity-50"
      >
        <GoogleLogo />
        Google ile devam et
      </button>

      <div className="mb-4 flex items-center gap-3 text-xs text-[var(--text-3)]">
        <span className="h-px flex-1 bg-[var(--border)]" /> veya <span className="h-px flex-1 bg-[var(--border)]" />
      </div>

      <form onSubmit={submit} className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-sm text-[var(--text-2)]">E-posta</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-[var(--text-2)]">Parola</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={signup ? 'new-password' : 'current-password'}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />
        </label>

        {msg && (
          <p
            role={msg.kind === 'error' ? 'alert' : 'status'}
            className={`text-sm ${msg.kind === 'error' ? 'text-red-400' : 'text-emerald-400'}`}
          >
            {msg.text}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-2)] disabled:opacity-50"
        >
          {busy ? 'Lütfen bekle…' : signup ? 'Kaydol' : 'Giriş yap'}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setSignup((s) => !s);
          setMsg(null);
        }}
        className="mt-4 text-sm text-[var(--text-2)] hover:text-[var(--text)]"
      >
        {signup ? 'Zaten hesabın var mı? Giriş yap' : 'Hesabın yok mu? Kaydol'}
      </button>
    </div>
  );
}

/** Resmi Google "G" logosu (4 renk) — "Google ile devam et" düğmesi için. */
function GoogleLogo(): React.ReactElement {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" className="shrink-0">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

/** Supabase Auth hatalarını sade Türkçeye çevirir (ham İngilizce mesaj yerine). */
function errText(err: unknown): string {
  const m = (err as { message?: string })?.message ?? '';
  if (/invalid login credentials/i.test(m)) return 'E-posta veya parola hatalı.';
  if (/already registered|already exists/i.test(m)) return 'Bu e-posta zaten kayıtlı. Giriş yapmayı dene.';
  if (/email not confirmed/i.test(m)) return 'E-postanı doğrulaman gerekiyor (gelen kutunu kontrol et).';
  if (/rate limit/i.test(m)) return 'Çok fazla deneme — biraz bekleyip tekrar dene.';
  return m || 'Bir hata oluştu, lütfen tekrar dene.';
}

export default function GirisPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-6 py-12">
      <Suspense fallback={null}>
        <GirisForm />
      </Suspense>
    </main>
  );
}
