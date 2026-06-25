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
4. **GÜVENLİK (önerilir):** Railway env'ine `ALLOWED_ORIGINS` ekle (virgülle): canlı web origin'(ler)in,
   ör. `ALLOWED_ORIGINS=https://vesna.design,https://www.vesna.design`. Set'liyse sync yalnız bu
   origin'lerden WS bağlantısı kabul eder (yabancı sitelerden bağlanma/cross-site hijack engellenir).
   **Set edilmezse tüm origin'ler kabul edilir** (mevcut davranış — kırmaz, ama korumasız). `maxPayload`
   (2 MB) ve heartbeat zaten her zaman aktif (amplifikasyon DoS + zombi bağlantı koruması).

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

---

## RUNBOOK — "Bir şey patladı, ne yaparım?"

> Canlı: **web** = Vercel (`vesna.design`), **sync** = Railway. İkisi bağımsız: biri düşse diğeri çalışır
> (sync düşerse uygulama tek-kullanıcı modda çalışmaya devam eder; yalnız "Canlı Paylaş" kopar).

### Ortam değişkenleri (nerede, ne işe yarar)
| Değişken | Yer | Tarayıcıya gider mi? | İşlev |
|---|---|---|---|
| `OPENAI_API_KEY` | Vercel env | ❌ (server route) | Sor/Çiz fallback + **Render** (görsel) |
| `ANTHROPIC_API_KEY` | Vercel env | ❌ | Karmaşık/yönetmelik soruları (Claude) |
| `AKASHML_API_KEY` | Vercel env | ❌ | Ucuz yedek (GLM, yavaş) |
| `OPENAI_IMAGE_MODEL` | Vercel env (ops.) | ❌ | Render modeli (vars. `gpt-image-1`; erişim yoksa `dall-e-3`) |
| `NEXT_PUBLIC_COLLAB_WS` | Vercel env | ✅ (public) | Railway sync URL'i (`wss://…`) |
| `ALLOWED_ORIGINS` (ops.) | Railway env | ❌ | Sync WS origin allow-list (virgülle); set'liyse yalnız bunlar bağlanır |
| `*_MODEL` (ops.) | Vercel env | ❌ | Sağlayıcı model id override |

### Belirti → teşhis → çözüm
- **AI hiç cevap vermiyor (Sor/Çiz):** `/api/copilot` 503 = hiç anahtar yok → Vercel env'de en az bir `*_API_KEY` dolu mu? · 500 = sağlayıcılar düştü → Vercel **Functions log**'una bak (hangi sağlayıcı, hata ne). Boş yanıt artık otomatik sıradakine düşer (ADR-0045).
- **Render çalışmıyor:** Hata mesajı artık gerçek nedeni + model id'yi söyler (ADR-0045). "model_not_found / no access" → `OPENAI_IMAGE_MODEL=dall-e-3` ekle. "billing" → OpenAI hesabına bakiye. "content_policy" → prompt'u yumuşat.
- **Canlı Paylaş bağlanmıyor (pill "kopuk"):** Railway servisi ayakta mı (Railway dashboard → Deploys/Logs)? · `NEXT_PUBLIC_COLLAB_WS` **wss://** ile mi (http değil)? · Railway uyku/limit? Yeniden deploy.
- **Çizim kayboldu (collab):** Beklenen — sync v1 **kalıcılık tutmaz** (oda boşalınca gider). Veri kaybı değil: kullanıcı **Kaydet** (JSON) ile yerelde tutar. Kalıcılık = ayrı iş (yukarı).
- **Sayfa beyaz / "stale manifest" 500 (yalnız dev):** `.next` sil + `pnpm dev`. Üretimde Vercel cache → **Redeploy** (Vercel dashboard).

### Rollback
- **Vercel:** Deployments → çalışan eski deploy → **Promote to Production** (anında geri al).
- **Railway:** Deployments → eski başarılı deploy → **Redeploy**.
- **Kod:** `main`'i son iyi commit'e `git revert` (force-push'tan kaçın — canlı branch).

### Sağlık kontrolü (hızlı)
- Web: `vesna.design` açılıyor + tuval çiziliyor mu?
- AI: Sor moduna "merhaba" → cevap geliyor mu (hangi hız)?
- Sync: iki sekme Canlı Paylaş → imleç/çizim eşleşiyor mu?
