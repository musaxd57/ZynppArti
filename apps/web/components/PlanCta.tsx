'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { openCheckout, paddleEnabled } from '@/lib/paddle/checkout';
import { type Plan } from '@/lib/plan';

/**
 * Fiyatlandırma kartı CTA'sı (ADR-0046/0048). Ücretsiz → uygulamaya; Pro/Studio → Paddle checkout
 * (giriş yoksa önce /giris'e yönlendirir; webhook profili `custom_data.user_id` ile bulur).
 * Paddle yapılandırılmamışsa (anahtar yok) ücretli CTA da uygulamaya/girişe düşer (sayfa bozulmaz).
 */
export function PlanCta({
  plan,
  label,
  featured,
}: {
  plan: Plan;
  label: string;
  featured?: boolean;
}): React.ReactElement {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const cls = `rounded-[10px] py-[11px] text-center text-sm font-semibold transition ${
    featured
      ? 'border border-[var(--accent)] bg-[var(--accent)] text-white hover:bg-[var(--accent-2)]'
      : 'border border-[var(--border-2)] bg-[var(--bg-3)] text-[var(--text)] hover:border-[var(--text-3)]'
  } disabled:opacity-60`;

  // Ücretsiz plan (ya da Paddle kapalı) → uygulamaya gir.
  if (plan === 'free' || !paddleEnabled()) {
    return (
      <a href="/app" className={cls}>
        {label}
      </a>
    );
  }

  async function upgrade(): Promise<void> {
    setBusy(true);
    try {
      const supabase = getSupabaseBrowser();
      const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
      const user = data.user;
      if (!user) {
        // Giriş şart (webhook user_id ister) → girişten sonra fiyatlandırmaya dön.
        router.push('/giris?next=/fiyatlandirma');
        return;
      }
      const res = await openCheckout({ plan, userId: user.id, email: user.email ?? undefined });
      if (!res.ok) {
        // Yapılandırma boşluğu → en azından uygulamaya düşür (sessiz takılma olmasın).
        router.push('/app');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" onClick={() => void upgrade()} disabled={busy} className={cls}>
      {busy ? 'Açılıyor…' : label}
    </button>
  );
}
