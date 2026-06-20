# STATE — Nerede kaldık?

> **Claude:** Her oturuma bunu okuyarak başla, oturum sonunda güncelle. Bu dosya "tek doğru" ilerleme kaydıdır.
> Format: en üstte güncel durum, altta kısa günlük (en yeni üstte).

---

## ŞU AN

**Faz:** 2 — AI Render + Copilot → **BAŞLADI**. **2A (canlı metrik) + 2B (copilot öneri tohumu) TAMAMLANDI** ✅
**Branch:** `feat/phase-2a-metrics` (push edildi)
**Durum:** Faz 1 + **2A canlı metrik paneli** (tip atama, toplam/net/brüt m², tipe göre dağılım, Excel) + **2B copilot kaynak-gösteren öneri** — `packages/copilot` deterministik kural motoru: çizdikçe **atıflı** yönetmelik bulguları (TS 9111 koridor ≥120 cm, İmar yatak ≥9 m² / oturma ≥12 m²) `CopilotPanel`'de canlı.

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

### 2026-06-20
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
