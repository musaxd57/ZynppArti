import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseService } from '@/lib/supabase/server';
import { normalizePlan, type Plan } from '@/lib/plan';

/**
 * Paddle (Billing) webhook iskeleti (ADR-0046) — abonelik olaylarını `profiles.plan`'a yazar.
 *
 * ⚠️ İSKELET: CANLI checkout + Paddle hesabı/anahtarları Moses onayı bekler (maliyet/irreversible).
 * Bu route anahtarsız ATILDIR (PADDLE_WEBHOOK_SECRET yoksa 503) → mevcut akışı bozmaz.
 *
 * Gerekli env (Moses ayarlar):
 *   PADDLE_WEBHOOK_SECRET   — Paddle Dashboard → Notifications → webhook imza anahtarı
 *   PADDLE_PRICE_PRO        — Pro plan price id (pri_...)
 *   PADDLE_PRICE_STUDIO     — Studio plan price id (pri_...)
 *   SUPABASE_SECRET_KEY     — (zaten var) servis istemcisi RLS'i atlayıp profiles günceller
 *
 * Checkout tarafı (sonra): Paddle.Checkout.open({ ..., customData: { user_id: <supabase uid> } })
 * → webhook bu uid ile doğru profili bulur.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Paddle imzasını doğrular: `Paddle-Signature: ts=..;h1=..`; imzalı yük = `ts:rawBody`, HMAC-SHA256. */
function verifySignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(';').map((kv) => kv.split('=').map((s) => s.trim()) as [string, string]));
  const ts = parts['ts'];
  const h1 = parts['h1'];
  if (!ts || !h1) return false;
  // NOT: Burada timestamp YAŞ kontrolü YAPILMAZ. Paddle başarısız teslimatı saatler boyunca AYNI imzayla
  // (aynı ts) tekrar gönderir → sert bir "taze mi" penceresi meşru retry'leri reddedip ödeme yapan
  // müşterinin planını güncellemezdi. Güvenliği HMAC imzası sağlar; tekrar-oynatma riski plan
  // güncellemelerinde düşük (idempotent) — sıralama için occurred_at tabanlı koruma ayrı TODO (runbook).
  const expected = createHmac('sha256', secret).update(`${ts}:${rawBody}`).digest('hex');
  // Uzunluk farkı timingSafeEqual'ı patlatır → önce uzunluk kontrolü (sabit-zamanlı karşılaştırma).
  if (expected.length !== h1.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(h1));
}

/** Abonelik öğelerindeki price id'lerden planı çıkarır; eşleşme yoksa null. */
function planFromItems(items: unknown, priceMap: Record<string, Plan>): Plan | null {
  if (!Array.isArray(items)) return null;
  for (const it of items) {
    const priceId = (it as { price?: { id?: string } })?.price?.id;
    if (priceId && priceMap[priceId]) return priceMap[priceId];
  }
  return null;
}

export async function POST(req: NextRequest): Promise<Response> {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) {
    // Yapılandırılmamış → atıl (Paddle henüz canlı değil). 503 = "ben yokum", Paddle tekrar dener.
    return NextResponse.json({ error: 'paddle_not_configured' }, { status: 503 });
  }

  const rawBody = await req.text();
  if (!verifySignature(rawBody, req.headers.get('paddle-signature'), secret)) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
  }

  const service = getSupabaseService();
  if (!service) {
    console.error('Paddle webhook: Supabase servis anahtarı yok (SUPABASE_SECRET_KEY).');
    return NextResponse.json({ error: 'service_unavailable' }, { status: 500 });
  }

  let event: { event_type?: string; data?: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'bad_json' }, { status: 400 });
  }

  const type = event.event_type ?? '';
  const data = event.data ?? {};
  const customData = (data['custom_data'] ?? {}) as { user_id?: string };
  const userId = customData.user_id;
  if (!userId) {
    // uid yoksa eşleştiremeyiz — logla, 200 dön (Paddle yeniden denemesin; tasarım gereği).
    console.warn(`Paddle webhook ${type}: custom_data.user_id yok, atlandı.`);
    return NextResponse.json({ ok: true, skipped: 'no_user_id' });
  }

  // Price id'leri NEXT_PUBLIC_* (checkout ile aynı değer; sunucuda da okunur) — eski PADDLE_PRICE_* yedek.
  const priceMap: Record<string, Plan> = {};
  const proPrice = process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO ?? process.env.PADDLE_PRICE_PRO;
  const studioPrice = process.env.NEXT_PUBLIC_PADDLE_PRICE_STUDIO ?? process.env.PADDLE_PRICE_STUDIO;
  if (proPrice) priceMap[proPrice] = 'pro';
  if (studioPrice) priceMap[studioPrice] = 'studio';

  let newPlan: Plan | null = null;
  if (type === 'subscription.canceled' || type === 'subscription.paused') {
    newPlan = 'free';
  } else if (
    type === 'subscription.created' ||
    type === 'subscription.activated' ||
    type === 'subscription.updated' ||
    type === 'subscription.resumed'
  ) {
    newPlan = planFromItems(data['items'], priceMap) ?? 'free';
  }

  if (newPlan === null) {
    // İlgilenmediğimiz olay (ör. transaction.*) → kabul et, no-op.
    return NextResponse.json({ ok: true, ignored: type });
  }

  const { error } = await service
    .from('profiles')
    .update({ plan: normalizePlan(newPlan) })
    .eq('id', userId);
  if (error) {
    console.error('Paddle webhook profiles güncelleme hatası:', error.message);
    return NextResponse.json({ error: 'db_update_failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, plan: newPlan });
}
