# PADDLE-SETUP — Abonelik kurulumu (Moses adımları)

> Durum: **İSKELET hazır** (kod), **canlı kısım Moses'ı bekliyor** (hesap + anahtar + onay).
> İlgili: ADR-0046, `apps/web/lib/plan.ts`, `apps/web/app/api/paddle/webhook/route.ts`.

Kod tarafı anahtarsız **atıldır** — Paddle yapılandırılmadıkça hiçbir şey değişmez (anonim/ücretsiz
akış aynen çalışır). Aşağıdaki adımlar bittiğinde abonelik canlıya alınır.

## 1. Paddle hesabı + ürünler
1. https://paddle.com → hesap aç (Sandbox ile başla; canlı için "domain verification" gerekir).
2. **Catalog → Products** → iki ürün: "Vesna Pro", "Vesna Studio".
3. Her ürüne **Price** ekle (aylık, USD veya TRY). Price id'leri kopyala: `pri_...`
   - Pro → `NEXT_PUBLIC_PADDLE_PRICE_PRO`
   - Studio → `NEXT_PUBLIC_PADDLE_PRICE_STUDIO`
   - (NEXT_PUBLIC: checkout + webhook ikisi de bu değeri okur; price id gizli değil.)

## 2. Webhook (abonelik → plan)
1. **Developer Tools → Notifications** → yeni destination:
   - URL: `https://vesna.design/api/paddle/webhook`
   - Olaylar: `subscription.created`, `subscription.activated`, `subscription.updated`,
     `subscription.resumed`, `subscription.canceled`, `subscription.paused`
2. İmza anahtarını kopyala: `pdl_ntfset_...` → `PADDLE_WEBHOOK_SECRET`

## 3. Checkout client token (tarayıcı)
1. **Developer Tools → Authentication → Client-side tokens** → token oluştur.
   → `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` (`test_...` sandbox / `live_...` canlı)
2. `NEXT_PUBLIC_PADDLE_ENV` = `sandbox` (test) veya `production`.

## 4. Vercel env (yukarıdakileri gir — CANLI)
```
PADDLE_WEBHOOK_SECRET=pdl_ntfset_...
NEXT_PUBLIC_PADDLE_PRICE_PRO=pri_...
NEXT_PUBLIC_PADDLE_PRICE_STUDIO=pri_...
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=live_...
NEXT_PUBLIC_PADDLE_ENV=production
```
(`SUPABASE_SECRET_KEY` zaten var — webhook profili bununla günceller.)
> Moses kararı: **sandbox atlandı, direkt canlı** → gerçek tahsilat. Test gerçek kartla yapılır.

## 5. KOD durumu
- [x] `@paddle/paddle-js` (overlay checkout) — eklendi (ADR-0048).
- [x] Fiyatlandırma "Pro'ya geç / Stüdyo'yu seç" → `Checkout.open({ items, customData:{ user_id } })`
      (giriş yoksa önce /giris'e yönlendirir — webhook eşlemesi user_id ister). `components/PlanCta.tsx`.
- [x] Webhook **replay/timestamp** kontrolü (5 dk pencere).
- [ ] Plan kotası **enforcement** (ücretsiz: 3 bulut proje / 1 işbirlikçi — `lib/plan.ts PLAN_QUOTAS`).
      ⚠️ Mevcut ücretsiz kullanıcıları kilitler → ürün kararı (ne zaman, hangi limit).
- [ ] Webhook **sıra-dışı olay** koruması: webhook'lar sıralı gelmez; geç gelen eski bir
      `subscription.updated` iptalden sonra planı geri yükseltebilir. Düzeltme: `profiles`'a
      `plan_updated_at` kolonu + olayın `occurred_at`'i daha eski ise yazma. (Önemli ama acil değil.)

## Test (CANLI — gerçek kart)
1. Env'leri Vercel'e gir → deploy.
2. Giriş yap → /fiyatlandirma → "Pro'ya Geç" → Paddle overlay → gerçek kartla öde.
3. Webhook `subscription.created` → `profiles.plan='pro'` → üst barda **Pro** rozeti.
4. İptal → `subscription.canceled` → plan `free`.
> İlk testi küçük tutmak istersen Paddle'da geçici düşük fiyatlı bir price oluşturabilirsin.
