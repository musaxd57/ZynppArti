# DOMAIN — CAD veri modeli (uzun hali)

> CLAUDE.md §7'nin uzun hali: entity şemaları, ilişkiler, türetilmiş veri. Bu doküman **sevk edilmiş
> gerçeği** yansıtır (`packages/document/src/entities.ts` ile senkron). Henüz olmayan parçalar
> "PLANLANAN" ile işaretlidir. Son güncelleme: 2026-06-22.

---

## 1. Birim & koordinat

- **İç birim: 1 birim = 1 cm** (ADR-0008). Tüm entity koordinatları cm.
- Koordinat ekseni tuvalde **y-aşağı** (ekran gibi); export'lar (DXF/SVG) bunu korur.
- Açılar **radyan** (ör. `Block.rotation`).
- Float karşılaştırmalarında epsilon kullanılır (CLAUDE.md §8.1).

## 2. Entity birliği (discriminated union)

`Entity = Wall | Space | Opening | Dimension | Parcel | Block | Annotation | Sheet`
Ayırıcı alan: `type`. Ortak taban (`EntityBase`): `id` (string), `type`, `layerId`.

| type | rol | binding/türetim | katman (tipik) |
|------|-----|------------------|----------------|
| `wall` | kalınlıklı duvar segmenti | — | `default` |
| `opening` | kapı/pencere | duvara `t` ile parametrik | `default` |
| `space` | mahal/oda (kapalı alan) | duvarlardan **türetilir** (RoomManager) | `rooms` |
| `dimension` | lineer ölçü | — | `dimension` |
| `parcel` | arsa sınırı | — | `site`/`parcel` |
| `block` | mobilya/sembol | `BLOCK_DEFS` ölçüsü | `furniture` |
| `annotation` | serbest metin | — | `annotation` |
| `sheet` | pafta/sayfa çerçevesi | kağıt boyutu×ölçek | `sheet` |

## 3. Entity şemaları (gerçek alanlar)

**Wall** — `start: Vec2`, `end: Vec2`, `thickness: number` (cm). Duvar zincirleri uçları snap'le bağlı
ayrı segmentlerdir (ADR-0007).

**Opening** — `wallId: EntityId`, `t: number` (0=start,1=end duvar orta-çizgisinde), `width: number`
(cm net geçiş), `kind: 'door' | 'window'`. Konum duvardan türetilir → duvar değişince uyumlu kalır.
Geometri: `openingFrame(o, wall)` (document/opening.ts).

**Space** — `name: string` (TR olabilir), `boundary: readonly Vec2[]` (CCW poligon, cm),
`roomType?: RoomType`, `material?: string` (materials.ts id). Alan boundary'den canlı hesaplanır.
`roomType` kullanıcı tarafından atanır — **isimden tahmin edilmez** (Faz 2A kararı).
`RoomType = 'living'|'kitchen'|'bathroom'|'wet'|'sleeping'|'circulation'|'service'|'other'`.

**Dimension** — `a: Vec2`, `b: Vec2`, `offset: number` (ölçü çizgisinin ölçülene dik uzaklığı; işaret
taraf). Uzunluk a/b'den türetilir. Geometri: `dimensionGeometry(d)`, biçim: `formatLength(cm)`.

**Parcel** — `boundary: readonly Vec2[]` (kapalı poligon, cm). Çekme (setback) + içerme denetimine girer.

**Block** — `kind: BlockKind`, `position: Vec2`, `rotation: number` (rad). Ayak izi `BLOCK_DEFS`
(document/block.ts) içinde sabit (cm); köşe-resize yok. Geometri: `blockCorners(b)`, `pointInBlock(b,p)`.

**Annotation** — `position: Vec2` (sol-üst), `text: string` (çok satırlı `\n`), `height: number`
(satır yüksekliği, dünya cm → zoom'la ölçeklenir). Geometri: `annotationSize`/`pointInAnnotation`.

**Sheet** — `position: Vec2` (sol-üst), `size: SheetSize` (A4–A0), `orientation`, `scale` (1:N payda),
`title: string`, `project?: string`. Model boyutu `sheetModelSize` = kağıt-mm × ölçek/10 (sheet.ts).

## 4. Türetilmiş veri (model'in parçası ama elle çizilmez)

- **Space (mahal):** duvarlardan `findFaces` (geometry, planar graf yüz-bulma) ile bulunur;
  `RoomManager` duvar değişince yeniden hesaplar. **Command ile uygulanır ama History dışı** (ADR-0012);
  ad/tip/malzeme recompute boyunca **centroid eşleştirmeyle** korunur.
- **Metrik:** `computeMetrics`/`netGrossAreaM2` (metrics.ts) — toplam/net/brüt m², tipe göre dağılım.
- **Metraj (takeoff):** `computeTakeoff` (takeoff.ts) — duvar uzunluğu, sıva/boya/döşeme m²,
  süpürgelik, kapı/pencere + mobilya çizelgesi. Excel'e aktarılır.

## 5. Layer (katman)

Entity'ler `layerId` ile bir katmana bağlı. Engine'de `LayerState` görünürlük + kilit tutar
(undo dışı view-state). Gizli katman çizilmez + hit-test atlar; kilitli katman görünür ama
seçilemez/düzenlenemez. **PLANLANAN:** iç içe katman hiyerarşisi + döngü-yok invariant'ı (CLAUDE.md §6.4).

## 6. Style & Metadata

- **Style:** renk, dolgu, çizgi kalınlığı (ISO 128 token'ları, engine/lineweights.ts), hatch/poché.
  Oda-tipi renkleri tek kaynak: `ROOM_TYPES`/`roomTypeColor` (document/metrics.ts).
- **Material:** `MATERIALS` kataloğu (materials.ts) — zemin kaplaması desen+açı+aralık+renk.
- **Metadata → metraj:** entity'ye takılı veri metraj/takeoff tablosu üretir (CLAUDE.md §7).
  **PLANLANAN:** serbest metadata alanı (tedarikçi/maliyet) entity şemasında henüz yok.

## 7. Binding

İki entity arası ilişki; biri değişince diğeri uyumlu kalır. Şu an tek aktif binding:
**Opening ↔ Wall** (`wallId` + `t`). tldraw "binding" kavramı referans (CLAUDE.md §6.2).

## 8. Serileştirme & kalıcılık

**Şu an:** model bellekte `EntityStore` (Map). Kalıcı dosya formatı / backend **PLANLANAN** (Faz 3):
model = blob storage'da tek dosya; Postgres yalnız metadata (CLAUDE.md §6.5). Lazy migration planı
ARCHITECTURE.md'de. Entity'ler ilişkisel DB'ye satır satır **yazılmaz** (§6.5 kuralı).

## 9. Canvas türleri

- **Model canvas:** gerçek ölçek (cm). Plan/kesit/görünüş burada.
- **Paper canvas (pafta):** `Sheet` entity baskı düzenini kurar (CLAUDE.md §7 paper canvas).
  **PLANLANAN:** ayrı paper-canvas modu/viewport; şu an Sheet model uzayında bir çerçeve.
