'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { supabaseEnabled } from '@/lib/supabase/env';

type Mode = 'login' | 'signup' | 'forgot';

/**
 * Giriş / Kayıt / Şifre-sıfırlama sayfası (Supabase Auth, ADR-0047). E-posta+parola ve Google (OAuth).
 * `?mod=kayit` kayıt modunda açılır. Başarıda /app'e döner. Anahtar yoksa bilgilendirir (app anonim çalışır).
 * Marka kartı (logo + wordmark + gölge/ring) — açık/koyu tema uyumlu landing token'ları.
 */
function GirisForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(params.get('mod') === 'kayit' ? 'signup' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const supabase = getSupabaseBrowser();

  // İlk açılışta / mod değişiminde e-posta alanına odaklan (forgot dönüşü hariç klavye akışı sürsün).
  useEffect(() => {
    emailRef.current?.focus();
  }, [mode]);

  if (!supabaseEnabled || !supabase) {
    return (
      <Card>
        <Brand />
        <p className="text-sm text-[var(--text-2)]">
          Giriş şu an yapılandırılmamış. Uygulamayı hesapsız da kullanabilirsin —{' '}
          <Link href="/app" className="font-medium text-[var(--accent)] underline">
            Uygulamayı Aç
          </Link>
          .
        </p>
      </Card>
    );
  }

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (mode === 'forgot') {
        const { error } = await supabase!.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/sifre-sifirla`,
        });
        if (error) throw error;
        setMsg({ kind: 'ok', text: 'Sıfırlama bağlantısı e-postana gönderildi. Gelen kutunu kontrol et.' });
      } else if (mode === 'signup') {
        const { error } = await supabase!.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/app` },
        });
        if (error) throw error;
        setMsg({
          kind: 'ok',
          text: 'Kayıt alındı. E-postana gelen doğrulama bağlantısına tıkla, sonra giriş yap.',
        });
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

  const title = mode === 'signup' ? 'Hesap oluştur' : mode === 'forgot' ? 'Parolanı sıfırla' : 'Giriş yap';
  const subtitle =
    mode === 'signup'
      ? 'Projelerini buluta kaydet ve paylaş.'
      : mode === 'forgot'
        ? 'E-posta adresini gir; sana sıfırlama bağlantısı gönderelim.'
        : 'Vesna hesabınla devam et.';

  return (
    <Card>
      <Brand />
      <h1 className="mb-1 text-2xl font-semibold text-[var(--text)]">{title}</h1>
      <p className="mb-6 text-sm text-[var(--text-2)]">{subtitle}</p>

      {mode !== 'forgot' && (
        <>
          <button
            type="button"
            onClick={google}
            disabled={busy}
            className="mb-4 flex w-full items-center justify-center gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-4 py-2.5 text-sm font-medium text-[var(--text)] transition hover:bg-[var(--bg-3)] disabled:opacity-50"
          >
            <GoogleLogo />
            Google ile devam et
          </button>

          <div className="mb-4 flex items-center gap-3 text-xs text-[var(--text-3)]">
            <span className="h-px flex-1 bg-[var(--border)]" /> veya{' '}
            <span className="h-px flex-1 bg-[var(--border)]" />
          </div>
        </>
      )}

      <form onSubmit={submit} className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-sm text-[var(--text-2)]">E-posta</span>
          <input
            ref={emailRef}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
          />
        </label>

        {mode !== 'forgot' && (
          <label className="block">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm text-[var(--text-2)]">Parola</span>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setMsg(null);
                  }}
                  className="text-xs text-[var(--text-3)] transition hover:text-[var(--accent)]"
                >
                  Şifremi unuttum
                </button>
              )}
            </div>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            />
          </label>
        )}

        {msg && (
          <p
            role={msg.kind === 'error' ? 'alert' : 'status'}
            className={`rounded-lg px-3 py-2 text-sm ${
              msg.kind === 'error'
                ? 'bg-red-500/10 text-red-400'
                : 'bg-emerald-500/10 text-emerald-400'
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
          {busy && <Spinner />}
          {busy
            ? 'Lütfen bekle…'
            : mode === 'signup'
              ? 'Kaydol'
              : mode === 'forgot'
                ? 'Sıfırlama bağlantısı gönder'
                : 'Giriş yap'}
        </button>
      </form>

      <div className="mt-4 flex flex-col gap-1 text-sm">
        {mode === 'forgot' ? (
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setMsg(null);
            }}
            className="text-[var(--text-2)] transition hover:text-[var(--text)]"
          >
            ← Girişe dön
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signup' ? 'login' : 'signup');
              setMsg(null);
            }}
            className="text-[var(--text-2)] transition hover:text-[var(--text)]"
          >
            {mode === 'signup' ? 'Zaten hesabın var mı? Giriş yap' : 'Hesabın yok mu? Kaydol'}
          </button>
        )}
      </div>
    </Card>
  );
}

/** Marka başlığı: Vesna logosu + wordmark (giriş kartının üstü). */
function Brand(): React.ReactElement {
  return (
    <Link href="/" className="mb-6 inline-flex items-center gap-2.5">
      <Image src="/vesna-logo.png" alt="Vesna" width={32} height={32} className="rounded-lg" priority />
      <span className="text-lg font-semibold tracking-tight text-[var(--text)]">Vesna</span>
    </Link>
  );
}

/** Giriş kartı kabuğu — gölge + ring + tema-uyumlu zemin. */
function Card({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--bg-2)] p-7 shadow-[var(--shadow)] ring-1 ring-black/5">
      {children}
    </div>
  );
}

/** Buton içi yükleniyor göstergesi (dönen halka). */
function Spinner(): React.ReactElement {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
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
  if (/should be at least|password/i.test(m)) return 'Parola en az 6 karakter olmalı.';
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
