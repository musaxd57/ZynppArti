'use client';

import { initializePaddle, type Paddle } from '@paddle/paddle-js';
import { type Plan } from '@/lib/plan';

/**
 * Paddle.js checkout (ADR-0046/0048) — tarayıcıda overlay checkout. ADDİTİF: client token yoksa `null`
 * → "Pro'ya geç" butonu fiyatlandırma sayfasına düşer (uygulama bozulmaz). CANLI: gerçek tahsilat.
 *
 * Env (NEXT_PUBLIC_ → tarayıcıda okunur; client token gizli DEĞİL, secret API key ile karıştırma):
 *   NEXT_PUBLIC_PADDLE_CLIENT_TOKEN   (live_... / test_...)
 *   NEXT_PUBLIC_PADDLE_ENV            (production | sandbox; varsayılan production)
 *   NEXT_PUBLIC_PADDLE_PRICE_PRO / _STUDIO   (pri_...)  — webhook da bunları okur (NEXT_PUBLIC sunucuda da görünür)
 */

const TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
const ENV = (process.env.NEXT_PUBLIC_PADDLE_ENV === 'sandbox' ? 'sandbox' : 'production') as
  | 'sandbox'
  | 'production';

/** Bir plan için price id (NEXT_PUBLIC env'den). free → null (satılık değil). */
export function priceIdFor(plan: Plan): string | null {
  if (plan === 'pro') return process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO ?? null;
  if (plan === 'studio') return process.env.NEXT_PUBLIC_PADDLE_PRICE_STUDIO ?? null;
  return null;
}

/** Paddle yapılandırılmış mı (client token + en az bir price var mı)? */
export function paddleEnabled(): boolean {
  return Boolean(TOKEN && (priceIdFor('pro') || priceIdFor('studio')));
}

let paddlePromise: Promise<Paddle | undefined> | null = null;

/** Paddle.js'i bir kez başlat (singleton). Token yoksa undefined. */
async function getPaddle(): Promise<Paddle | undefined> {
  if (!TOKEN) return undefined;
  if (!paddlePromise) {
    paddlePromise = initializePaddle({ environment: ENV, token: TOKEN });
  }
  return paddlePromise;
}

/**
 * Plan için checkout overlay'ini açar. `userId` ŞART (webhook profili `custom_data.user_id` ile bulur);
 * yoksa açmaz (çağıran önce girişe yönlendirmeli). Başarıda Paddle kendi onay ekranını gösterir;
 * abonelik webhook'la `profiles.plan`'a yazılır.
 */
export async function openCheckout(opts: {
  plan: Plan;
  userId: string;
  email?: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const priceId = priceIdFor(opts.plan);
  if (!priceId) return { ok: false, reason: 'no_price' };
  if (!opts.userId) return { ok: false, reason: 'no_user' };
  const paddle = await getPaddle();
  if (!paddle) return { ok: false, reason: 'no_token' };
  paddle.Checkout.open({
    items: [{ priceId, quantity: 1 }],
    customer: opts.email ? { email: opts.email } : undefined,
    customData: { user_id: opts.userId },
  });
  return { ok: true };
}
