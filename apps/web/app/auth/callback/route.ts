import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

/**
 * OAuth (Google) dönüş ucu — Supabase `code`'u oturum çerezine çevirir, sonra `next`'e yönlendirir.
 * @supabase/ssr server istemcisi çerezleri yazar (middleware tazeler). Anahtar yoksa /app'e düşer.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/app';
  // Vercel proxy arkasında request.url iç host olabilir → yönlendirme yanlış host'a gidip girişi bozar.
  // Supabase önerisi: x-forwarded-host'u onurlandır (Vercel edge bu başlığı güvenle set eder). (Denetim.)
  const fwdHost = request.headers.get('x-forwarded-host');
  const proto = request.headers.get('x-forwarded-proto') ?? 'https';
  const base = fwdHost ? `${proto}://${fwdHost}` : origin;

  if (code) {
    const supabase = await getSupabaseServer();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('OAuth code exchange başarısız:', error.message);
        return NextResponse.redirect(`${base}/giris?hata=oauth`);
      }
    }
  }
  return NextResponse.redirect(`${base}${next.startsWith('/') ? next : '/app'}`);
}
