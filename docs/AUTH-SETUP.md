# AUTH-SETUP — Hesap/giriş + veritabanı kurulumu (Moses adımları)

> Karar: ADR-0046 (Clerk + Railway PostgreSQL + Prisma). Bu dosya **Moses'ın yapacağı kurulumu** ve
> **ortam değişkenleri sözleşmesini** tarif eder. Gizli anahtarları **bana yazma** — doğrudan Vercel/
> Railway env'ine koy (güvenlik, CLAUDE §0.9). Anahtarlar girilince Claude kodu main'e alır.

---

## Adım 1 — Railway PostgreSQL (veritabanı)
1. [railway.app](https://railway.app) → mevcut projen (sync'in olduğu) → **+ New** → **Database** → **Add PostgreSQL**.
2. Oluşunca Postgres servisine tıkla → **Variables / Connect** sekmesi → **`DATABASE_URL`** (postgresql://... ile başlayan bağlantı dizesi) kopyala.
3. Bu değeri **Vercel**'e ekle: Vercel projesi → Settings → Environment Variables → `DATABASE_URL` = (kopyaladığın).

## Adım 2 — Clerk (giriş/kayıt)
1. [clerk.com](https://clerk.com) → ücretsiz hesap → **Create application**.
2. Ad: **Vesna**. Giriş yöntemi: **Email** + istersen **Google** (önerilir — tek tıkla giriş).
3. Açılan **API Keys** ekranından iki anahtarı al:
   - **Publishable key** (`pk_...`) → herkese açık, sorun değil.
   - **Secret key** (`sk_...`) → **GİZLİ**, kimseyle paylaşma.
4. İkisini de **Vercel** env'ine ekle:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = `pk_...`
   - `CLERK_SECRET_KEY` = `sk_...`
5. (Webhook — sonra kuracağız, şimdilik atla.) İleride `CLERK_WEBHOOK_SECRET` eklenecek.

## Adım 3 — Bana haber ver
Yukarıdakiler Vercel/Railway env'inde hazır olunca **"anahtarlar hazır"** de. Claude:
- `@clerk/nextjs` + Prisma'yı kurar, şemayı oluşturur, giriş/kayıt akışını ekler (feature branch).
- Anonim kullanım bozulmadan test eder, sonra main'e alır (canlıya).

---

## Ortam değişkenleri sözleşmesi (özet)
| Değişken | Yer | Gizli? | Ne |
|---|---|---|---|
| `DATABASE_URL` | Vercel (+ Railway verir) | ✅ gizli | Postgres bağlantısı |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Vercel | ❌ public | Clerk istemci anahtarı |
| `CLERK_SECRET_KEY` | Vercel | ✅ gizli | Clerk sunucu anahtarı |
| `CLERK_WEBHOOK_SECRET` | Vercel (sonra) | ✅ gizli | Clerk→DB kullanıcı senkronu |

## Veri şeması (Prisma — Claude kuracak, önizleme)
```prisma
model User {
  id        String   @id @default(cuid())
  clerkId   String   @unique          // Clerk kullanıcı id'si
  email     String?
  plan      String   @default("free") // free | pro | studio
  createdAt DateTime @default(now())
  projects  Project[]
  subscription Subscription?
}

model Project {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  name      String
  data      Json                      // çizim = tek JSON blob (CLAUDE §6.5; entity satır satır DEĞİL)
  updatedAt DateTime @updatedAt
}

model Subscription {
  id                   String   @id @default(cuid())
  userId               String   @unique
  user                 User     @relation(fields: [userId], references: [id])
  paddleSubscriptionId String?
  status               String                       // active | canceled | past_due
  plan                 String                       // pro | studio
  periodEnd            DateTime?
}
```

## Önemli ilkeler (ADR-0046)
- **Giriş opsiyonel:** ücretsiz katman hesap istemez; uygulama anonim çalışmaya devam eder. Giriş yalnız **bulut kayıt + abonelik** için.
- **Çizim = JSON blob** (tek sütun), entity'ler satır satır DB'ye yazılmaz (CLAUDE §6.5).
- Gizli anahtarlar **yalnız env**, repo'ya/sohbete girmez.

> İlgili: [DECISIONS.md](DECISIONS.md) ADR-0046, [BUSINESS-PRICING.md](BUSINESS-PRICING.md) (sıra: auth→bulut kayıt→Paddle), [DEPLOY.md](DEPLOY.md).
