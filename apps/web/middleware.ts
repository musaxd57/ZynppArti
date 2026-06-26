import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Supabase oturum tazeleme middleware'i (ADR-0047). Hiçbir rotayı KORUMAZ — ücretsiz katman hesap
 * istemez (additif auth); yalnız oturum çerezini canlı tutar. Anahtar yoksa no-op (anonim akış çalışır).
 */
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Next iç dosyaları + statik varlıklar hariç her şey; API rotaları dahil.
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
