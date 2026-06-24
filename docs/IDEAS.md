# IDEAS — Fikir park yeri

> Akla gelen ama şimdi yapılmayacak fikirler buraya (DOCS-BACKLOG #10). Amaç: **ROADMAP'i ve STATE'i
> kirletme.** Fazı/önceliği belli olan iş ROADMAP'e; "nerede kaldık" STATE'e; ham fikir buraya.
> Bir fikir olgunlaşıp karara dönüşünce → DECISIONS (ADR) + ROADMAP'e taşı, buradan sil.

---

## Şu an biriken backlog (STATE'ten taşındı — büyük/sonra)
- **Multiplayer olgunlaşma:** Command-tabanlı undo köşe durumları, katman-döngü invariant'ı (backend), sunucu otoritesi + kalıcılık (Hocuspocus / commit-log), auth + link izinleri (görüntüle/yorum/düzenle), mahal-adı senkronu. → ADR-0044 v1 sınırları; Faz 3.
- **Katman hiyerarşisi:** iç içe katman grupları (Illustrator gibi). Döngü invariant'ı yalnız collab/backend garanti eder → Yjs ile birlikte (ADR-0040 ertelemesi).
- **Bulguya tıkla → seç + zoom:** copilot bulgusuna tıklayınca ilgili entity'ye zoom (engine zoom-to-entity gerek).
- **Planar-faces perf:** O(n²) → spatial-hash (büyük plan/AI üretici çıktısı için).
- **Panel re-render debounce** (büyük modelde panel hesaplama yükü).

## Ürün fikirleri (ham)
- **Maliyet/metraj otomasyonu derinleşmesi:** bölgesel birim fiyat, tedarikçi, teklif çıktısı.
- **Güneş/gölge analizi** (yön + saat → mahal gün ışığı; copilot zaten "doğal ışık" kuralı veriyor).
- **Mobil tarama girişi** (CubiCasa tarzı: fotoğraf/lazer → kaba plan).
- **Sürüm/branch UI** (CLAUDE §6.7: Git-benzeri geçmiş ama rebase/squash gizli).
- **Yorum → görev dönüşümü** (markup'tan iş listesi; `Comment.resolved` zaten var — atanan kişi + durum eklenebilir).
- **Şablon/örnek proje galerisi** (boş tuval korkusu — ONBOARDING ile; "örnek 3+1 daire"den başla).
- **Eklenti/API ekosistemi** (3. parti araçlar, blok kütüphaneleri).
- **AI render varyant galerisi + stil kilidi** (geometriyi koru modu olgunlaşınca).

## Küçük UX cilaları (maliyetsiz, sıraya girince yapılır)
- Kalibrasyon prompt'u hâlâ native `window.prompt` (packages/tools) → temalı diyaloğa (artık `ctx.requestText` deseni var).
- Annotation ok/lider çizgisi (leader) — şu an yalnız metin.
- Çoklu-pafta PDF + sunum reel.
- Klavye kısayolu özelleştirme (kullanıcı tanımlı).

> Bir fikri ele alırken: önce LANDSCAPE.md §8 "o işi en iyi yapan repo" listesine bak (CLAUDE §12 tekerlek).
