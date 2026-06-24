import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/**
 * Clerk middleware — oturumu tüm isteklerde kullanılabilir kılar. **Hiçbir rotayı KORUMAZ** (varsayılan):
 * ücretsiz katman hesap istemez (ADR-0046, additif auth) → anonim kullanım aynen çalışır. İleride
 * yalnız hesap/fatura uçları `auth.protect()` ile korunacak.
 *
 * Anahtar yoksa (yerel/CI build) middleware no-op → build/dev kırılmaz.
 */
const hasClerk = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

export default hasClerk ? clerkMiddleware() : () => NextResponse.next();

export const config = {
  matcher: [
    // Next iç dosyaları + statik varlıklar hariç her şey; API rotaları dahil.
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
