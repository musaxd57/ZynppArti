'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { getProfile } from '@/lib/supabase/projects';
import { PLAN_LABEL, isPaidPlan, normalizePlan } from '@/lib/plan';

/**
 * Üst bar plan göstergesi (ADR-0047). Giriş yapılmışsa kullanıcının `profiles.plan`'ını gösterir.
 * ADDİTİF: anahtar/oturum yoksa hiç render etmez (anonim akış bozulmaz). Çıkışta temizlenir
 * (onAuthStateChange ile plan null'a düşer → gizlenir).
 */
export function PlanBadge(): React.ReactElement | null {
  const [plan, setPlan] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    let active = true;
    const load = (): void => {
      void getProfile().then((p) => {
        if (active) setPlan(p?.plan ?? null);
      });
    };
    load();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session?.user) setPlan(null);
      else load();
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!plan) return null;
  const label = PLAN_LABEL[normalizePlan(plan)];
  return (
    <span
      title={`Planın: ${label}`}
      className="shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium"
      style={
        isPaidPlan(plan)
          ? { background: 'var(--accent-soft)', color: 'var(--accent-text, #b1a9ff)' }
          : { background: 'var(--surface-3)', color: 'var(--text-3)' }
      }
    >
      {label}
    </span>
  );
}
