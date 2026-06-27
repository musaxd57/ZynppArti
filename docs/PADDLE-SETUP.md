# PADDLE-SETUP — Abonelik kurulumu (Moses adımları)

> Durum: **İSKELET hazır** (kod), **canlı kısım Moses'ı bekliyor** (hesap + anahtar + onay).
> İlgili: ADR-0046, `apps/web/lib/plan.ts`, `apps/web/app/api/paddle/webhook/route.ts`.

Kod tarafı anahtarsız **atıldır** — Paddle yapılandırılmadıkça hiçbir şey değişmez (anonim/ücretsiz
akış aynen çalışır). Aşağıdaki adımlar bittiğinde abonelik canlıya alınır.

## 1. Paddle hesabı + ürünler
1. https://paddle.com → hesap aç (Sandbox ile başla; canlı için "domain verification" gerekir).
2. **Catalog → Products** → iki ürün: "Vesna Pro", "Vesna Studio".
3. Her ürüne **Price** ekle (aylık, USD veya TRY). Price id'leri kopyala: `pri_...`
   - Pro → `PADDLE_PRICE_PRO`
   - Studio → `PADDLE_PRICE_STUDIO`

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

## 4. Vercel env (yukarıdakileri gir)
```
PADDLE_WEBHOOK_SECRET=pdl_ntfset_...
PADDLE_PRICE_PRO=pri_...
PADDLE_PRICE_STUDIO=pri_...
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_... (sonra live_...)
NEXT_PUBLIC_PADDLE_ENV=sandbox
```
(`SUPABASE_SECRET_KEY` zaten var — webhook profili bununla günceller.)

## 5. Kalan KOD işi (Moses onayından sonra Claude yapar)
- [ ] `@paddle/paddle-js` bağımlılığı (overlay checkout) — **bağımlılık onayı gerek**.
- [ ] Fiyatlandırma + uygulama içi "Pro'ya geç" → `Paddle.Checkout.open({ items:[{priceId}],
      customData:{ user_id: <supabase uid> } })`. **customData.user_id şart** — webhook profili bununla bulur.
- [ ] Plan kotası **enforcement** (ücretsiz: 3 bulut proje / 1 işbirlikçi — `lib/plan.ts PLAN_QUOTAS`).
      ⚠️ Mevcut ücretsiz kullanıcıları kilitler → ürün kararı (ne zaman, hangi limit).
- [x] Webhook **replay/timestamp** kontrolü (5 dk tolerans penceresi) — eklendi.
- [ ] Webhook **sıra-dışı olay** koruması: webhook'lar sıralı gelmez; geç gelen eski bir
      `subscription.updated` iptalden sonra planı geri yükseltebilir. Düzeltme: `profiles`'a
      `plan_updated_at` kolonu + olayın `occurred_at`'i daha eski ise yazma. (Canlıdan önce.)

## Test (sandbox)
1. Sandbox env ile deploy.
2. Test kartıyla (Paddle sandbox kartları) Pro satın al → webhook `subscription.created` →
   `profiles.plan='pro'` → üst barda **Pro** rozeti.
3. İptal → `subscription.canceled` → plan `free`.
