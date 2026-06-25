# YARIN — Günlük çalışma planı

> Geçici çalışma dosyası (her gün güncellenir; tamamlananlar `docs/STATE.md`'ye geçince buradan silinir).
> Kalıcı ilerleme kaydı = `docs/STATE.md`. Bu dosya = "yarın nereden başlayalım".
> **Ritüel (her gün uyumadan):** ① bugünü STATE.md'ye yaz ② yarını buraya yaz ③ commit + push.

---

## ✅ 2026-06-25 — bugün ne yaptık (13-saat otonom sertleştirme turu)
`feat/autonomous-13h-2026-06-25` (off `feat/auth-clerk`), **18 fix-commit, push'lu, Moses merge bekliyor.**
7 denetim + 2 doğrulama agent'ı; **regresyon yok** (adversaryal review). Test 318→**~342**, tüm zincir yeşil.
Tam liste + gerekçeler: `docs/STATE.md` 2026-06-25 girdisi. Özet: serialize derin doğrulama · AI route
context sanitize + design clamp · select-tool kilit-bypass · dxf escaping · entity-bounds tek-geçiş · dash
cap · collab karantina · **findFaces bileşen-bazlı (çift-mahal bug)** · Assistant fetch/stream + a11y ·
export guard'ları · io text clamp · **sync sunucu sertleştirme** · paste→opening · 3B/kesit lento birliği.

---

## 🌅 YARIN — sonraki tur (öncelik sırası)

> Bunlar bugün **bilinçli yapılmadı**: ya tarayıcı doğrulaması, ya 500k-ölçek testi, ya ürün kararı gerek.
> Körlemesine değiştirip canlıyı/çekirdeği riske atmak yerine flag'lendi (hatasızlık önceliği).

### 1) Hızlı + güvenli (önce)
- **ALLOWED_ORIGINS**'i Railway env'ine ekle → sync WS origin koruması devreye girsin (kod hazır).
- **render-mode hata mesajı**: ham provider detayını client'a sızdırıyor (model gizliliği persona'sıyla çelişir,
  pre-launch info-disclosure). Sunucu log'una al, client'a sade kategori dön. (Karar: detay teşhis için mi kalsın?)

### 2) Perf sertleştirme (500k hedefi — tarayıcıda ölç + doğrula)
- engine `EntityLayer.onChange`: `store.all()` yerine **wall→opening reverse-index** (her drag-frame O(n) → O(boşluk)).
- `tools/context.ts nearestAxis`: tam-yükseklik strip rbush sorgusu → **viewport'a sınırla / aday cap**.
- `render-wall/render-sheet/render-space`: zoom'da geometri+hatch yeniden hesaplanıyor → **build (entity-değişimi) ile
  stroke (zoom) ayrımı** (hatch dünya-uzaylı, zoom'dan bağımsız). En büyük kazanç burada.

### 3) View3D görsel (tarayıcıda doğrula)
- **slab-mirror:** asimetrik odada zemin slab'ı duvarlara göre aynalı (rotation.x +π/2 vs -π/2). Asimetrik oda çiz, karşılaştır.
- render-loop **on-demand** yap (statikken rAF dönmesin → pil/CPU); `document.hidden`'da duraklat.
- **clip-plane** yönü: kesit hangi yarıyı tutuyor kamera tarafına göre seç (şu an çizim yönüne bağlı, yanlış yarıyı kesebilir).

### 4) a11y tamamlama (görsel + klavye doğrulaması)
- Modal'lara `role=dialog`+`aria-modal`+focus-trap+focus-restore (DialogHost/Calibrate/Comment/CommandPalette/ContextMenu/View3D).
- Form `<label htmlFor>` (PropertiesPanel/RoomList/SheetPanel), ikon-buton aria-label'ları, LayerPanel klavye sıralama.

### 5) Çekirdek/domain (karar + iş)
- **findFaces hole-subtraction:** kapalı iç döngüde dış mahal alanı çentik çıkarmıyor (polygon-with-holes gerek).
- **calibrate kapsamı:** yalnız duvar ölçekliyor; import'ta metin de var → duvar+annotation mı, tüm pozisyonel mi? (ürün kararı).
- **domain yaklaşımları (belgeli, Moses kararı):** sıva ×2 dış-duvar fazla sayım, convex-hull min-genişlik concave'de false-neg,
  daylight bina+oda çift-rapor.

### 6) Düşük öncelik / niş
- dxf-import: INSUNITS unmapped→factor1 sessiz (unitsKnown surface), MINSERT row/col, bulge (yay) segmenti, OCS extrusion.
- Test borcu: canvas-app/entity-layer cull/presence (pixi-coupled — saf matematiği helper'a çıkarıp test et).

---

## 📌 Açık notlar / kararlar
- Bu turun tamamı `feat/autonomous-13h-2026-06-25`'te + push'lu; **main'e değmedi** (canlı deploy tetiklenmedi).
  Merge + tarayıcı doğrulaması Moses'ta.
- Railway sync **kalıcılık tutmuyor** (bilinçli v1). Akash GLM yavaş → yalnız yedek. Domain `vesna.design`.
