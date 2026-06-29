# YARIN — Günlük çalışma planı

> Geçici çalışma dosyası (her gün güncellenir; tamamlananlar `docs/STATE.md`'ye geçince buradan silinir).
> Kalıcı ilerleme kaydı = `docs/STATE.md`. Bu dosya = "yarın nereden başlayalım".
> **Ritüel (her gün uyumadan):** ① bugünü STATE.md'ye yaz ② yarını buraya yaz ③ commit + push.

---

## ⚡ 2026-06-29 (5) — RENDER "GEOMETRİYİ KORU" AKTİVASYONU (kod canlıda DORMANT, anahtar bekliyor)
ControlNet render kodu canlıda ama anahtarsız uyuyor. **Moses flux-canny-dev (resmi) seçti** → kod buna ayarlı
(model-ailesi farkında: FLUX şeması `control_image`/`guidance`/`output_format`, sürüm hash GEREKMEZ). AÇMAK İÇİN:
- [ ] **1. Replicate hesabı:** replicate.com → kayıt + fatura/kredi → API token (sağ üst → API tokens).
- [ ] **2. Vercel env (Production+Preview) + apps/web/.env.local:**
  `REPLICATE_API_TOKEN=r8_...` + `REPLICATE_PRESERVE_MODEL=black-forest-labs/flux-canny-dev`.
  (Opsiyonel: `RENDER_PRESERVE_HD_MODEL=black-forest-labs/flux-depth-dev`, `RENDER_DAILY_CAP=30`. Sürüm hash YOK.)
- [ ] **3. Supabase:** `supabase/schema.sql`'i tekrar çalıştır (idempotent) → `render_events` + `claim_render_slot` RPC.
  (Olmadan preserve render fail-closed 503 verir — maliyet backstop'u.)
- [ ] **4. Redeploy** → giriş yapılı Pro/admin ile `GET /api/render/capabilities` `{preserve:true}` dönmeli.
- [ ] **5. Test:** Pro/admin hesapla Render → "Geometriyi koru" + "3B Perspektif" → gerçek planda dene (trial kredi).
- [ ] **6. ⚠️ İLK TESTTE:** flux-canny-dev şeması resmi/belgeli ama canlı doğrulanmadı — 422 gelirse
  `provider-render-replicate.ts` FLUX payload'ındaki alan adlarını (guidance/control_image/output_format/megapixels)
  modelin Replicate sayfasındaki "Input schema"ya göre düzelt (Claude'a "şu hatayı aldım" de, anında düzeltir).
- [ ] **7. A/B (opsiyonel):** flux-canny-dev (kenar) vs flux-depth-dev (derinlik, 3B'ye daha uygun) — `REPLICATE_PRESERVE_MODEL`'i
  değiştir, kod aynı. Yavaşsa (Hobby 60s) Vercel Pro (300s) maliyet kararı.

## ✅ 2026-06-28 — DENETİM + SELF-REVIEW + UI ELDEN GEÇİRME (main'de canlı, son `85c3abb`)
- **30+ ajan denetimi** (72 onaylı bulgu) → tüm otonom-güvenli bulgular düzeltildi (4 HIGH dahil: plan
  self-upgrade açığı, Paddle paying→free downgrade, **oda adı veri kaybı**) + **self-review** (kendi diff'imde
  1 regresyon yakalandı + düzeltildi). ~24 commit.
- **UI:** tam-ekran proje galerisi + canlı thumbnail + satır sil/paylaş · giriş→direkt galeri (AppRedirect) ·
  üst çubuk sadeleştirme (Bulut/Aç/Ücretsiz kalktı, 4 indir → "İndir ▾" portal menü).
- Detay: `docs/STATE.md` en üstte. **Moses schema.sql'i prod'da çalıştırdı → H1/M8 canlıda kapalı.**

---

## 0. ÖNCE — Moses'ın tarayıcı doğrulaması (maliyetsiz, kritik)
Bugünkü UI işi canlıda ama gözle teyit edilmeli:
- [ ] **Galeri:** giriş yapılı `vesna.design` → projeler ızgarada, **thumbnail'lar** çiziliyor mu? Kart üzerine
  gel → **Sil + Paylaş** beliriyor mu? Sil onaylı çalışıyor mu?
- [ ] **Redirect:** giriş yapınca `vesna.design` direkt galeriye düşüyor mu (landing CTA'sız)?
- [ ] **Üst çubuk:** "İndir ▾" butonun altında **tam görünüyor mu** (kaydırmasız)? Aç/Bulut/Ücretsiz gitti mi?
- [ ] **Oda adı (en kritik fix):** çiz → Ctrl+S → kapat → tekrar gir → galeriden aç → **oda adların geri geldi mi?**

## 0.5 — 2026-06-29 (2): AI duvar köşeleri + admin hesabı (canlı `6087db4`)
- [x] **AI duvar köşe boşluğu** ✅: `snapSegmentsToGrid` (geometry) → AI Çiz duvar uçları ortak çizgilere
  hizalanıyor (köşe/T-bağlantı kapanıyor). *(Moses: AI'a yeni plan çizdir → köşeler kapalı mı?)*
- [x] **Admin hesap** ✅: `musacinar2009@gmail.com` tam yetki (render açık + sınırsız proje). *(Moses: render dene.)*
- [ ] **Takip — el-çizimi duvar köşe-join (render miter):** Hand-drawn duvarlarda da köşe notch'u olabilir;
  render tarafı join daha riskli (canlı engine değişimi) → ayrı tur + görsel doğrulama.

## 1. Bekleyen küçük öneriler (Moses onaylarsa)
- [x] **"← Projelerim" butonu** ✅ (`43e36b3`): üst çubuğun en başına eklendi → galeriye (StartScreen) döner.
  Kaydedilmemiş çizim varsa onay ister (Kaydet hatırlatması). Zincir yeşil. *(Tarayıcı teyidi Moses'ta.)*
- [ ] **Thumbnail hızlandırma**: her kart TAM JSON indiriyor (çok projede yavaş) → kaydederken küçük önizleme sakla.
- [ ] **Sunum (3B kamera turu)**: görünümler kalıcı değil + video export yok → kalıcı + MP4/GIF export.
- [ ] **Redirect davranışı**: giriş yapan kullanıcı kökte landing'i göremiyor — istenirse "Site'ye dön" geçişi.

## 2. Denetimden KALAN — yalnız Moses kararı/altyapı (otonom dokunulmadı)
- [ ] **M9/M11 Paddle event-sıralama:** `profiles.plan_updated_at` + webhook'ta eski `occurred_at`'i atla.
- [ ] **M10 ücretsiz kota sunucu-tarafı:** şu an istemci kapısı; kesin sınır için DB trigger/RPC.
- [ ] **M12 rate-limit:** in-memory limiter Vercel serverless'te etkisiz → Upstash/Redis (maliyet kararı).
- [ ] **M17 katman klavye erişimi:** sürükle-sırala/yeniden-adlandır klavyeyle (UX, görsel doğrulama).
- [ ] **M23 grid viewport-relative:** uzak/import çizimde ızgara kayboluyor; core render + pan-perf → görsel doğrulama şart.

### 2026-06-29 (3) dalga-2 — Moses kararı bekleyen (otonom DOKUNULMADI; tasarım sağlam teyit edildi)
- [ ] **Anonim AI maliyet-istismarı:** `/api/copilot` yalnız `render`'ı plan-gate'liyor; `ask`/`design` (paralı LLM)
  auth'suz, tek koruma in-memory IP-limiter (serverless'te etkisiz, M12). → `ask`/`design`'a oturum şartı +
  paylaşımlı rate-limit. **ÜRÜN KARARI:** anonim kullanıcı AI'ı denesin mi? (funnel etkisi).
- [ ] **aiRendersPerMonth hiç enforce edilmiyor:** Pro/Studio sınırsız render (PLAN_QUOTAS sayısı kullanılmıyor) →
  aylık sayaç (`profiles.renders_used`) gerekiyorsa Moses karar versin.
- [ ] **Paddle `custom_data.user_id` doğrulanmıyor:** ödeyen biri başka uid girip başkasının planını yükseltebilir
  (kendine-zarar; M9/M11 ile birlikte customer_id↔uid eşlemesi).
- [ ] **Copilot regülasyon yorumu (domain — mimar kararı):** (a) `checkDoorWidth` her <90cm kapıyı `warning`
  yapıyor; TS 9111 90cm **erişilebilir** kapı değeri → standart 80-85cm konut kapıları boşuna uyarı veriyor;
  `info`'ya indirilsin mi yoksa hepsi uyarı mı kalsın? (b) koridor net-genişlik 0'a clamp olunca atlanıyor
  (çok-dar koridor saptanmıyor). (c) setback işaretsiz mesafe → parsel DIŞINDAKİ duvarı "çekme" gibi gösteriyor
  (gerçek ihlal containment'ta yakalanıyor, mesaj yanıltıcı).
- [ ] **Serialize forward-compat (MED):** Yeni build'in yeni block-kind/sheet-size'lı dosyası (hâlâ version 1)
  eski build'de sessizce DÜŞÜYOR → sonraki kayıtta kalıcı kayıp. Doğru çözüm: **katalog büyüyünce
  `MODEL_FORMAT_VERSION` artır** (guard düşürmek yerine reddetsin) — bir proje disiplini; kodla güvenli
  otomatikleştirmek render-tolerans gerektirir.

### 2026-06-29 (3) dalga-3 — Moses kararı/altyapı (otonom dokunulmadı)
- [ ] **Collab last-writer çakışması (§6.4 hard case):** A bir entity'yi taşır (undo stack'te eski hali); B uzaktan
  aynı entity'yi değiştirir; A undo yapınca B'nin düzenlemesini sessizce ezer. Çözüm: planlanan commit-log/invariant
  katmanı (en azından "yakalamadan beri değişti mi" tespiti + reddet/rebase). Crash artık yok (dalga-3'te düzeldi),
  ama sessiz-ezme kalıyor.
- [ ] **Eşzamanlı boş-odaya katılım çiftlemesi:** iki istemci aynı anda boş odaya bağlanınca ikisi de yerel çizimini
  push eder → birleşik/çift çizim. Çözüm: tek "pusher" seçimi (awareness lideri / sunucu) ya da transactional
  "seeded" flag. v1 sınırı, kabul edilmiş.
- [ ] **acceptRemote sarkık binding (LOW):** docstring "sarkık binding reddedilir" diyor ama `opening.wallId`
  var-olmayan duvara işaret edebiliyor + `t` aralık-denetimsiz (t=1e9 kabul). Çözüm: wallId çözünürlüğü doğrula
  ya da render eksik-duvarı tolere etsin.
- [ ] **DXF kapı/pencere ayrımı (minor):** export ikisini de tek LINE çiziyor (SVG ayırıyor: pencere düz, kapı kesik).
  Katman/işaretle ayrılabilir.

### 2026-06-29 (3) dalga-4 — METRAJ domain/mimar kararı (otonom dokunulmadı; sayısal totaller değişir)
- [ ] **Floor/ceiling/paint NET vs GROSS alan:** `takeoff.ts` floor/tavan/boya + tesisat, `polygonArea(boundary)` =
  centerline (brüt) kullanıyor; net iç alan değil → ~%4 fazla (100 m²/20cm duvarda ~+4 m²). `metrics.netGrossAreaM2`
  zaten net hesaplıyor; takeoff onu kullanmalı mı? **Mimar kararı** (teklifte brüt mü net mi metrajlanır).
- [ ] **"İç/Dış sıva" kategorisi:** `cost.ts` bunları 'Kaba yapı'ya koyuyor; TR metrajda sıva 'İnce yapı'. Sadece
  panel/Excel gruplaması (totaller aynı). Mimar onayıyla taşınabilir.
- [ ] **c===0 duvar plaster yüzü:** mahal tanımlı değilken her duvar 2 iç-yüz + 0 cephe sayılıyor (iç sıva ~2×,
  cephe 0). Mahalsiz/izole duvar belirsiz → mimar kararı.
- [ ] **median-thickness çift-orta (minor):** `metrics.ts` çift sayıda duvarda üst-orta elemanı alıyor (ortalama değil);
  yalnız copilot net-genişlik kontrolünü etkiler, m²/maliyeti DEĞİL.

### 2026-06-29 (3) dalga-5 — export/import kalan (otonom dokunulmadı)
- [x] **Pafta ANTET'i SVG/PDF'e EKLENDİ** ✅: `svg-export.ts` artık sheet çerçeve + 10mm margin + antet
  (başlık/proje/tarih/Ölçek/pafta-no) çiziyor + sheet bounds'a katıldı. **Moses: gerçek PDF export'unda antet
  yerleşimini/metin sığmasını gözle teyit et.**
- [ ] **MINSERT dizileri (MED, nadir):** dxf-parser `columnCount/rowCount/spacing` veriyor ama INSERT tek kopya
  yerleştiriliyor → dizi (kolon/park/oturma) tek kopyaya çöküyor. Fix: satır×kolon döngüsü, blok dönmüş çerçevede ofset.
- [ ] **INSERT-seviye mirror (LOW):** ins extrusion (0,0,−1) uygulanmıyor (çocuk entity'lerde var); aynalı blok yerleşimi aynalanmaz.
- [ ] **Blok 2-nokta kalibrasyonda ölçeklenmiyor:** `scaleEntityAbout` blok pozisyonunu taşıyor ama boyutunu değil
  (blok katalog-boyutlu, per-instance scale alanı yok) → büyük kalibrasyonda mobilya küçük kalır. Block.scale alanı = model değişimi (sürüm artışı).
- [ ] **Presence peer-isim etiketi (feature):** uzak imleçler yalnız renkle ayrışıyor, isim yok. RemoteCursor'a name + BitmapText.
- [ ] **Arc faceting radius-bağımsız (LOW):** sabit 15°/segment → büyük yarıçaplı eğride kaba; radius-bağımlı segment sayısı (sagitta cap).

## 3. Faz haritası (büyük resim — ROADMAP.md)
- Faz 2 AI render/LLM maliyetli kısım ertelenmiş; deterministik her şey hazır.
- Faz 3 kalıcı çok-yazar (Yjs presence var; commit-log north-star).
- Faz 4 boş plandan üretim (AI üretici — en zor).
- Faz 5 gerçek 3B + animasyon + BIM (web-ifc) — sunum/GLB tohumu.
