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

  if (code) {
    const supabase = await getSupabaseServer();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('OAuth code exchange başarısız:', error.message);
        return NextResponse.redirect(`${origin}/giris?hata=oauth`);
      }
    }
  }
  return NextResponse.redirect(`${origin}${next.startsWith('/') ? next : '/app'}`);
}
