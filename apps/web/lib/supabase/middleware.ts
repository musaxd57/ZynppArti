import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL } from './env';

/**
 * Oturum tazeleme (Supabase önerisi, @supabase/ssr) — her istekte access token'ı yeniler ve çerezi
 * günceller; aksi halde oturum sessizce düşer. ADDİTİF: anahtar yoksa düz `NextResponse.next()` (anonim
 * akış aynen çalışır). **Hiçbir rotayı KORUMAZ** — ücretsiz katman hesap istemez (ADR-0047). İleride
 * yalnız hesap/fatura uçları korunur.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });
  if (!SUPABASE_URL || !SUPABASE_PUBLIC_KEY) return response; // anahtar yok → no-op

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });

  // getUser() token'ı doğrular/yeniler (getSession DEĞİL — o çerezdeki ham veriye güvenir, güvensiz).
  await supabase.auth.getUser();
  return response;
}
