# ROADMAP — Faz detayları ve kabul kriterleri

> CLAUDE.md §10'un uzun hali. Her faz **çalışan, gösterilebilir bir ürünle** biter. Önceki faz bitmeden sonrakine geçilmez.
> İlerleme kaydı `docs/STATE.md`'de. Durum: ✅ tamam · ⏳ kısmen · ☐ yapılmadı.
> **NOT (ADR-0019):** Maliyetsiz/deterministik işler öne çekilir; bazı kalemler planlanan fazından erken sevk edilmiştir (bkz. "Sevk edilen ekstra özellikler").

---

## Faz 0 — İskelet ✅ TAMAMLANDI
**Hedef:** Üzerine inşa edilecek sağlam, çalışan temel.
- [x] pnpm workspaces + Turborepo monorepo
- [x] `apps/web` Next.js (App Router) + React + Tailwind + TypeScript strict
- [x] ESLint + Prettier + Vitest + GitHub Actions CI (lint+typecheck+test)
- [x] `packages/geometry` — saf TS geometri çekirdeği + birim testleri
- [x] `packages/engine` — PixiJS canvas, pan/zoom/grid
- [x] `CLAUDE.md §3` komutları gerçek
**✅ Kabul (KARŞILANDI):** Zoom'lanabilir boş tuval ekranda; `pnpm typecheck && pnpm test` yeşil.

## Faz 1 — Çizim + Import + Mahal ✅ TAMAMLANDI
**Hedef:** AutoCAD planını al, düzenle, ölçülendir, mahalleri isimlendir.
- [x] Çizim araçları: duvar, kapı/pencere, ölçü, seç, taşı, sil (XState FSM)
- [x] Command sistemi + undo/redo + snapping + katman (panel + görünürlük + kilit) + stil
- [x] DXF import + katman eşleme (DWG/WASM + sunucu yedeği hâlâ ☐)
- [x] 2-nokta ölçekleme (kalibrasyon)
- [x] Duvarlardan otomatik mahal bulma + isim + canlı m²
- [x] Mahal listesi tablosu → Excel; DXF/PNG export (PDF de eklendi, ADR-0022)
**✅ Kabul (KARŞILANDI):** AutoCAD'den DXF gelip ölçekleniyor, mahaller isimlenip m²'leniyor, tablo dışa aktarılıyor.

## Faz 2 — AI Render + Copilot ✅ TAMAM (copilot+LLM+render v1; ileri render ☐)
> **GERÇEK DURUM (2026-06-23 denetim):** Copilot (deterministik+LLM) + metrik ✅; **AI Render v1 de yapıldı** (`packages/ai/render.ts` + Asistan Render modu, OpenAI gpt-image-1, "yaratıcı mod"). Eksik: ControlNet "geometriyi koru", render geçmişi/S3 depolama/kota, izole `services/ai-render`.
**Hedef:** Plandan görsel üret, kullanıcıya atıflı öneri + canlı metrik ver. (Detay: `docs/FAZ2-NOTES.md`.)
- [ ] ☐ `services/ai-render` — izole render servisi; **doğrudan API başlangıç, kuyruk yük artınca** (ADR-0017). Sağlayıcı (Replicate/Fal) + bütçe 2D'de test edilip seçilir, önce ücretsiz krediler *(maliyetli → ertelendi, ADR-0019)*
- [ ] ☐ **Uygulama içi canlı render paneli** (export-yükle değil; ADR-0013): plan/kesit → ControlNet + diffusion; "yaratıcı" + "geometriyi koru" modu; stil/malzeme; varyant *(maliyetli → ertelendi)*
- [ ] ☐ Render geçmişi + S3/R2 depolama + önbellek + kota
- [x] ✅ **Copilot (1) — kaynak-gösteren öneri (2B):** `packages/copilot` deterministik kural motoru; her bulgu atıflı (ADR-0014/0018).
- [x] ✅ **Copilot (1b) — doğal-dil LLM katmanı (Fikir 1, ADR-0041/0042):** `packages/ai` 3-sağlayıcı router (Akash/OpenAI/Claude) + fallback + streaming; Asistan UI. AI kapısı açıldı (Moses anahtarları girdi).
- [x] ✅ **Copilot (2) — canlı metrik paneli (2A):** RoomList — toplam/net/brüt m², oda tipi dağılımı, Excel
- [x] ✅ **Türkçe yönetmelik (genişliyor):** koridor (TS 9111), asgari alan (yatak/oturma/mutfak/banyo, İmar), kapı genişliği, çekme/setback, doğal aydınlatma, otopark, TAKS (ADR-0015/0021)
**✅ Kabul:** 2A/2B karşılandı (metrik + atıflı öneri canlı). Render ayağı (2C) sağlayıcı/bütçe kararından sonra. (Foto-gerçekçi otomatik KESİT burada YOK — bkz. Faz 3/5.)

## Sevk edilen ekstra deterministik özellikler (ADR-0019, plan dışı) ✅
> Orijinal faz planında ayrı kalem değildi; maliyetsiz oldukları için erken yapıldı (hepsi main'de, ~178 test).
- [x] **Blok/mobilya kütüphanesi** + yerleştirme + seç/taşı/döndür + mobilya çizelgesi + mobilya katmanı
- [x] **Annotation (metin) aracı** + çift-tıkla yerinde düzenleme
- [x] **Pafta / sheet sistemi** (A4–A0 + yön + ölçek + antet + SheetPanel) — sunum/paftanın erken çekirdeği
- [x] **Özellikler paneli** (seçili entity düzenleme: duvar kalınlığı / boşluk genişliği+tür / metin / blok dönüş)
- [x] **Çoklu seçim** (kutu/marquee + Shift + toplu taşı/sil) + **kopyala-yapıştır/çoğalt** (Ctrl+C/V/D) + **Ctrl+A** + ok-tuşu itme
- [x] **Hizalama kılavuzları** (smart snap: eksen hizalama) + snap göstergesi
- [x] **Hatch malzeme kütüphanesi** (zemin kaplamaları) + poché + çizgi tipleri + lineweight hiyerarşisi (VISUAL-CRAFT)
- [x] **Ölçülendirme** + **Parsel** (setback denetimi) araçları
- [x] **Görünüm/UX:** içeriğe sığdır (Home) + durum çubuğu (koordinat) + kısayol yardımı (?) + araç başına imleç + katlanabilir paneller

## Faz 3 — Gerçek Zamanlı İşbirliği ⏳ KISMEN (v1 temel çalışıyor; "olgun" kriterler ☐)
> **GERÇEK DURUM (2026-06-23 denetim):** Çekirdek ✅ — `packages/collab` (EntitySync + RoomLabelSync), `apps/sync` (ws relay), `engine/presence.ts` (uzak imleçler), şematik kesit (ADR-0039), metraj+maliyet. İki sekme: çizim + imleç + mahal-adı senkron. **EKSİK (kabul kriterleri):** çevrimdışı+resync, çakışma çözümü, **multiplayer undo** (bilinçli ertelendi), **katman-döngü invariant'ı** (iç içe katman hiç yok — düz reorder), yorum/markup, paylaşım rol/izin, **auth**, **sunucu-otoriteli kalıcılık** (oda boşalınca kaybolur). = "store-aynası v1".
**Hedef:** Birden çok kişi aynı çizimde eş zamanlı.
- [ ] `packages/collab` — Yjs entegrasyonu, Command'leri CRDT'ye bağla
- [ ] `apps/sync` WebSocket sunucusu, presence (imleç/seçim)
- [ ] Yorum/markup, paylaşım linki, rol (editor/viewer) + izin
- [ ] Çevrimdışı + senkron
- [ ] **Hafif şematik kesit (ADR-0016):** duvarlara yükseklik özelliği + plana kesit çizgisi → ekstrüzyonla düzenlenebilir şematik kesit (gerçek kesitin ara yolu; tam 3B kesit Faz 5)
- [x] ✅ **Metraj paneli (`PRO-FEATURES.md §1`) — ADR-0019 ile öne çekildi:** duvar/mahal/kapı-pencereden otomatik miktar (sıva/boya m², döşeme m², süpürgelik, kapı/pencere + mobilya çizelgesi) → canlı tablo + Excel. *(Türkçe **poz/birim fiyat** entegrasyonu ☐ — hâlâ tohum.)*
- [x] ⏳ **Çizelge (schedule) motoru (`PRO-FEATURES.md §3`):** mahal listesi + kapı/pencere + mobilya çizelgeleri canlı (`takeoff.ts`). *(Genel "entity özelliği → tablo" soyutlaması ☐.)*
- [x] ✅ **Canlı yaklaşık maliyet (`PRO-FEATURES.md §2`) — ADR-0019 ile öne çekildi:** `cost.ts` metraj × birim fiyat → kaba TL (TakeoffPanel + Excel "Maliyet"). *(Poz/birim-fiyat veritabanı ☐.)*
**✅ Kabul:** İki kişi aynı anda çiziyor; duvar yüksekliğinden şematik kesit alınabiliyor. (Metraj/çizelge zaten canlı — öne çekildi.)

**Kabul kriterleri (detay):**
- *Multiplayer (Yjs):*
  - [ ] İki istemci aynı modelde eş zamanlı duvar ekle/sil/düzenle yapıyor; değişiklik <300 ms'de karşıya yansıyor.
  - [ ] **Presence:** karşı tarafın imleci + seçimi renkli görünüyor.
  - [ ] **Conflict-free:** Command'ler Yjs CRDT'ye bağlı; "ben silerken o ad yazıyor" çelişkisi belirlenmiş, tutarlı sonuç.
  - [ ] **Çevrimdışı + senkron:** bağlantı kesilince çalışmaya devam, dönünce otomatik birleşir.
  - [ ] **Katman invariant:** döngülü hiyerarşi reddedilir (CRDT tek başına garanti etmez; veri katmanı zorlar).
  - [ ] Multiplayer undo köşe durumları `ARCHITECTURE.md`'den uygulanır (uydurma yok).
- *Şematik kesit (ADR-0016, deterministik — Yjs'den bağımsız ilerleyebilir):*
  - [ ] Veri modeli: `Wall.height?` (varsayılan ~280 cm) + `Sheet.sectionLine?` (planda 2-nokta kesit çizgisi).
  - [ ] `SectionTool` — planda kesit çizgisi koy; Özellikler panelinden duvar yüksekliği düzenlenir.
  - [ ] Kesit görünümü: çizgi boyunca duvar cross-profile + döşeme/tavan hattı; çizim değişince canlı güncellenir.
  - [ ] Fotogerçekçi DEĞİL (tam 3B kesit Faz 5).

## Faz 4 — Boş Plandan Üretim ⏳ ERKEN ÖNİZLEME
> **GERÇEK DURUM (2026-06-23 denetim):** `packages/ai/design.ts` LLM-JSON üretici → vektör (Wall/Space/Opening, undo'lanabilir) ✅; ≥2 varyant + puanlama ✅; program girişi (`ProgramBuilder`, oda+adet+m²) ⏳. **EKSİK:** komşuluk/bubble-diagram grafiği, sınır-çizme UI, kısıt-uyum döngüsü, otomatik kesit üretimi, retrieval/difüzyon model (şu an yalnız dikdörtgensel LLM taslağı).
**Hedef:** AI'nın kendisi tasarım üretmesi.
- [ ] Program girişi (oda/m²/komşuluk = bubble diagram) + sınır girişi UI'si
- [ ] `services/ai-layout` — kural tabanlı + diffusion/GAN + LLM değerlendirme
- [ ] Çoklu alternatif üretip puanlama; çıktı **vektör** plan
- [ ] Otomatik kesit üretimi; insan + AI düzenleme döngüsü
**✅ Kabul:** Boş plan + istekten otomatik yerleşim ve kesit.

**Kabul kriterleri (detay):**
- [ ] **Girdi:** parsel sınırı + oda listesi (ad/m²/tip) + komşuluk grafiği (bubble diagram) + kurallar (setback/kat/TAKS).
- [ ] **Çıktı vektör:** `packages/document` entity'leri (Wall/Opening/Space) — raster değil; sonra Command'le düzenlenebilir.
- [ ] **Kısıt uyumu:** üretilen plan parsel içinde (ADR-0027), oda asgari genişlik/alan, çekme; copilot uyum raporu temiz/atıflı.
- [ ] **Alternatifler:** bir istekten ≥2 varyant üretip puanlama; kullanıcı seçer.
- [ ] **İnsan-döngüde:** AI üretir → mimar Command'lerle düzeltir → copilot canlı denetler.
- [ ] **Hız:** boş parsel + program → ilk topoloji makul sürede (hedef <5 sn, sağlayıcıya göre ölçülecek).
- [ ] Maliyetli (LLM/GPU) → ADR-0019: sağlayıcı/bütçe ücretsiz kredilerle test edildikten sonra.

## Faz 5 — Gerçek 3D + Animasyon ⏳ ERKEN ÖNİZLEME
> **GERÇEK DURUM (2026-06-23 denetim):** Şematik 3B ✅ — `document/wall3d.ts` (duvar→hacim, kapı/pencere boşlukları oyulur) + renkli oda zeminleri + three.js `View3D` + otomatik tur + PNG export. **EKSİK:** düzlemle gerçek 3B kesit (Faz 5 başlığı), kamera keyframe animasyonu (yalnız oto-tur var), glTF/GLB export, malzeme/ışık derinliği, görünüş (cephe), IFC/BIM.
**Hedef:** Plandan 3D, klasik render, animasyon, **tam 3B kesit**.
- [ ] 2D'den hacim (duvar yüksekliği, boşluklar, döşeme/tavan)
- [ ] Three.js / react-three-fiber görüntüleme, malzeme/ışık
- [ ] **Tam 3B kesit/cephe:** hacmi bir düzlemle keserek gerçek kesit (ADR-0016 yol A)
- [ ] Kamera keyframe animasyonu + AI video; glTF/GLB export
**✅ Kabul:** Plandan 3B model + animasyonlu sunum + düzlemle kesilmiş gerçek kesit.

## Faz 6 — Ölçek & Kurumsal
**Hedef:** Üretim ölçeğinde performans ve çok kiracılılık.
- [ ] Darboğaz geometri/render parçalarını Rust→WASM'e taşı
- [ ] Commit-log senkron + sürüm geçmişi/branch
- [ ] Multi-tenant, organizasyon/izin, gözlemlenebilirlik
- [ ] Ödeme/abonelik (editor ücretli, viewer ücretsiz — Rayon modeli)
**✅ Kabul:** 500k entity'de akıcı + sürüm kontrolü.

---

## 💸 PARALI AI AYAĞI — ne zaman, hangi sırayla (ADR-0019)

> Bu kesişen (cross-phase) bölüm, **para harcayan AI** parçalarını tek yerde toplar. CLAUDE §0
> kural 12 + ADR-0019: maliyetli AI **en sona** ertelenir; sebep kalite değil — en iyi sağlayıcıyı
> **bedava kredilerle gerçek projeyle** test edip seçmek. Bedava/deterministik her şey önce ve en iyi.

**AI kapısı (gate) — ne zaman açılır?** İkisi birden olunca:
1. Deterministik ürün uçtan uca **kullanılabilir/demo-hazır** (pratikte ~Faz 3 collab bitince; Moses'ın elinde test edeceği **gerçek bir proje** olunca), ve
2. **Moses açıkça "şimdi paralı AI'a geç" der** (her çağrı para; sağlayıcı seçimi `packages/ai` adapter + ADR-0006).

**Sıra — ucuzdan/kolaydan pahalıya/zora:**

| # | Özellik | Ne | Maliyet | Yapılış sırası | Faz / doküman |
|---|---------|-----|---------|----------------|----------------|
| 1 | **LLM Copilot Q&A** *(Moses Fikir 1)* | Kullanıcı serbest soru sorar, AI **proje + seçili bölge + mevcut deterministik bulgular/metrik/Türkçe yönetmelik** bağlamıyla cevaplar | Düşük (yalnız LLM API; GPU yok) | **İlk** — en ucuz, en kolay; mevcut copilot verisini bağlam verir (RAG-lite) | Faz 2 "doğal-dil katmanı" (FAZ2-NOTES §2) → olgunlaşınca AI-AGENT-VISION Seviye 2 (onaylı Command) |
| 2 | **AI Render** | Plan/kesit → ControlNet + diffusion ile fotogerçekçi görsel; uygulama-içi canlı panel; "yaratıcı" + "geometriyi koru" modu | Orta-yüksek (diffusion/GPU) | İkinci | Faz 2 render ayağı (FAZ2-NOTES §1, RENDER.md, ADR-0013/0017) |
| 3 | **Metin→Plan Üretici** *(Moses Fikir 2)* | "8×6 m, 2 oda, parke" gibi tarif → AI eksik bilgiyi sorar → emin olunca **vektör plan (Command'ler)** üretir | Yüksek (LLM + üretim modeli) + en zor mühendislik | **Son** — sağlam çizim motoru + domain + tercihen collab şart (CLAUDE §8.8: "Faz 4'e kadar dokunma") | Faz 4 (AI-GENERATE.md; Tell2Design/Graph2Plan/HouseDiffusion) |

**Neden bu sıra:** (1) LLM Q&A bugünün deterministik copilot'unun üstüne **ince bir katman** — en hızlı görünür değer, en az risk; aynı zamanda AI-AGENT-VISION Seviye 1→2 merdiveninin doğal devamı (öneri → onaylı Command). (2) Render ayrı bir maliyet/sağlayıcı sınıfı (GPU). (3) Üretici hepsinin üstüne biner; en sona.

**Durum (2026-06-23):** AI kapısı **AÇILDI** (Moses Akash+OpenAI anahtarlarını girdi). **#1 LLM Copilot Q&A ✅** (streaming + 3-sağlayıcı router, ADR-0041/0042). **#3 Metin→Plan üretici ⏳ erken/deneysel önizleme** (ADR-0043: duvar+oda+kapı+pencere, undo'lanabilir; tam üretici Faz 4). **#2 AI Render ☐** (hâlâ GPU/maliyet — sırada). Hepsi `packages/ai` adapter arkasında (ADR-0006); Claude anahtarı gelince karmaşık/yönetmelik otomatik Claude'a geçer.
