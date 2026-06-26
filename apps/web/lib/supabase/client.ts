'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL } from './env';

/**
 * Tarayıcı (istemci bileşeni) Supabase istemcisi — oturum çerezlerini @supabase/ssr yönetir.
 * ADDİTİF: anahtar yoksa `null` döner; çağıran taraf anonim akışa düşer (giriş/bulut yok ama app çalışır).
 * Singleton (tek instans) — tekrar tekrar client kurmaz.
 */
let cached: SupabaseClient | null | undefined;

export function getSupabaseBrowser(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  cached = SUPABASE_URL && SUPABASE_PUBLIC_KEY ? createBrowserClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY) : null;
  return cached;
}
