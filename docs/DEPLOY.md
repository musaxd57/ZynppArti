# DEPLOY — Yayına alma (hosting)

> Seçim (Claude önerisi): **Web → Vercel**, **Sync (WebSocket) → Railway**.
> Sebep: Next.js için en iyi/ücretsiz ev Vercel'dir; ama Vercel **kalıcı WebSocket** çalıştıramaz
> (serverless). Canlı-işbirliği sunucusu (`apps/sync`) sürekli açık bir süreç ister → Railway (veya
> Render). İkisi ayrı; bu en ucuz + en sağlam bölünme.

## Mimari
```
Kullanıcı tarayıcı
  ├── Next.js web  → Vercel        (apps/web; /api/copilot AI route'u burada, anahtarlar env)
  └── WebSocket    → Railway       (apps/sync; canlı imleç + çizim senkronu)
Domain → Vercel'e bağlanır (web). Sync için Railway alt-domaini (wss://...) yeterli.
```

## A) Web → Vercel
1. vercel.com → GitHub ile giriş → **New Project** → bu repo.
2. **Root Directory: `apps/web`** (Vercel monorepo'yu otomatik algılar; Next.js preset).
   - Build override gerekmez; `pnpm build` + workspace paketleri `transpilePackages` ile derlenir.
3. **Environment Variables** (Project Settings → Environment Variables):
   - `AKASHML_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` → kendi değerlerin (sunucu tarafı; gizli).
   - `NEXT_PUBLIC_COLLAB_WS` → Railway sync URL'i, **wss://** ile (ör. `wss://zynpparti-sync.up.railway.app`).
4. Deploy. Custom domain'i Settings → Domains'ten ekle.

## B) Sync (WebSocket) → Railway
1. railway.app → GitHub ile giriş → **New Project → Deploy from repo**.
2. Service ayarları:
   - **Start command:** `pnpm install --frozen-lockfile && pnpm --filter @zynpparti/sync start`
     (veya root + `node apps/sync/server.mjs`; `ws` paketi sync'in dependency'sidir.)
   - Railway `PORT` env'ini otomatik verir; `apps/sync/server.mjs` `process.env.PORT`'u kullanır → uyumlu.
3. Railway publicdomain üret → `wss://<servis>.up.railway.app` → bunu Vercel'deki `NEXT_PUBLIC_COLLAB_WS`'e yaz.

## Maliyet (kaba, başlangıç)
| Kalem | Sağlayıcı | Maliyet |
|---|---|---|
| Web | Vercel **Hobby** | **Ücretsiz** (kişisel/non-ticari). Ticari/ekip → Pro $20/ay. |
| Sync WS | Railway | ~**$5/ay** (küçük, sürekli açık servis). |
| Domain | herhangi (Namecheap/Cloudflare) | **.com ~$10-12/yıl**, .design ~$20/yıl, .app ~$14/yıl, .com.tr değişken. |
| AI kullanımı | Akash/OpenAI/Claude | **Kullandıkça** (anahtarların). Akash ucuz; çoğu trafik oraya yönlü. |

→ **Başlangıç ~ $5/ay + domain (~$1/ay).** Kullanıcı artınca Vercel Pro + Railway ölçeklenir.

## Domain önerisi
AI'nın adı **Arki**, ürün **ZynppArti**. Öneriler (uygunluk değişir, kontrol et):
`arki.design` · `arki.app` · `getarki.com` · `zynpparti.com` · `arki.com.tr`.
**İlk tercih:** `arki.design` (kısa + mimari/tasarım çağrışımı) ya da `zynpparti.com` (ürün adı).

## NOT — olgun collab için sonra
Şu anki sync **kalıcılık tutmaz** (oda boşalınca kaybolur) ve **auth yok**. Üretimde:
Hocuspocus (kalıcı y-websocket) + basit token auth + blob/DB persistence eklenir (ayrı iş).
