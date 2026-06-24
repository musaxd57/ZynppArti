# YARIN — Günlük çalışma planı

> Geçici çalışma dosyası (her gün güncellenir; tamamlananlar `docs/STATE.md`'ye geçince buradan silinir).
> Kalıcı ilerleme kaydı = `docs/STATE.md`. Bu dosya = "yarın nereden başlayalım".
> **Ritüel (her gün uyumadan):** ① bugünü STATE.md'ye yaz ② yarını buraya yaz ③ commit + push.

---

## ✅ 2026-06-24 gece — bugün ne yaptık (özet)
- **Promo videosu** gerçek app paritesine çekildi: mantıklı **3+1 plan + GİRİŞ KAPISI** + mutfak-koridor
  bitişiği; scrubbable zaman-çubuğu + tıkla-duraklat; 2 seçenek görünür; **GERÇEK 3B GIF** (View3D kaydı).
- **HeroMockup** aynı mantığa çekildi (giriş→Hol→ferah salon→3+1). **AI Çiz promptu**: zorunlu giriş kapısı +
  gerçekçilik + bağlama uygun oda adları. **Üst-üste etiket bug'ı**: `polygonLabelPoint` (erişilemezlik kutbu).
- **Maliyet** geliştirildi: elektrik+sıhhi tesisat + kategoriler + genel gider/kâr + ₺/m² + **düzenlenebilir
  birim fiyatlar** (localStorage) + gerçekçi 2026 TR rayiç (~14.5k ₺/m²).
- **2 denetim dalgası (22+13 ajan) + 1 tasarım araştırması (11 ajan, 104 ders)** koştu. Uygulandı:
  14 quick-win (klavye/toolbar/NaN-guard/stream-flush) + **Y1** (oda bire-bir eşleştirme — çift-ad bug) +
  **Y2** (artımlı viewport cull, 500k perf) + serialize derin doğrulama + store.emit dayanıklılık + tool
  gen-token (async diyalog yarışı) + dxf NaN-guard + **motion token + a11y tabanı** (focus-visible,
  reduced-motion, buton-press) + **Cmd+K ok-navigasyonu** + AuthButtons light-fix + **SEO** (robots/sitemap/OG).
- **Wave-2 regresyon kapatma:** R1 (comment-tool gen++), R2 (cull GC + prevVisible sızıntı), H5 (maliyet NaN).
- Hepsi yeşil (typecheck 9/9 · ~317 test · build) ve **main'e merge + canlı deploy** edildi.

---

## 🌅 YARIN — sıradaki tur (~2 saat, kök-neden kümeleri sırasıyla)

> Kaynak: 2026-06-24 gece denetimleri. Her küme bitince typecheck+test+build yeşil → commit → main merge → push.
> Tam raporlar: `tasks/wco1qdq91.output` (wave-2 bug), `tasks/wlinyl6yt.output` (tasarım 104 ders).

### KÜME 1 — Türetilmiş Space kimliği & kalıcılığı (EN YÜKSEK; tek çözüm 6 bulgu)
**R3, H4, M5, M6, M7, M10.** `RoomManager.recompute()` her sefer YENİ ID'li space üretiyor → undo/redo,
kaydet-aç, collab senkronu kullanıcı oda adı/tip/malzemesini kaybediyor.
- **Çözüm:** `packages/document` **centroid-anahtarlı kalıcı `RoomPropertyMap`** (name/roomType/material);
  recompute oradan uygular; History'ye girmez ama kaydet-aç'a **sidecar** olarak girer.
- M5: recompute Command-dışı mutasyon (§6.3) — `RoomCommand`'a sar veya istisnayı belgele + invariant testi.
- R3: `collab/room-labels.ts` init `initialized` bayrağı (başlangıç yarışı). M6: Toolbar.onOpenJson eşleme.

### KÜME 2 — Hot-path tahsis/spread (500k perf)
**M1, M2, M3, M4.** `Math.min(...xs)` spread + `.map()` ara dizi → kare başına milyonlarca tahsis.
- `engine/entity-bounds.ts` (aabbFrom/opening/block) → inline tek-geçiş min/max.
- `geometry/hatch.ts:77-78` clipLineToPolygon → O(n) tmin/tmax. `spatial-index.ts:45` updateBox (tek rebalance).
- `canvas-app.ts` pointer-move `getBoundingClientRect` cache (resize'da yenile). **CSS scale bölmeyi koru (§8.1).**

### KÜME 3 — AI route güvenlik + girdi doğrulama
**H6, M8, M9, H7.** `api/copilot/route.ts` + `ai/{design,router,copilot}.ts`.
- Hata mesajı genelleştir (ham `e.message` sızıntısı); rate-limit çok-instance + ölü cleanup + `x-real-ip` spoof.
- `design.ts`: count [1,10] clamp · yanıt JSON kontrolü · `hint` JSON.stringify escape · summary 200 char · boş-ad reddi.
- `router.ts`: soru `.slice(0,5000)`. **H7:** `askCopilot()`'a `signal` ekle (streaming-dışı iptal).

### KÜME 4 — serialize derin doğrulama kalan tipler
**H1.** `serialize.ts isValidEntity` genişlet: Sheet(size/orientation/scale/title) · Annotation(height) ·
Section(label) · Block(kind ∈ BLOCK_DEFS).

### KÜME 5 — collab dayanıklılık
**H2, H3, M11.** `sync.onRemote` → put öncesi `isValidEntity` (karantina) · echo origin `Symbol('EntitySync')` ·
`room-labels.applyLabel` dar try · `createCollab` bağlantı-hata callback.

### KÜME 6 — Erişilebilirlik (motion/focus tabanı bu tur yapıldı; kalan)
**H8, H9, M12.** Diyalog/modal `role=dialog`+`aria-modal`+`aria-labelledby` + focus trap/restore (DialogHost,
Calibrate, Comment, CommandPalette, ContextMenu, ShortcutsHelp; backdrop kapatma engelle). Form `<label htmlFor>`↔
`id` (PropertiesPanel/RoomList). Toaster `role=status aria-live=polite`. CanvasStage `role=application`. Toolbar/
BlockPalette ikon aria-label. ContextMenu ok-tuşu nav.

### KÜME 7 — Tasarım araştırması yüksek-etki kalanlar (104 ders)
Hero'yu **canlı mini-canvas** · ön-yüklü **"Vesna'yı Keşfet" örnek projesi** (boş tuvali yok et) · **/pricing
4-kart** · **floating toolbar + bağlamsal sağ panel** (Figma UI3) · **Radix 12-step OKLCH token sistemi**.

### HIZLI KAZANIMLAR (ilk yarım saat, tek-satır)
design.ts count clamp · router.ts slice(0,5000) · route.ts hata genelleştir · validateLayout boş-ad reddi ·
Toaster aria-live · Toolbar "CAD Yükle"/"Aç" aria-label.

### ❌ YANLIŞ-POZİTİF (yapma; rapor küçülttü)
copilot negatif-thickness/segment-epsilon/guard-sınır = kod doğru (test borcu) · `BatchCommand.invert` = güvenli ·
`room-labels s.name !== 'Mahal'` = kasıtlı.

---

## 📌 Açık notlar / kararlar
- "Clicked"/turuncu-logo promo GIF'inin İÇİNDE gömülü (ekran-kaydı aracı filigranı) → temizlemek için Moses'ın
  o aracın "tıklamaları göster"+filigran kapalı yeni kayıt atması lazım; gelince GIF değiştirilir.
- Railway sync **kalıcılık tutmuyor** (bilinçli v1).
- Akash GLM yavaş → yalnız yedek. Domain `vesna.design`; repo/paket kod adı ZynppArti.
