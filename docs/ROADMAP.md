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

## Faz 2 — AI Render + Copilot ⏳ KISMEN (2A+2B ✅; render + LLM ☐)
**Hedef:** Plandan görsel üret, kullanıcıya atıflı öneri + canlı metrik ver. (Detay: `docs/FAZ2-NOTES.md`.)
- [ ] ☐ `services/ai-render` — izole render servisi; **doğrudan API başlangıç, kuyruk yük artınca** (ADR-0017). Sağlayıcı (Replicate/Fal) + bütçe 2D'de test edilip seçilir, önce ücretsiz krediler *(maliyetli → ertelendi, ADR-0019)*
- [ ] ☐ **Uygulama içi canlı render paneli** (export-yükle değil; ADR-0013): plan/kesit → ControlNet + diffusion; "yaratıcı" + "geometriyi koru" modu; stil/malzeme; varyant *(maliyetli → ertelendi)*
- [ ] ☐ Render geçmişi + S3/R2 depolama + önbellek + kota
- [x] ✅ **Copilot (1) — kaynak-gösteren öneri (2B):** `packages/copilot` deterministik kural motoru; her bulgu atıflı (ADR-0014/0018). *(Doğal-dil LLM katmanı ☐ — maliyetli, ertelendi.)*
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

## Faz 3 — Gerçek Zamanlı İşbirliği
**Hedef:** Birden çok kişi aynı çizimde eş zamanlı.
- [ ] `packages/collab` — Yjs entegrasyonu, Command'leri CRDT'ye bağla
- [ ] `apps/sync` WebSocket sunucusu, presence (imleç/seçim)
- [ ] Yorum/markup, paylaşım linki, rol (editor/viewer) + izin
- [ ] Çevrimdışı + senkron
- [ ] **Hafif şematik kesit (ADR-0016):** duvarlara yükseklik özelliği + plana kesit çizgisi → ekstrüzyonla düzenlenebilir şematik kesit (gerçek kesitin ara yolu; tam 3B kesit Faz 5)
- [x] ✅ **Metraj paneli (`PRO-FEATURES.md §1`) — ADR-0019 ile öne çekildi:** duvar/mahal/kapı-pencereden otomatik miktar (sıva/boya m², döşeme m², süpürgelik, kapı/pencere + mobilya çizelgesi) → canlı tablo + Excel. *(Türkçe **poz/birim fiyat** entegrasyonu ☐ — hâlâ tohum.)*
- [x] ⏳ **Çizelge (schedule) motoru (`PRO-FEATURES.md §3`):** mahal listesi + kapı/pencere + mobilya çizelgeleri canlı (`takeoff.ts`). *(Genel "entity özelliği → tablo" soyutlaması ☐.)*
- [ ] ☐ **Canlı yaklaşık maliyet tohumu (`PRO-FEATURES.md §2`):** metraj × birim fiyat → TL bazında kaba canlı maliyet (detaylı hesap Faz 4)
**✅ Kabul:** İki kişi aynı anda çiziyor; duvar yüksekliğinden şematik kesit alınabiliyor. (Metraj/çizelge zaten canlı — öne çekildi.)

## Faz 4 — Boş Plandan Üretim
**Hedef:** AI'nın kendisi tasarım üretmesi.
- [ ] Program girişi (oda/m²/komşuluk = bubble diagram) + sınır girişi UI'si
- [ ] `services/ai-layout` — kural tabanlı + diffusion/GAN + LLM değerlendirme
- [ ] Çoklu alternatif üretip puanlama; çıktı **vektör** plan
- [ ] Otomatik kesit üretimi; insan + AI düzenleme döngüsü
**✅ Kabul:** Boş plan + istekten otomatik yerleşim ve kesit.

## Faz 5 — Gerçek 3D + Animasyon
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
