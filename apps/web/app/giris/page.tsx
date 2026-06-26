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
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm font-medium text-[var(--text)] transition hover:bg-[var(--surface-3)] disabled:opacity-50"
      >
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
