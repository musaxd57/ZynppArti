# STATE — Nerede kaldık?

> **Claude:** Her oturuma bunu okuyarak başla, oturum sonunda güncelle. Bu dosya "tek doğru" ilerleme kaydıdır.
> Format: en üstte güncel durum, altta kısa günlük (en yeni üstte).

---

## ŞU AN

**🆕 2026-06-29 (4) — VESNA "ÇİZ" PROMPTU DÜNYA-SINIFI YENİDEN TASARIM (main'de canlı, `05d7da6`):**
- Moses "Çiz promptlarını 20 ajanla didik didik geliştir" dedi → **~20-ajanlı workflow** (12 web-araştırma açısı:
  rakipler[Maket/ArkDesign/Finch/TestFit/Hypar/Forma]/akademik[Graph2Plan/HouseGAN/Tell2Design]/LLM+Claude prompt
  müh./tasarım ilkeleri/antropometri/TR norm/CEO konuşmaları/hata modları/few-shot/çeşitlilik → 2 aday → 4 adversaryal
  yargıç → 1 final birleştirme; ~1M token). Yeni `DESIGN_SYSTEM` (`packages/ai/src/design.ts`).
- **JSON sözleşmesi birebir korundu (testlerle güvenceli):** yalnız-JSON ilk-karakter `{`, kesin şema anahtarları,
  tam-sayı cm + sınırlar, `type` enum = ROOM_TYPE_KEYS, ≥1 dış giriş kapısı, `{variants}`.
- **Kazanımlar:** topoloji-önce içsel muhakeme (program→komşuluk grafiği→bölgeleme→ızgara; Claude adaptive thinking;
  sağlayıcı-agnostik "içsel düşün, çıktı `{` ile başlar" kilidi) · somut TR norm + antropometri (oda m²/dar-kenar,
  koridor ≥120, kapı 90/80, ıslak-çekirdek, yön/ışık, erişilebilirlik) · kapalı-köşe/paylaşılan-tek-duvar/ızgara
  kuralları · elle-doğrulanmış kompakt few-shot (2+1) + 8-maddelik öz-denetim · varyantlar gerçek "parti" farkı.
- **Final ajan iki yargıcın da kaçırdığı GİZLİ sözleşme bug'ını yakaladı:** adaylar type enum'unu bedroom/wc/hall'a
  çevirmişti (kod sessizce düşürürdü) → doğru 8 değere + açık eşlemeye geri çevrildi.
- **Maliyet:** +~700-820 input token/çağrı (~2.5-3×, alt-cent); takip: Anthropic system bloğuna prompt-caching.
  **Moses: gerçek bir Çiz isteğiyle (ör. "100 m² 3+1, açık mutfak") plan kalitesini gözle test et.** +3 koruma testi (design 20).

**🆕 2026-06-29 (3) — HATA + İYİLEŞTİRME DENETİMİ, dalga 1 (main'de canlı, son `c40b068`):**
- Moses "4 saat durmadan hata/iyileştirme ara, agentlarla" dedi → 5 paralel denetim ajanı (geometry+document,
  engine+tools, io, web, ai+copilot+collab) → 14 gerçek bulgu, otonom-güvenli olanlar düzeltildi (6 commit, hepsi
  yeşil zincir + push: branch + main + default senkron). **+5 test** (geometry 73, engine 42, io 44, ai 45).
- **Düzeltmeler:** (web `4f841d0`) boş tuvalde "Yeni" bulut bağını koparıyor (yanlış proje üzerine-yazma/veri kaybı),
  input'ta Ctrl+O ele geçirilmiyor, galeri auth catch, download() body'e ekli, setInitError disposed guard ·
  (io `5150c9c`) eksik $INSUNITS kodları (Å/nm/µm/Gm) + CIRCLE/ELLIPSE/SPLINE OCS sınırı belgelendi (dxf-parser
  extrusion'ı yalnız ARC'ta parse ediyor → aynalı eğri zaten kayıp, no-op) · (geometry `2ded376`) **findFaces dış-yüz
  seçimi |alan| yerine signed-area İŞARETİ ile** — dışarıdan değen sarkık duvar (spur) oda poligonuna spike
  kaçırmasını önler (perimeter/centroid/sıva bozulmasını giderir) + wall3d denizlik h-clamp + annotationSize reduce ·
  (engine/tools `98bba9b`) **marquee narrow-phase** (çapraz duvarın büyük AABB'si boş köşede seçtirmesin) +
  pointercancel araç-jesti temizliği (FSM 'dragging'de kilitlenmesin) + dimension alpha sızıntısı ·
  (ai `b854149`) **garantili giriş kapısı** (AI hiç dış açıklık koymadıysa en uzun dış duvara sentezle) +
  parseLayouts TÜM JSON bloklarını dener (öndeki layout-olmayan obje planı atmasın) + askCopilot boş-yanıt fallback ·
  (sync `c40b068`) per-socket mesaj token-bucket (oda-içi flood amplifikasyonu sınırı, cömert/env-ayarlı).
- **Dalga 2 (4 ajan: render / perf-500k / security-RLS / persistence+copilot) — 3 fix commit daha:**
  - (render `9a8b62b`) **HIGH: her kapıda hayalet çapraz çizgi** — Pixi v8 `stroke()` son-noktayı yeniden
    seed'liyor → sonraki `arc()` boş kiriş ekliyor; `moveTo(f.b)` ile düzeldi + wardrobe sembolü aynı bug +
    dimension label negatif-offset tarafı + CHAIN dash yorumu.
  - (perf `8629dac`) **RoomList + TakeoffPanel store-aboneliği trailing-debounce** (~100/120ms): sürüklemede
    kare-başına computeMetrics/computeTakeoff O(n²) yeniden hesabı kaldırıldı (canlı m² hissi korunur, UI-only —
    model/AI-Çiz senkron okuması etkilenmedi). *Perf teşhisi: jank kaynağı document-katmanı recompute kaskadı;
    engine cull/index zaten 500k-hazır.*
  - (cloud `2c05cde`) paylaşılan-projeyi-üzerine-yaz reddinde yetim blob temizliği (transient hatada meşru blob'a
    dokunmadan).
  - **Güvenlik tasarımı SAĞLAM teyit edildi** (RLS/RPC/storage/key-leakage temiz). Bulguların tümü ürün/altyapı
    kararı = zaten flag'li (M9–M12, aşağıda) — otonom dokunulmadı. Copilot kuralları + serialize forward-compat:
    domain/regülasyon yorumu → Moses (aşağıda). *(Tarayıcı teyidi Moses'ta: kapı/wardrobe çizimi + panel debounce hissi.)*
- **Dalga 3 (4 ajan: 3D/export / collab+undo / a11y / tool-FSM+layers) — 4 fix commit daha:**
  - (collab `d6c48bc`) **HIGH: çok-yazarda undo/redo/dispatch ÇÖKMESİ** — uzak peer entity'yi silince `invert`'in
    "entity bulunamadı" throw'u yakalanmıyor + undo stack'i bozuyordu (§6.4). History.run try/catch: invert SAF
    (apply öncesi → store değişmez, zombie diriltilmez), başarısız adım atlanır, stack tutarlı. +test.
  - (tools `70cb606`) **snapper gizli/kilitli katmana snap'liyordu** (tek istisna pick yolu) → skipLayer predicate.
  - (io/web `ebb5271`) DXF'e **kesit (A—A') export'u** (SVG'de vardı, DXF'te yoktu → round-trip kaybı) + **glTF
    cm→m ölçek** (BIM'de 100× büyük açılıyordu) + 3B kesit = panelin son-kesiti. +test.
  - (web a11y `a0a4d94`) View3D modal focus-trap + ContextMenu klavye-navigasyonu (role=menu) + Assistant Escape
    + PropertiesPanel/Panel aria etiketleri.
  - **Moses-territory (otonom dokunulmadı, YARIN'a yazıldı):** collab last-writer çakışması (commit-log gerek),
    eşzamanlı-join çiftleme (v1), serialize forward-compat (katalog büyüyünce sürüm-artışı disiplini),
    solo/layer-reorder edge, LayerPanel klavye (M17), DXF kapı/pencere ayrımı (minor).
- **Dalga 4 (3 ajan: çekirdek-math/store / metraj-sayısal / tüm-semboller+hatch) — 2 fix commit daha:**
  - (blocks `4a01f8f`) **dining-table sandalyeleri footprint dışındaydı** (seçilemez/snap'lenemez) → footprint 180×176
    (sandalye sıralarını kapsar), masa ortada sabit 180×90, 8→6 sandalye ("6 kişi" etiketiyle uyumlu). Görsel ~aynı.
  - (engine/document `b0a9ded`) SpatialIndex.insert idempotent (hayalet-düğüm sertleştirme +test) + metraj geçersiz
    (genişlik 0/NaN) açıklığı SAYMIYOR (adet/maliyet şişmesi).
  - **TEMİZ ÇIKAN:** transform/spatial-index/store/geometri-helper math (doğrulandı, bug yok); kapı sembol arc'ları
    (analiz teyit); render-space/hatch temiz. → çekirdek sağlam.
  - **Moses-territory metraj (domain/mimar kararı — otonom dokunulmadı, YARIN'a):** floor/ceiling/paint **gross
    (centerline) yerine net** alan kullanmalı mı (~%4 fazla); "İç/Dış sıva" kategorisi Kaba→İnce yapı; c===0 duvar
    plaster yüzü; median-thickness çift-orta. (Sayısal totaller değişeceği için mimar onayı.)
- **✅ SELF-REVIEW (2 adversaryal ajan, oturum diff'i `6e01e74..HEAD`): REGRESYON YOK.** 15+ değişiklik tek tek
  doğrulandı — planar-faces winding elle izlendi (bounded CCW+ / outer CW−, tie imkânsız), history crash-safety
  (invert saf→apply öncesi throw store'u bozmaz), marquee narrow-phase, debounce (leak/stale yok), parseLayouts
  (yanlış-blok seçmiyor), glTF clone (canlı sahne/paylaşılan kaynak güvenli), token-bucket math, orphan-blob guard.
  Tek not (regresyon değil, kasıtlı): `dispatch` artık programcı-hatası throw'unu da yutuyor (console.error'la).
- **Dalga 5 (3 ajan: SVG/PDF-export / metin-charset-presence / kalibrasyon-DXF-tessellation) — 1 fix commit daha:**
  - (export/engine `75e4a33`) **çok-sayfa PDF'te paftayı KESEN geometri sayfayı düşürmüyor** (sheetHasContent
    point-in-rect → AABB-örtüşme) + import wireframe duvarda ince opening-kesim (beyaz-kutu artefaktı) +
    buildSpaceLabel dejenere sınırda null (NaN konum yerine).
  - **TEMİZ ÇIKAN:** charset TR tam (ğĞıİşŞçÇöÖüÜ ✓), font install race yok, label/peer leak yok; kalibrasyon
    + INSERT-composition + ellipse/arc/bulge math doğrulandı (sağlam); XML-escape/viewBox/multi-page-clip temiz.
  - **✅ Pafta ANTET'i SVG/PDF export'una EKLENDİ (`e5012b7`):** render-sheet.ts SVG'ye aynalandı (çerçeve +
    10mm margin + 3-satır antet kutusu + başlık/proje/tarih/ölçek/pafta-no; beyaz kağıt için koyu çizgi/metin),
    sheet bounds'a katıldı. +test. *(Moses: gerçek PDF'te antet yerleşimini gözle teyit et.)*
  - **Moses-territory (otonom dokunulmadı, YARIN'a):** MINSERT dizileri tek kopya (nadir) · INSERT-seviye mirror ·
    blok 2-nokta-kalibrasyonda ölçeklenmiyor (model alanı gerek) · presence peer-isim etiketi (feature) ·
    radius-bağımsız arc faceting (büyük eğri).
- **Dalga 6 (1 ajan: routing/auth-gate) — 1 fix commit daha:**
  - (web `7c4318f`) **HIGH: "← Projelerim" `#room=`'u temizlemiyordu** → galeriden yeni proje açınca CollabControl
    eski odaya SESSİZCE geri bağlanıp özel çizimi paylaşılan odaya senkronluyordu (gizlilik/veri sızıntısı) +
    reload'da galeri atlanıyordu. onBack URL'yi temizliyor + `?ciz=` tüketildikten sonra strip + setStartEmpty/
    setPendingOpen karşılıklı-iptal (footgun). **TEMİZ:** middleware session-refresh, AppRedirect (loop yok),
    AuthButtons abonelik, auth/callback — doğrulandı sağlam.
- **TOPLAM (6 dalga + self-review, bu oturum): 18 fix commit + 5 doc, +12 test, hepsi yeşil zincir + push (main+default senkron).
  Her dalga 1-14 gerçek bulgu; düzeltilenler arasında 4 HIGH (boş-Yeni bulut veri kaybı, çok-yazar undo crash,
  her-kapıda hayalet çizgi, back-to-gallery oda sızıntısı). Kalanlar Moses-territory (domain/altyapı/feature/görsel).**

**🆕 2026-06-29 (2) — AI duvar köşe boşluğu + admin hesabı (main'de canlı, `6087db4`):**
- **AI duvar köşeleri kapanıyor (`39197c0`):** Moses AI'a çizdirdiği planda iç duvarların alt dış duvara değmediğini gördü (köşeler açık, ekran görüntüsüyle teyit — alt-orta kırpmada net boşluk). Sebep: LLM duvar uçlarını birkaç cm kaydırıyor → köşe/T-bağlantı buluşmuyor. Çözüm: yeni saf `snapSegmentsToGrid` (geometry) — yakın X/Y uç koordinatlarını ortak çizgilere kümeler (tol 50cm), `applyLayout`'ta entity kurmadan önce uygulanır; sıfır-uzunluk duvarlar atılır. +6 test (geometry 71).
- **Admin hesabı (`6087db4`):** `musacinar2009@gmail.com` tam-yetkili ('studio' gibi): AI render açık (sunucu tarafı, **auth e-postasıyla** doğrulanır → istemci-bypass'a kapalı) + sınırsız bulut proje (kota atlanır). `isAdminEmail` (`lib/plan.ts`). Başka hesap eklemek = ADMIN_EMAILS setine ekle.
- Zincir yeşil (typecheck 9/9 · lint 9/9 · web build). *(Tarayıcı teyidi Moses'ta: AI Çiz köşe kapanışı + admin render/kota.)* **NOT:** El-çizimi duvarların köşe-join'i (render miter) ayrı/daha riskli iş — bu tur AI yoluna odaklandı.

**🆕 2026-06-29 — "← Projelerim" geri butonu (main'de canlı, `43e36b3`):** Çalışma ekranından galeriye (StartScreen) dönüş yolu yoktu (yalnız "Yeni"/sayfa yenile). Üst çubuğun en başına **"← Projelerim"** butonu eklendi → AppGate `app→start` fazına döner (CanvasStage unmount). Kaydedilmemiş çizim içeriği varsa onaylı (Kaydet/Ctrl+S hatırlatması), boşsa direkt. Toolbar `onBackToGallery` prop (verilmezse buton gizli). Zincir yeşil (web typecheck · lint · build). *(Tarayıcı teyidi Moses'ta.)*

**🚀 CANLI YAYINDA:** Web `https://vesna.design` (Vercel) + sync `wss://zynpparti-production.up.railway.app` (Railway). 3 AI anahtarı Vercel env'de; AI adı **Vesna**.
**Faz:** 2 (AI copilot ✅) + Faz 4 erken önizleme (AI üretici ✅) + Faz 1 DWG import ✅ + Faz 3 (presence+seçim+yorum) + Faz 5 (3B+kesit+glTF+kamera keyframe) önizleme.
**Branch:** `main` canlıda (her şey merge'li). 2026-06-25 büyük tur main'de + canlı: (a) otonom sertleştirme (serialize/AI/lock/dxf/perf/collab/findFaces/a11y…), (b) Moses 5-görevi (render hata-A, perf turu [?perf HUD + RoomManager cap + reverse-index + nearestAxis viewport + duvar hatch build/stroke + render-group], 3B GPU-fan on-demand, domain kararları), (c) **proje-adı + karşılama ekranı + çoklu-pafta yöneticisi + AI viewport-yerleştirme**, (d) PNG/Excel toast + metin-focus düzeltmeleri. **Test 318→365**, zincir yeşil (typecheck 9/9 · lint 9/9 · web build). render-group + start-screen ekran görüntüsüyle doğrulandı. Açık flag: çok-sayfa PDF, AI tam tıkla-bırak ghost, slab-mirror teyidi, render-space/sheet hatch follow-up (`docs/YARIN.md`).
**Durum:** Üç sağlayıcı router (ADR-0042) **hız-öncelikli**: basit/orta→**OpenAI** (~1.3sn), karmaşık/yönetmelik→**Claude** (~2.7sn), **Akash yedek**. **Test: ~317.** 2026-06-24 turları **main'e MERGE + push** (canlı): promo videosu (mantıklı 3+1 + GİRİŞ KAPISI + scrubbable timeline + GERÇEK 3B GIF), HeroMockup aynı kurguya, AI Çiz promptu (zorunlu giriş kapısı + gerçekçilik + oda adları), üst-üste etiket bug'ı (`polygonLabelPoint`), maliyet geliştirme (tesisat+kategori+overhead+₺/m²+düzenlenebilir fiyat), ve **2 denetim + 1 tasarım dalgası** (22+13+11 ajan) → 20+ düzeltme: Y1 (oda bire-bir eşleştirme), Y2 (artımlı cull/500k perf), serialize derin doğrulama, store.emit dayanıklılık, tool gen-token, dxf NaN, motion/a11y tabanı, Cmd+K nav, SEO + R1/R2/H5 regresyon kapatma. **Kalan denetim/tasarım işleri kök-neden kümeli `docs/YARIN.md`'de.** Tarayıcı doğrulaması Moses'ta.

**🆕 2026-06-28 GECE — UI ELDEN GEÇİRME (galeri + üst çubuk sadeleştirme; main'de canlı, son `85c3abb`):**
- **TAM EKRAN PROJE GALERİSİ** (`3782e7d`): StartScreen artık dar modal değil → tam-ekran dashboard. Sticky header (marka + yeni proje adı/oluştur + Aç .json) + responsive kart ızgarası (1/2/3 sütun). Her kart **CANLI vektör thumbnail** (proje JSON → `exportSvg` → data-url img; lazy + iskelet/boş/hata durumları) + ad + tarih.
- **Satır-bazlı SİL + PAYLAŞ** (`259597f`/`573bb83`): kart üzerine gel → sağ-üstte Paylaş + Sil ikonları (yalnız SAHİBİ olduğun projede; paylaşılanlarda gizli). Onaylı sil.
- **GİRİŞ → DİREKT GALERİ** (`3782e7d`): `AppRedirect` — giriş yapan kullanıcı `/`'a girince `/app`'e (galeriye) yönlenir; "hemen başla/ücretsiz"e tıklamadan projelerini görür. Anonim landing'i normal görür; `#room=` ve pazarlama sayfaları dokunulmaz.
- **ÜST ÇUBUK SADELEŞTİRME** (`573bb83`/`9e894c0`/`85c3abb`): **"Bulut" menüsü kaldırıldı** (CloudMenu silindi — kaydet Ctrl+S'te, aç/sil galeride). **"Aç" kaldırıldı** (Ctrl+O kalır). **"Ücretsiz" PlanBadge kaldırıldı** (component silindi). **DXF/SVG/PNG/PDF → tek "İndir ▾" menüsü** (PORTAL ile body'ye çizilir → çubuğun overflow-x'i artık kırpmıyor, kaydırma derdi bitti). Net: üstte 5 buton eksildi, hiçbir işlev gitmedi.
- Zincir yeşil (typecheck 9/9 · lint 9/9 · web build). **Tarayıcı doğrulaması Moses'ta** (thumbnail'lar + sil/paylaş + redirect + İndir menüsü).

**🆕 2026-06-28 — Ctrl+S = BULUTA KAYDET + karşılama ekranı bulut listesi (main'de, canlı `1d4cd31`):**
- **Ctrl+S / Toolbar "Kaydet" artık BULUTA kaydeder** (giriş varsa): bağlı projeye üzerine yazar, yoksa yeni proje açar (ücretsiz kota kontrolü). Giriş yoksa eski davranış: yerel `.json` iner. Kaydetmek için aşağı açılan "Bulut" menüsünü açmaya gerek yok (Moses isteği). Bulut menüsü artık yalnız başka projeye geç / paylaş / sil / "Farklı kaydet" için.
- **Karşılama ekranı (StartScreen) giriş yapanın bulut projelerini en üstte listeler** → tıkla, kaldığın yerden devam (model yüklenir + kadraja gelir + ad/bağ kurulur → sonraki Ctrl+S aynı projeye yazar). Giriş yoksa küçük `/giris` linki.
- **Kaydet mantığı tek yerde:** yeni `apps/web/lib/cloud-save.ts` (`saveCurrentToCloud` + `isCloudSignedIn`); Ctrl+S, Toolbar butonu ve CloudMenu hepsi onu kullanır (kopya kota/hata mantığı kaldırıldı). Zincir yeşil (typecheck 9/9 · lint 9/9 · web build). **Tarayıcı uçtan-uca testi Moses'ta** (gir→çiz→Ctrl+S→kapat→tekrar gir→listeden aç→devam).

**🆕 2026-06-28 — 30+ AJAN DENETİM TURU + düzeltmeler (otonom, Moses uzaktayken; main'de canlı):**
- **Denetim:** 24 bulucu × mercek (alan×lens) + her bulgu ayrı şüpheci doğrulayıcı (107 ajan, 5.4M token). **83 ham → 72 onaylı bulgu** (4 HIGH, 28 MED, 40 LOW). Düzeltilenler (her biri ayrı commit + push, zincir yeşil):
- **Batch 1 — Güvenlik (`0a17b11`):** (H1) profiles RLS `for all`→select+update; istemci artık kendi `plan`'ını yazamaz (Paddle/kota baypası kapandı). (H2/H3/M22) Paddle webhook aktif-abonelik olayında tanınmayan/eksik price'ta 'free'e DÜŞÜRMÜYOR (no-op) → ödeyen müşteri downgrade edilmiyor; yalnız canceled/paused → free. (M8) comments UPDATE policy proje erişimini re-check ediyor.
- **Batch 2 — cloud-save sertleştirme (`31f0635`):** paylaşılan projeyi ezmeme→kopya (M13), bulut hatasında yerel .json yedeği (M14), çift-kayıt in-flight guard (M18), auth.getUser reject yakalama (M21).
- **Batch 3 — ODA ADI VERİ KAYBI (`1a46c79`, HIGH H0+M0):** kaydet→aç turunda oda adı/tip/malzeme kayboluyordu (taze oturumda eşleşecek eski mahal yok → 'Mahal'a düşüyordu). RoomManager artık yüklenen mahalleri TOHUM alıyor (constructor + `seedSpaces`; store'a yazmadan eşleşme kaynağı) → 3 yükleme yolu (CanvasStage init/Toolbar Aç/CloudMenu) tohumluyor; eşleşme alan-ağırlıklı `polygonCentroid`'e geçti (kenar alt-bölününce ad kopmuyor). +3 test (document 158).
- **Batch 4 — doküman senkronu (`374fd46`):** CLAUDE.md collab/ai/sync/Supabase/Playwright drift'leri gerçekle eşitlendi; router.ts docstring (hız-öncelikli yönlendirme) düzeltildi.
- **✅ MOSES YAPTI (2026-06-28 18:03):** `supabase/schema.sql` prod'da tekrar çalıştırıldı → "Success. No rows returned". **H1 (plan self-upgrade açığı) + M8 (comments cross-project) artık CANLIDA kapalı.** (Tarayıcı uçtan-uca testi — oda adı geri geliyor mu? Ctrl+S bulut? — hâlâ Moses'ta.)
- **EK BATCH'LER (otonom, devam — main'de canlı):** Batch 5 select-tool (`9b10899`: M3 Escape jest-iptali + M4 tutamaç tık-eşiği, +3 test) · Batch 6 a11y (`470c75c`: M15 ShareDialog focus-trap, M16 CloudMenu klavye/aria, input label'ları, TR dilbilgisi) · Batch 7 engine perf (`c14c0f3`: M2 mahal hatch build/stroke ayrımı — zoom'da yeniden hesaplama yok) · Batch 8 robustness (`a649a6e`: M20 peer-cursor NaN/string doğrulama, L25 ödeyen-kullanıcı plan-sorgu hatası, L12 dosya-input temizleme) · Batch 9 DXF/charset fidelity (`328c220`: L8 $ACADVER AC1015, L9 blok layer-0 miras, L6 yorum ✓ glyph, +3 test) · Batch 10 (`0184a9b`: L5 opening konum-sürüklenmesi — plan/kesit/3B/metraj tek `openingCenterT`, +3 test).
- **⏸️ ERTELENEN (Moses görsel doğrulaması gerek):** M23 grid viewport-relative (core kamera/grid render + pan-perf etkisi → canlıda körlemesine değiştirmek riskli).
- **EK BATCH'LER 2 (otonom, devam):** B11 (`123cb13`: L13 orphan-blob, L16 3B-export toast, L18 collab hata, L26/L27 metin) · B12 (`6321de3`: L0-L3 geometry test boşlukları, +8 test) · B13 (`98259b9`: L4 nested-batch guard +test, L11 askCopilot AbortSignal, L22 ROOM_TYPE_KEYS tek kaynak, L21 dead askDesign sil) · B14 (`a2a7e43`: L20 layerLabels doğrulama, L23 parcelBounds dedup).
- **EK BATCH'LER 3 (otonom, kapanış):** B15 (`20fc409`: L17 Assistant hata-banner mode-scoped, L19 ProgramBuilder boş-girdi disabled) · B16 (`207b435`: L24 `EntityStore.byType<T>()` + 22 site sadeleştirme) · B17 (`2e53338`: L7 cull id-dizisi ayırmıyor `searchItems`, L14 CommandPalette combobox aria).
- **✅ DENETİM TURU KAPANDI:** 72 onaylı bulgunun otonom-güvenli olanlarının **TAMAMI** düzeltildi (17 batch, ~20 commit, hepsi yeşil zincir + push). 4 HIGH + tüm güvenli MEDIUM/LOW.
- **✅ SELF-REVIEW (oturum diff'i `e2d7711..HEAD`, 9 denetçi):** kendi ~22 commit'imde regresyon taraması → **1 onaylı regresyon** (oda-tohum `seededSpaces` erken-return'de sızıp sonraki model açılışına ad bulaştırabiliyordu) → tüketim recompute başına alındı + test (`22d34c7`). Diğer 8 alan temiz. Diff doğrulandı.
- **⏸️ YALNIZ MOSES YAPABİLİR (altyapı kararı / görsel doğrulama — otonom DOKUNULMADI):**
  - **M9/M11 Paddle event-sıralama (occurred_at idempotency):** profiles'a `plan_updated_at` kolonu + webhook'ta eski-olayı-atla → şema+ürün kararı.
  - **M10 ücretsiz kota sunucu-tarafı:** şu an istemci kapısı (UX); kesin sınır için DB trigger/RPC.
  - **M12 rate-limit:** in-memory limiter Vercel serverless'te etkisiz → Upstash/Redis gerek (maliyet kararı).
  - **M17 katman klavye:** sürükle-sırala/yeniden-adlandır klavyeyle (büyük UX işi, görsel doğrulama).
  - **M23 grid viewport-relative:** uzak/import çizimde ızgara kayboluyor; düzeltme core kamera/grid render + pan-perf → canlıda görsel doğrulama şart.
  - Bulgu tam dökümü: scratchpad/findings.json.

**🆕 2026-06-26 akşam — FAZ 3 BACKEND CANLI KURULDU + DXF renk + login cila:**
- **Supabase provizyon TAM:** Vercel env (URL + publishable + **secret** + 3 AI + collab; eski Clerk/DATABASE_URL silindi) · `supabase/schema.sql` çalıştırıldı (profiles/projects/members/comments + RLS + `models` bucket + trigger) · **Google OAuth açıldı** (Cloud OAuth client + redirect callback + Site URL=vesna.design + redirect `vesna.design/**`) · **Branding** (App name "Vesna Design" + logo + domain; Test modunda, verify gerekmez). Railway `ALLOWED_ORIGINS` ✓. → Giriş + bulut Kaydet/Aç **test edilmeye hazır** (Moses uçtan-uca deneyecek).
- **DXF/DWG renk içe-aktarma** (Rayon/AutoCAD deseni, araştırıldı): import edilen geometri KAYNAK rengini taşır (gerçek renkler→renkli wireframe çizgi; beyaz/siyah auto→poché native craft). Opsiyonel `Wall.color`/`Annotation.color` → format kırılmaz, sürüm artışı yok. render-wall + annotation tint + SVG/PDF export renk. +testler.
- **Login cilası:** /giris "Google ile devam et"e resmi 4-renk Google logosu; "Boş tuval" ipucuna ✕ kapatma; `apps/web/public/vesna-logo.png` (256² marka PNG, Google branding için üretildi).
- **main + varsayılan branch (`feat/phase-0-scaffold`) eşitlendi** (GitHub default 416 commit geride kalmıştı → fast-forward; ben her push'ta ikisini de senkron tutuyorum). **Test 412**, zincir yeşil. Yarın: `docs/YARIN.md` **7-saatlik program** (login paneli → bulut tamamlama → audit flag → Paddle → round-5).

**🆕 2026-06-27 — 7-SAATLİK PROGRAM TAMAM (`feat/login-cloud-2026-06-27`, Moses merge bekliyor):**
- **Blok 1 — Login:** /giris markalandı (logo+wordmark kart, gölge/ring, focus ring, spinner, durum-pill); **şifremi-unuttum modu** + yeni **`/sifre-sifirla`** sayfası (recovery linki /auth/callback kod-değişimiyle → yeni parola); AuthButtons **avatar + dropdown** (Uygulamaya git / Bulut projelerim / Çıkış); CloudMenu `?bulut=1` derin-linkle otomatik açılır.
- **Blok 2 — Faz 3 bulut:** **PAYLAŞIM** — `share_project`/`list_project_members` SQL definer RPC'leri (sahip-only, e-postayla uid çözer; RLS profiles'ı kilitler) + **ShareDialog** (e-posta+rol viewer/commenter/editor, üye listele/çıkar); CloudMenu liste UX (göreli tarih, arama, **Farklı kaydet**, **paylaşılan rozeti**, paylaşılanda "Kopyamı kaydet"); **PlanBadge** üst bar (profiles.plan, çıkışta temizlenir). *(Yorum kalıcılığı: yorumlar zaten entity → model JSON'da kalıcı; ayrı `comments` tablosu konum-modeli kararı gerektiriyor → FLAG.)*
- **Blok 3 — Audit flag:** engine `buildSheet` **build/stroke ayrımı** (zoom'da yalnız kontur Graphics re-stroke; dünya-ölçekli antet BitmapText bir kez); ShortcutsHelp **focus-trap** + role=dialog. *(Y-flip/renk AutoCAD + ?perf FPS + room-font remount GÖRSEL doğrulaması Moses'ta.)*
- **Blok 4 — Paddle İSKELET:** `lib/plan.ts` (plan/etiket/kota tek kaynak, enforcement YOK = ürün kararı); **env-gated `/api/paddle/webhook`** (node:crypto HMAC imza + replay/ts kontrol; SDK yok; anahtarsız 503-atıl); `.env.example` + **`docs/PADDLE-SETUP.md`** runbook. *(Canlı checkout = Paddle hesabı/anahtar + @paddle/paddle-js bağımlılık onayı → Moses.)*
- **Blok 5 — Denetim turu 5:** 3 paralel inceleme ajanı (auth/cloud-share/paddle-engine) → güvenlik tasarımı (RLS/RPC/imza/engine) **sağlam**; onaylı bulgular düzeltildi: paylaşılanda üzerine-yaz çöp-dosya bug'ı (HIGH), sessiz OAuth/recovery hatası (HIGH), webhook replay, signup metni, cleanup, a11y. **412 test korunur, zincir yeşil** (typecheck 9/9 · lint 9/9 · web build).
- **Moses adımları:** (1) `supabase/schema.sql`'i **tekrar çalıştır** (yeni share RPC'leri — idempotent). (2) Google OAuth'u Supabase'de aç (hâlâ "provider not enabled"). (3) Uçtan-uca tarayıcı testi: giriş→bulut kaydet/aç/**paylaş**→şifre sıfırla. (4) Branch'i main'e merge. → **(4) YAPILDI: main'e merge'lendi (aşağı bak).**

**🆕 2026-06-27 öğleden sonra — PADDLE CANLI CHECKOUT + ENFORCEMENT + MERGE (main'de, canlı):**
- **Branch main'e MERGE'LENDİ** (FF) + default branch (`feat/phase-0-scaffold`) senkron → tüm login/cloud/share/paddle işi **canlıda**. Son commit `a56713b`.
- **Paddle CANLI checkout (ADR-0048):** Moses "direkt canlı, sandbox yok" dedi + `@paddle/paddle-js` bağımlılık onayı verdi. `lib/paddle/checkout.ts` (env-gated Paddle.js singleton + openCheckout, `customData.user_id`) + `PlanCta` (fiyatlandırma CTA → giriş yoksa /giris, sonra checkout) + webhook price map `NEXT_PUBLIC_PADDLE_PRICE_*`. Webhook replay-penceresi KALDIRILDI (Paddle retry'leri aynı ts ile gelir → meşru retry'yi reddediyordu; güvenlik HMAC'te).
- **ENFORCEMENT (Moses: "3 proje + render kapalı"):** `/api/copilot` render branch **sunucu plan-gate** (ücretsiz/anonim → 402 + yükselt); CloudMenu ücretsiz **3 bulut proje** kotası (yeni/farklı-kaydet engellenir, üzerine-yaz serbest). `lib/plan.ts PLAN_QUOTAS`.
- **`/iade` (İade ve İptal Politikası)** sayfası + footer linki — Paddle domain onayı Kullanım Koşulları + Gizlilik + **İade**'ye link ister (yoktu → eklendi).
- **Paddle durum (Moses canlı kuruyor):** hesap onaylı (lixusai.com çalışıyor). `vesna.design` checkout **403** veriyordu → sebep **domain onayı**. Moses vesna.design'ı Paddle approved-domains'e ekledi → **"Pending"** (manuel inceleme, birkaç saat–1-2 gün). Onaylanınca checkout otomatik çalışır. Env'ler Vercel'de: `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN/PRICE_PRO/PRICE_STUDIO` + `PADDLE_WEBHOOK_SECRET` ✓. Webhook URL düzeltildi → `vesna.design/api/paddle/webhook`. Runbook: `docs/PADDLE-SETUP.md`.
- **Bekleyen Paddle:** domain "Approved" olunca gerçek kartla test alımı (Moses+ben). Webhook sıra-dışı-olay (occurred_at) TODO. `pdl_live_apikey_` kod kullanmıyor.

**AI ÇALIŞIYOR (canlı):** Üst araç çubuğu **Vesna** → Sor/Çiz/Render. Sağlayıcı adı UI'da gizli. Anahtarlar yalnız Vercel env (sunucu route `/api/copilot`, tarayıcıya sızmaz; `@zynpparti/ai` client'a import edilmez). Deploy: `docs/DEPLOY.md`.

**Otonom devam turu (2026-06-22 akşam, "30 dk durmadan", `feat/autonomous-30min`):**
- **Sol dock yeniden boyutlanabilir** (sağ dock gibi: sürükle-kol + localStorage, 180–480px; sol paneller w-full). *(önce yarıda kalmıştı, tamamlandı + main'e alındı)*
- **Kesit boşlukları (kapı/pencere void):** kesit çizgisi bir duvarı boşluk konumunda kesince kapı = zemin→lento açık, pencere = denizlik+lento bantları. Saf `solidBands(cut)` (document) hem SVG önizleme hem export'u sürüyor. +7 test.
- **Kalıcı A—A' kesit işareti:** ~~engine `setSectionMarker` handle (transient)~~ → **artık kalıcı `section` entity** (2026-06-23, ADR-0039). Çizilen kesit çizgisi planda ok+ekran-sabit etiketle kalır; kaydet/aç'a girer, undo'lanır, seçilebilir/taşınabilir/silinebilir. SectionPanel seçili/son kesiti gösterir; "Sil" = `RemoveEntity`.
- **Copilot oda-bazlı doğal ışık kuralı:** yaşam mahalleri (oturma/yatma/mutfak) çevre duvarında en az 1 pencere almalı (pencere↔oda eşleşmesi; bina-düzeyi orandan farklı). Atıflı İmar, info. +4 test.
- **Test: 247** (document 92 · geometry 43 · copilot 37 · engine 33 · io 27 · tools 15). Zincir yeşil (typecheck 7/7 · lint 7/7 · build 1/1).

**UI/dayanıklılık turu (2026-06-22, main'de, tarayıcı geri bildirimiyle):**
- **Playwright e2e kuruldu** (8 test: smoke/araçlar/paneller/duvar→mahal/Kaydet-Aç/DXF-SVG/Ctrl+A-Delete-undo) + CI job (her push). `pnpm --filter @zynpparti/web e2e`.
- **Stale-manifest KALICI fix:** `next.config experimental.devtoolSegmentExplorer:false` (Next 15.5 Segment Explorer kapatıldı).
- **Metin seçimi kapatıldı** (user-select:none; input hariç) — takılı mavi seçim bitti.
- **Pointer capture** — kutu-seçim panellere değince iptal olmuyor.
- **Dock layout** (Rayon/Figma deseni, 10-agent konsensüsü): üstte toolbar · sol dock | canvas | sağ dock · altta durum. Paneller canvas'ı/birbirini örtmüyor.
- **Bol hata-yakalama** (10-agent denetimi): React **ErrorBoundary** + global `unhandledrejection`/error + toast; RoomManager.findFaces / engine event-handler / room-font / extract / panel compute / io (NaN guard, per-entity, calibrate) try-catch; createCanvasApp init-hata ekranı.
- **Katman paneli:** emoji→SVG ikon (göz/kilit), kilitli=amber+ipucu, renk noktası, badge.
- **Panel aç/kapa hatırlama** (localStorage). PDF export decode guard.
- **Teşhis:** "seçilemiyor" = kullanıcı Mimari katmanını kilitlemiş (kod doğru); net ikonlar çözüyor.

**Devam turu (2026-06-22, "durmadan çalış, fazlara göre"):**
- **Durum çubuğu seçim özeti** (Duvar×N + toplam uzunluk).
- **Duvar yüksekliği** (`Wall.height?`) + PropertiesPanel + metraj sıvası duvar-başına yükseklik.
- **ŞEMATİK KESİT (Faz 3 başlık, ADR-0016/0037):** `computeSection` (saf+4 test) + **SectionTool (C)** + **SectionPanel** (SVG canlı kesit). Hafif şematik; 3B kesit Faz 5.
- **Sağ-tık bağlam menüsü** + **Komut paleti (Ctrl+K)** (ADR-0038).
- **Katman solo modu** ("yalnız bunu göster"); **kesit SVG export**; **kat yüksekliği copilot kuralı** (Wall.height, atıflı); **kısayol yardımı** yeni kısayolları listeler.
- **Dialog modal** (lib/dialog + DialogHost): yerel alert/confirm/prompt yerine temalı modal (Toolbar + annotation). Kalibrasyon prompt'u hâlâ native (packages/tools).
- **Test: ~237** (document 85 · geometry 43 · engine 33 · copilot 33 · io 27 · tools 15) + **e2e 12/12**. Zincir yeşil.

**Backlog turu 2 (2026-06-22, "1 saat durmadan"):**
- **Duvar malzemesi** (WALL_MATERIALS katalog + Wall.material + PropertiesPanel + metraj malzeme dağılımı).
- **Pafta antet alanları** (tarih + pafta no; SheetPanel + render-sheet).
- **Katman yeniden adlandırma** (çift-tık özel etiket, localStorage) + **solo modu**.
- **Yeniden boyutlanabilir sağ dock** (sürükle-kol + localStorage; paneller w-full).
- e2e: pafta yerleştirme (12 toplam).

**Kalan backlog:** katman sürükle-sırala/hiyerarşi, ek copilot kuralları (kat sayısı/pencere-oda eşlemesi gibi daha zengin veri gerekiyor), kesit kalıcılığı (entity), Yjs multiplayer (Faz 3, backend — büyük, Moses onayı bekliyor).

**Otonom tur (2026-06-22, `feat/autonomous-tour` branch'inde):** Moses geniş otonom yetki verdi (maliyetsiz/deterministik işler; silme/force-push yok). Yapılanlar (her biri ayrı commit + push):
1. **Snapping zenginleştirme** — orta nokta + kenar-üstü (dik) + **kesişim** yakalama; gösterge glyph türü (köşe/orta/kenar/kesişim). Artık CLAUDE §8.1'in tüm snap türleri gerçek (ADR-0024).
2. **DXF export tüm entity tipleri** (parsel/blok/ölçü/metin/boşluk; ADR-0025).
3. **SVG vektör export** (ADR-0026) + Toolbar "SVG İndir".
4. **Copilot 2 yeni kural** — oda asgari genişlik + parsel içinde kalma (ADR-0027).
5. **Doküman borcu**: ADR-0023..0027; DOMAIN.md + ARCHITECTURE.md STUB→gerçek.
6. **DXF import genişletme** — CIRCLE/ARC (segment) + TEXT/MTEXT (→Annotation).
7. **Model kaydet/aç (JSON)** — ilk kalıcılık (`document/serialize.ts`); Toolbar "Kaydet"/"Aç".
8. **RoomManager testleri** (çekirdek modül, testsizdi).
9. **.md denetimi** (4 paralel agent) → HIGH/MED bulgular düzeltildi (test sayıları, ADR-0011/0013 durum notu, FAZ2-NOTES checklist, UX-INTERACTIONS snap/dosya işlemleri, I18N çelişki notu, ENGINEERING-NOTES tembel-mahal düzeltmesi, ARCHITECTURE export atfı).
10. **Ctrl+S/Ctrl+O kısayolları** — JSON kaydet/aç (tarayıcı diyaloğu bastırılır).
11. **Alan-ağırlıklı `polygonCentroid`** (geometry) → mahal etiketleri (engine + SVG) daha iyi yerleşir; 2 kopya centroid silindi.
12. **Vektör export katman görünürlüğüne saygılı** — gizli katman DXF/SVG'ye gitmez (PNG zaten hariç tutuyordu).
13. **DXF export'ta mahal adı** TEXT olarak (oda merkezine) — AutoCAD'de oda etiketleri görünür.
14. **"Yeni" butonu** — dosya menüsünü tamamlar (Yeni/Kaydet/Aç), geri alınabilir + onaylı temizleme.
15. **Ortho/polar mod (`Shift`)** — duvar + ölçü çizerken yön 45°'ye kilitlenir (`geometry snapToAngle`, saf+test).

**Test: 225** (document 80 · geometry 43 · engine 31 · copilot 31 · io 25 · tools 15). Zincir yeşil (typecheck 7/7 · lint 7/7 · build 1/1).

**Açık not (Moses'a):** Tüm bu otonom tur `feat/autonomous-tour` branch'inde + push'lu; main'e **merge senin onayını bekliyor**. Sonraki büyük aday: şematik kesit (Faz 3, ADR-0016, deterministik) ya da Yjs multiplayer (Faz 3). Tarayıcı görsel doğrulaması (yeni snap glyph'leri, ortho çizim, SVG/JSON export, mahal etiket yerleşimi) **sende**.

**Son maliyetsiz tur (2026-06-21, hepsi main'de):** blok seç/taşı/döndür · mobilya çizelgesi/katmanı · Annotation (metin) + çift-tık düzenleme · kopyala-yapıştır/çoğalt (Ctrl+C/V/D) · **çoklu seçim (kutu/Shift + toplu)** · hizalama kılavuzları · yönetmelik turu 3 (TAKS+banyo) · hatch malzeme kütüphanesi · **pafta/sheet sistemi** · renk token konsolidasyonu · durum çubuğu · içeriğe sığdır (Home) · Ctrl+A + ok-itme · kısayol yardımı (?) · highlightEntity refactor + EraseTool tüm-tip · **özellikler paneli (seçili entity düzenleme)** · **PDF export (jsPDF)** · panel kaydırma fix + mahal satırı iki satır. **Test: 178 (document 69 · engine 31 · geometry 29 · copilot 26 · tools 12 · io 11).** Zincir yeşil (typecheck 7/7 · lint 7/7 · build 1/1). Son commit `9f1ce11`.

**Doküman senkronu (2026-06-21):** 6-agent doküman denetimi → kritik HIGH dokümanlar gerçekle senkronlandı (CLAUDE.md §2-5/§7/§10, ROADMAP, UX-INTERACTIONS, VISUAL-CRAFT, PRO-FEATURES). **Ertelenen (MED/LOW, Moses "yalnız HIGH" dedi):** DECISIONS ADR-0011/0013 superseded notu + Block/Annotation/Sheet için ADR; I18N-TEXT §2 (hardcoded TR ↔ "i18n EDİLMEZ" çelişkisi); TESTING sayıları; PERFORMANCE "uygulanacak"; FAZ2-NOTES checklist; DOMAIN.md + ARCHITECTURE.md hâlâ STUB; AI-AGENT-VISION arXiv ID'leri.

**Tarayıcı görsel doğrulaması Moses'ta:** blok sembolleri (onaylandı ✓), metin, çoklu seçim/kutu, pafta çerçevesi+antet, malzeme hatch, hizalama kılavuzları, durum çubuğu, kısayol katmanı.
**NOT (dev):** uzun HMR oturumunda Next devtools "stale manifest" 500 verebiliyor (kod değil) → `.next` silip `pnpm dev` ile temiz başlat.

**Son doğrulama (2B sonu):** typecheck 7/7 · test 6/6 paket (geometry 19, copilot 6, document 23…) · lint 7/7 · build 1/1. **Tarayıcı doğrulaması: ekran görüntüsüyle onaylandı** — metrik paneli (2 oda + tipler) + copilot TS 9111 dar-koridor bulgusu atıfla görünüyor.

**2A kararları:**
- **Oda tipi isimden TAHMİN EDİLMEZ** (Moses kararı): kullanıcı her mahale tip atar; metrikler ona göre gruplanır. Ad serbest, tip ayrı alan (`Space.roomType`).
- Net/brüt: centerline alanından duvar yarı-kalınlığı çıkarma/ekleme — birinci-derece yaklaşım (`ΔA = Σ kenar×kalınlık/2`), Clipper offset değil ama hızlı + dürüst. (`packages/document/src/metrics.ts`)
- Tip, ad gibi recompute boyunca centroid eşleştirmeyle korunur (RoomManager).

**2B kararları (ADR-0018):**
- Copilot öneri ayağı **önce LLM'siz** — saf TS deterministik kural motoru (`packages/copilot`). Atıflı bulgu = asıl değer; LLM doğal-dil katmanı sağlayıcı/maliyet kararından sonra (ADR-0006).
- **Seviye 1 (salt-okunur):** copilot modeli değiştirmez (AI-AGENT-VISION §2).
- geometry'ye `convexHull` + `polygonMinWidth` eklendi (koridor genişliği için).
- Türkçe yönetmelik **tohum** (ADR-0015): birkaç yüksek-değerli kural; ileride genişler.

**Net özellik durumu (çalışıyor mu?):**
- Duvar çiz (L) / seç-taşı (V) / sil (E) / undo-redo (Ctrl+Z/Y) → **ÇALIŞIYOR**
- DXF yükle + 2-nokta ölçekle (K) + DXF indir + PNG indir → **ÇALIŞIYOR**
- Otomatik mahal bulma + canlı m² + düzenlenebilir Türkçe ad → **ÇALIŞIYOR**
- **Mahal listesini Excel'e (.xlsx) aktarma → ÇALIŞIYOR** (RoomList "Excel İndir" butonu)
- Mahale **çift tık → ad düzenle**; araç **toggle** (tekrar bas→Seç); **Esc → her zaman Seç** → ÇALIŞIYOR (Faz 1 cilası)

**Faz 1 RESMEN KAPANDI ✅** (1A–1E + UX cilası). **Sıradaki: Faz 2** (AI render + copilot) — başlamadan Moses onayı + sağlayıcı/maliyet kararı beklenir (FAZ2-NOTES + ADR-0013..0016).

---

## FAZ 1 TAŞLARI (branch `feat/phase-1-drawing`):
- ✅ **1A — `packages/document`**: `EntityStore` + `Command` (Add/Remove/Update) + `History` (undo/redo). Saf TS, 13 test. Wall entity (segment+kalınlık, cm). Tüm zincir yeşil.
- ✅ **1B — engine entity render + mekânsal indeks**: `EntityLayer` (store aboneliği, dirty-render), `SpatialIndex` (rbush R-tree), `hitTest` (broad→narrow), viewport culling. Geometry: `distanceToSegment`/`closestPointOnSegment`/`pointInPolygon`. Web'de geçici demo duvarlar görünüyor. Test 38, zincir yeşil. (ENGINEERING-NOTES §2.)
- ✅ **1C — `packages/tools`**: xstate WallTool (idle→drawing zincir) + SelectTool (seç/sürükle-taşı/Delete) + EraseTool + `ToolManager` (kısayol: V/L/E, Ctrl+Z/Y), `createSnapper` (uç-nokta→ızgara). Engine'e tool routing + overlay + Space/orta-tuş pan. Web'de araç çubuğu. Test +9 (toplam 47). Zincir yeşil. Desen: ADR-0010. (xstate eklendi.)
- ✅ **1D — `packages/io`**: `importDxf` (LINE/LWPOLYLINE/POLYLINE→Wall, $INSUNITS→cm, katmanlar), `exportDxf` (R12 LINE), `computeScaleFactor`/`scaleWall`. `document`'e `BatchCommand` (tek-undo). CalibrateTool (K: 2 nokta→prompt→tüm doku ölçekle). Engine PNG export (Pixi extract). Web: DXF yükle/indir + PNG indir + Ölçekle. Test 56; zincir yeşil. Kapsam: ADR-0011. (dxf-parser eklendi.)
- ✅ **1E — mahal/m²**: geometry `findFaces` (planar graf yüz-bulma, ML değil; snap→kesişim böl→half-edge döngü→dış sınır at). document `Space` + `RoomManager` (duvar değişince canlı yeniden hesap, History dışı — ADR-0012). engine: `TR_CHARSET` + `installRoomFont` (BitmapText atlası Türkçe dahil), mahal dolgu+etiket render (z-katmanlı). web: mahal listesi paneli (düzenlenebilir ad + canlı m² + toplam) + **Excel (xlsx) export**. Test ~71. Zincir yeşil; dev temiz derlendi (2089 modül).

**Faz 1 TAMAMLANDI ✅** — tüm taşlar (1A–1E) bitti. Sıradaki: **Faz 2** (AI render + copilot) — başlamadan Moses onayı beklenir.

**Notlar / kararlar:**
- AI çağrıları için sağlayıcı-bağımsız adapter kararı eklendi (ADR-0006); Faz 0'da kurulmadı, Faz 2'de.
- pnpm 11 build-script bloklaması: `esbuild` + `sharp` `pnpm-workspace.yaml`'de izinli.

**Açık sorular / Moses'a sorulacak:** (yok)

---

## GÜNLÜK

### 2026-06-26 (gece — denetim turu 4: kapsam/polish) `feat/audit-deep-2026-06-26`
4. tur (19 ajan, kapsam/iyileştirme/completeness-critic): **12 onaylı (11 güvenli, 1 riskli flag)**. Hepsi düzeltildi, **407 test**, zincir yeşil:
- **export fidelity:** PNG export'a editör kromu (grid + overlay: seçim/snap/yorum/uzak-imleç) gömülüyordu → extract öncesi gizle/sonra geri al (vektör export'lar gibi temiz); SVG/PDF export'a **kalıcı kesit (A—A') işareti** girmiyordu → render + bounds eklendi (section-only model artık boş SVG vermiyor). +test.
- **AI Çiz:** applyLayout TÜM dış açıklıkları window'a zorluyordu → DESIGN_SYSTEM'in zorunlu giriş kapısını siliyordu. İç→kapı, dış→AI'ın kind'ine güven + failsafe (hiç dış kapı yoksa birini giriş yap) → her plan gerçek girişe sahip.
- **DXF robustness:** polyface/3B mesh POLYLINE çöp duvar üretiyordu (yüz-kayıtları origin'e) → atla; OCS −Z eksenel extrusion (ayna ARC/LWPOLYLINE/POLYLINE) → tf-kompozisyonla X-negate düzeltme. +2 test.
- **a11y:** `useFocusTrap` hook + DialogHost/Calibrate/Comment/CommandPalette'e role=dialog/aria-modal/aria-label + odak tuzağı; CommandPalette klavye-seçimi scrollIntoView + listbox/option rolleri.
- **güvenlik/sertleştirme:** schema models_shared_read uuid-cast guard (bucket'ta UUID-olmayan dosya tüm sorguyu düşürmesin); sync server global + oda-başı bağlantı sınırı (auth'suz public WS DoS); CLAUDE.md DWG ☐→✅ (kod gerçeğiyle senkron).
- **FLAG (riskli — yapılmadı):** DXF import katman/entity RENGİ atılıyor (flat-monokrom) → düzeltmesi feature (renk modeli + serialize sürüm artışı + render değişimi) → `docs/YARIN.md`, roadmap.

### 2026-06-26 (gece — UI istekleri + denetim turu 3) `feat/audit-deep-2026-06-26`
Moses tarayıcı testi (preview deploy) → istekler + 3. denetim turu (24 ajan, ~1.6M token). **DXF Y-flip matematiği rigor doğrulandı → bug YOK.**
- **Moses UI istekleri:** açılışta pafta/sayfa seed YOK (boş başla) · **chromeHidden=true** (sol+sağ dock gizli, temiz tam-genişlik tuval = 143612) · açılış kamerası zoom 0.5 (biraz uzaktan, origin) · **basit FPS sayacı** (FpsCounter, rAF, sol-alt) · **DXF Y-flip** (import+export, AutoCAD aynalama düzeldi).
- **Round-3 (bugünkü değişikliklerimin REGRESYONLARI — düzeltildi):** chromeHidden oda-adlandırmayı kırmıştı (RoomList sağ dock'ta) → space-activate + ilk-seçim panelleri açar (one-time guard); Aç/Import sonrası **zoomToFit yoktu** → origin'den uzak model boş-görünüyordu → pendingOpen/onFile/onOpenJson/CloudMenu.openProject hepsine eklendi; CollabControl crypto.randomUUID güvensiz bağlamda (LAN http) throw → Math.random fallback.
- **Perf (round-2/3 flag — YAPILDI):** `updateLineweights` zoom'da TÜM entity'leri yeniden çiziyordu → `appliedPx` ile yalnız görünür set; ekran-dışı stale, görünür olunca cull tazeler (O(görünür)). **Görsel zoom doğrulaması Moses'ta (FPS sayacı).**
- Round 4 (kapsam/polish/completeness) çalışıyor. Zincir yeşil, hepsi push'lu.

### 2026-06-26 (gece — derin denetim turu 2 + 12 düzeltme) `feat/audit-deep-2026-06-26`
İkinci, daha derin + "geliştir" odaklı **8-hedef workflow (25 ajan, ~1.5M token)** → **17 onaylı (hepsi güvenli)**; 12'si test-yazılarak düzeltildi, **3'ü riskli diye Moses'a flag'lendi** (körlemesine yapılmadı). Test **394→402**, zincir yeşil:
- **Bug'lar:** hatch sonsuz/patlayan döngü (devasa koord/küçük aralık → çizgi-cap+tam-sayı indeks); planar-faces ızgara-bucket snap hücre-sınırı çapraz ucu kaçırıyordu (komşu-hücre gerçek-mesafe); canvas-app SAĞ-tık eşleşmemiş pointerUp ile seçimi siliyordu (buton guard); **schema RLS karşılıklı özyineleme** (projects↔project_members → her listCloudProjects çöker → SECURITY DEFINER fn + members_self_read + paylaşılan-okuma storage policy); projects.ts paylaşılan yükleme caller-uid'den (404) → storage_path okur.
- **Geliştirmeler:** serialize version yok sayılıyordu (yeni dosya sessiz veri kaybı → daha-yeni sürümü reddet); copilot akış mutlak-deadline uzun yanıtı kesiyordu → `withIdleTimeout` (delta'da sıfırlanır); auth callback x-forwarded-host; View3D Escape+role=dialog (a11y); CanvasStage presence seçimi 200'le cap (büyük-seçim ağ/render uçurumu); **io ELLIPSE+SPLINE import** (sessizce düşüyordu); io DXF export HEADER ($INSUNITS=5)+LAYER tablosu.
- **FLAG (Moses — riskli, doğrulama gerek, körlemesine YAPILMADI):** (1) **DXF Y-ekseni hiç çevrilmiyor → AutoCAD'de dikey AYNALI** (HIGH interop; #1 iş akışı). Net fix var (IO sınırında Y-negate + yay yön) ama **AutoCAD'le doğrulama** gerek + canlıda mevcut tüm import'ları çevirir. (2) **engine updateLineweights zoom'da TÜM entity'leri yeniden çiziyor** (culling'i bozar, 500k'da zoom uçurumu; HIGH perf) — tarayıcı `?perf` FPS ölçümü + görünür-set lazy-redraw planı hazır. (3) **rooms.ts recompute her duvar düzenlemesinde TÜM odalara yeni id** (Graphics/BitmapText churn + seçim kaybı; LOW) — stabil-id diff'i belkemiği, tarayıcı doğrulaması ister.

### 2026-06-26 (gece — 25-ajan derin denetim turu 1 + 12 düzeltme) `feat/audit-deep-2026-06-26` (sweep+faz3 merge'li)
Moses "agentlarla tüm projeyi tara, hata bul, düzelt, geliştir, ~3 saat" dedi (gitti). Birleşik taban (sweep A–F + Faz 3 Supabase). **12-hedef derin denetim workflow'u (25 ajan, ~1.5M token)** → her bulgu adversaryal doğrulama → **12 onaylı (hepsi gerçek+güvenli, 0 riskli)**, hepsi test-yazılarak düzeltildi. Test **387→394**, zincir yeşil (typecheck 9/9 · lint 9/9 · web build):
- **geometry/hatch:** tarama paritesi reflex/tepe köşede ters dönüyordu (u-tabanlı kural) → projection-koordinat half-open. +test.
- **document (F-regresyonu!):** F-guard'ım kaydedilen modeli tekrar açmayı kırmış (Remove+Add aynı id → throw) → `replaceEntitiesCommands` (ortak id=Update); Toolbar+CloudMenu kullanıyor. +test.
- **engine/entity-bounds:** opening NaN/Infinity duvar kalınlığı (pad) rbush'ı zehirliyordu → pad finite-clamp. +test.
- **tools:** Ctrl+A gizli/kilitli katmanı seçiyordu (görsel sızıntı+kopya); OpeningTool kilitli duvara boşluk açıyordu → ikisi de skip kuralına uydu.
- **collab/sync:** acceptRemote entity.id===Y.Map-key doğrulamıyordu (peer store zehirleme/yetim) → kontrol eklendi.
- **ai/design:** extractJson ilk dengeli {} bloğu geçersizse pes ediyordu → sonraki bloğa devam. +test.
- **web/CloudMenu (HIGH):** stale currentId Yeni/yerel-Aç sonrası YANLIŞ bulut projesinin üstüne yazıyordu (veri kaybı) → `lib/cloud-project` paylaşılan store; Yeni/Aç temizler.
- **copilot:** asgari alan centerline (net değil) + genişlik centerline (net/clear değil) ölçüyordu → false-negative → `netGrossAreaM2`.netM2 + `representativeWallThickness` çıkarma. +test.
- **io/dxf:** LWPOLYLINE/POLYLINE bulge (yay) düz kirişe düşüyordu → tessellate (c-faktör merkez). +test.
- **supabase/schema:** comments.author NOT NULL + ON DELETE SET NULL çelişkisi (hesap silmeyi bloklar) → nullable.
- Round 2 (daha derin + "geliştir") workflow'u çalışıyor. **NOT:** bu branch sweep+faz3'ü içerir → Moses merge'lerken bunu tek başına alabilir.

### 2026-06-26 (YARIN-flag süpürmesi A–F + AI maliyet koruması) `feat/yarin-debt-sweep` (Moses merge bekliyor)
Moses "1. bugün A–F'yi yap, 2. Faz 3'ü de başlat; AI maliyet korumasını şimdi ekle" dedi. Test-önce, emin olarak. Test **367→387**, her commit yeşil + push (typecheck 9/9 · lint 9/9 · web build):
- **A geometry ★:** `polygonLabelPoint` artık kesin-içeride (scanline) fallback + sık ızgara → ince-kollu L/U odada etiket çentiğe/komşuya düşmüyor. `hatch clipLineToPolygon` ts'leri sıralayıp ÇİFT-aralık dolduruyor (parite) → U/L taramada çentik dolmuyor. +2 test.
- **B tools:** snapper'a `exclude` (ucu sürüklerken kendi diğer ucuna yapışmaz); ToolManager jest-ortasında klavye araç-değişimini yok sayar; `fitOpeningT` boşluğu duvara sığdırır (taşma yok, sığmazsa yerleştirme reddedilir). +3 test.
- **D AI maliyet (ADR-0019):** `timeout.ts withTimeout(ms,parent?)` — her ücretli AI çağrısına deadline (sohbet/tasarım/render); route `req.signal`'ı render+design'a geçiriyor (istemci kopunca iptal). +5 test.
- **E copilot:** `polygonNarrowWidth` (konkav-duyarlı, içe-normal ışın) → konveks-kabuğun kaçırdığı L koridorun dar kolunu (90cm) yakalar; koridor/oda/banyo denetimleri buna geçti. +5 test.
- **F document:** `BatchCommand` aynı id'ye iki kez dokunan batch'i yapım anında net hatayla reddeder (undo'da gizemli "entity bulunamadı" yerine fail-fast; uygulamada ulaşılmazdı). +1 test.
- **C perf (kısmi):** CanvasStage sayfa-sayacı O(n) tam-tarama → plain-sheet id Set'i (O(değişen)); engine `pruneEmptyLayers` toplu silmede O(katman×N) → onChange'de bir kez O(katman). ☐ Kalan (tarayıcı-ölçüm gerek, flag): `buildSheet` zoom'da tam rebuild (build/stroke ayır), `room-font` BitmapFont SPA-remount lifecycle.
- **Kalan (Moses ile):** G eski-kalan (findFaces hole-subtraction, a11y modal focus-trap, View3D slab-mirror, ALLOWED_ORIGINS Railway env), H Faz 3 backend+auth+kalıcılık (büyük — Moses infra/maliyet kararı bekliyor: DB + auth sağlayıcı).

### 2026-06-26 (Faz 3 başladı — Supabase backend) `feat/faz3-supabase` (Moses provizyon + test bekliyor)
Moses Faz 3 yönünü **Supabase (hepsi-bir-arada)** seçti (ADR-0047, Clerk planının yerine). Sıfır-riskli zemin + additive kod (anahtarsız anonim çalışır; build/typecheck/lint yeşil):
- **Zemin (provizyon unblock):** ADR-0047 · `supabase/schema.sql` (profiles/projects/project_members/comments + RLS + models Storage bucket + new-user trigger) · `docs/SUPABASE-SETUP.md` runbook · `.env.example` Supabase değişkenleri.
- **Auth (Clerk → Supabase):** `lib/supabase` (env/browser/server/service/middleware, additive) · `@supabase/ssr` oturum tazeleme middleware'i · `/giris` (e-posta+parola + Google OAuth) · `/auth/callback` · AuthButtons Supabase'e · ClerkProvider + `@clerk/nextjs` söküldü · yeni API anahtar formatı (`sb_publishable_`/`sb_secret_`, anon yedek).
- **Bulut Kaydet/Aç:** `lib/supabase/projects.ts` (save/list/load/delete — model = Storage'da `serializeModel` zarfı, §6.5) · toolbar **"Bulut"** menüsü (girişe kapılı, anonim akışı bozmaz).
- **Moses adımları (sonra):** Supabase projesi + `schema.sql` çalıştır + 3 anahtarı env'e koy → "hazır" → tarayıcıda birlikte doğrula (giriş→Buluta Kaydet→yenile→Aç). Sonraki: paylaşım (project_members) + Paddle abonelik.
- **NOT:** A–F süpürmesi + Faz 3 Supabase + bu denetim turu `feat/audit-deep-2026-06-26` branch'inde birleşti (sweep+faz3 merge'li).

### 2026-06-25 (gece geç — 8-ajan tüm-proje denetimi + düzeltmeler) main (canlı)
Moses "bol agent çalıştır, didik didik, emin ol düzelt" dedi (kendisi yok). 8 ajan tüm paketleri taradı; **onaylanan güvenli HIGH/MED'ler düzeltildi**, test 365→**367**:
- **Sayfa düzeltmeleri (önceki istek):** boş-export uyarısı nötr dil ("Projede dışa aktarılacak yapı yok"); StartScreen "Aç" bozuk-.json doğrulama+toast; AppGate ?ciz= hizalama; yorum-boyut + 3 sayısal PropertiesPanel girdisi onChange→onBlur (undo kirlenmesi); tek "Adsız Plan" sabiti.
- **engine:** entity-bounds NaN guard (wall/annotation/comment/sheet → rbush bozulması); onDblClick gizli/kilitli katmanı atlar.
- **collab (güvenlik):** room-labels uzak etiketleri `sanitizeLabel` ile doğrular (karantina baypası kapatıldı — sınırlı name, bilinen roomType enum).
- **io:** svg-export `region` artık KIRPAR (clipPath) → çok-sayfa PDF her sayfaya tüm çizimi basmıyordu, düzeldi; geçersiz region full-bounds'a düşer; $INSUNITS birim tablosu tamamlandı (mile/km/yard/dm…).
- **takeoff:** NaN Wall.height/storeyHeight metrajı zehirlemez (safeH/safeLen); boşluklar DUVAR-BAZINDA düşülür (dar duvardaki boşluk komşunun alanını çalmıyor); +2 regresyon testi.
- **web:** RoomList NaN guard ("NaN m²"/Excel); Assistant send() abort-yarışı (spinner) guard.
- **FLAG (Moses'a — riskli/büyük/dokümante, emin olmadan dokunulmadı):** geometry label-noktası-dışarı & hatch concave taşma (★, test gerek); engine BitmapFont remount lifecycle + sheet/zoom rebuild perf + pruneEmptyLayers perf; web pageCount O(n) tarama + StrictMode pendingOpen (dev-only); ai timeout yok + tier-abuse (maliyet, ADR-0019 ertelendi); copilot konkav-oda convex-hull genişliği; tools snap-to-self & mid-gesture tool-switch & opening-genişlik>duvar; BatchCommand Update+Remove-aynı-id (latent/ulaşılamaz). **Faz 3 backend/auth kalıcılığı hâlâ büyük eksik (bilinen).**
- Zincir yeşil (typecheck 9/9 · lint 9/9 · 367 test · web build). 7 commit + push.

### 2026-06-25 (gece — proje-adı + karşılama ekranı + çoklu-pafta + AI yerleştirme) `feat/project-name-sheets` → main (canlı)
Moses'ın büyük özellik isteği (5-agent haritalama + didik didik). Hepsi main'e merge + canlı. Test 359→**365**:
- **Proje adı:** `lib/project-name.ts` modül-store → 12 indirme sahası proje adını kullanır (zynpparti yerine) + üstte düzenlenebilir "Proje adı" alanı. sanitizeFilename (Türkçe korunur). İç `zynpparti.*` localStorage anahtarları korundu.
- **Karşılama ekranı (AppGate + StartScreen):** açılışta "Yeni proje" (isim→boş tuval) / "Aç" (.json→isim dosyadan). Collab `#room=` + `?ciz=` baypas (linkler bozulmaz). Yeni=boş (seedDemo `lib/app-start` köprüsüyle koşullu). Production-build screenshot ile doğrulandı.
- **Çoklu pafta:** `sheet.ts` saf helper'lar (makeSheet/nextSheetPosition/nextSheetNo +6 test). SheetPanel = yönetici: "+ Pafta ekle" (üst üste binmeyen oto-yerleşim + oto numara), "1/N yenile", "Git" (paftaya zoom). engine `zoomToBounds` eklendi.
- **AI "Çiz" yerleştirme:** plan viewport-merkeze (baktığın yere) gelir + konan plana zoom (H1 fix). applyLayout `target`+`bounds`.
- **Moses follow-up — "büyük kare" = BOŞ SAYFA (grid karesi), pafta DEĞİL:** Moses açılıştaki ızgara karesini ("bu sayfa") çoğaltmak istiyordu; ben yanlışlıkla PAFTA olarak yorumladım. **Pafta yaklaşımı geri alındı** (auto-pafta-on-open kaldırıldı; SheetPanel orijinaline — paftasız gizli; Pafta tool'u pre-existing kaldı). Yerine: **engine grid N "sayfa" (kare) çiziyor yan yana** (her biri sade kenarlıklı grid karesi — antet/ölçek yok, kasıtlı pafta-değil) + **canvas altında "− N sayfa +" kontrolü** (setPageCount + zoomToBounds). Yeni proje = 1 boş sayfa. **Playwright ile doğrulandı** (aç→1 sayfa; +×2→3 sayfa yan yana). **Yorum boyutu** (`Comment.size`) ve **çok-sayfa PDF (dolu pafta=sayfa, `exportSvg region`)** kodu duruyor (ayrı/uykuda).
- Flag (sonraki): sayfaların kalıcılığı/PDF-per-sayfa (şu an grid sayfaları görsel — UI state); AI tam tıkla-bırak ghost; sayfa içine çizim/organizasyon netleşsin.

### 2026-06-25 (akşam — Moses'ın 5-görev turu, aynı branch) `feat/autonomous-13h-2026-06-25`
Moses döndü, flag'lediğim 5 maddeyi onayladı/karar verdi → hepsi yapıldı (her biri yeşil + commit + push):
- **(2) Render hata sızıntısı — Seçenek A:** /api/copilot render hatası ham sağlayıcı mesajını artık YALNIZ sunucu loguna yazıyor; istemciye HTTP-durumundan türetilmiş sade kategori (erişim/kota/içerik/fatura/geçici) + model + dall-e-3 ipucu döner. Model-gizliliği persona'sıyla tutarlı.
- **(3) Perf turu — "en iyisi":** (a) **`?perf` HUD** — canlı FPS/ms/entity + sentetik 1k/10k/50k/100k duvar yükleyici (kalıcı dev aracı, prod'da kapalı). (b) **RoomManager cap** (>8000 duvar → findFaces O(n²) atla; donma koruması + test kapısı). (c) **reverse-index** — duvar sürüklerken `store.all()` O(n) tarama yerine `openingsByWall` O(boşluk). (d) **nearestAxis viewport** — hizalama şeridi tüm modeli değil görünür alanı tarar (CanvasHandle.viewportBounds). (e) **duvar hatch build/stroke ayrımı** — zoom'da wallQuad+hatchLines yeniden hesaplanmıyor (geometri cache). Hepsi `?perf` ile ölçülebilir.
- **(4) 3B GPU-fan:** View3D **on-demand render** — statik sahnede renderer.render çağrılmıyor (needsRender bayrağı; drag/tur/spin/clip/resize'da set). Fan/pil korunur, tur/spin akıcı kalır.
- **(5) Domain kararları (web araştırması: Rayon/Revit/Türk metraj/IBC/Solibri, kaynaklı):**
  - **Sıva iç/dış ayrımı:** duvar kaç odaya komşu (1=çevre→1 iç+1 dış cephe yüzü; 2=bölme→2 iç). Yeni `facadePlasterAreaM2` + ayrı "Dış cephe sıvası" maliyet kalemi (₺650/m²). Toplam yüzey aynı → ₺/m² ~değişmez, kırılım doğru.
  - **Süpürgelik oda-bazlı:** paylaşılan iç kapı iki odadan da düşülür (doğru), dış kapı bir, pencere asla.
  - **Daylight oda-başına:** bina-geneli `checkDaylight` kaldırıldı (oda-bazlı presence+oran kaldı; çift uyarı bitti).
  - **Calibrate tüm-çizim:** `scaleEntityAbout` — duvar+metin+ölçü+parsel+blok hepsi base etrafında tek-tip ölçeklenir (eskiden yalnız duvar). Ölçü uzunluğu a/b'den türer (çift uygulama yok).
- **Slab-mirror (3B zemin):** Moses ekran görüntüsü gösterdi. Analiz ettim — slab rotation +π/2 plan-y→world+z, **duvarlarla matematiksel olarak HİZALI**; körlemesine değiştirmek hizayı bozar → **DEĞİŞTİRMEDİM.** Görünen tutarsızlık muhtemelen gerçek oda geometrisi (ince/üçgen oda + kopuk gruplar). Moses asimetrik L-oda ile teyit edip onaylarsa tarayıcı oturumunda incelenir.
- Kalan (Moses): branch'i merge + tarayıcıda doğrula (özellikle ?perf 50k FPS, 3B fan, kalibrasyon, maliyet kırılımı); render-space/sheet hatch ayrımı follow-up (az entity). Test 351→**359**, zincir yeşil.

### 2026-06-25 (13-saat otonom sertleştirme turu) `feat/autonomous-13h-2026-06-25` (Moses merge bekliyor)
Moses 13 saat otonom çalışma istedi (didik didik, hatasız, sorma-ilerle). **7 paralel denetim agent'ı** (geometry+document / engine / tools+io / web-react+a11y / ai+copilot+collab / sync+auth+deploy / 3D-View3D) + **2 doğrulama agent'ı** (kendi diff'imin adversaryal review'u → **regresyon yok**; sayısal domain → 100× hatası yok, div-zero temiz). Yalnız test-doğrulanabilir / düşük-regresyon / maliyetsiz işler yapıldı; görsel/perf-refactor/ürün-kararı gerektirenler Moses'a flag'lendi. **18 fix-commit, her biri typecheck+test(+web build) yeşil + push:**
- **serialize derin doğrulama (KÜME 4):** Sheet/Block(kind∈BLOCK_DEFS)/Annotation/Section/Dimension tip-bazlı; gizli NaN/undefined-alan sınıfı kapandı. `isValidEntity` export edildi.
- **AI route sertleştirme (KÜME 3):** istemci `context` sanitize (rooms≤200/metrics≤50/findings≤50 + metin kırpma → token-DoS + sistem-prompt injection kapandı); design.ts boş-ad reddi + oda≤300 + summary≤280.
- **select-tool kilit-bypass (HIGH×2):** seçimden sonra katman kilitlenince handle-drag/taşı/ok-it/sil/x-döndür hâlâ mutasyon ediyordu → tüm mutasyon noktalarına `skip` filtresi.
- **dxf-export escaping (HIGH):** metin/katman içindeki newline tüm DXF'i bozuyordu → sanitizeText/sanitizeLayer; dxf-import LINE Array.isArray guard.
- **entity-bounds tek-geçiş (KÜME 2 perf):** `Math.min(...spread)`+`.map()` → tahsis-siz tek loop (NaN-dejenere semantiği korundu).
- **engine:** dash patlaması cap (zoom-in binlerce moveTo → tek katı çizgi); resize listener destroy temizliği.
- **collab karantina (KÜME 5):** uzak entity'ler `put` öncesi `isValidEntity`+isSyncable ile doğrulanıyor (bozuk peer store'u zehirleyemez, §6.4).
- **findFaces bileşen-bazlı dış sınır (HIGH geometry):** kopuk iç döngü (serbest kolon/çekirdek) mahali ÇİFT sayıyordu → union-find ile bileşen başına dış sınır atılır; tek-bileşende eski davranışla birebir.
- **web Assistant:** res.ok-önce-json (gateway 502 → "Unexpected token <" düzeldi), stream null-body/try-catch/reader.cancel, önceki controller abort; toast/chat **a11y** (role=status/log, aria-live, role=alert).
- **web:** export onClick guard'ları (RoomList/Takeoff Excel, Toolbar PNG) + SectionPanel render `computeSection` try/catch (panel çökmesi kapandı); CommandPalette pointermove re-render fırtınası; CanvasStage dock-resize + PlanGenerator timer unmount sızıntısı.
- **io:** içe-aktarılan metin yüksekliği [1,2000] cm clamp + non-finite konum guard.
- **sync sunucu sertleştirme:** maxPayload 2MB + heartbeat (hep açık) + `ALLOWED_ORIGINS` env ile opt-in origin allow-list (env yoksa eski davranış → canlı kırılmadı); DEPLOY.md güncellendi.
- **tools:** duvar yapıştırınca bağlı kapı/pencereler de gelir (saf `offsetClone` + wallId remap).
- **document:** 3B/kesit pencere lento yüksekliği tek-kaynağa bağlandı (220 vs 210 tutarsızlığı, §6.6).
- **web View3D:** GLB export cast guard + forceContextLoss (context sızıntısı). **test:** polygonLabelPoint kapsandı.
- **Moses'a FLAG (sonraki tur — körlemesine yapılmadı, doğrulama/karar gerek):**
  1. **render-mode hata mesajı** ham provider detayını sızdırıyor (2026-06-24 bilinçli teşhis) → pre-launch info-disclosure, gözden geçir.
  2. **findFaces** kapalı iç döngüde hole-subtraction yok (40000 yerine 30000 değil) → polygon-with-holes gerek.
  3. **Perf (500k, browser-doğrulama gerek):** engine `store.all()` wall→opening reverse-index, `nearestAxis` strip→viewport cap, render-wall/sheet/space hatch'i zoom'da yeniden hesaplama (build/stroke ayır).
  4. **View3D görsel:** asimetrik odada slab-mirror, render-loop on-demand (pil), clip-plane yön seçimi → tarayıcıda doğrula.
  5. **a11y:** modal'lara role=dialog+focus-trap+restore (DialogHost/Calibrate/Comment/CommandPalette/ContextMenu/View3D), form label htmlFor, ikon aria-label'ları.
  6. **domain yaklaşımları:** sıva ×2 dış-duvar fazla sayım, convex-hull min-genişlik concave koridorda false-neg, daylight bina+oda çift-rapor (belgeli — karar Moses).
  7. **ALLOWED_ORIGINS**'i Railway'de set et (sync origin koruması devreye girsin).
  8. **calibrate** yalnız duvar ölçekliyor (import'ta metin de var) → duvar+annotation mı, hepsi mi? (ürün kararı).

### 2026-06-24 (akşam — pazarlama redesign v2 + auth + 20-ajan QA denetimi) `feat/auth-clerk` (main'e merge bekliyor)
- **Pazarlama sitesi (claude.ai/design v2):** zengin landing — gerçek-app HeroMockup (araç çubuğu + KATMANLAR/BLOKLAR/COPİLOT + tutarlı 5-odalı kat planı + MAHAL/METRAJ/MALİYET/KESİT + AI render kartı), Marquee, interaktif PlanGenerator, Workflow, BeforeAfter (plan↔render kaydırıcı, illüstratif), açık/koyu tema toggle, mobil hamburger menü. Tailwind v4 arbitrary-value (`bg-[var(--bg)]`) — @theme güvenilmez çıktı. `/app` daima koyu (AppBodyLock).
- **Auth (Clerk) + Railway DB planı:** additif Clerk girişi (anahtar yoksa anonim çalışır), turbo.json'a CLERK/DATABASE_URL eklendi. ADR-0046 + docs/AUTH-SETUP.
- **favicon (app/icon.svg) + OG görseli (opengraph-image.tsx)** — OG Satori multi-child bug'ı düzeltildi (her paylaşımda 500 verirdi).
- **AI Çiz geometrik kapı/pencere kuralı** (dış duvar=pencere, iç=kapı) → "12 pencere" bug'ı çözüldü; özet "6 kapı, 6 pencere".
- **20-AJAN QA DENETİMİ (10 frontend + 10 backend, workflow):** 131 bulgu, 18 doğrulanmış kritik → 4 fix turunda düzeltildi: XFF spoofing (rate-limit), extractJson string-bug (AI plan parse), light scrollbar/kontrast, dialog race (yetim promise ×3), AbortSignal `chat()`, Anthropic refüzal stream, resolved-yorum hit-test, opening t-clamp, DXF arc NaN, takeoff/svg/metrics NaN guard'ları, BeforeAfter klavye/ARIA, toolbar aria-label, mobil nav, bol try/catch (tool diyalogları + CanvasStage + Assistant). CadMockup (orphan) silindi.
- Zincir yeşil her turda (typecheck 9/9 · ai 32 · document 109 · io 29 · engine 36 · tools 15 · lint · build). **Sıradaki: Moses tarayıcı testi + main'e merge + (sonra) auth anahtarları test.**

### 2026-06-24 (öğle-2 — fiyatlandırma sayfası + Paddle/iş modeli planı) **main'de, canlıda**
- **Fiyatlandırma sayfası** (`/fiyatlandirma`): 3 katman (Ücretsiz / Pro ~$12 / Stüdyo ~$29) + SSS, marka uyumlu. Ücretsiz→/app; ücretli planlar **"Yakında"** (gerçek checkout auth'a bağlı). Landing nav+footer'a "Fiyatlar" linki.
- **docs/BUSINESS-PRICING.md**: önerilen model (maliyetsiz çekirdek + kotalı AI + kredi paketi), **Paddle** (Merchant of Record — KDV/fatura Paddle'da) entegrasyon sırası ve **kritik bağımlılık: tahsilat auth'tan SONRA** (kim hangi planda → kota/gate). Rakamlar Moses onayı bekliyor (§6).
- **Ödeme sağlayıcı kararı:** Moses'ın mevcut **Paddle** hesabı (başka site için kurulu, doğrulanmış) Vesna için de kullanılacak — yeni ürün olarak eklenir. Stripe yerine Paddle (vergi/fatura kolaylığı).
- **Kurumsal e-posta beklemede:** Namecheap hesabı geçici kilitli (risk doğrulaması; descriptor `NAME-CHEAP.COM* WOMLLQ` ile açtırılacak). Email acil değil; iletişimde Gmail kalıyor.
- Zincir yeşil (typecheck 9/9 · lint 9/9 · build 1/1; /fiyatlandirma derlendi). Dev-mode CSS yarışı yüzünden yerel screenshot stilsiz çıktı — production'da tam stilli (landing aynı yöntemle doğru render).

### 2026-06-24 (öğle — satışa hazırlık: yasal sayfalar + landing) **main'de, canlıda**
- **Gizlilik Politikası** kısa→**15 bölümlük tam KVKK aydınlatma metni**; yeni **Kullanım Koşulları** (`/kosullar`) — AI sorumluluk reddi, veri kaybı, sorumluluk sınırı, TR hukuku. Durum çubuğunda iki link.
- **Landing/satış sayfası** (`/` kök): hero + 9 özellik kartı + "Neden Vesna" + CTA, marka uyumlu (Inter/iris/dark), statik (SEO/hız). **Uygulama `/`→`/app`'e taşındı**; yasal back-link'ler + CTA oraya. **RoomRedirect** eski collab linklerini (`/#room=`) `/app`'e yönlendirir (kopmaz). layout/metadata → Vesna.
- **Görsel doğrulama:** landing headless Chrome ile teyit edildi (profesyonel görünüm). Tüm rotalar 200 (`/`, `/app`, `/gizlilik`, `/kosullar`).
- **Satışa hazırlık sıradaki adımlar (Moses kararı bekliyor):** auth (Clerk/Supabase) · bulut kayıt (backend) · ödeme+paketler (Stripe + fiyat). Kurumsal e-posta: `iletisim@vesna.design` (DNS — Moses yapacak). Zincir yeşil (typecheck 9/9 · lint 9/9 · build 1/1).

### 2026-06-24 (sabah-2 — DWG canlı test + asistan meşgul göstergesi + doküman turu) `fix/openings-and-quickwins`
- **DWG gerçek dosya testi (Moses'ın .dwg'si):** annotation/scaling/multileader içeren mimari DWG Node'da çözüldü → **2337 duvar + 24 metin, in→cm (2.54)**, katmanlar tanındı (Arch_Section_Wall, Dim, Mleader…). `importDwg(content, wasmDir?)` opsiyonel dizin aldı (tarayıcı boş='/'; Node/sunucu node_modules wasm'ı) → **sunucu tarafı DWG yolu da açıldı**. MLEADER içeriği kısmi (libredwg sınırı), geometri sağlam.
- **Asistan meşgul göstergesi (Moses talebi):** çalışan mod sekmesinde (Sor/Çiz/Render) canlı nokta + etikete mod adı ("Çiz · plan üretiliyor") → başka sekmedeyken bile hangi sohbetin çalıştığı belli.
- **Doküman turu (Moses "hepsini bitir"):** **SECURITY.md** + **COMPLIANCE.md** (KVKK/GDPR) tohumdan büyütüldü (canlı ürün riski: gizlilik politikası + yurtdışı AI aktarımı eksik); **DEPLOY.md** runbook (env tablosu + belirti→çözüm + rollback); **FILE-FORMATS.md** oluşturuldu (zynpparti-model zarfı + import/export matrisi); **IDEAS.md** oluşturuldu (STATE backlog'u taşındı); **DECISIONS ADR-0045**; **CLAUDE.md §2** canlı duruma çekildi.
- Zincir yeşil (typecheck 9/9 · lint 9/9 · build 1/1).

### 2026-06-24 (sabah — YARIN §2 hızlı kazanımlar + kapı/pencere bug incelemesi) `fix/openings-and-quickwins`
- **🐞 Kapı/pencere bug incelendi → KODDA YOK:** Moses "kapılar pencere sayılıyor" gözlemini doğruladım: deterministik hat (design.ts parse → validateLayout → applyLayout → render-opening 2B → wall3d 3B → buildContext sayaç) **uçtan uca `kind`'ı koruyor, takas yok.** Sonuç: kod doğru; yanlışlık varsa **LLM etiketlemesi**. Önlem: DESIGN_SYSTEM prompt'u (iç boşluk=door, dış=window; "iç boşluğu window yapma") güçlendirildi. Canlı tekrar yanlışsa geometrik güvenlik ağı eklenecek.
- **AI boş-cevap fallback:** `askCopilot`/`askCopilotStream` artık boş/yalnız-boşluk yanıtı (veya hiç parça yaymayan akışı) **başarısızlık** sayıp sıradaki sağlayıcıya düşüyor (eskiden boş string "başarı"ydı → boş baloncuk). +3 test (mock sağlayıcı). ai testleri 29→32.
- **Temalı metin/yorum diyaloğu:** AnnotationTool + CommentTool `window.prompt` yerine `ctx.requestText` (temalı promptDialog) kullanıyor; yoksa window.prompt yedek. Asenkron akış.
- **Yorum düzenle/sil/çözüldü:** Yoruma çift tık → **CommentDialog** (calibrate-dialog deseni): metni düzenle, "çözüldü" işaretle, sil. `Comment.resolved` (serialize/clone spread ile otomatik); çözülmüş yorum soluk gri + ✓. Engine `setCommentActivateHandler` (dblclick → iğne kutu hit-test).
- **Render hata netleştirme:** /api/copilot render hatası gerçek OpenAI mesajını + model id'yi yüzeye çıkarıyor (model erişimi/fatura/içerik teşhisi kolaylaştı).
- Zincir yeşil (typecheck 9/9 · lint 9/9 · ~316 test · web build 1/1). **Tarayıcı doğrulaması (yorum diyaloğu, çözüldü işareti, metin diyaloğu) + main'e merge Moses'ta.**

### 2026-06-23 (gece-14 — CANLI YAYIN + hız routing + 5-ajan denetim turu)
- **🚀 YAYINDA:** Web → Vercel (`vesna.design` + `zynpp-arti-web.vercel.app`), Sync → Railway (`zynpparti-production.up.railway.app`, Root Directory=apps/sync). AI anahtarları Vercel env; `NEXT_PUBLIC_COLLAB_WS=wss://...railway.app`. AI ismi **Arki→Vesna** (domain). turbo.json'a build env'leri eklendi.
- **Hız routing (ölçümle):** OpenAI ~1.3sn, Claude ~2.7sn, Akash GLM-5.2 ~8sn (reasoning). Basit/orta→OpenAI, karmaşık→Claude, Akash yalnız yedek (router.ts).
- **5-ajan denetim + düzeltmeler:** (HIGH) DWG tarayıcıda bozuktu — `create('/')`→`//libredwg-web.wasm`; `WASM_DIR=''` düzeltti. (HIGH) Yorum render GPU sızıntısı → `destroy({children:true})`. (MED) View3D theta en-kısa-yol + viewCount reset; highlight.ts yorum kenarlığı; Assistant daktilo-yarım-kalma + akıllı auto-scroll; EmptyCanvasHint metni; dxf mm metin yüksekliği. (LOW) presence seçim temizliği. +5 test (document 109, copilot 43).
- Zincir yeşil (typecheck 9/9 · lint 9/9 · ~313 test · build 1/1).

### 2026-06-23 (gece-13 — DWG import + 3 collab/3B feature + hosting planı)
- **DWG import (Faz 1 boşluğu kapandı):** `packages/io/dwg-import.ts` libredwg-web (WASM) ile DWG→DXF→importDxf; wasm `apps/web/public`'te; "CAD Yükle" .dxf+.dwg. next.config'te node: şeması düzeltmesi. Gerçek AC1021 dosyayla Node'da doğrulandı.
- **Faz 5 kamera keyframe:** View3D'de görünüm yakala (📷) + yumuşak geçişli sunum (▶ Sunum).
- **Faz 3 presence-seçim:** uzak kullanıcıların seçtikleri renkli kutuyla görünür (awareness + entityBounds).
- **Faz 3 yorum/markup:** yeni Comment entity (💬 pin, "Yorum"/M aracı) — collab'la otomatik senkron; tam stack (render/bounds/hit/layer/serialize/clone).
- **Hosting (docs/DEPLOY.md):** Web→Vercel (ücretsiz), Sync→Railway (~$5/ay); domain önerisi arki.design/zynpparti.com. Maliyet ~$5/ay+domain. (Moses hesapları açacak + domain alacak.)
- Zincir yeşil (typecheck 9/9 · lint 9/9 · build 1/1; tüm paket testleri yeşil).

### 2026-06-23 (gece-12 — boşluk kapatma 2: 3B kesit + glTF + bloklar + yönetmelik)
- **Faz 5:** 3B'de **clipping-plane kesit** (✂ Kesit, kesit çizgisinden CSG'siz kesim) + **glTF/GLB export** (⤓ GLB).
- **Bloklar 12→22** (10-ajan web araştırması: kapı açılım yayı, çift kapı, araç, otopark, gardırop, komodin, yemek masası, sehpa, bulaşık mak., lavabo dolabı) + default sembol.
- **Faz 4:** ProgramBuilder'a komşuluk/istek girişi. **Collab:** link kopyalama toast'ı.
- **Yönetmelik düzeltmeleri (web-doğrulama ajanı):** tavan 240→**260** (m.28), banyo 3,0→**2,25** (m.29 dar kenar), daylight atfı İmar→"iyi pratik", otopark ifadesi (m.8/Ek-1), tüm İmar atıflarına **madde no**. copilot 42 test yeşil.
- **Senin yapman gerekenler:** (1) **DWG import** için bir gerçek `.dwg` dosyası ver (kütüphane kurup deneriz). (2) **Collab backend** (auth+kalıcılık) ve **paralı AI render/üretici** → hosting + bütçe kararı (ayrı faz). Bunlar frontend'de bitirilemez.
- Zincir yeşil (typecheck 9/9 · lint 9/9 · build 1/1; ~310 test).

### 2026-06-23 (gece-11 — denetim + boşluk kapatma turu)
- **Faz denetimi:** 8-ajan + tam kod taraması → ROADMAP faz işaretleri gerçeğe çekildi (her faza "GERÇEK DURUM"). Gerçek test: **307**. Konum: Faz 0–2 ✅, Faz 3 v1 (olgun kriterler açık), Faz 4/5 önizleme.
- **Kapatılan boşluklar:** Canlı link kopyalama **toast** geri bildirimi; **+10 blok** (10-ajan web araştırması: kapı açılım yayı, çift kapı, araç, otopark, gardırop, komodin, yemek masası+sandalye, sehpa, bulaşık mak., lavabo dolabı → 12'den **22 blok**); **glTF/GLB export** (Faz 5, three GLTFExporter); **Faz 4 komşuluk/istek girişi** (ProgramBuilder).
- **Kalan (altyapı/maliyet/dosya-testi gerektiren — bilinçli açık):** DWG import (WASM lib + gerçek dosya), collab auth/sunucu-kalıcılık/offline/multiplayer-undo/katman-döngü-invariant (backend + ARCHITECTURE spec), AI render "geometriyi koru" (ControlNet/GPU), gerçek 3B kesit (CSG), difüzyon üretici. Bunlar adanmış faz/efor ister; "unutulmuş" değil, ROADMAP'te işaretli.
- Zincir yeşil (typecheck 9/9 · lint 9/9 · build 1/1 · 307 test).

### 2026-06-23 (gece-10 — Faz 4 program girişi + Faz 3 collab olgunlaştırma)
- **Faz 4 — program girişi:** Çiz modunda "🏗️ Program ile çiz" → oda tipleri+adet+toplam m² seç → net/tutarlı tarif üretir (serbest metinden isabetli). `buildProgramPrompt` saf.
- **Faz 3 — presence imleçleri:** `packages/engine/presence.ts` (overlay'de uzak imleçler, kullanıcı başına renk). Hover multiplex (StatusBar + presence). Collab bağlıyken kendi imlecini Yjs awareness ile paylaşır, uzakları canlı çizer. CollabControl handle'ı yukarı verir (onHandle). Guard'lı.
- **Faz 3 — mahal-adı senkronu:** `RoomLabelSync` — adlar, merkez-tabanlı stabil anahtarla ayrı Y.Map'te paylaşılır (türetilmiş mahaller entity-senkron değil; ad kaybı çözüldü). 2-doc testleriyle doğrulandı (collab 8).
- İki sekme aynı odada: çizim + **imleçler** + **mahal adları** senkron. Zincir yeşil (typecheck 9/9 · lint 9/9 · collab 8 · engine 36 · build 1/1).

### 2026-06-23 (gece-9 — Faz 5 3B zenginleştirme: oda zeminleri + tur + PNG)
- **Oda zeminleri:** 3B'de her mahal, tipine göre **renkli döşeme** (2B dolgusunun 3B karşılığı) → odalar 3B'de okunur.
- **Otomatik kamera turu:** "▶ Tur" → kamera yavaşça döner (sunum hissi); sürüklerken durur.
- **3B PNG indir:** "⤓ PNG" → 3B görünümü dışa aktar (preserveDrawingBuffer).
- Faz 5 3B önizleme artık: boşluk-oyma (kapı/pencere) + renkli oda zeminleri + tur + PNG + hemisphere ışık.
- Zincir yeşil (typecheck 9/9 · lint 9/9 · build 1/1).

### 2026-06-23 (gece-8 — zen mod + havalı ölçekleme + Faz 5 derinleştirme)
- **Zen modu:** araç çubuğunda toggle → sol+sağ paneller gizlenir (sadece çalışma alanı). **Canlı Paylaş + 3B** sağ-üst tek kümeye taşındı. "?" = kısayol yardımı (token'landı).
- **Havalı ölçekleme:** native `window.prompt` → temalı **CalibrateDialog** (iris/Inter): ölçülen mesafeyi gösterir, gerçek cm sorar, **ölçek oranını canlı hesaplar** ("2.40× büyür"). ToolContext.requestCalibration + ölçü çizgisi parlak cyan. DialogHost da token'landı.
- **Faz 5 derinleştirme:** `wallBoxesWithOpenings` — 3B duvarlara **kapı/pencere boşlukları oyuluyor** (kapı: lento; pencere: denizlik+lento), +hemisphere ışık. Saf+test (document 105).
- **İkon-öncelikli araç çubuğu** (Lucide + custom CAD ikon) önceki turda; ikonlu, premium.
- Zincir yeşil (typecheck 9/9 · lint 9/9 · document 105 · build 1/1).

### 2026-06-23 (gece-7 — premium UI redesign (9-mercek web araştırması) + figür maskot)
- **9 ajan internette** mimari/CAD + premium koyu-tema (Rayon/Arcol/Figma/Linear/Vercel) araştırıp **redesign spec** üretti → uygulandı:
  - **Tasarım tokenları (globals.css):** 4 parlaklık-katmanlı yüzey (gölge değil luminans), 3 solid metin tonu, hairline border, **tek soğuk accent (iris #5B5BD6)**, semantik; amber yalnız Arki'de. **Inter** (next/font ~510) + tnum.
  - **Panel:** 32px CAPS başlık, surface-1 + hairline, özet rozeti. **Toolbar:** surface-2, pasif araçlar nötr, accent yalnız aktif araç + Arki CTA. **Chrome:** asistan paneli/başlık, durum çubuğu, dock tutamaçları, **engine tuval zemini #0E0E10**.
  - **Arki maskotu:** pergel değil → **inşaat kasklı gülümseyen figür** (gövde currentColor + amber baret + koyu gözler).
- Zincir yeşil (typecheck 9/9 · lint 9/9 · engine 36 · build 1/1).
- **Sıradaki premium adım:** Toolbar'da Lucide ikon+etiket (spec'in en yüksek-etkili kalan maddesi; lucide-react dep gerek) + data-row split-row (renk noktası) cilası.

### 2026-06-23 (gece-6 — vektör PDF + DXF blok + accordion + Arki araç çubuğuna)
- **#13 Vektör PDF:** PDF artık SVG'yi doğrudan gömüyor (svg2pdf.js — A1'de keskin); hata olursa raster'a düşer. Yeni bağımlılık onaylı.
- **#12 DXF blok (INSERT) import:** Blok referansları çözülüp içerik konum/ölçek/rotasyon dönüşümüyle (iç içe dahil) patlatılıyor → mobilya/sembol blokları kaybolmuyor. +2 test (io 29).
- **Sağ panel accordion:** Panel zaten katlanabilirdi; Metraj + **Yaklaşık Maliyet (ayrı accordion, toplam rozetli)** + Paftalar varsayılan KAPALI, yalnız **Mahal Listesi** açık (Panel storage v2 → varsayılanlar uygulanır). Maliyet, Metraj'dan ayrıldı.
- **Arki araç çubuğuna:** Sol-alttaki yüzen launcher kaldırıldı; Asistan kontrollü panel oldu, üst araç çubuğunda **PDF İndir yanında vurgulu "Arki AI"** butonu (mimari pergel + kıvılcım logosu) açıyor. Canvas artık yüzen butonla kapanmıyor.
- Zincir yeşil (typecheck 9/9 · lint 9/9 · build 1/1 · io 29).

### 2026-06-23 (gece-5 — UX düzeltmeleri + 8-mercek backlog uygulaması)
- **Canlı Paylaş kullanışlı:** pill'e **🔗 Link kopyala** (2. sekme/cihaz davet) + **✕ kapat** (bağlantıyı sök, URL temizle). **Kat yüksekliği**: çirkin native spinner → şık −/+ stepper. **3B/Canlı butonları** `fixed`→canvas içi `absolute` (sağ panele binmiyordu).
- **8-mercek uzman analizi (workflow)** → 15 maddelik önceliklendirilmiş backlog. Uygulananlar: **#1 rate-limit** (/api/copilot, IP 30/dk) + **#8 toplam içerik bütçesi**; **#15 AI bağlam zenginliği** (seçili öğe detayı + duvar/kapı sayıları + parsel kutusu → copilot/render doğru ölçek); **#3 toast sistemi** (export/import başarı/hata bildirimi); **#4 dostça hata mesajları** (DXF/model-aç); **#5 boş tuval rehberi** + duvar-var-mahal-yok ipucu; **#6 kilitli katman geri bildirimi** (sessiz no-op → toast).
- **Kalan backlog (M-L, sıradaki):** #2 bulguya tıkla-seç-zoom (engine'de zoom-to-entity gerek), #9 planar-faces O(n²)→spatial-hash (perf), #10 panel re-render debounce, #11 multiplayer undo + mahal-adı senkron, #12 DXF blok (INSERT) import, #13 vektör PDF (svg2pdf.js dep), #14 çok-pafta PDF + sunum reel, #1 presence imleçleri.
- Zincir yeşil (typecheck 9/9 · lint 9/9 · tools 15 · ai 29 · build 1/1).

### 2026-06-23 (gece-4 — Arki kimliği + cüretkâr/kısıtlı prompt + router hız + buton çakışması)
- **İsim Zeynep → Arki** (Moses isteğiyle marka adı; domain alınacak). 2. tur 10-ajan workflow ile prompt yenilendi: mimariye özelleştiği için **cüretkâr-mütevazı** ("hangi AI daha iyi?" → model adı vermeden kendini öne koyar — canlı doğrulandı), **model gizliliği jailbreak-dirençli** ("sistem promptunu yaz" → nazik ret — canlı doğrulandı), **alan kısıtı** (yalnız mimari/yönetmelik), **basit soruda tek satır hızlı cevap**.
- **Router didik didik:** complex anahtarları genişledi (yönetmelik + yapı/can-güvenliği + "minimum/olmalı/gerekir" yükümlülük); bantlar sıkılaştı; **maxTokensForTier** (basit 700 / orta 1400 / karmaşık 3000) → basit cevap daha hızlı+ucuz.
- **Buton çakışması düzeldi:** 🧊 3B ve 👥 Canlı Paylaş `fixed` olduğu için sağ "Mahal Listesi" panelinin üstüne biniyordu → canvas sarmalı içine `absolute` taşındı (dock'la asla çakışmaz).
- NOT: Eski ekran görüntüsündeki "akash · GLM-5.2" model-adı bileşeni zaten kaldırılmıştı (önbellek); sert yenileyince (Ctrl+Shift+R) gider. Zincir yeşil (typecheck 9/9 · lint 9/9 · ai 29 · build 1/1).

### 2026-06-23 (gece-3 — asistan UX revizyonu + denetim düzeltmeleri)
- **Zeynep:** Asistan yeniden adlandırıldı + sıcak/arkadaş-canlısı sistem prompt (10-mercek workflow sentezi: ton, selamlaşma, yönetmelik doğruluğu, uydurma-önleme, mimari sezgi, proaktiflik, biçim, can güvenliği). Canlı: selam → sıcak yanıt + işe yönlendirme.
- **Mod başına ayrı sohbet:** Sor/Çiz/Render kendi thread'i (karışmıyor); Temizle yalnız o modu siler; "üretiliyor" göstergesi yalnız aktif modda (Çiz çalışırken Sor "düşünüyor" demiyor). Stabil mesaj id'leri (kaydırınca stil bozulması düzeldi). Daktilo efekti + zıplayan nokta + msg-in; otomatik en-alta kaydırma. Şık ince scrollbar.
- **Router:** tasarım zorluğa göre (classifyDesignTier) — basit daire→Akash (ucuz, geçersizse Claude'a düşer), gelişmiş (villa/çok-katlı/parsel/yönetmelik)→Claude-önce.
- **Denetim düzeltmeleri (2 ajan):** RoomManager try/finally (zombi bug) + en-yakın merkez eşleşmesi; varyant puanı bir kez hesaplanıyor (O(n²) gitti). Metraj: duvar örgü m² (yükseklik×uzunluk), tavan + boya(duvar+tavan) ayrı; maliyet 2026 fiyatları güncellendi (örgü m² bazlı, sıva/boya ayrı).
- **Açık kalan denetim önerileri (büyük, sırada):** /api/copilot rate-limit (maliyet-DoS), findFaces duvar-boşluğu kapatma+uyarı, DXF blok (INSERT) import, akış hatalarını gövde-dışı verme, kitchen 3.3 m² gibi yönetmelik sayılarını doğrulama. Test ~302; zincir yeşil (typecheck 9/9 · lint 9/9 · build 1/1).

### 2026-06-23 (gece-2 — Claude anahtarı eklendi + faz cilası)
- **Claude aktif:** Moses ANTHROPIC_API_KEY'i girdi (satır başı `#` sorunu düzeltildi). Router artık karmaşık/yönetmelik/tasarım → **claude-opus-4-8**; canlı doğrulandı (TS 9111 sorusu Claude'dan atıflı cevap).
- **Faz 4 — varyant uyum puanlaması:** her varyant çizilmeden findFaces+runCopilotChecks ile puanlanır; kartta rozet (✓ uyumlu / ⚠ N uyarı), en uyumlu üstte. "Çoklu alternatif + puanlama" kabul kriteri.
- **Collab durum göstergesi:** CollabControl bağlanıyor/bağlı/kopuk + kişi sayısı (sunucu kapalıysa belli olur). **Render indirme** butonu.
- **(NOT: ZynppArti'yi kodlayan model = Claude Opus 4.8.)** Zincir yeşil (typecheck 9/9 · lint 9/9). Test 293.

### 2026-06-23 (gece — "üçünü de sırayla yap" turu: Faz 4 + Render + Collab)
- **Faz 4 — çoklu varyant (ADR kabul kriteri):** AI tek çağrıda 2 farklı plan üretir (`askDesignVariants` + `parseLayouts`); Asistan varyant kartları gösterir, kullanıcı seçer → Command ile çizer. Canlı: "60m²" → 2 plan.
- **AI Render (Faz 2C v1, ADR yok — Faz2 ayağı):** `render.ts` OpenAI görsel API'si (gpt-image-1); Asistan 3. mod **🖼️ Render** (program-farkında prompt = stil + oda/m²); görsel sohbette gösterilir. Canlı: gerçek 1024² render döndü. "Yaratıcı mod"; ControlNet (geometriyi koru) sonraki sağlayıcı.
- **Yjs Collab v1 (ADR-0044):** `packages/collab` EntitySync (store↔Y.Map echo-güvenli ayna; mahaller hariç) + `apps/sync` broadcast relay (`pnpm sync`, ws://localhost:1234) + CollabControl ("Canlı Paylaş", #room link). İki sekme aynı odada duvarları paylaşır. 4 test. v1 temel — undo/invariant/kalıcılık/auth follow-up (§6.4).
- **Test: 292** (collab 4 · ai 27). Zincir yeşil (typecheck 9/9 · lint 9/9 · build 1/1). **Moses'a:** Collab denemek için terminalde `pnpm sync` çalıştır + "Canlı Paylaş"a bas + linki 2. sekmede aç.

### 2026-06-23 (akşam — "1 saat durmadan" otonom AI turu)
- **Streaming** — Sor modu yanıtı kelime kelime akıyor (`chatStream`: Anthropic messages.stream / OpenAI-Akash stream:true; `askCopilotStream` akış-öncesi fallback; `/api/copilot` ReadableStream; istemci body stream okur).
- **Akıllı çizim** — design prompt m² hedefi (±%10) + parsel "kullanılabilir alan" hint'i; yerleşim parsel içine (sol-üst+çekme) ya da mevcut çizimin sağına (dx,dy offset).
- **Kapı/pencere üretimi (Faz 4 ilerleme)** — AI planı artık openings üretiyor; istemci en yakın duvara projeksiyonla (t) bağlıyor, tek BatchCommand'de (undo). Canlı: 90m² 3 oda → 4 kapı+4 pencere doğru yerleşti.
- **Canlı yaklaşık maliyet (PRO-FEATURES §2)** — `cost.ts` (saf) metraj×birim fiyat→TL; TakeoffPanel "Yaklaşık Maliyet" + Excel "Maliyet" sayfası (kaba/atıflı).
- **Panel kontrast fix** — Asistan paneli siyah-üstüne-siyah okunmuyordu → yüksek kontrast (neutral-800 + parlak yazı). **Test: 285.** Zincir yeşil.

### 2026-06-23 (gündüz)
- **ASİSTAN ARAYÜZÜ + AI TASARIM ÜRETİCİ (deneysel, ADR-0043):** (1) Yeni **Assistant** slide-over paneli (logo→tıkla→solda büyük panel; "Sor"+"Çiz" modu); sağlayıcı/model adı UI'dan kaldırıldı ("kendi AI'mız" hissi — CopilotChat silindi). (2) **Çiz modu = AI kat planı taslağı**: LLM katı JSON plan (cm duvarlar + oda etiketleri) üretir (`design.ts`, complex tier), istemci **Command ile çizer** (BatchCommand→undo), RoomManager mahalleri türetir, pointInPolygon ile adlandırır, zoom-to-fit. **Canlı doğrulandı:** "8x6m daire çiz" → GLM-5.2 geçerli plan → çiziliyor. Fikir 2'nin erken önizlemesi (Moses talebiyle öne çekildi; tam üretici Faz 4). **Test: 277** (ai 20: +design parse). Zincir yeşil (typecheck 8/8 · lint 8/8 · build 1/1). NOT: basit dikdörtgensel taslak; ölçüler kullanıcı kontrolünde.
- **3 SAĞLAYICILI AKILLI ROUTER + AkashML (ADR-0042):** Copilot artık soru zorluğuna göre otomatik sağlayıcı seçiyor + fallback yapıyor. **Akash** (`zai-org/GLM-5.2`, OpenAI-uyumlu, ucuz — çoğu trafik) · **OpenAI** (`gpt-5.4`, dar "orta" bant, nadir) · **Anthropic** (`claude-opus-4-8`, karmaşık/yönetmelik). `router.ts` classifyTier (Türkçe kw+uzunluk, tr-locale) + FALLBACK_CHAINS; `buildProviders` yalnız anahtarı olanı kurar (eksik = elenir, hata değil). AkashML `openai` SDK + baseURL (yeni dep yok). ADR-0041 inceleme bulguları katıldı (Anthropic kırpılma/refusal, OpenAI max_completion_tokens, genel hata mesajı, mesaj sınırı). Modeller `.env`'den ayarlanır. **Test: 271** (ai 14: prompt+router). Zincir yeşil (typecheck 8/8 · lint 8/8 · build 1/1). **Moses'a:** anahtarları `apps/web/.env.local`'a koy (Akash + OpenAI; Claude sonra).
- **PARALI AI BAŞLADI — Fikir 1: doğal-dil copilot (ADR-0041, ADR-0019 kapısı açıldı):** Kullanıcı serbest soru sorar, AI proje bağlamıyla (mahaller+metrik+deterministik bulgular+seçim) cevaplar. Yeni **`packages/ai`** sağlayıcı-bağımsız adapter (Anthropic `claude-opus-4-8` + OpenAI, resmî SDK'lar; `.env` seçimi, Anthropic önce). Sunucu route **`/api/copilot`** (Node, dynamic) → anahtar yalnız sunucuda (.env.local), tarayıcıya gitmez. İstemci **CopilotChat** bileşeni (sol dock, Copilot altında). Prompt kurma saf+7 test. **Streaming v1'de yok** (sonraki adım). **Moses'a:** OpenAI anahtarını `apps/web/.env.local`'a koy (`OPENAI_API_KEY=...`) + dev'i yeniden başlat → test. Claude anahtarı: adapter+UI hazır, "şimdi al" denince → `.env`'de `ANTHROPIC_API_KEY` + varsayılan Claude. ROADMAP "Paralı AI Ayağı" sırası #1 yapıldı (#2 render, #3 üretici sırada). **Test: 264** (ai 7). Zincir yeşil (typecheck 8/8 · lint 8/8 · build 1/1).
- **Copilot: 2 yeni atıflı kural (mevcut veriyle, çakışmasız):** (1) **ıslak hacim havalandırma** — banyo/WC çevresinde pencere yoksa info (İmar: doğal veya mekanik havalandırma şart). (2) **mahal-başına doğal aydınlatma oranı** — penceresi olan yaşam mahallerinde pencere/taban < ~%10 ise info (mevcut "pencere var mı?" presence kuralını tamamlar). Ortak `windowsServingRoom` helper'ı çıkarıldı (checkRoomDaylight refactor, davranış aynı). Bina-düzeyi `checkDaylight` ile kasıtlı tamamlayıcı (mahal bazlı + tıklanabilir). İnceleme agent'ı HIGH bulmadı; MED'ler (overlap/çift-sayım) JSDoc ile belgelendi. **Test: 257** (copilot 42: +5). Zincir yeşil.
- **Katman z-sırası: sürükle-sırala + akıllı hibrit bant (ADR-0040):** Katmanlar artık çizim z-sırasını da kontrol ediyor. EntityLayer 3 banta kurgulandı — ALT (sabit: pafta+oda dolguları), ORTA (katman-sıralı: çizgisel entity'ler, layerId başına container), ÜST (sabit: tüm etiketler). LayerState'e `order`/`setOrder`/`sortLayers`/`DEFAULT_LAYER_ORDER` eklendi (view-state). LayerPanel'de grip-tutamacıyla sürükle-sırala + localStorage kalıcılık (doğrulamalı). Boş katman container'ları budanıyor. **Hiyerarşi (gruplar) Faz 3'e (collab döngü-invariant'ları, §6.4) bilinçli ertelendi.** İnceleme agent'ı bulguları katıldı (grip-only draggable, container prune, localStorage doğrulama). **Test: 252** (engine 36: +sortLayers/setOrder). Zincir yeşil (typecheck 7/7 · lint 7/7 · build 1/1).
- **Kesit çizgisi artık kalıcı `section` entity'si (ADR-0039):** transient engine işareti → first-class entity. `SectionLine` (`type:'section'`, a/b/label) document'e eklendi; SectionTool `AddEntity` dispatch eder (undo + JSON kalıcılık). EntityLayer çizer (`render-section.ts` + kendi `sectionLayer`, ekran-sabit etiketler); engine'in `setSectionMarker`/`onSectionLine` yolu kaldırıldı (tek doğruluk kaynağı). hit-test/bounds/highlight/clone/snap + PropertiesPanel etiket düzenleme + LayerPanel/StatusBar "Kesit" katmanı eklendi. SectionPanel store'dan (seçili/son kesit) okur, "Sil" = `RemoveEntity`. Etiket = ilk boş harf (silince çakışmaz). İnceleme agent'ı (HIGH×2/MED×2 bulgu) önerileri katıldı: ekran-sabit etiket, çakışmayan etiket, ADR+STATE, etiket düzenleme UI, SECTION_COLOR tek kaynak. **Test: 249** (document 94: +clone/serialize section round-trip). Zincir yeşil (typecheck 7/7 · lint 7/7 · build 1/1).

### 2026-06-21
- **Doküman denetimi + kritik senkron:** Moses geniş yetki verdi + `.claude/settings.local.json`'a Read/Edit/Write/Glob/Grep/Agent izinleri eklendi (artık dosya işlemleri sormuyor). 6 paralel agent tüm `.md` dosyalarını denetledi → kritik HIGH dokümanlar gerçekle senkronlandı (CLAUDE.md envanter/§7/§10, ROADMAP fazları + ekstra-özellikler bölümü, UX-INTERACTIONS keymap, VISUAL-CRAFT done-işaretleri, PRO-FEATURES metraj/pafta yapıldı). MED/LOW bulgular Moses kararıyla ertelendi (bkz. ŞU AN). Commit `9f1ce11`.
- **Özellikler paneli (seçili entity düzenleme):** SelectTool seçimi `ToolContext.onSelectionChange` ile React'e yayınlıyor. `PropertiesPanel` tam 1 entity seçiliyken düzenleme sunar: **duvar kalınlığı**, **kapı/pencere genişliği + türü**, **metin içerik + yükseklik**, **blok 90° döndür** — hepsi undo'lanabilir UpdateEntity. Boşluk kapandı: yerleştirilen duvar/kapı ölçüleri artık sonradan değişebiliyor. Zincir yeşil (typecheck/lint/build).
- **Panel kaydırma DÜZELTİLDİ + Mahal satırı iki satır:** sağ/sol kolon kaydırma kabı `pointer-events-none` dış öğedeydi → fare tekerleği ve çubuk sürükleme çalışmıyordu (Moses bildirdi). Kaydırma **etkileşimli iç sarmalayıcıya** taşındı (`max-h-full overflow-y-auto`). Ayrıca Mahal Listesi satırı, malzeme dropdown'ı eklenince yatay taşıyordu → iki satıra bölündü (ad+alan / tip+malzeme). Tarayıcıda (headless screenshot) doğrulandı.
- **PDF export (jsPDF, ADR-0022):** Toolbar "PDF İndir" — tuval görüntüsünü orantı korunarak PDF sayfasına gömer (boyut/yön varsa ilk paftadan, yoksa A4 yatay). `jspdf` bağımlılığı (Moses onayı); `core-js` build pnpm-workspace'te reddedildi. Toolbar tek satır + genişlik sınırı + kbd→tooltip (paneller altına girmiyor, PDF butonu görünür). Tarayıcıda doğrulandı.
- **Kısayol yardım katmanı:** `ShortcutsHelp` — **?** ile aç/kapa + sağ-altta "?" düğmesi; araçlar/düzenleme/görünüm kısayollarını gruplu listeler (artan kısayol setini keşfedilebilir kılar, VISUAL-CRAFT §6). Kendi state'i + global keydown (input'ta yazarken yok sayar). Zincir yeşil.
- **Seçim UX: Ctrl+A + ok tuşuyla itme:** ToolManager **Ctrl+A** → tüm seçilebilir entity'leri (mahaller hariç) seç. SelectTool **ok tuşları** → seçili taşınabilirleri 10 cm (Shift ile 100 cm) it (tek BatchCommand undo). Çoklu seçim + offsetEntity üstüne. Zincir yeşil.
- **İçeriğe sığdır (zoom extents):** SpatialIndex `bounds()` (birleşik AABB, +1 test) → canvas-app `zoomToFit` (tüm entity'leri %10 boşlukla çerçeveler) + **Home** kısayolu + Toolbar "⊡ Sığdır" butonu. engine 31 test. Zincir yeşil.
- **Durum çubuğu (status bar):** alt-orta çubuk: imleç **dünya koordinatı (m)** + aktif araç adı. canvas-app `setHoverHandler` (pointermove'da dünya koordinatı, leave'de null). web `StatusBar` kendi state'ini tutar → her fare hareketinde yalnız o re-render olur (paneller etkilenmez). Zincir yeşil (typecheck/lint/build).
- **Test kapsamı turu 3:** document `materials.test` (materialById + katalog bütünlüğü: benzersiz id, geçerli alanlar, 4) + copilot `regulations.test` (citationOf biçimi + allRegulations bütünlüğü, 3). document 69, copilot 26. Zincir yeşil.
- **Cila + refactor: ortak `highlightEntity` (engine):** entity vurgu çizimi SelectTool'da private/büyük switch'ti; engine'e `highlightEntity` olarak çıkarıldı. SelectTool ona devrediyor (~50 satır + 4 import temizlendi); **EraseTool artık tüm tipleri** (blok/kapı/ölçü/parsel/metin/pafta) silmeden önce kırmızı vurguluyor (eskiden yalnız duvar — UX boşluğu kapandı). Zincir yeşil (typecheck 7/7 · tools 11 · lint 7/7 · build 1/1).
- **Test kapsamı turu 2:** engine `LayerState` (görünürlük/kilit/abonelik, 4) + `linetypes` dashSegment (sahte Graphics ile kısa-çizgi sayımı, 5) + `entityBounds` yeni tipler (parsel/blok/annotation/sheet, +4) + `hitTest` pafta-yalnız-çerçeve edge-case (+1). engine 30 test (eskiden 16). Zincir yeşil.
- **Test kapsamı turu 1:** boşluk (opening) binding geometrisi `opening.ts` (openingFrame/projectToWall) testsizdi → 7 test (yatay/dikey/dejenere duvar, jamb kenarları, dik uzaklık, t kırpma). io `dxf-export.ts` testsizdi → 4 test (ENTITIES/EOF sarmalama, duvar başına LINE, cm 4-ondalık + katman, boş girdi). document 65, io 11. Zincir yeşil.
- **Görsel zanaat: oda-tipi renk token konsolidasyonu (VISUAL-CRAFT §6):** oda-tipi renkleri iki yerde elle kopyalıydı (engine `ROOM_TYPE_FILL` + web `TYPE_COLOR`) → kayma riski. `ROOM_TYPES`'a kanonik `color` + `roomTypeColor()`/`toHexColor()` (document, tek kaynak). engine dolgu + web lejantı artık buradan türetiyor; iki kopya silindi. document 58 test (+2). Zincir yeşil. (Refactor + görsel tutarlılık.)
- **Pafta / sheet sistemi:** yeni `Sheet` entity (kağıt boyutu A4–A0 + yönelim + ölçek 1:N + antet alanları). document `sheet.ts` (ISO 216 boyutlar, `sheetModelSize` = kağıt-mm × ölçek/10, `sheetTitleBlock`; saf, +5 test). engine `render-sheet` (dış çerçeve + iç margin + sağ-alt antet kutusu/metinleri, en arka katman → çizimi kapatmaz) + bounds + hit-test (yalnız çerçeveden seçilir) + entity-layer sheetLayer + zoom redrawable. tools `SheetTool` (F kısayolu, tıkla→A3 yatay 1:50 yerleştir) + SelectTool taşı/vurgu/kopya (isClonable + offsetEntity 'sheet'). web Toolbar "Pafta" + LayerPanel "Paftalar" + **SheetPanel** (boyut/yön/ölçek/başlık/proje düzenle, sil). Zincir yeşil (typecheck 7/7 · document 56 test · lint 7/7 · build 1/1). NOT: dev tekrar stale-manifest 500 verdi (Next devtools, kod değil) → temiz restart.
- **Hatch malzeme kütüphanesi (zemin kaplaması):** geometry'ye `hatchPattern` (single/cross çapraz; +3 test). document `materials.ts` — `MATERIALS` kataloğu (Fayans/Parke/Laminat/Şap/Halı/Mermer/Doğal Taş: desen+açı+aralık+renk, saf) + `materialById`; `Space.material?` alanı; RoomManager malzemeyi de centroid eşleştirmeyle korur. engine `drawSpaceMaterial` (dünya-uzaylı çizgi, ekran-sabit hairline, dolgunun üstü/çevrenin altı) + entity-layer tek redrawable (çevre+hatch zoom'da birlikte). web RoomList'e malzeme seçici dropdown. Zincir yeşil (typecheck 7/7 · geometry 27 test · lint 7/7 · build 1/1).
- **Yönetmelik turu 3 (TAKS + banyo asgari alanı, ADR-0021):** copilot'a iki yeni atıflı bulgu, ek entity gerekmeden. **TAKS** (taban/parsel, kaba: mahal alanları toplamı / parsel alanı; tipik %40 üst sınırı aşınca hatırlatır, info). **Banyo asgari alanı** (İmar ~3,0 m², değer sürüme göre değişebildiği için info/hedge). copilot 23 test (+4). Zincir yeşil. Karar + varsayım DECISIONS ADR-0021'de.
- **Hizalama kılavuzları (smart snap):** snapper yeniden kurgulandı — öncelik **tam anahtar nokta** (duvar ucu/blok merkezi/ölçü ucu/metin/parsel köşesi, eskiden yalnız duvar ucu) → **eksen hizalama** (başka noktayla yatay/dikey hizalanınca pembe kılavuz + o eksene yakala, şerit rbush aramasıyla) → **ızgara**. `SnapHint` tipi engine'de (nokta + v/h kılavuz segmentleri); snap-indicator kılavuz çizgisi + elmas çiziyor. CanvasStage wiring güncellendi. snapper.test +2 (hizalama + nokta ipucu), tools 11 test. Zincir yeşil (typecheck 7/7 · lint 7/7 · build 1/1). Not: çok büyük modelde şerit araması çok aday dönebilir → ileride kademeli arama (PERFORMANCE.md).
- **Çoklu seçim (kutu/marquee + Shift + toplu taşı/sil/kopyala):** SelectTool tekil `selectedId`'den `selectedIds: Set`'e yeniden yazıldı. Boş alanda sürükle → **kutu seçim** (soluk dikdörtgen; kutuyla kesişen seçilebilir entity'ler, mahaller hariç, gizli/kilitli atlanır); **Shift-tık** ekle/çıkar; **Shift-kutu** mevcut seçime ekler. Sürükle → **çoklu taşıma** (tek BatchCommand undo; bağlı boşluklar duvarla gelir). **Delete** → toplu sil (duvar+boşlukları tek komut). Tutamaçlar yalnız **tek seçimde**. ToolManager kopyala-yapıştır panosu çokluya çıktı (BatchCommand). `getSelected`→`getSelectedEntities`, `selectExternal`→`selectMany`. Çekirdek hâlâ saf `offsetEntity`/`isClonable`. Zincir yeşil (typecheck 7/7 · tools 9 test · lint 7/7 · build 1/1). **Tarayıcı görsel doğrulaması Moses'ta** (büyük davranış değişikliği).
- **Kopyala-yapıştır / çoğalt (Ctrl+C/V/D):** document'e saf `clone.ts` (`offsetEntity` tüm tipleri kaydırır; `isClonable` → mahal türetilmiş/boşluk duvara bağlı olduğu için hariç; 7 test). ToolManager oturum-içi pano + Ctrl+C (kopyala), Ctrl+V (kaydırılmış kopya ekle→seç, tekrar V cascade), Ctrl+D (çoğalt). SelectTool'a `getSelected`/`selectExternal` ve `translate` ortak `offsetEntity`'ye devredildi (tekrar yok). Undo'lanabilir (AddEntity). Zincir yeşil (typecheck 7/7 · document 51 test · lint 7/7 · build 1/1).
- **Metin çift-tıkla yerinde düzenleme:** canvas-app çift-tık akışı genelleştirildi (mahal ad düzenlemenin yanına `setAnnotationActivateHandler`); açıklama metnine çift tık → mevcut metinle `window.prompt` → `UpdateEntity` (undo'lanabilir). Annotation aracını tamamlar. Zincir yeşil (typecheck/lint/build).
- **Açıklama/metin (Annotation) entity + aracı:** domain'de listeli (CLAUDE.md §7) ama yapılmamış çekirdek entity tamamlandı. document `Annotation` (position/text/height) + `annotation.ts` (`annotationSize`/`pointInAnnotation`, kaba AABB; 6 test). engine `buildAnnotation` (mevcut TR BitmapText atlasını yeniden kullanır, dünya-ölçekli) + entity-bounds + hit-test + entity-layer render branch (son else'ten önce — yoksa space sanardı). tools `AnnotationTool` (T kısayolu, tıkla→`window.prompt`→etiket; CalibrateTool deseni) + ToolManager + cursor. SelectTool: metin **taşınır + vurgulanır** (kutu). web Toolbar "Metin" butonu + LayerPanel "Notlar" katmanı (`layerId: 'annotation'`). Zincir yeşil (typecheck 7/7 · document 44 test · lint 7/7 · build 1/1). **Tarayıcı görsel doğrulaması Moses'ta.** (Not: yerinde düzenleme/dblclick ileride.)
- **Mobilya kendi katmanında ("Mobilya"):** bloklar artık `layerId: 'furniture'` (eskiden 'default'). engine `cull()` ve hit-test katman görünürlüğünü/kilidini zaten `layerId`'ye göre genel uyguladığından, bloklar LayerPanel'den **toplu gizlenip kilitlenebilir** oluyor (ek motor kodu yok). LayerPanel'e "Mobilya" adı + sıra eklendi. Zincir yeşil (typecheck/lint/build).
- **Mobilya çizelgesi (metraj):** `takeoff.ts` → `blockSchedule` (tipe göre adet, BLOCK_DEFS sırasıyla); `computeTakeoff`'a `blocks` parametresi (opts'tan önce). web TakeoffPanel: "Mobilya" bölümü (canlı adet) + Excel'e **Mobilya** sayfası. takeoff testleri imzaya uyarlandı + mobilya çizelgesi testi (document 39 test). Zincir yeşil (typecheck 7/7 · lint 7/7 · build 1/1).
- **Blok seç/taşı/döndür (SelectTool entegrasyonu):** gece eklenen blok kütüphanesi yerleştiriyordu ama yerleştirilen blok düzenlenemiyordu. SelectTool artık blokları **sürükleyerek taşıyor** (translate wall+block'a genelleştirildi), seçili bloku **`x` ile 90° döndürüyor** (BlockTool ile tutarlı), ve dönmüş ayak izinde **seçim/hover vurgusu** çiziyor. Mobilya gerçek ölçülü kaldığı için köşe tutamacıyla yeniden boyutlandırma yok (kasıtlı). Ayrıca blok geometrisinin (`blockCorners`/`pointInBlock`) **hiç testi yoktu** → `document/block.test.ts` eklendi (dönüş + konum, 6 test). Zincir yeşil (typecheck 7/7 · document 38 test · lint 7/7 · build 1/1). main'e merge + push (43f52ab). **Blok sembollerinin tarayıcı görsel doğrulaması Moses'ta.**

### 2026-06-20
- **Blok/mobilya kütüphanesi:** document `Block` entity + `block.ts` (BLOCK_DEFS: yatak/kanepe/koltuk/masa/klozet/lavabo/duş/küvet/ocak/buzdolabı/merdiven + boyut, blockCorners/pointInBlock). engine block-symbols (tip-üstü semboller) + render-block (konum/dönüş, ekran-sabit ince çizgi) + blockLayer + bounds/hit-test. tools BlockTool ('b' kısayolu, 'x' ile döndür) + ToolManager.setBlockKind. web BlockPalette (sol kolon, katlanabilir). Zincir yeşil; tarayıcı görsel doğrulaması yapılamadı (gece yarıda kesildi — sembolleri yarın gözden geçir).
- **Panel UX cilası:** ortak katlanabilir `Panel` bileşeni (başlık + ▾ katla/aç; kapalıyken ince sekme). Paneller sol/sağ **dikey kolonlarda** (CanvasStage, pointer-events-none kolon + auto içerik) → üst üste binmiyor (Metraj artık Mahal Listesi'nin altında, gap'li). RoomList/Takeoff/Copilot/LayerPanel hepsi Panel kullanıyor. Tarayıcıda doğrulandı (katlama + temiz tuval).
- **Düzenlenebilir tutamaçlar (SelectTool):** seçili entity'de tutamaç kareleri + sürükleme — duvar uçları, ölçü uçları + offset, parsel köşeleri (snap'li, canlı ghost, UpdateEntity). Parsel highlight de eklendi. Tarayıcıda doğrulandı (duvar seç → uç tutamaçları).
- **Daha çok yönetmelik + oda tipleri:** RoomType'a **Mutfak** + **Banyo/WC** eklendi (renk + dropdown + metrik gruplama). copilot: mutfak asgari alan (İmar 3,3 m²), banyo/ıslak hacim erişilebilir dönüş alanı (TS 9111 ~150 cm, info). copilot 19 test. (Merdiven ertelendi — stair entity gerekiyor.)
- **Katman kilitleme:** LayerState'e `locked` (isLocked/toggleLock) eklendi; kilitli katman görünür kalır ama hit-test atlar (seçilemez/silinemez/taşınamaz). hit-test param `skipLayer` = gizli||kilitli. LayerPanel'e 🔒/🔓 toggle.
- **Katman (layer) paneli + görünürlük:** engine `LayerState` (paylaşılan view-state, undo dışı) — EntityLayer cull'da gizli katmanı çizmez, hit-test gizli katmanı atlar (ToolContext.isLayerHidden). `CanvasHandle.layers` ile yayınlanır. web `LayerPanel` (Mimari/Mahaller/Parsel, göz aç-kapa + sayım). Tarayıcıda doğrulandı (Mahaller gizle → oda+etiket kaybolur, duvarlar kalır).
- **Hatch/poché malzeme dolgusu (VISUAL-CRAFT §3):** geometry `hatchLines` (paralel çizgileri poligona kırp, saf, 24 test). engine duvar render'ına 45° poché tarama (hairline, soluk, dünya-ölçekli aralık) — kesilen duvar hissi. Yeniden kullanılabilir (ileride malzeme hatch/section). Tarayıcıda doğrulandı.
- **Parsel sınırı + çekme (setback) denetimi (İmar):** document `Parcel` entity + geometry `distanceToPolygonBoundary`. engine `render-parcel` (zincir/dash-dot çizgi = mülk sınırı, en alt katman), bounds/hit-test. tools `ParcelTool` (R kısayolu, poligon: tıkla-tıkla-kapat). copilot `checkSetback` (yapı↔parsel min mesafe < ~3m → atıflı uyarı; setbackSide aktif, setbackFront hâlâ tohum). Toolbar "Parsel". geometry 21 + copilot 16 test. Tarayıcıda doğrulandı (~70cm çekme uyarısı + zincir parsel çizgisi).
- **Mahalleri tipe göre renklendirme (zoning/imar diyagramı, VISUAL-CRAFT §5):** mahal dolgusu `roomType`'a göre tint (yaşam/ıslak/yatma/sirkülasyon/servis/diğer); tip değişince canlı yeniden renklenir. RoomList'e eşleşen renk noktası (lejant). Dolgu opaklığı 0.16.
- **Seçim/hover cilası (VISUAL-CRAFT §5/§6 mikro-etkileşim):** SelectTool artık tüm tiplere (duvar/kapı/pencere/ölçü) vurgu çiziyor + boştayken imleç altında soluk **hover** vurgusu. Duvar Delete edilince bağlı boşluklar tek BatchCommand (SelectTool'da da). Genel `highlight()` ortak.
- **Ölçülendirme (Dimension) aracı:** document `Dimension` entity + `dimension.ts` (geometri + `formatLength`, 4 test). engine `render-dimension` (uzatma çizgileri + ölçü çizgisi + 45° mimari tikler, ekran-sabit ince + BitmapText değer), dimensionLayer, bounds + hit-test. tools `DimensionTool` (O kısayolu, 2 tık, snap). Toolbar "Ölçü". Tarayıcıda doğrulandı (5,00 m).
- **Görsel zanaat + yönetmelik turu 2:** (1) **çizgi tipleri** (`linetypes.ts`: DASH/DOT/CHAIN, ekran-sabit) + ızgara **major/minor** hiyerarşisi + duvar önizleme kesik çizgi. (2) **Pencere aracı** (DoorTool → genel `OpeningTool`, kapı+pencere; P kısayolu) + **İmar doğal aydınlatma denetimi** (pencere alanı/taban ~1/10, kaba bina-düzeyi, copilot 13 test). Tarayıcıda doğrulandı (pencere sembolü + aydınlatma uyarısı).
- **Adım 3 — Metraj (takeoff) paneli (PRO-FEATURES §1):** document'e `takeoff.ts` (`computeTakeoff`: duvar uzunluğu, sıva/boya m² [kat yüksekliği varsayımı, boşluklar düşülür], döşeme m², süpürgelik mt, kapı/pencere çizelgesi; 6 test). web `TakeoffPanel` canlı + düzenlenebilir kat yüksekliği + Excel (Metraj+Çizelge). NOT: ROADMAP'te Faz 3'tü; ADR-0019 (maliyetsizi öne al) gereği deterministik olduğu için erken yapıldı. Tarayıcıda doğrulandı.
- **Adım 2 — yönetmelik denetimi derinleştirildi (Opening entity, ADR-0020):** document'e `Opening` (kapı/pencere, duvara `t` ile parametrik binding) + `opening.ts` (openingFrame/projectToWall). engine: render-opening (boşluk kesimi + kapı kanadı/açılış yayı), openingLayer, hit-test + bounds (duvar çözümlü), duvar değişince boşluk takip eder. tools: DoorTool (D kısayolu) — duvara tıkla→kapı. EraseTool: duvar silinince bağlı boşluklar tek BatchCommand. copilot: **kapı genişliği (TS 9111) aktif** (dar kapı→uyarı), 11 test. Toolbar'a "Kapı" butonu. Tarayıcıda doğrulandı (kapı sembolleri + 70cm dar kapı→TS 9111 uyarısı).
- **Adım 1 — görsel zanaat (ADR yok, VISUAL-CRAFT §1):** çizgi kalınlığı hiyerarşisi (ekran-sabit, ISO 128 token'ları `lineweights.ts`), poché duvar gövdesi + kesit kenarı, mahal çevre çizgisi, hairline ızgara. EntityLayer.updateLineweights zoom'da konturları yeniler. main'e alındı (66fc7f3).
- **Yön ilkesi yazıldı (ADR-0019 + CLAUDE.md §0 kural 11-12):** (1) kalite tavanı yok — her parça en iyi haliyle, Rayon'u özellik+his olarak geç; (2) maliyetli AI'ı (render + LLM copilot) sona ertele, bedava kredilerle en iyi sağlayıcıyı seç. Deterministik/bedava her şey şimdi ve en iyi.
- **Yönetmelik tohumu genişletildi:** `regulations.ts` → kapı genişliği (TS 9111, 90 cm), ön/yan çekme (İmar) **bilgi tabanına** eklendi (status: pending — denetim parsel sınırı / Opening entity gelince aktifleşir); **otopark** (Otopark Yön.) → toplam alandan kaba tahmin **aktif info bulgusu**. `status` alanı ile aktif/tohum ayrımı. checks 8 test. Zincir yeşil.
- **Faz 2B — copilot kaynak-gösteren öneri TOHUMU TAMAM:** yeni `packages/copilot` (saf TS): `regulations.ts` (TS 9111 / İmar tohumu, atıflı) + `checks.ts` (`runCopilotChecks` → koridor genişliği + asgari alan, 6 test). geometry'ye `convexHull`+`polygonMinWidth` (3 test). `apps/web` `CopilotPanel` canlı, atıflı bulgu + sorumluluk reddi. Seviye 1 salt-okunur (ADR-0018). Zincir yeşil; tarayıcıda ekran görüntüsüyle doğrulandı (dar koridor → TS 9111 bulgusu).
- **Faz 2A — canlı metrik paneli TAMAM:** `packages/document` → yeni `metrics.ts` (saf TS: `computeMetrics`/`netGrossAreaM2`/`ROOM_TYPES`, 8 test) + `Space.roomType` alanı + RoomManager tip korur. `apps/web` RoomList → tip seçici (dropdown) + toplam/net/brüt + tipe göre dağılım + Excel'e Tip kolonu & Özet sayfası. Zincir yeşil. Oda tipi kullanıcı tarafından atanır (isimden tahmin YOK — Moses kararı).
- Faz 2 araştırma dokümanları ingest edildi: `PRO-FEATURES.md` + `AI-AGENT-VISION.md` (commit dc86420).

### 2026-06-19
- **Faz 1 RESMEN KAPANDI:** 1A (doküman çekirdeği) → 1B (engine+rbush) → 1C (xstate araçlar) → 1D (DXF io) → 1E (mahal/m²+Türkçe atlas) + UX cilası (çift-tık ad düzenle, araç toggle, Esc→Seç). Test ~71; zincir yeşil; main güncel. Faz 2 araştırması (FAZ2-NOTES, ADR-0013..0016) hazır.
- **Faz 0 tamamlandı:** monorepo (pnpm+turbo), Next.js+PixiJS pan/zoom canvas, geometry/engine testleri, CI. Branch `feat/phase-0-scaffold`. Doğrulama zinciri yeşil; dev HTTP 200.
- AI adapter tasarımı ADR-0006 olarak `docs/DECISIONS.md`'ye not düşüldü (provider-agnostic: Anthropic+OpenAI, statik + router/fallback).
- Proje başlatıldı. Rayon.design + AI render + tarayıcıda DWG/DXF + CRDT işbirliği araştırıldı (`docs/LANDSCAPE.md`).
- `CLAUDE.md` (anayasa) ve `docs/` iskeleti yazıldı.
- Kararlar: TypeScript-first stack, PixiJS render, Yjs-first collab, aşamalı AI render (görsel → 3D). Detay `docs/DECISIONS.md`.
