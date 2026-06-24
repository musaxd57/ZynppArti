'use client';

import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';

/**
 * Giriş/kayıt kontrolleri (Clerk). Oturum yoksa "Giriş Yap" + "Kaydol" (modal); oturum varsa kullanıcı
 * menüsü. Yalnız ClerkProvider aktifken (anahtar var) render edilir — çağıran taraf env ile koşullar.
 * ADR-0046: giriş opsiyonel; bu butonlar uygulamayı kapı arkasına ALMAZ, sadece hesap girişidir.
 * (v7'de SignedIn/SignedOut yerine `useUser` hook'u — sürümler arası daha dayanıklı.)
 */
export function AuthButtons() {
  const { isSignedIn, isLoaded } = useUser();
  if (!isLoaded) return null; // Clerk yüklenene kadar boş (yanıp sönme olmasın).

  if (isSignedIn) return <UserButton />;

  return (
    <>
      <SignInButton mode="modal">
        <button
          type="button"
          className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[var(--surface-2,#1c1c22)]"
          style={{ color: 'var(--text-1, #e8e8ea)' }}
        >
          Giriş Yap
        </button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button
          type="button"
          className="rounded-md px-3 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: 'var(--accent, #5B5BD6)' }}
        >
          Kaydol
        </button>
      </SignUpButton>
    </>
  );
}
