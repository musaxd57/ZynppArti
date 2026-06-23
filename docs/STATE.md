# STATE — Nerede kaldık?

> **Claude:** Her oturuma bunu okuyarak başla, oturum sonunda güncelle. Bu dosya "tek doğru" ilerleme kaydıdır.
> Format: en üstte güncel durum, altta kısa günlük (en yeni üstte).

---

## ŞU AN

**Faz:** 2 — AI Render + Copilot → **BAŞLADI**. **2A + 2B TAMAM** ✅. Maliyetsiz tur + UI/dayanıklılık turu sürüyor (ADR-0019).
**Branch:** `main` (güncel + push'lu). Otonom tur main'e merge edildi.
**Durum:** Faz 1 + 2A/2B + maliyetsiz tur + **Playwright e2e** + **dock layout** + **bol hata-yakalama**.

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

### 2026-06-23
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
