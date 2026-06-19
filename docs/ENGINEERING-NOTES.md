# docs/ENGINEERING-NOTES.md — Faz 1 Teknik Notları (ZynppArti)

> Faz 1 (çizim + mahal/m² + performans) için somut algoritma rehberi. Araştırmaya dayalı; "tekerleği yeniden icat etme" notları.
> Bunları ilgili kilometre taşına gelince uygula; CLAUDE.md'ye kısa referans düş.

---

## 1. MAHAL/ODA BULMA (1E) — DOĞRU YÖNTEMİ SEÇ ★

**Kritik ayrım — iki ayrı dünya var, karıştırma:**

| Yöntem | Ne zaman | Bizim için? |
|--------|----------|-------------|
| **Vektör / planar graf (faces)** | Elimizde gerçek duvar segmentleri (geometri) varken | ✅ **BİZİM DURUM.** Kesin, anlık (<1 sn), deterministik. ML YOK. |
| Raster / ML (Mask R-CNN, watershed, EDT) | Elimizde sadece **görüntü/tarama** (piksel) varken | ❌ Şimdilik değil. Sadece ileride PDF/taranmış plan import edersek. |

> **YOU MUST:** ZynppArti'de duvarlar gerçek vektör (çizimden veya DXF'ten). O yüzden oda bulma **planar graf yüz-bulma (face-finding)** ile yapılır, yapay zekayla DEĞİL. Yapay zeka burada yanlış araç olur (yavaş + hatalı).

**Algoritma adımları (1E için reçete):**

1. **Temizle & snap (en kritik adım):** Duvar uçları birbirine "neredeyse değiyor" ama tam değmiyorsa kapalı döngü bulunamaz. Bir tolerans (epsilon) içindeki uçları **birbirine yapıştır** (vertex snapping), gereksiz/çok kısa kenarları sadeleştir. → Çoğu "oda bulunamadı" hatası buradan çıkar.
2. **Planar graf kur:** Duvar uçları = düğüm (node), duvarlar = kenar (edge). **Kesişen duvarları kesişim noktasından böl** (joint/intersection points), böylece düzlemsel (planar) bir graf olur.
3. **Yüzleri (faces) bul = minimal döngüler:** Half-edge / DCEL yapısı kur; her kenarın iki yönü için "bir sonraki kenarı saat yönünde en dar açıyla seç" kuralıyla minimal döngüleri (kapalı poligonlar) çıkar. Her iç döngü = bir oda. En dış döngü = bina dış sınırı (oda değil, atla).
4. **Boşlukları (kapı/pencere) mantıken kapat:** Oda kapalı sayılsın diye kapı/pencere boşluklarını geçici "dolu duvar" gibi kabul et (openings = bağlantı, ama alan hesabı için kapat).
5. **Alanı hesapla:** Kapalı poligonun alanı = **Shoelace formülü** (`packages/geometry`'de saf fonksiyon, testli). İç birim cm → alan/10000 = m² (ADR-0008).
6. **Eşle & koru:** Bulunan her bölgeye bir `Space` entity bağla; çizim değişince yeniden hesapla (canlı m²).

**Kaynak:** Wall Adjacency Graph yaklaşımı (CAD floor topology, <1 sn); RoomPilot CAD parsing (vertex snapping + simplification + Shoelace).

**➤ CLAUDE.md'ye:** §8.5 Mahal — "planar graf yüz-bulma, ML değil; snap→graf→minimal döngü→openings kapat→Shoelace. Detay: ENGINEERING-NOTES §1."

---

## 2. MEKÂNSAL İNDEKS (engine performansı) — rbush ★

**Sorun:** 50k–500k entity'de "fareyle neye tıkladım?" (hit-test) ve "ekranda ne görünüyor?" (culling) için her seferinde tüm entity'leri dönmek = ölüm. 500k döngü/kare = donar.

**Çözüm: R-tree mekânsal indeks (`rbush`).** "Şu kutu içindeki tüm nesneler" sorgusunu **yüzlerce kat hızlı** yapar (saf döngüye göre ~50x).

**Nasıl kullanılır:**
- Her entity için bir **AABB (eksen-hizalı sınır kutusu)** hesapla, `rbush`'a ekle (`minX,minY,maxX,maxY`).
- **Toplu yükleme (bulk load)** tek tek eklemekten ~2–3x hızlı; ilk yüklemede bunu kullan.
- **Hit-test (tıklama/seçim):** önce rbush'tan imleç çevresindeki adayları al (broad phase), sonra sadece o birkaç aday için **kesin geometri testi** (narrow phase): `distanceToSegment`, `pointInPolygon`, `closestPointOnSegment` (zaten 1C'de geometry'e ekleniyor).
- **Viewport culling:** rbush'a ekranın görünür kutusunu sorgula → sadece görünenleri çiz.
- **Snapping (1C):** imleç çevresindeki uç/orta noktaları da rbush ile hızlı bul.
- Entity hareket edince indeksini güncelle (remove + insert).
- **Statik nokta kümeleri** için (değişmeyen) `kdbush` nokta indekslemede 5–8x daha hızlı — gerekirse.

**İleri teknik (sonra):** GPU renk-tabanlı picking (her nesneye gizli benzersiz renk → tek piksel oku). 500k+ için.

**➤ CLAUDE.md'ye:** §8.1 — "Hit-test + culling + snapping için rbush (R-tree) zorunlu; broad phase (rbush AABB) → narrow phase (kesin geometri). Detay: ENGINEERING-NOTES §2."

---

## 3. HARİKA AÇIK KAYNAK ÖĞRETİCİ (mutlaka oku)

**`infinitecanvas.cc` — "An infinite canvas tutorial".** Sonsuz tuval motorunu sıfırdan, ders ders anlatıyor. Bizim engine için doğrudan referans. Özellikle:
- **Ders 8 — Performans:** draw call batching, viewport culling, mekânsal indeks (rbush), GPU color picking — tam bizim §8.1/§9 konularımız.
- Diğer dersler: koordinat sistemleri, pan/zoom kamera, seçim, şekil çizimi.

**➤ Çalışma kuralı (CLAUDE.md §12'ye):** engine performans/picking yazmadan önce infinitecanvas.cc ilgili dersini oku, sonra sade versiyonunu uygula.

---

## 4. KÜÇÜK AMA KRİTİK HATIRLATMALAR (Faz 1)

- **Tolerans/epsilon her yerde:** duvar birleştirme, oda kapatma, snapping — hep epsilon. Float tam eşitlik testi yok.
- **Birim tutarlılığı:** iç birim cm (ADR-0008); DXF import'ta kalibrasyon bunu ayarlar; m² = alan/10000.
- **Mahal yeniden-hesabı tembel olsun:** her küçük değişiklikte tüm planı değil, etkilenen bölgeyi güncelle (büyük planda performans).
- **DXF gerçeği:** LINE/LWPOLYLINE → Wall eşlemesi temiz; ama gerçek DXF'ler dağınık olur (kopuk uçlar, çift çizgi, blok içinde duvar). İlk import'ta "temizleme" adımı (1D) şart.
- **Hit-test önceliği:** üst üste binen entity'lerde z-sırası/katman önceliği belirle (en üstteki seçilsin).

---

### Kaynaklar
- Oda bulma (vektör): WAG / CAD floor topology (researchgate 256688203), RoomPilot CAD parsing (arXiv 2512.11234)
- Oda bulma (raster/ML, bizim için değil): Floor-SP (arXiv 1908.06702), Kreo floor plan recognition
- Mekânsal indeks: rbush (github.com/mourner/rbush), kdbush; infinitecanvas.cc Ders 8
