import { createServerClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL } from './env';

/**
 * Sunucu (Server Component / Route Handler) Supabase istemcisi — oturumu Next çerezlerinden okur/yazar.
 * ADDİTİF: anahtar yoksa `null`. Server Component'ten `setAll` yazamaz (çerez salt-okunur) → sessizce
 * yutulur; oturum tazeleme middleware'de yapılır (Supabase önerisi).
 */
export async function getSupabaseServer(): Promise<SupabaseClient | null> {
  if (!SUPABASE_URL || !SUPABASE_PUBLIC_KEY) return null;
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Server Component bağlamı (çerez yazılamaz) → middleware oturumu tazeler.
        }
      },
    },
  });
}

/**
 * SUNUCU-YALNIZ servis istemcisi (RLS'i ATLAR) — yalnız güvenilen sunucu işleri için (ör. webhook,
 * admin). Secret anahtar (`sb_secret_…` veya eski `service_role`) ASLA tarayıcıya gitmez. Yoksa `null`.
 */
export function getSupabaseService(): SupabaseClient | null {
  const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !secret) return null;
  return createClient(SUPABASE_URL, secret, { auth: { persistSession: false } });
}
