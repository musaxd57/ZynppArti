# ROADMAP — Faz detayları ve kabul kriterleri

> CLAUDE.md §10'un uzun hali. Her faz **çalışan, gösterilebilir bir ürünle** biter. Önceki faz bitmeden sonrakine geçilmez.
> İlerleme kaydı `docs/STATE.md`'de.

---

## Faz 0 — İskelet
**Hedef:** Üzerine inşa edilecek sağlam, çalışan temel.
- [ ] pnpm workspaces + Turborepo monorepo
- [ ] `apps/web` Next.js (App Router) + React + Tailwind + TypeScript strict
- [ ] ESLint + Prettier + Vitest + GitHub Actions CI (lint+typecheck+test)
- [ ] `packages/geometry` — temel `Document`/`Layer`/`Entity` + birim testleri
- [ ] `packages/engine` — PixiJS canvas, pan/zoom/grid
- [ ] `CLAUDE.md §3` komutlarını gerçek hale getir
**✅ Kabul:** Zoom'lanabilir boş tuval ekranda; `pnpm typecheck && pnpm test` yeşil.

## Faz 1 — Çizim + Import + Mahal
**Hedef:** AutoCAD planını al, düzenle, ölçülendir, mahalleri isimlendir.
- [ ] Çizim araçları: duvar, kapı/pencere, seç, taşı, sil (XState FSM)
- [ ] Command sistemi + undo/redo + snapping + katman + stil
- [ ] DXF import (sonra DWG/WASM + sunucu yedeği), katman eşleme
- [ ] 2-nokta ölçekleme (kalibrasyon)
- [ ] Duvarlardan otomatik mahal bulma + isim + canlı m²
- [ ] Mahal listesi tablosu → Excel; DXF/PDF/PNG export
**✅ Kabul:** AutoCAD'den DXF gelip ölçekleniyor, mahaller isimlenip m²'leniyor, tablo dışa aktarılıyor.

## Faz 2 — AI Render + Copilot
**Hedef:** Plandan görsel üret, kullanıcıya öneri ver.
- [ ] `services/ai-render` + BullMQ/Redis kuyruğu
- [ ] Plan/kesit → görsel (ControlNet + diffusion), stil/malzeme seçimi, varyant
- [ ] Render geçmişi + S3/R2 depolama + önbellek + kota
- [ ] AI Copilot (öneri): geometrik kural motoru + Claude API
**✅ Kabul:** Tek tıkla render + ilk akıllı öneriler.

## Faz 3 — Gerçek Zamanlı İşbirliği
**Hedef:** Birden çok kişi aynı çizimde eş zamanlı.
- [ ] `packages/collab` — Yjs entegrasyonu, Command'leri CRDT'ye bağla
- [ ] `apps/sync` WebSocket sunucusu, presence (imleç/seçim)
- [ ] Yorum/markup, paylaşım linki, rol (editor/viewer) + izin
- [ ] Çevrimdışı + senkron
**✅ Kabul:** İki kişi aynı anda çiziyor, değişiklikler anında birleşiyor.

## Faz 4 — Boş Plandan Üretim
**Hedef:** AI'nın kendisi tasarım üretmesi.
- [ ] Program girişi (oda/m²/komşuluk = bubble diagram) + sınır girişi UI'si
- [ ] `services/ai-layout` — kural tabanlı + diffusion/GAN + LLM değerlendirme
- [ ] Çoklu alternatif üretip puanlama; çıktı **vektör** plan
- [ ] Otomatik kesit üretimi; insan + AI düzenleme döngüsü
**✅ Kabul:** Boş plan + istekten otomatik yerleşim ve kesit.

## Faz 5 — Gerçek 3D + Animasyon
**Hedef:** Plandan 3D, klasik render, animasyon.
- [ ] 2D'den hacim (duvar yüksekliği, boşluklar, döşeme/tavan)
- [ ] Three.js / react-three-fiber görüntüleme, malzeme/ışık
- [ ] Kamera keyframe animasyonu + AI video; glTF/GLB export
**✅ Kabul:** Plandan 3B model + animasyonlu sunum.

## Faz 6 — Ölçek & Kurumsal
**Hedef:** Üretim ölçeğinde performans ve çok kiracılılık.
- [ ] Darboğaz geometri/render parçalarını Rust→WASM'e taşı
- [ ] Commit-log senkron + sürüm geçmişi/branch
- [ ] Multi-tenant, organizasyon/izin, gözlemlenebilirlik
- [ ] Ödeme/abonelik (editor ücretli, viewer ücretsiz — Rayon modeli)
**✅ Kabul:** 500k entity'de akıcı + sürüm kontrolü.
