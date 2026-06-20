# STATE — Nerede kaldık?

> **Claude:** Her oturuma bunu okuyarak başla, oturum sonunda güncelle. Bu dosya "tek doğru" ilerleme kaydıdır.
> Format: en üstte güncel durum, altta kısa günlük (en yeni üstte).

---

## ŞU AN

**Faz:** 2 — AI Render + Copilot → **BAŞLADI**. **2A (canlı metrik paneli) TAMAMLANDI** ✅ (Faz 0+1 bitti)
**Branch:** `feat/phase-2a-metrics`
**Durum:** Faz 1'in tüm özellikleri + **2A: mahal paneli canlı metrik paneline büyütüldü** — her mahale **tip atama** (Yaşam/Islak hacim/Yatma/Sirkülasyon/Servis/Diğer), **toplam/net/brüt m²**, **tipe göre m² dağılımı**, Excel'e Tip kolonu + Özet sayfası.

**Son doğrulama (2A sonu):** typecheck 6/6 · test 5 dosya (document 23) yeşil · lint 6/6 · build 1/1.

**2A kararları:**
- **Oda tipi isimden TAHMİN EDİLMEZ** (Moses kararı): kullanıcı her mahale tip atar; metrikler ona göre gruplanır. Ad serbest, tip ayrı alan (`Space.roomType`).
- Net/brüt: centerline alanından duvar yarı-kalınlığı çıkarma/ekleme — birinci-derece yaklaşım (`ΔA = Σ kenar×kalınlık/2`), Clipper offset değil ama hızlı + dürüst. (`packages/document/src/metrics.ts`)
- Tip, ad gibi recompute boyunca centroid eşleştirmeyle korunur (RoomManager).

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
- **Faz 2A — canlı metrik paneli TAMAM:** `packages/document` → yeni `metrics.ts` (saf TS: `computeMetrics`/`netGrossAreaM2`/`ROOM_TYPES`, 8 test) + `Space.roomType` alanı + RoomManager tip korur. `apps/web` RoomList → tip seçici (dropdown) + toplam/net/brüt + tipe göre dağılım + Excel'e Tip kolonu & Özet sayfası. Zincir yeşil. Oda tipi kullanıcı tarafından atanır (isimden tahmin YOK — Moses kararı).
- Faz 2 araştırma dokümanları ingest edildi: `PRO-FEATURES.md` + `AI-AGENT-VISION.md` (commit dc86420).

### 2026-06-19
- **Faz 1 RESMEN KAPANDI:** 1A (doküman çekirdeği) → 1B (engine+rbush) → 1C (xstate araçlar) → 1D (DXF io) → 1E (mahal/m²+Türkçe atlas) + UX cilası (çift-tık ad düzenle, araç toggle, Esc→Seç). Test ~71; zincir yeşil; main güncel. Faz 2 araştırması (FAZ2-NOTES, ADR-0013..0016) hazır.
- **Faz 0 tamamlandı:** monorepo (pnpm+turbo), Next.js+PixiJS pan/zoom canvas, geometry/engine testleri, CI. Branch `feat/phase-0-scaffold`. Doğrulama zinciri yeşil; dev HTTP 200.
- AI adapter tasarımı ADR-0006 olarak `docs/DECISIONS.md`'ye not düşüldü (provider-agnostic: Anthropic+OpenAI, statik + router/fallback).
- Proje başlatıldı. Rayon.design + AI render + tarayıcıda DWG/DXF + CRDT işbirliği araştırıldı (`docs/LANDSCAPE.md`).
- `CLAUDE.md` (anayasa) ve `docs/` iskeleti yazıldı.
- Kararlar: TypeScript-first stack, PixiJS render, Yjs-first collab, aşamalı AI render (görsel → 3D). Detay `docs/DECISIONS.md`.
