# DECISIONS — Mimari Karar Kaydı (ADR)

> Her kalıcı teknik karar burada: **Bağlam → Karar → Sonuç/Takas**. En yeni üstte.
> CLAUDE.md ile çelişen bir karar alınırsa önce CLAUDE.md güncellenir, sonra buraya ADR eklenir.

---

## ADR-0048 — Abonelik: Paddle (Billing) — Merchant of Record; webhook → `profiles.plan`
**Tarih:** 2026-06-27 · **Durum:** Kabul (Moses kararı; canlı kurulum) · **Kapsam:** Ödeme/abonelik · **İlişkili:** [ADR-0046] (plan iskelesi), [ADR-0047] (profiles)
**Bağlam:** Pro/Studio abonelikleri için ödeme altyapısı gerekiyordu. Stripe Türkiye'de doğrudan satıcı hesabı + KDV/fatura yükü getirir; **Paddle Merchant-of-Record** olarak vergi/fatura/uyumu üstlenir (Türkiye'den global SaaS satışı için pratik). Bağımlılık (`@paddle/paddle-js`) + canlı para = Moses onayı alındı.
**Karar:**
- **Checkout:** Paddle.js overlay (`@paddle/paddle-js`), client token ile (`NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`). Fiyatlandırma kartı CTA'sı → giriş şart (webhook eşlemesi için) → `Checkout.open({ items:[{priceId}], customData:{ user_id } })`.
- **Plan yazımı:** Paddle **webhook** (`/api/paddle/webhook`) → imza doğrula (node:crypto HMAC `ts:body` + 5dk replay penceresi) → `subscription.*` olaylarını `profiles.plan`'a yaz (servis istemcisi, RLS atlar). Price→plan eşlemesi env (`NEXT_PUBLIC_PADDLE_PRICE_PRO/_STUDIO`).
- **ADDİTİF/atıl:** anahtar yoksa checkout fiyatlandırmaya, webhook 503'e düşer → anonim/ücretsiz akış bozulmaz.
- **Plan modeli:** `lib/plan.ts` tek kaynak (etiket + kota). Kota **enforcement** ayrı/ertelendi (ürün kararı — mevcut ücretsiz kullanıcıları kilitler).
**Sonuç:** Canlı abonelik altyapısı. Takas: (1) **sandbox atlandı, direkt canlı** (Moses) → gerçek tahsilat, test gerçek kartla; (2) webhook **sıra-dışı olay** koruması yok (geç gelen eski olay planı geri alabilir) → `plan_updated_at`+`occurred_at` TODO (`docs/PADDLE-SETUP.md`); (3) secret API key (`pdl_live_apikey_`) kod tarafından henüz kullanılmıyor (programatik yönetim ileride). Kurulum runbook: `docs/PADDLE-SETUP.md`.

## ADR-0047 — Faz 3 backend: Supabase (auth + Postgres + Storage, hepsi-bir-arada) — ADR-0046'yı günceller
**Tarih:** 2026-06-26 · **Durum:** Kabul (Moses kararı) · **Kapsam: Faz 3 backend** · **Yerini aldığı:** [ADR-0046] (Clerk + Railway Postgres + R2)
**Bağlam:** Faz 3'ün üç ayağı (gerçek kimlik/giriş, kalıcı bulut proje, çok-kullanıcı kalıcılığı) ayrı sağlayıcılarla (Clerk + Railway Postgres + R2 blob) kurulacaktı — üç hesap, üç anahtar seti, üç fatura. Moses tek-sağlayıcı sadeliğini seçti: **Supabase** auth + Postgres + dosya (Storage) + satır-düzeyi güvenlik (RLS) + realtime'ı tek serviste, cömert ücretsiz katmanla verir. Kodun çoğunu Claude yazıyor; az hareketli parça = az hata.
**Karar:** **Supabase** Faz 3 backend'i:
- **Auth:** Supabase Auth (e-posta/parola + OAuth + magic link). **Clerk'i değiştirir** (ADR-0046'daki additif Clerk iskelesi sökülür/devre dışı). **KRİTİK İLKE korunur: auth ADDİTİF/OPSİYONEL** — anahtar yoksa uygulama anonim çalışır (build/runtime kırılmaz); giriş yalnız bulut kayıt + abonelik için. Tüm app auth arkasına ALINMAZ.
- **Veritabanı (metadata, CLAUDE §6.5 — entity satır satır YAZILMAZ):** Postgres tabloları — `profiles`(id=auth.uid, email, plan), `projects`(id, owner, name, **storage_path**, updated_at), `project_members`(project, user, role), `comments`(project, author, body, resolved). **Çizim içeriği DB'de değil**, Storage'da tek dosya.
- **Model dosyaları (CLAUDE §6.5 "model = blob"):** Supabase **Storage** bucket (`models/`); her proje = bir versiyonlu JSON zarfı (`packages/document/serialize.ts` formatı). Aç/Kaydet bu dosyayı indirir/yükler.
- **Güvenlik:** RLS politikaları — kullanıcı yalnız sahibi/üyesi olduğu projeyi görür. Anon key public (RLS korur), service_role yalnız sunucu route'unda.
- **Realtime (Faz 3 multiplayer):** Yjs+broadcast sync sunucusu (ADR-0044) **kalır**; Supabase Storage yalnız kalıcılık (snapshot) için. Supabase Realtime presence ileride değerlendirilir.
- **Yeni bağımlılık:** `@supabase/supabase-js` (bu ADR §12 onayı). Anahtarlar yalnız env: `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public, RLS'li), `SUPABASE_SERVICE_ROLE_KEY` (gizli, yalnız sunucu).
**Sonuç/Takas:** Tek sağlayıcı = en hızlı yol + tek fatura + RLS güvenliği hazır. Takas: Supabase'e bağımlılık (kilitlenme) — ama `serialize.ts` zarfı taşınabilir (model dosyaları her yere taşınır), şema standart Postgres. **Sıra:** (1) Supabase projesi provision + `supabase/schema.sql` çalıştır + anahtarları env'e koy **[Moses]** → (2) additive Supabase istemcisi + Aç/Kaydet-buluta + auth UI **[Claude, branch]** → (3) Clerk sökümü → (4) Paddle abonelik (ADR-0046 §Paddle planı korunur). Setup: `docs/SUPABASE-SETUP.md`.

## ADR-0046 — Hesap/giriş + kalıcılık: Clerk (auth) + Railway PostgreSQL + Prisma
**Tarih:** 2026-06-24 · **Durum:** Kabul (Moses kararı — satışa hazırlık; "Railway'i seçelim") · **Kapsam: Faz 3 backend başlangıcı**
**Bağlam:** Satış için ücretli özellikleri kapı arkasına almak gerek; bunun için kullanıcı kimliği + plan durumu saklanmalı (BUSINESS-PRICING §4: tahsilat auth'tan sonra). Moses zaten Railway kullanıyor (sync); veritabanını da orada istedi. Şifre/oturum güvenliğini elle yazmak riskli (güvenlik açığı = felaket) → giriş hazır/güvenli bir katmana bırakılır.
**Karar:** **Clerk** (managed auth — `@clerk/nextjs`) + **Railway PostgreSQL** (veri) + **Prisma** (ORM; CLAUDE §5 zaten Postgres+Prisma diyor). **KRİTİK İLKE: auth ADDİTİF/OPSİYONEL** — ücretsiz katman hesap GEREKTİRMEZ (landing/fiyat kararı). Uygulama anonim çalışmaya devam eder; giriş yalnız bulut kayıt + abonelik için. Tüm app Clerk arkasına ALINMAZ; yalnız hesap/fatura/bulut-proje uçları korunur. Şema (metadata — CLAUDE §6.5: entity satır satır DB'ye YAZILMAZ): `User`(clerkId, email, plan), `Project`(userId, name, **data: Json blob**, updatedAt), `Subscription`(userId, paddleSubscriptionId, status, plan, periodEnd). Çizim içeriği JSON blob olarak tek sütunda (büyürse object storage'a — R2/S3). Anahtarlar yalnız env (Vercel/Railway): `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (public), `CLERK_SECRET_KEY` + `DATABASE_URL` + `CLERK_WEBHOOK_SECRET` (gizli). Yeni bağımlılıklar: `@clerk/nextjs`, `prisma`/`@prisma/client` (bu ADR §12 onayı).
**Sonuç/Takas:** İlk gerçek backend + kalıcılık temeli; Paddle ödeme bunun üstüne gelir (kota/gate). **Canlı site riski:** auth additif kurulacak (anonim akış bozulmaz); kod **feature branch'te** geliştirilip Moses anahtarları env'e girince main'e merge edilir (anahtarsız Clerk build/runtime patlar → live deploy korunur). Setup adımları: `docs/AUTH-SETUP.md`. Sıra: (1) Clerk app + Railway Postgres provision [Moses] → (2) auth scaffolding + Prisma şema [Claude, branch] → (3) bulut kayıt → (4) Paddle.

## ADR-0045 — Boş AI yanıtı = başarısızlık; araç metni için `ctx.requestText`; `Comment.resolved`
**Tarih:** 2026-06-24 · **Durum:** Kabul (YARIN §2 hızlı kazanımlar; maliyetsiz/deterministik)
**Bağlam:** Canlı kullanımda üç küçük boşluk: (1) bir AI sağlayıcı **boş string** dönerse `askCopilot` bunu "başarı" sayıp boş baloncuk gösteriyordu (fallback tetiklenmiyordu); (2) açıklama/yorum araçları hâlâ çirkin/bloklayan `window.prompt` kullanıyordu (kalibrasyon temalı diyaloğa geçmişti, bunlar geri kalmıştı); (3) yorumlar yalnız eklenebiliyordu — düzenleme/silme/çözüldü işareti yoktu (markup'ın temel ihtiyacı).
**Karar:** (1) `askCopilot`/`askCopilotStream` boş/yalnız-boşluk yanıtı (veya hiç parça yaymadan biten akışı) **başarısızlık** sayıp zincirdeki sıradaki sağlayıcıya düşer (+3 birim test, mock sağlayıcı). (2) `ToolContext`'e `requestText(message, initial?)` eklendi (`requestCalibration` deseni); `AnnotationTool` + `CommentTool` bunu kullanır, enjekte edilmemişse `window.prompt` yedek; akış asenkron. Web tarafında temalı `promptDialog`'a bağlanır. (3) `Comment.resolved?: boolean` (serialize/clone spread'le otomatik taşınır — format kırılmaz); çözülmüş yorum soluk gri + ✓ render edilir. Yoruma çift tık → engine `setCommentActivateHandler` → **CommentDialog** (calibrate-dialog modül-store deseni): metni düzenle / çözüldü değiştir / sil (Command'lerle: UpdateEntity/RemoveEntity).
**Sonuç:** Boş yanıt artık sessizce yutulmuyor; metin/yorum girişi temalı; markup tam döngüye (düzenle/çöz/sil) kavuştu. Ayrıca: `importDwg(content, wasmDir?)` opsiyonel dizin alır (tarayıcıda boş='/'; Node/sunucu node_modules wasm'ını gösterir) → gerçek DWG (annotation/scaling/multileader) Node'da doğrulandı (2337 duvar + 24 metin, in→cm). Kapı/pencere "bug"ı incelendi: deterministik hat `kind`'ı uçtan uca koruyor → kod doğru, şüphe LLM etiketlemesinde; DESIGN_SYSTEM prompt'u netleştirildi. Takas yok (geriye uyumlu, salt ekleme).

## ADR-0044 — Gerçek-zamanlı işbirliği v1 temeli (Yjs + broadcast sync sunucusu)
**Tarih:** 2026-06-23 · **Durum:** Kabul (ADR-0004'ü uygular; Moses "yap" dedi) · **Kapsam: v1 TEMEL**
**Bağlam:** Faz 3 multiplayer (ADR-0004: Yjs-first). Moses üç büyük işi sırayla istedi; bu üçüncüsü. Tam multiplayer (Command-tabanlı undo köşe durumları, katman-döngü invariant'ı, sunucu otoritesi/kalıcılık, auth) büyük + altyapı gerektirir; bu v1 çalışan bir temel kurar.
**Karar:** Yeni **`packages/collab`** — `EntitySync`: EntityStore ↔ Yjs `Y.Map` çift-yönlü, **echo-güvenli** ayna (origin=this ile kendi yazımını yok sayar; remote'u applyingRemote bayrağıyla uygular). **Türetilmiş `space` SENKRONLANMAZ** — her client duvarlardan RoomManager ile yerel türetir (yoksa çift mahal); dolayısıyla mahal ADLARI v1'de yerel (senkron değil). Duvar/boşluk/blok/ölçü/parsel/pafta/kesit senkronlanır. `createCollab(store, wsUrl, room)` = Y.Doc + WebsocketProvider + awareness. **`apps/sync`** minimal broadcast relay (`ws`; y-websocket protokolü peer-simetrik → broadcast yeterli, `pnpm sync`, port 1234). Web'de **CollabControl** ("Canlı Paylaş" → oda; URL #room=... ile 2. sekme otomatik katılır). Opt-in: sunucu yoksa/bağlanmazsa tek-kullanıcı mod etkilenmez. 4 birim test (iki-istemci sync/update/delete/space-hariç/geç-katılım, bellek-içi doc bağlantısıyla).
**Sonuç:** İki sekme aynı odada çizince duvarlar anında eşleşiyor (canlı doğrulandı: sunucu + sync mantığı). Takas / v1 SINIRLARI (CLAUDE §6.4 — ARCHITECTURE.md'ye yazılıp tamamlanacak): (a) sync store-aynası, remote değişiklikler Command'den GEÇMEZ → multiplayer undo köşe durumları henüz tanımsız; (b) katman-döngü invariant'ı sunucuda zorlanmıyor; (c) kalıcılık yok (herkes çıkınca oda durumu kaybolur; model istemcide Kaydet/Aç ile saklı); (d) auth yok; (e) mahal adları senkron değil. Üretim: Hocuspocus/kalıcı sunucu ya da commit-log otoritesi + invariant doğrulama.

## ADR-0043 — Asistan arayüzü (slide-over) + deneysel AI tasarım üretici (Fikir 2 önizleme, öne çekildi)
**Tarih:** 2026-06-23 · **Durum:** Kabul (Moses açık talebi — "geliştirme amaçlı")
**Bağlam:** Moses (1) cevap altındaki sağlayıcı/model adının gitmesini ("kendi AI'mız" hissi), (2) düzgün bir asistan arayüzü (logo→tıkla→solda büyük panel), (3) AI'ın **tasarımı çizebilmesini** istedi. (3) aslında Fikir 2 / Faz 4'tür ve CLAUDE.md "Faz 4'e kadar dokunma" + "faz atlama yok" der; ancak Moses bunu açıkça istedi (geliştirme amaçlı) → kural 0 gereği "sor"ulan onay sağlandı; Command/RoomManager altyapısı (Faz 1) bunu güvenle taşıyor (AI-AGENT-VISION: Command tabanı ajan için ideal).
**Karar:** **`Assistant`** bileşeni (slide-over): logo butonu → solda büyük panel; "Sor" + "Çiz" modu; **sağlayıcı/model adı UI'da gösterilmez** (CopilotChat kaldırıldı). **Çiz modu** = deneysel tasarım üretici: `packages/ai/design.ts` LLM'e katı JSON kat planı ürettirir (cm duvar segmentleri + oda etiketleri; complex kademe = en iyi model); `parseLayout` toleranslı ayrıştırma + doğrulama (5 test). İstemci planı **Command ile** çizer (`BatchCommand([AddEntity...])` → tek undo); RoomManager mahalleri senkron türetir; `pointInPolygon` ile merkez noktasından ad/tip atanır (best-effort, ayrı batch); sonra zoom-to-fit. Salt-okunur değil ama yine de Command'den geçer (kutsal kural) ve undo'lanır. Route'a `mode:'design'` eklendi.
**Sonuç:** AI artık Türkçe tariften (örn. "8x6m salon+mutfak+yatak+banyo") undo'lanabilir bir kat planı taslağı çiziyor (canlı doğrulandı: GLM-5.2 geçerli plan üretti). Takas: **basit dikdörtgensel taslak** (tam üretici — komşuluk grafiği, kısıt-uyumu, çoklu varyant — Faz 4); JSON güvenilirliği modele bağlı (geçersizse fallback/hata); ölçüleri kullanıcı doğrulamalı ("deneysel" etiketli). Streaming hâlâ yok.

## ADR-0042 — 3 sağlayıcılı zorluk-bazlı router + fallback (AkashML eklendi)
**Tarih:** 2026-06-23 · **Durum:** Kabul (ADR-0006 provider-agnostic adapter'ı tam kurar; ADR-0041 üstüne)
**Bağlam:** Moses AkashML (OpenAI-uyumlu, ucuz açık modeller) entegrasyonu + gerçek sağlayıcı-bağımsız router istedi: soru zorluğuna göre otomatik sağlayıcı + fallback. Maliyet tercihi: **çoğunlukla Akash, OpenAI nadir, yönetmelik/akıl-yürütme Claude.**
**Karar:** `packages/ai`'ya **AkashML** sağlayıcısı (`https://api.akashml.com/v1`, `openai` SDK + baseURL — yeni bağımlılık yok; `max_tokens` + temperature). 3 sağlayıcı: **Akash** (vars. `zai-org/GLM-5.2`), **OpenAI** (vars. `gpt-5.4`, `max_completion_tokens`, temperature gönderilmez), **Anthropic** (`claude-opus-4-8`, adaptive thinking). `router.ts` `classifyTier` (Türkçe anahtar kelime + uzunluk; tr-locale küçük harf) → **simple→Akash · medium→OpenAI (dar bant) · complex/yönetmelik→Claude**, varsayılan simple (Akash-ağırlıklı). `FALLBACK_CHAINS` + `resolveChain`: birincil çökerse/anahtarı yoksa sıradakine geçer; OpenAI 3 zincirin 2'sinde sonda. `buildProviders(env)` yalnız anahtarı olan sağlayıcıları kurar (eksik = zincirden eleme, hata değil) → şu an (OpenAI+Akash) yönetmelik Akash'a düşer, Claude anahtarı gelince otomatik Claude. OpenAI+Akash tek `openAICompatibleProvider` fabrikasından. Model ID'leri `.env`'den (AKASHML_MODEL/OPENAI_MODEL/ANTHROPIC_MODEL). Anahtarlar yalnız `.env.local` (kullanıcı girer; koda/commit'e girmez).
**Sonuç:** Maliyet-optimum, dayanıklı (fallback) çok-sağlayıcılı copilot. ADR-0041 inceleme bulguları katıldı: Anthropic yanıt-kırpılma (max_tokens 6000 + refusal/stop_reason), OpenAI `max_completion_tokens`, istemciye genel hata (SDK ayrıntısı sızmaz), route mesaj/uzunluk sınırı (auth'suz uç koruması). Takas: tier sınıflandırma heuristik (yanlışta fallback + `.env` ile ayarlanır); streaming hâlâ yok (sonraki). Test: ai 14 (prompt + router).

## ADR-0041 — Paralı AI başladı: doğal-dil copilot (Fikir 1) + sağlayıcı-bağımsız `packages/ai`
**Tarih:** 2026-06-23 · **Durum:** Kabul (ADR-0006'yı uygular; ADR-0019 AI kapısı açıldı)
**Bağlam:** Moses "Fikir 1'i başlat" dedi (serbest soru → AI proje/yönetmelik bağlamıyla cevaplar) ve OpenAI anahtarı var, Claude alacak. Bu, ROADMAP "Paralı AI Ayağı" sırasının **1.** parçası — en ucuz/kolay, mevcut deterministik copilot'un üstüne ince LLM katmanı.
**Karar:** Yeni **`packages/ai`** — sağlayıcı-bağımsız adapter (ADR-0006): `AiProvider` arabirimi + **Anthropic** (resmî `@anthropic-ai/sdk`, `claude-opus-4-8`, adaptive thinking, effort low) ve **OpenAI** (resmî `openai` SDK, `gpt-4o-mini` vars.) uygulamaları; `providerFromEnv` ile `.env` seçimi (Anthropic önce — CLAUDE.md tercihi). Prompt kurma (`buildSystemPrompt`/`formatContext`) **saf+test edilebilir** (7 test); persona Türkçe yönetmelik-farkında, atıflı, **uydurmasız** (emin değilse hedge), salt-öneri (Seviye 1). **`apps/web/app/api/copilot/route.ts`** sunucu route'u (Node runtime, dynamic): API anahtarı yalnız `process.env`/.env.local'da, **tarayıcıya asla gitmez**. İstemci `CopilotChat` bileşeni proje bağlamını (mahaller + metrik + deterministik bulgular + seçim) toplayıp POST'lar; server-only `packages/ai` istemciye bundle EDİLMEZ (yerel tipler). Yeni bağımlılıklar: `@anthropic-ai/sdk`, `openai` (§12 gereği bu ADR).
**Sonuç:** İlk backend kodu (Next route handler) + ilk paralı AI. Hemen OpenAI anahtarıyla çalışır; varsayılanı Claude'a çevirmek = `.env` değişikliği (Claude anahtarı alınınca). Takas: v1 **streaming yok** (yanıt tek seferde; UX iyileştirmesi sonraki adım). Maliyet: çağrı başına LLM (kullanıcının anahtarı). Anahtar yoksa route 503 döner, uygulama yine çalışır.

## ADR-0040 — Katman z-sırası: sürükle-sırala + akıllı hibrit bant (hiyerarşi Faz 3'e ertelendi)
**Tarih:** 2026-06-23 · **Durum:** Kabul
**Bağlam:** Katmanlar (CLAUDE.md §7, proje adı = katman+artı) şimdiye dek yalnız görünürlük/kilit/solo kontrol ediyordu; z-sırası entity **tipine** göre sabitti. Kullanıcı katman sırasını (neyin neyin üstüne çizileceği) ayarlayamıyordu. Tam Figma-tarzı "sıra = z" ise CAD planında sorun: "Mahaller" yukarı alınınca oda dolguları duvarları örter, etiketler duvar altında kalır (Moses ile netleştirildi).
**Karar:** **Akıllı hibrit z** (3 bant, EntityLayer): **ALT (sabit)** = pafta çerçeveleri + oda dolguları/malzeme/çevre; **ORTA (katman-sıralı)** = çizgisel entity'ler (duvar/boşluk/blok/parsel/ölçü/kesit), her `layerId` kendi alt-container'ında, `LayerState.sortLayers` ön→arka sırasına göre dizilir; **ÜST (sabit)** = tüm metin/etiketler. LayerState'e açık `order` + `setOrder`/`sortLayers` + `DEFAULT_LAYER_ORDER` eklendi (view-state, undo dışı — §6.1). LayerPanel'de **grip ile sürükle-sırala** (yalnız tutamaç draggable → rename input/butonlar bozulmaz) + localStorage kalıcılık (doğrulamalı). **İç içe hiyerarşi (katman grupları) bilinçli olarak Faz 3'e ertelendi:** döngü invariant'ları yalnız collab/backend'de garanti edilir (§6.4); şimdi yapılırsa Yjs gelince yeniden yazım gerekir.
**Sonuç:** Reorder anlamlı (mobilya↔duvar↔parsel↔kesit z'si değişir) ama "dolgu örttü / etiket kayboldu" imkânsız. Takas: aynı katmanda duvar gövdesi ile ölçü/kesit çizgisi artık ekleme sırasına göre dizilir (eski sabit tip-z garantisi gider — kabul, çakışma nadir). Yeni/bilinmeyen layerId reorder sonrası en arkaya düşer (kabul; DXF custom katmanları toplu gelir).

## ADR-0039 — Kesit çizgisi kalıcı `section` entity'si (transient işaret → first-class)
**Tarih:** 2026-06-23 · **Durum:** Kabul (ADR-0037'nin "ileride entity/persist edilebilir" notunu uygular)
**Bağlam:** ADR-0037'de kesit çizgisi transient'ti: yalnız React state + engine `setSectionMarker` görseliydi. Kaydet/aç'ta kaybolurdu, undo'lanmazdı, seçilemezdi. CLAUDE.md §6.3/§7 (her şey entity, model yalnız Command ile değişir) ve §6.1 (tek doğruluk kaynağı) ile çelişiyordu.
**Karar:** Yeni **`SectionLine` entity** (`type: 'section'`, alanlar `a`/`b`/`label`). SectionTool artık 2-tıkla `AddEntity` dispatch eder (undo'lanır, JSON zarfına girer, lazy-migration uyumlu). EntityLayer çizer (kendi `sectionLayer`'ı + ekran-sabit etiketler), engine'in özel `setSectionMarker`/`onSectionLine` yolu **kaldırıldı**. Section seçilebilir/taşınabilir/silinebilir (hit-test/bounds/highlight/clone/snap eklendi); PropertiesPanel'den etiket düzenlenir; SectionPanel store'dan (seçili/son kesit) okur, "Sil" = `RemoveEntity`. Etiket = ilk boş harf (silince çakışmaz). Kendi "Kesit" katmanı (turuncu).
**Sonuç:** Kesit artık tam first-class: kalıcı + undo + çoklu kesit + paftaya yerleştirilebilir temel. Takas: çizgi ham noktalar tutar (duvar id'sine bağlı değil) → kesilen duvar silinince kesit canlı yeniden hesaplanır (dangling yok). Etiket/ok bayrakları ekran-sabit (çizgiyle tutarlı).

## ADR-0038 — UX verimlilik: sağ-tık menü + komut paleti + durum çubuğu seçim özeti
**Tarih:** 2026-06-22 · **Durum:** Kabul
**Bağlam:** Profesyonel CAD/tasarım araçları (AutoCAD/Figma) sağ-tık menü + komut satırı/palet + durum çubuğu seçim bilgisi sunar (10-agent UI araştırması).
**Karar:** (1) **Sağ-tık menü** (`ContextMenu`): Kopyala/Çoğalt/Sil (seçim varsa) + Yapıştır/Tümünü seç/Geri-İleri al/Sığdır — mevcut kısayol mantığına **sentetik klavye olaylarıyla** bağlanır (yeni tool API'si yok). (2) **Komut paleti** (`CommandPalette`, **Ctrl+K**): araç/eylem arama, Enter çalıştır. (3) **Durum çubuğu seçim özeti**: "Duvar×3 + Ölçü×1 · 12,40 m".
**Sonuç:** Klavye+fare karışık kullanıcı için hızlı erişim. Takas: sentetik olaylar mevcut handler'lara dayanır (mantık tek yerde kalır).

## ADR-0037 — Şematik kesit: hafif (duvar yüksekliği + kesit çizgisi), 3B değil
**Tarih:** 2026-06-22 · **Durum:** Kabul (ADR-0016'yı uygular)
**Bağlam:** Faz 3 hedefi şematik kesit (ADR-0016): tam 3B Faz 5. Maliyetsiz, deterministik bir ilk sürüm gerekiyordu.
**Karar:** `Wall.height?` (cm, varsayılan 280) alanı eklendi. Saf `computeSection(a,b,walls)` (document): kesit çizgisini kesen duvarlar offset/kalınlık/yükseklikle "kesim" olur. **SectionTool** (C) planda 2-tıkla çizgi çizer (`ctx.onSectionLine`; modeli değiştirmez → Command değil). **SectionPanel** kesimi SVG'de canlı gösterir. Kesit genişliği = duvar kalınlığı (dik kesişim varsayımı — şematik). Metraj sıvası da artık duvar başına yüksekliği kullanır.
**Sonuç:** Plandan canlı şematik kesit önizleme. Takas: eğik duvarda kalınlık projeksiyonu yaklaşık; gerçek profil + 3B kesit Faz 5. Kesit çizgisi şimdilik transient (kalıcı değil) — ileride entity/persist edilebilir.

## ADR-0036 — Ortho/polar mod: Shift ile yön 45°'ye kilitlenir (snapToAngle)
**Tarih:** 2026-06-22 · **Durum:** Kabul
**Bağlam:** CAD'de yatay/dikey/çapraz çizim için açı kilidi (ortho) standarttır.
**Karar:** Saf `snapToAngle(origin, point, stepRad)` (geometry) — uzaklık korunur, yön en yakın `stepRad` katına yuvarlanır. WallTool ve DimensionTool, ikinci noktayı seçerken `Shift` basılıysa `π/4` (45°) ile çağırır; aksi halde normal snap. `ScenePointer.shiftKey` taşır.
**Sonuç:** Hızlı dik/çapraz çizim. Takas: yalnız duvar+ölçüde; diğer araçlarda yok (gerekirse eklenir).

## ADR-0035 — Vektör export katman görünürlüğüne saygılıdır (DXF/SVG); PNG/PDF zaten render'dan gelir
**Tarih:** 2026-06-22 · **Durum:** Kabul
**Bağlam:** Gizli katman ekranda görünmüyorsa export'ta da görünmemeli.
**Karar:** Toolbar DXF/SVG export öncesi `visibleEntities()` ile `LayerState.isHidden` katmanlarını eler. PNG/PDF canlı tuval görüntüsünden üretildiği için görünürlük zaten motor tarafından uygulanmıştır.
**Sonuç:** Ekran = çıktı tutarlılığı. Takas: yok.

## ADR-0034 — Yeni/Kaydet/Aç dosya akışı: tüm değişim tek BatchCommand (tek undo)
**Tarih:** 2026-06-22 · **Durum:** Kabul
**Bağlam:** Dosya işlemleri undo geçmişiyle tutarlı olmalı.
**Karar:** **Yeni** = türetilmemiş entity'leri `RemoveEntity` ile tek `BatchCommand`. **Aç** = `[...eskileri sil, ...yenileri ekle]` tek `BatchCommand` (Ctrl+Z geri alır). **Kaydet** = `serializeModel(store.all())`. Mahaller (space) her iki işlemde atlanır → RoomManager yeniden türetir.
**Sonuç:** Tutarlı undo/redo. Takas: çok büyük dosya yüklemesi tek komutta gecikebilir (ileride parça/asenkron).

## ADR-0033 — Mahal etiketi alan-ağırlıklı centroid'e yerleşir
**Tarih:** 2026-06-22 · **Durum:** Kabul
**Bağlam:** Ad+m² etiketi mahalin görsel merkezine yakın olmalı; köşe ortalaması L/konkav odalarda kayıyordu.
**Karar:** `polygonCentroid` (shoelace alan-ağırlıklı, saf geometry) engine + SVG etiketinde kullanılır; dejenere/alan~0'da köşe ortalamasına düşer.
**Sonuç:** Daha iyi yerleşim. Takas: konkav (U) poligonda hâlâ dışarı düşebilir → tam "görsel merkez" (pole of inaccessibility) ileride.

## ADR-0032 — RoomType adından TAHMİN EDİLMEZ; kullanıcı atar (atanmazsa 'other')
**Tarih:** 2026-06-22 · **Durum:** Kabul (Faz 2A'da alınmış karar, ADR borcu kapatıldı)
**Bağlam:** Mahal adı serbest TR olabilir ("Salon"); otomatik sınıflandırma hatalı metrik üretir.
**Karar:** `Space.roomType` yalnız kullanıcı ataması (panel dropdown); atanmazsa metrikte 'other'. `ROOM_TYPES`/`roomTypeColor` tek kaynak. LLM/AI katmanı buna güvenir.
**Sonuç:** Kesin, yanılsız metrik. Takas: adlandırma disiplini gerekir (otomatik öneri ileride eklenebilir).

## ADR-0031 — Katman görünürlük/kilit state'i doküman dışıdır (LayerState; undo dışı)
**Tarih:** 2026-06-22 · **Durum:** Kabul (geriye dönük kayıt)
**Bağlam:** Görünürlük/kilit bir görünüm tercihi; modelin parçası değil (CLAUDE.md §6.1 model/view ayrımı).
**Karar:** `LayerState` (engine) saf view-state: hidden/locked Set'leri + listener; Command/History'den geçmez, model dosyasına yazılmaz. Yüklemede katmanlar açık/kilitsiz başlar.
**Sonuç:** Temiz doküman modeli. Takas: proje-özel katman ayarları kalıcı değil (ileride oturum/proje state'inde saklanabilir).

## ADR-0030 — Snap öncelik sırası: tam nokta > kesişim > kenar > eksen hizalama > ızgara
**Tarih:** 2026-06-22 · **Durum:** Kabul (ADR-0024'ü detaylandırır)
**Bağlam:** Birden çok snap adayı aynı anda olabilir; tutarlı, öngörülebilir bir sıra gerekir.
**Karar:** `createSnapper` (tools/context.ts) tek rbush aramasıyla: (1) tam nokta = köşe/orta (12px), (2) kesişim = segment çaprazları, (3) kenar-üstü = dik iz düşüm, (4) eksen hizalama (8px şerit), (5) ızgara (50cm). Gösterge glyph'i türü yansıtır (eşkenar dörtgen/X/kare/üçgen + pembe kılavuz).
**Sonuç:** "CAD hissi" veren öngörülebilir snapping. Takas: T-kesişiminde kenar↔köşe karışması (ileride iyileştirme).

## ADR-0029 — Yüklemede türetilmiş entity'ler (space) yüklenmez, yeniden hesaplanır
**Tarih:** 2026-06-22 · **Durum:** Kabul
**Bağlam:** Mahaller duvarlardan türetilir (ADR-0012); kaydedilen mahal yüklemede duvarlarla çelişebilir/eskiyebilir.
**Karar:** "Aç" akışı `type === 'space'` entity'leri **atlar**; yalnız duvar/ölçü/parsel/blok/metin yüklenir, sonra RoomManager mahalleri yeniden bulur. (Kaydetmede tüm entity yazılır — dosya bütünlüğü.)
**Sonuç:** Mahal hiçbir zaman stale kalmaz. Takas: kayıtlı mahal adı/tipi yüklemede sıfırlanır (RoomManager varsayılan üretir) — ileride ad/tip seed'lemesi eklenebilir.

## ADR-0028 — Versiyonlu JSON model zarfı (MODEL_FORMAT_VERSION)
**Tarih:** 2026-06-22 · **Durum:** Kabul
**Bağlam:** İlk kalıcılık (Kaydet/Aç); format ileride değişebilir (yeni entity/alan).
**Karar:** `packages/document/serialize.ts` — model `{ format: 'zynpparti-model', version: N, entities: [...] }` zarfında saklanır (saf entity listesi değil). `deserializeModel`: bozuk JSON/yanlış format → hata; tek tek bilinmeyen/eksik entity → atlanır (toleranslı). Lazy migration sürüm artınca eklenir.
**Sonuç:** İleri uyumlu dosya formatı. Takas: minimal zarf overhead (önemsiz). İlişkili: [ADR-0029].

## ADR-0027 — Copilot: oda asgari genişlik + parsel içinde kalma denetimleri
**Tarih:** 2026-06-22 · **Durum:** Kabul
**Bağlam:** Yönetmelik tabanı büyüyor (ADR-0015, kalite tavanı yok ADR-0019). Mevcut veriyle (mahal/duvar/parsel) çalışan, atıflı yeni kurallar eklenebilir.
**Karar:** İki yeni deterministik denetim (`packages/copilot`): (1) **roomMinWidth** — yaşanabilir oda (yatma/yaşam) en küçük net genişliği İmar ~210 cm ile kıyaslanır (`polygonMinWidth`); değer plana göre değiştiğinden **info**. (2) **parcelContainment** — duvar uçları parsel poligonu dışındaysa (`pointInPolygon`) "yapı parsel dışına taşıyor" **warning**'i; gürültüyü önlemek için etkilenen duvar sayısı özetlenir. `setbackSide` (çekme) ile tamamlayıcı: çekme mesafeyi, içerme taşmayı yakalar.
**Sonuç:** Daha kapsamlı, hâlâ Seviye-1 salt-okunur copilot. +5 test (26→31). İlişkili: [ADR-0018], [ADR-0021].

## ADR-0026 — Vektör SVG export (`packages/io`)
**Tarih:** 2026-06-22 · **Durum:** Kabul
**Bağlam:** Baskı/Illustrator/web için vektör çıktı gerekiyordu; PNG raster, PDF de tuval görüntüsünü gömüyor (ADR-0022, raster). DXF CAD-içi; tasarım/sunum için SVG daha uygun.
**Karar:** `exportSvg(entities)` — saf TS (yalnız `document`; engine/DOM yok). Mahal dolgusu (tip rengi + ad), kesik parsel sınırı, kalınlık-stroke duvar, boşluk (beyaz kesim + kanat/cam), blok ayak izi, ölçü (değerli), XML-escape çok satırlı metin. `viewBox` tüm entity'leri otomatik çevreler (cm, y-aşağı = tuval ile aynı). Toolbar "SVG İndir".
**Sonuç:** Gerçek vektör çıktı (sonsuz ölçeklenir, düzenlenebilir). Takas: SVG metni sistem `sans-serif`; gömülü font değil. Bağımlılık eklenmedi.

## ADR-0025 — DXF export tüm entity tiplerini kapsar
**Tarih:** 2026-06-22 · **Durum:** Kabul
**Bağlam:** `exportDxf` yalnız duvarları (LINE) yazıyordu; gerçek interop için parsel/blok/ölçü/metin/boşluk da gerekli.
**Karar:** İmza `Entity[]`'ye genişletildi (`Wall[]` hâlâ geçerli — kovaryant readonly dizi). Parsel/blok → kapalı **LWPOLYLINE**, metin → (çok satırlı) **TEXT**, ölçü → ölçü+uzatma **LINE**'ları + değer TEXT, boşluk → duvarına çözülen işaret LINE'ı. Türetilmiş/baskı entity'leri (space/sheet) model uzayına yazılmaz. Koordinatlar cm, kendi içe-aktarıcımızla yuvarlanır.
**Sonuç:** Tam çizim DXF'e gider. Takas: minimal R12 tarzı (gerçek DIMENSION/HATCH entity'leri değil); AutoCAD'de geometri doğru, akıllı ölçü nesnesi değil.

## ADR-0024 — Snapping zenginleştirme: orta nokta + kenar-üstü (dik) yakalama
**Tarih:** 2026-06-22 · **Durum:** Kabul
**Bağlam:** CAD'in ruhu snapping (CLAUDE.md §8.1: uç/orta/dik/kesişim/hizalama). Snapper yalnız uç-nokta + eksen-hizalama + ızgara yapıyordu.
**Karar:** Anahtar noktalara duvar/ölçü/parsel **orta noktaları** eklendi; ayrıca **kenar-üstü** yakalama (segmente dik iz düşüm, `closestPointOnSegment`) tek rbush aramasıyla. Öncelik: tam nokta (köşe/orta) > kenar > eksen hizalama > ızgara. `SnapHint.pointKind` ile gösterge glyph'i ayrışır: eşkenar dörtgen=köşe, üçgen=orta, kare=kenar.
**Sonuç:** Çok daha "CAD hissi" veren snapping; tıklamadan önce ne tür yakalama olduğu görünür. +2 test. (Kesişim snap'i ileride.)

## ADR-0023 — Block / Annotation / Sheet entity kararları (geriye dönük kayıt)
**Tarih:** 2026-06-22 · **Durum:** Kabul (uygulama 2026-06-20/21'de yapıldı; ADR borcu kapatıldı)
**Bağlam:** Faz 1 sonrası maliyetsiz tur (ADR-0019) blok/metin/pafta entity'lerini ekledi ama ADR yazılmamıştı (STATE.md ertelenenler).
**Karar:** (1) **Block** — kütüphane mobilya/sembolü; `kind` + `position` + `rotation`. Boyut `BLOCK_DEFS` (document/block.ts) içinde sabit; mobilya gerçek ölçülü olduğundan köşe-resize yok (yalnız taşı/90° döndür). Kendi `furniture` katmanında → toplu gizle/kilitle. (2) **Annotation** — serbest metin; `position`+`text`+`height` (dünya cm); çok satırlı `\n`. Engine TR BitmapText atlasını yeniden kullanır. (3) **Sheet** — pafta/sayfa çerçevesi (paper canvas çekirdeği); kağıt boyutu (A4–A0) × yönelim × ölçek → model boyutu; antet alanları. En arka katman; yalnız çerçeveden seçilir.
**Sonuç:** Domain modeli CLAUDE.md §7 ile hizalı. Tümü `Entity` union'ında, Command'den geçer, hit-test/bounds/render destekli.

## ADR-0022 — PDF export: jsPDF (istemci) + bağımlılık + UX scroll/toolbar düzeltmeleri
**Tarih:** 2026-06-21 · **Durum:** Kabul (Moses onayı: "jspdf ekleyebilirsin")
**Bağlam:** Faz 1 kabul kriterinde PDF export vardı (CLAUDE.md §8.4); PNG/DXF/Excel zaten vardı. PDF için kütüphane gerekir (CLAUDE.md §12: bağımlılık = ciddi karar, önce sor → Moses onayladı).
**Karar:** `jspdf` (apps/web bağımlılığı). `exportPng` data-URL'i bir PDF sayfasına orantı korunarak gömülür; sayfa boyutu/yönelimi varsa **ilk paftadan** (A4–A0), yoksa A4 yatay. Toolbar "PDF İndir". pnpm 11 build-script bloğu: `jspdf`'in transitif `core-js` postinstall'ı yalnız funding mesajı → `pnpm-workspace.yaml allowBuilds: core-js: false` (build çalıştırılmaz, install hatası önlenir).
**Sonuç:** Tek tık PDF. Takas: PDF mevcut tuval görüntüsünü gömer (vektör değil, raster) — gerçek vektör/pafta-viewport gömme ileride. Ek olarak bu turda panel UX düzeltildi: sağ/sol kolon kaydırma kabı `pointer-events-none` dış öğedeydi → tekerlek/çubuk çalışmıyordu; kaydırma etkileşimli iç sarmalayıcıya taşındı (`max-h-full overflow-y-auto`). Mahal satırı iki satıra bölündü (malzeme dropdown'ı eklenince yatay taşıyordu). Toolbar tek satır + genişlik sınırı + kbd ipuçları tooltip'e (panellerin altına girmiyor).

## ADR-0021 — Yönetmelik turu 3: TAKS (hesaplanan) + banyo asgari alanı (hedge'li)
**Tarih:** 2026-06-21 · **Durum:** Kabul (otonom tur, makul varsayım)
**Bağlam:** Copilot kural tabanını mevcut veriyle (parsel + mahal) denetlenebilir, **doğru** kalan kurallarla genişletmek istendi. CLAUDE.md: Türkçe yönetmelik doğruluğu premium farklılaştırıcı — uydurma sayı yasak.
**Karar:**
1. **TAKS (taban alanı katsayısı)** = bina taban alanı / parsel alanı. Taban alanı, tek kat varsayımıyla **mahal alanları toplamı** (kaba; duvar kalınlığı hariç) olarak yaklaşılır. Parsel varsa **info** bulgusu üretilir; tek hukuki ifade "plan notuna göre tipik üst sınır ~%40" (gerçekten yaygın varsayılan, plana bağlı olduğu açıkça yazılır). Hesaplanan oran olduğu için sabit yanlış sayı riski yok.
2. **Banyo asgari net alanı** = İmar'da yaygın anılan **~3,0 m²**; tam değer Planlı Alanlar İmar Yön. sürümüne/plana göre değişebildiğinden **severity 'info'** (advisory) + "değişebilir" ibaresiyle eklendi (hard 'warning' değil). Yatak/oturma/mutfak asgarileri zaten 'warning' (daha kesin maddeler).
**Sonuç:** İki yeni atıflı bulgu, ek entity gerekmeden. Takas: TAKS taban alanı kaba (gerçek dış outline + duvar kalınlığı ileride); banyo değeri tam madde doğrulaması gerektirir (bu yüzden info). Çok katlı emsal/KAKS denetimi kat sayısı veri modeli gelince eklenecek (şimdilik yok).

## ADR-0020 — Opening (kapı/pencere) entity'si: duvara parametrik binding
**Tarih:** 2026-06-20 · **Durum:** Kabul
**Bağlam:** Yönetmelik denetimini derinleştirmek için kapı genişliği (TS 9111) kuralını aktifleştirmek gerekti; bu da kapı/pencere veri modeli ister (Faz 1 roadmap'inde vardı). Kapı bir duvarın üstünde yaşar; duvar değişince uyumlu kalmalı (CLAUDE.md §7 binding).
**Karar:** `Opening` entity = `{ wallId, t∈[0,1], width, kind: 'door'|'window' }`. Konum **duvardan türetilir** (orta-çizgi üzerinde `t`); gerçek koordinat saklanmaz → duvar taşınınca/uzayınca kapı otomatik takip eder (binding). Render: duvarı boşluk kadar "keser" (zemin rengi) + mimari sembol (kapı kanadı + açılış yayı; pencere cam çizgisi), ekran-sabit ince çizgi (VISUAL-CRAFT). Bağ tutarlılığı: duvar silinince bağlı boşluklar **tek BatchCommand** ile birlikte silinir (öksüz kalmaz, tek undo). Bounds/hit-test duvar çözülerek hesaplanır (EntityLayer).
**Sonuç:** TS 9111 kapı genişliği denetimi aktif (copilot). DoorTool ile duvara tıklayıp kapı eklenir (90 cm varsayılan, uyumlu). Takas: pencere ayrı araç yok (şimdilik veri modeli + render hazır); T-kesişimde boşluk-köşe temizliği yok (ADR-0007 ile uyumlu, ileride).

## ADR-0019 — Yön ilkesi: kalite tavanı yok + maliyetli AI'ı sona ertele
**Tarih:** 2026-06-20 · **Durum:** Kabul (Moses direktifi) · **Yansıma:** CLAUDE.md §0 kural 11-12
**Bağlam:** Proje uzun; AI render + LLM copilot para gerektirir. İki şey net olmalı ki Claude her oturum hatırlasın.
**Karar — iki ayaklı:**
1. **Kalite tavanı (en iyi hedefi):** Her parça mümkün olan **en iyi, en gelişmiş** haliyle yapılır — kod, mimari, görsel zanaat (`docs/VISUAL-CRAFT.md`), Türkçe yönetmelik, metraj. Hiçbir yerde "yeter bu kadar" yok. Hedef: Rayon'u **hem özellik hem his** olarak geçmek.
2. **Maliyet zamanlaması:** Para gerektiren AI parçaları (**AI render + LLM copilot**) **en sona**, ürün neredeyse bitince yapılır. Sebep kalite değil — en iyi sağlayıcıyı **bedava kredilerle gerçek projeyle test edip** seçmek. Bedava/deterministik her şey (geometri, yönetmelik kuralları, metraj, görsel zanaat) **şimdi ve en iyi** halinde.
**Sonuç:** Kalitede tavan yok; sadece maliyetli AI doğru ana ertelenir. Pratik etki: deterministik yönetmelik/metraj/görsel-zanaat fazları LLM/render'dan önce gelir; copilot LLM katmanı (ADR-0006) ve AI render (ADR-0013/0017) sona kalır. Faz sırası bu ilkeye göre okunur (ROADMAP).

## ADR-0018 — Copilot önce deterministik kural motoru (LLM'siz), `packages/copilot` (2B)
**Tarih:** 2026-06-20 · **Durum:** Kabul
**Bağlam:** Copilot iki ayaklı (ADR-0014): (1) kaynak-gösteren öneri, (2) canlı metrik (2A'da yapıldı). Öneri ayağı "geometri kuralı + LLM" olarak tanımlı. Ama LLM katmanı API key + sağlayıcı/maliyet kararı ister (ADR-0006/0017, Moses onayı). Asıl farklılaştırıcı değer ise **atıflı, doğru madde** (FAZ2-NOTES §2a) — bu deterministik kuralla, LLM olmadan üretilebilir.
**Karar:** Copilot öneri ayağı **önce saf TS deterministik kural motoru** olarak kurulur: yeni `packages/copilot` (geometri + document'e bağlı, UI yok, test edilebilir). `runCopilotChecks(spaces, walls) → Finding[]`; her bulgu **atıflı** (ör. TS 9111 koridor ≥120 cm; İmar yatak odası ≥9 m², oturma ≥12 m²). **Seviye 1 (salt-okunur)** — modeli değiştirmez (AI-AGENT-VISION §2). LLM doğal-dil katmanı bunun üstüne, sağlayıcı/maliyet kararından sonra (ADR-0006) biner.
**Sonuç:** API key/maliyet olmadan hemen görünür, doğrulanabilir değer; testle garanti (geometri `polygonMinWidth` koridor genişliği + alan kontrolleri). Web'de `CopilotPanel` canlı çalışır. Takas: doğal-dil soru-cevap ve serbest öneri yok (sıradaki adım); koridor genişliği konveks-kabuk yaklaşımı (L/T planda kapsayıcı genişlik, ileride medial-axis ile sıkışır).

## ADR-0017 — AI render altyapısı: basit/doğrudan API başlangıç, kuyruk yük artınca eklenir
**Tarih:** 2026-06-20 · **Durum:** Kabul (Moses kararı, Faz 2 planı)
**Bağlam:** ADR-0013 "uygulama içi canlı render paneli" diyor; CLAUDE.md §8.7 asenkron BullMQ kuyruğu öngörüyor. Ama Faz 2'nin render ayağına (2D) henüz gelmedik; sağlayıcı seçimi ertelendi, maliyet için önce ücretsiz krediler kullanılacak. Bu aşamada Redis+BullMQ kurmak gereğinden ağır ve kurulumu yavaşlatır.
**Karar:**
- Render MVP'si **doğrudan API** ile çalışır: `apps/web` route'undan sağlayıcıya senkron çağrı, **kuyruk yok**.
- Ama mantık **`services/ai-render` içinde baştan izole** kurulur (render isteği → sağlayıcı adapteri → sonuç). Web yalnızca bu servisi çağırır; render mantığını web'e gömmek YOK.
- Böylece **yük artınca Redis + BullMQ kuyruğu**, çağrı yerini (sync→queue) değiştirerek eklenir; hiçbir şey söküp atılmaz. İzolasyon sınırı bugünden korunur.
- Sağlayıcı (Replicate/Fal) ve gerçek bütçe **2D'ye gelince** birlikte test edilip seçilir; başlangıçta sağlayıcıların ücretsiz kredileri kullanılır. İlişkili: [ADR-0006] (provider-agnostic adapter), [ADR-0013].
**Sonuç:** Hızlı MVP + temiz büyüme yolu. Takas: ilk sürümde uzun render'larda istek bloklayabilir (kullanıcıya "üretiliyor" durumu gösterilir); kuyruk gelince çözülür.

## ADR-0016 — Kesit gerçeği: hafif şematik kesit (Faz 3) → tam 3B kesit (Faz 5)
**Tarih:** 2026-06-19 · **Durum:** Kabul (beklenti düzeltmesi)
**Bağlam:** "Plandan otomatik kesit" istendi; ama gerçek kesit dikey bilgi (duvar yüksekliği, döşeme, çatı) gerektirir — saf 2B planda yok. Otomatik kesit özünde bir 3B/BIM işidir (BricsCAD BIM/OrthoGen/Revit: 3B modeli düzlemle keser). Bkz. `docs/FAZ2-NOTES.md §4`.
**Karar:** "Faz 2'de tek tıkla foto-kesit" sözü VERİLMEZ. (B) **hafif şematik kesit** — duvarlara yükseklik özelliği + plana kesit çizgisi → ekstrüzyonla düzenlenebilir şematik kesit — **~Faz 3**. (A) **tam 3B kesit** (hacmi düzlemle kes) **Faz 5**. AI render kesite de uygulanır ama bu temelin üstüne biner.
**Sonuç:** Dürüst yol haritası, hayal kırıklığı yok. Takas: erken fazda gerçek kesit yok; şematikle başlanır.

## ADR-0015 — Türkçe yönetmelik bilinci = premium farklılaştırıcı
**Tarih:** 2026-06-19 · **Durum:** Kabul (ürün stratejisi)
**Bağlam:** Piyasadaki kod/uyum copilot'ları (UpCodes vb.) ABD odaklı; diğer ülke kodları çoğunlukla desteklenmiyor. Türkiye için İmar/TBDY/Otopark/TS 9111 farkında bir copilot neredeyse yok (FAZ2-NOTES §3).
**Karar:** Copilot'un **Türkçe yönetmelik bilgisi** uzun vadeli farklılaştırıcı olarak işaretlenir. Faz 2 tohum: çekme mesafesi/kat/koridor/otopark gibi temel kurallar; ileride genişler. Fiyatlandırmada premium özellik (BUSINESS-PRICING.md).
**Sonuç:** Türk mimar için "olmazsa olmaz" değer — Rayon'da da, ABD araçlarında da yok. Takas: yönetmelik verisi bakımı gerektirir (güncel tutma).

## ADR-0014 — Copilot iki ayaklı: kaynak-gösteren öneri + canlı metrik paneli
**Tarih:** 2026-06-19 · **Durum:** Kabul
**Bağlam:** "Öneri" tek başına yetmez. (a) Yapı/yönetmelik can güvenliğidir → öneri **atıflı** olmalı (palavra değil; UpCodes dersi). (b) En iyi araçlar (Architechtures/Finch/Blueprints AI) çizerken **canlı metrik** verir. Bkz. FAZ2-NOTES §2.
**Karar:** Copilot = (1) **kaynak-gösteren öneri motoru** (geometri kuralı + LLM; her öneri hangi kurala/ölçüye dayandığını gösterir, ör. "TS 9111: koridor min 120 cm; seninki 90"), (2) **canlı metrik paneli** (mahal/m² özelliğinin üstüne: toplam/net/brüt m², oda tipi dağılımı, ileride verim/gün ışığı).
**Sonuç:** Güvenilir + sürekli geri bildirim. Mevcut RoomList paneli bu metrik panelinin çekirdeğidir.

## ADR-0013 — AI render: uygulama içi canlı panel (export-yükle değil)
**Tarih:** 2026-06-19 · **Durum:** Kabul (tasarım kararı) — **HENÜZ KURULMADI** (`services/ai-render` yok; maliyetli → ADR-0019 ile sona ertelendi)
**Bağlam:** Eski akış "dışa aktar → ayrı AI aracına yükle → bekle" zayıf. Modern araçlar (Veras, Archicad AI Visualizer) uygulama içi prompt paneliyle canlı modele uygular; plan/kesit değişince görsel güncellenir (FAZ2-NOTES §1).
**Karar:** `services/ai-render` **uygulama içi canlı render paneli** (export-yükle akışı değil). Girdi: plan **ve kesit**. İki mod: "yaratıcı" + "geometriyi koru" (ControlNet, LANDSCAPE §4). Sonraki adım: image→video. ADR-0005'i (aşamalı render) somutlaştırır.
**Sonuç:** Akıcı UX, hızlı iterasyon. Takas: canlı panel + kuyruk + önbellek mimarisi gerektirir (BullMQ; maliyet kotası).

## ADR-0012 — Mahaller türetilmiş veri: Command ile ama History dışı (1E)
**Tarih:** 2026-06-19 · **Durum:** Kabul (otonom varsayım)
**Bağlam:** Mahaller (Space) duvarlardan otomatik türetilir (planar graf yüz-bulma, ENGINEERING-NOTES §1). Her duvar düzenlemesinde yeniden hesaplanır. Bunları undo geçmişine koymak undo'yu kirletir (her duvar hamlesi + bir de mahal hamlesi).
**Karar:** `RoomManager` mahalleri store'a **Command.apply ile doğrudan** uygular (AddEntity/RemoveEntity), **History'ye girmez**. "Model yalnız Command'den değişir" kuralı korunur (değişim yine Command nesneleridir), ama türetilmiş veri geri-alınabilir geçmişe sokulmaz. Yeniden-giriş `recomputing` bayrağıyla, yalnız-duvar tetikleme `knownWalls` izleyiciyle sağlanır. Mahal **adı** kullanıcı eylemidir → o UpdateEntity History'den geçer (geri alınabilir) ve yeniden-hesapta centroid yakınlığıyla korunur.
**Sonuç:** Temiz undo (yalnız kullanıcı eylemleri) + canlı m². Takas: mahal bulma/silme geri alınamaz (zaten duvarın türevi). Türkçe etiketler için metin atlası `TR_CHARSET` ile baştan yüklenir (I18N-TEXT.md); BitmapText kullanıldığından "ş görünmüyor" tuzağı kapalı.

## ADR-0011 — DXF import & kalibrasyon kapsam kararları (1D)
**Tarih:** 2026-06-19 · **Durum:** Kabul (otonom varsayımlar) — **kapsam genişletildi: bkz. ADR-0025/0026** (CIRCLE/ARC/TEXT/MTEXT artık import ediliyor; aşağıdaki "atlanır" maddesi 2026-06-22'de geçersiz kaldı).
**Bağlam:** 1D'de DXF import + ölçekleme hızlı ve kullanışlı olmalı; mükemmel CAD-uyumu Faz 1 hedefi değil.
**Karar:**
- DXF entity eşlemesi: yalnız **LINE / LWPOLYLINE / POLYLINE → Wall** (kapalı polyline son kenarı da). ~~Diğerleri (ARC, CIRCLE, INSERT, TEXT…) şimdilik atlanır.~~ **GÜNCELLENDİ:** CIRCLE/ARC → segmentlenmiş Wall, TEXT/MTEXT → Annotation (2026-06-22). INSERT (blok referansı) hâlâ ☐.
- DXF çizgilerinde kalınlık yok → duvarlara **varsayılan 15 cm** kalınlık atanır.
- Birim: `$INSUNITS` → cm (in/ft/mm/cm/m); bilinmiyorsa 1 (cm) kabul + **2-nokta kalibrasyon** düzeltir.
- Kalibrasyon: gerçek mesafe Faz 1'de **`window.prompt`** ile alınır (basit; ileride uygun UI). Ölçek **tüm dokümana**, ilk seçilen nokta merkez alınarak uygulanır; tek undo (`BatchCommand`).
- Export: minimal R12-tarzı DXF (LINE) + PNG (Pixi extract). PDF/IFC ertelendi.
**Sonuç:** Hızlı, çalışan import/scale/export. Takas: ARC/blok/temizleme (kopuk uç, çift çizgi) yok → gerçek karışık DXF'lerde 1E öncesi temizleme adımı gerekebilir (ENGINEERING-NOTES §4). `docs/FILE-FORMATS.md` ileride detaylandırır.

## ADR-0010 — Araç FSM deseni: xstate makine (durum) + sınıf (efekt)
**Tarih:** 2026-06-19 · **Durum:** Kabul (otonom çalışmada alınan varsayım)
**Bağlam:** CLAUDE.md §5/§8.3 araçların XState FSM olmasını ister. xstate v5 aksiyonlarına servis (store/history/pixi) enjekte etmek boilerplate yükü getiriyor; ama saf makine de side-effect içermemeli.
**Karar:** Her araç için xstate makinesi **durumun tek kaynağıdır** (idle/drawing; idle/pressed/dragging). WallTool: efekt (segment ekleme) makine `commit` aksiyonundan, `input` ile verilen callback üzerinden yapılır. SelectTool: makine yalnız pointer fazını tutar; hit-test/komut gibi efektler sınıfta yapılır, faz makineden okunur. EraseTool gibi tek-durumlu araçlar makinesiz.
**Sonuç:** FSM gereği korunur + makineler saf/test edilebilir (transition testleri). Pixi/efekt sınıfta izole. Takas: SelectTool'da faz makine ile sınıf mantığı biraz dağınık; tek-FSM'e (efektleri aksiyonlara taşıyarak) ileride sıkılaştırılabilir.

## ADR-0009 — Faz 1 inşa sırası: önce saf doküman çekirdeği (1A)
**Tarih:** 2026-06-19 · **Durum:** Kabul
**Bağlam:** İnteraktif duvar düzenleme üç parçaya bağlı: doküman modeli (entity+Command+undo/redo), engine'in çizmesi, araçların input→Command çevirmesi. Hangisiyle başlamalı?
**Karar:** Faz 1, **1A = `packages/document`** (saf TS: store + Command + history) ile başlar; sonra 1B (engine render), 1C (tools+kısayol), 1D (DXF), 1E (mahal/m²).
**Sonuç:** En test edilebilir, UI'siz çekirdek önce sağlamlaşır (TDD); interaktif çizim onun üstüne güvenle oturur. Sıralama `docs/STATE.md` ve `docs/ROADMAP.md`'de izlenir.

## ADR-0008 — İç birim: 1 birim = 1 cm
**Tarih:** 2026-06-19 · **Durum:** Kabul
**Bağlam:** m² hesabı (mahal) ve ölçeklendirme için iç koordinat birimi sabitlenmeli. DXF dosyaları mm/m/inch olabilir.
**Karar:** İç koordinat birimi **1 = 1 santimetre**. 100 birim = 1 m; alan / 10.000 = m². DXF import'taki 2-nokta kalibrasyonu gelen çizimi bu birime ölçekler. Gösterim (m²/ft², ondalık) yereldir ve iç birimden bağımsızdır (bkz. `docs/I18N-TEXT.md`).
**Sonuç:** Alan/ölçü hesapları net ve tek tip. Risk: çok büyük projelerde float hassasiyeti → epsilon kullan (CLAUDE.md §8.1). Birim gösterimi katmanı ayrı tutulur.

## ADR-0007 — Duvar temsili: segment + kalınlık
**Tarih:** 2026-06-19 · **Durum:** Kabul
**Bağlam:** Faz 1 duvar nasıl modellenecek? Tek segment mi, birleşik polyline mı?
**Karar:** Faz 1'de **duvar = tek segment** (`start`/`end` Vec2) **+ kalınlık** + layerId. Duvar zincirleri, uçları snap'le bağlı ayrı segmentler olarak kurulur.
**Sonuç:** Basit, test edilebilir; mahal bulma segment grafiği üzerinde çalışır (kapalı bölge = döngü). Takas: birleşik/parametrik duvar, T-kesişim temizliği, otomatik köşe birleştirme ileriye (Faz 1 sonu / sonrası) bırakıldı.

## ADR-0006 — AI çağrıları için sağlayıcı-bağımsız (provider-agnostic) adapter
**Tarih:** 2026-06-19 · **Durum:** Önerildi (Faz 0'da KURULMAZ — yalnızca tasarım notu)
**Bağlam:** AI özellikleri (render prompt'ları, copilot önerileri, layout üretimi) farklı sağlayıcılara gidebilir. Tek sağlayıcıya kilitlenmek risklidir; maliyet, performans, model yetenekleri ve erişilebilirlik zamanla değişir.
**Karar:** Tüm LLM/AI metin çağrıları `packages/ai` içinde **tek bir adapter arayüzü** arkasına konur. En az iki sağlayıcı desteklenir: **Anthropic** ve **OpenAI**. Seçim iki modda çalışır:
- **(a) Statik mod:** `.env`'deki `AI_PROVIDER` + `AI_MODEL` ile sabit seçim (Faz 2'de ilk bu kurulur).
- **(b) Router modu (ileri faz):** göreve göre otomatik seçim — basit görev → ucuz/küçük model, karmaşık görev → güçlü model; bir sağlayıcı/model çökerse diğerine **fallback** (retry + circuit-breaker + sağlık takibi).

Arayüz taslağı (sözleşme): `generate(messages, { task, schema?, stream? }) → normalize edilmiş cevap`. Sağlayıcılar arası farklar (tool-use formatı, streaming, token sayımı, hata kodları) **adapter içinde** soyutlanır; çağıran kod sağlayıcıyı bilmez. Router, `task` etiketine ve canlı sağlık/maliyet sinyallerine göre adapter seçer.
**Sonuç:** Sağlayıcı bağımsızlığı + maliyet optimizasyonu + dayanıklılık (biri düşerse hizmet durmaz). **Faz 0'da yalnızca bu karar yazıldı; implementasyon Faz 2** (copilot/render) ile gelir. Varsayılan güçlü model: `claude-opus-4-8` (bkz. CLAUDE.md §5). İlişkili: [ADR-0005].

## ADR-0005 — AI render aşamalı: önce görsel, sonra gerçek 3D
**Tarih:** 2026-06-19 · **Durum:** Kabul
**Bağlam:** Plandan görselleştirme iki yolla yapılabilir: (a) generative AI ile 2D plandan fotogerçekçi görsel, (b) plandan gerçek 3D geometri kurup klasik render. (a) saniyeler sürer, ucuz, etkileyici; (b) tam kontrol verir ama aylarca sürer.
**Karar:** Faz 2'de AI görsel render (ControlNet + diffusion), Faz 5'te gerçek 3D + animasyon.
**Sonuç:** Kullanıcı erkenden değer görür; 3D yükü ileri faza ertelenir. `services/ai-render` ve `services/ai-layout` ayrı tutulur.

## ADR-0004 — İşbirliği: Yjs (CRDT) ile başla, commit-log'a geçiş açık
**Tarih:** 2026-06-19 · **Durum:** Kabul
**Bağlam:** Gerçek zamanlı çok kullanıcılı düzenleme şart. Seçenekler: olgun CRDT (Yjs) vs Rayon-tarzı merkezi commit-log + invariant doğrulama.
**Karar:** Faz 3'te Yjs + Hocuspocus (presence + offline + otomatik merge bedava). Ölçek/sürüm-kontrolü kritikleşince **north-star alternatifleri** açık tutulur: (a) **Loro** — Rust/WASM, movable **Tree CRDT** (katman hiyerarşisi/döngü sorununa zarif), (b) Rayon-tarzı **commit-log + merkezi otorite** (invariant garantisi + sürüm kontrolü temeli).
**Sonuç:** Hızlı başlangıç. Risk: katman döngüsü gibi invariant'lar Yjs'te garanti edilemez → katman hiyerarşisi baştan döngüsüz invariant'la kurulur; ölçekte Loro Tree CRDT veya commit-log'a geçilir (bkz. CLAUDE.md §6.4, `docs/LANDSCAPE.md §5`).

## ADR-0003 — Render motoru: PixiJS (WebGL), engine izole
**Tarih:** 2026-06-19 · **Durum:** Kabul
**Bağlam:** Hedef 500k entity'de 60 FPS. Canvas2D bu ölçekte çöker.
**Karar:** WebGL üzerinden PixiJS. `packages/engine` tüm render'ı kapsar ve izole tutulur; ileride kritik parçalar Rust→WASM renderer'a taşınabilir.
**Sonuç:** Yüksek performans + değiştirilebilirlik. Takas: WebGL özel shader (dash/hatch) işçiliği gerekir.

## ADR-0002 — Çekirdek paketler saf TypeScript (geometry, document)
**Tarih:** 2026-06-19 · **Durum:** Kabul
**Bağlam:** Geometri ve doküman modeli hem tarayıcıda hem sunucuda (AI üretici, invariant kontrolü) çalışmalı.
**Karar:** `packages/geometry` ve `packages/document` React/DOM/PixiJS/`window` içermez; %100'e yakın test.
**Sonuç:** Test edilebilir, paylaşılabilir, WASM'e taşınabilir çekirdek. (CLAUDE.md §0.8, §13.)

## ADR-0001 — TypeScript-first stack (Rust+WASM değil, henüz)
**Tarih:** 2026-06-19 · **Durum:** Kabul
**Bağlam:** Rayon Rust+WASM kullanıyor (maksimum performans) ama öğrenme eğrisi dik ve geliştirme yavaş. Kodun çoğunu Claude yazacak, Moses mimar (profesyonel yazılımcı değil).
**Karar:** TypeScript-first: Next.js + React + PixiJS + Yjs. Performans-kritik parçalar Faz 6'da Rust→WASM'e taşınabilecek şekilde izole.
**Sonuç:** En hızlı, en sürdürülebilir başlangıç + en geniş ekosistem/doküman. WASM kapısı mimaride açık bırakıldı.
