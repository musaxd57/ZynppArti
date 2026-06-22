# ARCHITECTURE — Detaylı mimari

> CLAUDE.md §6'nın uzun hali. Bu doküman **sevk edilmiş gerçeği** (Faz 1 + 2A/2B) yansıtır;
> ileri faz (collab/sync/persistence) parçaları "PLANLANAN" ile işaretlidir. Son güncelleme: 2026-06-22.

---

## 1. Şu anki veri akışı (sevk edilmiş)

```
React UI (apps/web)                    ← UI state: yerel useState
  │  kullanıcı olayı (pointer/klavye)
  ▼
ToolManager (packages/tools)           ← aktif araç + kısayol yönlendirme
  │  araçlar xstate FSM (WallTool, SelectTool, OpeningTool…)
  ▼
Command (packages/document)            ← AddEntity/RemoveEntity/UpdateEntity/BatchCommand
  │  history.dispatch(cmd)
  ▼
History (undo/redo yığını) ──apply()──► EntityStore (DOĞRULUK KAYNAĞI)
                                           │  değişiklik bildirimi (abonelik)
                            ┌──────────────┼───────────────┐
                            ▼              ▼                ▼
                     EntityLayer      RoomManager      React panelleri
                     (engine, PixiJS)  (mahal türetir)  (RoomList/Copilot…)
                     dirty-render      → AddEntity      canlı metrik/öneri
                            │             (History dışı)
                            ▼
                     SpatialIndex (rbush) — hit-test + culling + snapping
```

**Tek doğruluk kaynağı:** `EntityStore` (packages/document). React yalnız UI state tutar; doküman
entity'lerini tutmaz (CLAUDE.md §6.1). Engine store'a abone; sadece değişen + görünür entity'yi çizer.

## 2. Command sistemi (§6.3)

- **Modeli değiştiren her işlem bir Command'dir.** Doğrudan store yazımı yok.
- Sözleşme: her Command `apply(store)` ve `invert()` tanımlar; undo/redo = invert/apply yığını.
- **Çekirdek komutlar** (document/command.ts): `AddEntity`, `RemoveEntity`, `UpdateEntity`.
- **BatchCommand** — birden çok komutu **tek undo birimi** yapar (ör. duvar + bağlı boşlukları birlikte
  sil; çoklu seçim taşıma; ok-itme). Atomik apply/invert.
- **History** — `dispatch(cmd)` uygular + undo yığınına iter, redo yığınını temizler. `undo()`/`redo()`.

## 3. Türetilmiş veri akışı: RoomManager

Duvar değişince `RoomManager` mahalleri yeniden hesaplar (`findFaces`, geometry). Sonuç Space
entity'leri **Command ile** uygulanır ama **History dışı** (ADR-0012) — undo duvarı geri alır, mahal
kendiliğinden yeniden türetilir. Ad/tip/malzeme recompute boyunca **centroid eşleştirmeyle** korunur.

## 4. Engine (packages/engine, PixiJS/WebGL)

- **EntityLayer:** store aboneliği + dirty-render (yalnız değişeni yeniden çiz). Tip başına render
  fonksiyonu (render-wall/opening/space/dimension/parcel/block/annotation/sheet).
- **SpatialIndex (rbush R-tree):** broad phase (AABB aday) → narrow phase (kesin geometri). hit-test +
  viewport culling + snapping bunu kullanır (ENGINEERING-NOTES §2). `bounds()` = birleşik AABB (zoom-fit).
- **Snapping:** uç/orta nokta + kenar-üstü (dik) + eksen-hizalama + ızgara (ADR-0024). Ekran-sabit
  yarıçap. `SnapHint` göstergeye glyph türü (köşe/orta/kenar) taşır.
- **Koordinat tuzağı:** ekran→dünya dönüşümünde CSS scale faktörüne bölünür (CLAUDE.md §8.1).
- **Metin:** TR karakter atlası BitmapText (room-font.ts). **PLANLANAN:** MSDF → vektör metin geçişi.
- **LayerState:** görünürlük + kilit (undo dışı view-state).

## 5. Araçlar (packages/tools, xstate)

Her araç bir `SceneTool`; çizim araçları xstate FSM (durum) + sınıf (yan etki) deseni (ADR-0010).
`ToolContext` araçlara servis verir: store, history, index, overlay, `snap()`, `pixelSize()`,
katman gizli/kilit sorguları, seçim değişim callback'i. `ToolManager` kısayol + aktif araç yönetir.

## 6. Export hattı (packages/io)

`packages/io` (saf TS):
- **DXF import:** `dxf-parser` (LINE/LWPOLYLINE/POLYLINE → Wall, CIRCLE/ARC → segment, TEXT/MTEXT →
  Annotation, $INSUNITS → cm, katman eşleme).
- **DXF export:** tüm entity'ler (ADR-0025) — LINE/LWPOLYLINE/TEXT (minimal R12 tarzı).
- **SVG export:** vektör (ADR-0026) — viewBox auto-fit.
- **Kalibrasyon:** 2 nokta + gerçek mesafe → `computeScaleFactor` → tüm çizim ölçeklenir.

`packages/io` DIŞINDA (DOM/kütüphane gerektirir):
- **PNG:** engine Pixi extract (`canvas-app.ts`) → Toolbar indirir.
- **PDF:** jsPDF (raster gömme, ADR-0022) — `apps/web` Toolbar.
- **Excel (.xlsx):** `xlsx` — `apps/web` RoomList/TakeoffPanel (mahal listesi + metraj).

## 7. PLANLANAN — collab / sync / persistence (Faz 3+)

> Bunlar **henüz kod değil**; CLAUDE.md §6.4–6.7'nin tasarım hedefleri. Uygulanınca buraya detay gelir.

- **Collab (Faz 3):** Yjs + Hocuspocus (presence + offline + merge). Katman hiyerarşisi baştan
  **döngüsüz invariant** ile kurulur (CRDT tek başına garanti etmez). Alternatif: Loro Tree CRDT.
- **Multiplayer undo/redo köşe durumları:** (ör. ben rengi değiştirdim, başkası nesneyi sildi →
  ben undo yaparsam?) **uydurulmaz** — uygulama anında tek tek burada tanımlanacak (CLAUDE.md §6.4).
- **North star — commit-log:** istemci diff/commit üretir → merkezi otorite invariant kontrol eder →
  geçerse uygular + yayar; çakışma varış sırasıyla; geçersiz commit reddedilir.
- **Persistence:** model = blob storage'da tek dosya; açılışta belleğe, periyodik geri yazma.
  Postgres yalnız metadata. **Lazy migration:** eski format açılınca istemci güncel formata taşıyan
  bir commit üretir (toplu migration yok).
- **Sürüm kontrolü:** tutarlı commit geçmişi üstünde Git-benzeri branch/merge (rebase karmaşası
  kullanıcıya gösterilmez).

## 8. Paylaşılan kod ilkesi

Serileştirme + geometri + invariant kontrolü `packages/document` + `packages/geometry`'de tek yerde;
hem istemci hem (gelecekte) backend/AI üretici **aynı kodu** kullanır (CLAUDE.md §6.6). Bu yüzden bu
iki paket saf TS — React/DOM/PixiJS yok (ADR-0002).
