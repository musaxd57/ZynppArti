# UX-INTERACTIONS — Kısayollar & Etkileşim Sözlüğü

> Kaynak tohum: `docs/DOCS-BACKLOG.md §1`. CAD aracı klavyeyle yaşar; kısayol şeması **bir kez**
> tasarlanır, her araç ona uyar. Sonradan değiştirmek acı verir → baştan sabitliyoruz.
>
> **Uygulama durumu:** Şema burada tanımlı. Araçlara bağlama **Faz 1 / 1C**'de (duvar + seç/taşı/sil)
> başlar; her yeni araç bu tabloya uymak ZORUNDA.

---

## 1. Tasarım ilkeleri
- **AutoCAD'e yakın ol:** Moses ve mimarlar AutoCAD'den geliyor; tek-harf araç kısayolları tanıdık olmalı.
- **Tek kaynak:** Tüm kısayollar bu tabloda + uygulama içinde `?` ile açılan yardım kartında. Kod, kısayolu buradan okur (dağıtık string'ler değil, merkezi bir `keymap`).
- **Esc her zaman iptal, Enter her zaman onayla.** İstisna yok. **Esc ayrıca her zaman Seç (V) moduna döner.** *(Faz 1'de uygulandı.)*
- **Araç toggle:** Aktif araç tuşuna tekrar basmak aracı kapatır ve Seç'e döner (L→aç, L→kapat). *(Faz 1.)*
- **Mahal içine çift tık → ad düzenle:** Hangi araç açık olursa olsun, bir mahalin içine çift tıklamak doğrudan o mahalin isim kutusunu açar (duvar çizmeye geçmez). *(Faz 1.)*
- **Mod yok sürprizi yok:** Aktif araç ekranda her zaman görünür; imleç aracın durumunu yansıtır.

## 2. Araç kısayolları (tek harf)

| Tuş | Araç | Faz |
|-----|------|-----|
| `L` | Line / Wall (duvar çiz) | **1C** |
| `M` | Move (taşı) | **1C** |
| `E` | Erase (sil) | **1C** (ayrıca `Delete`) |
| `Esc` | İptal (aracı/işlemi bırak) | **1C** |
| `Enter` | Onayla / bitir | **1C** |
| `C` | Copy (kopyala) | Faz 1 sonu |
| `R` | Rotate (döndür) | Faz 1 sonu |
| `S` | Scale (ölçekle) | Faz 1 sonu |
| `D` | Dimension (ölçü) | Faz 1 |
| `T` | Text (metin) | Faz 1 |
| `Z` | Zoom aracı | Faz 1 |
| `Spacebar` (basılı) | Geçici pan | **1C** |

## 3. Evrensel kısayollar

| Tuş | İşlem | Faz |
|-----|-------|-----|
| `Ctrl+Z` | Undo | **1A/1C** |
| `Ctrl+Shift+Z` / `Ctrl+Y` | Redo | **1A/1C** |
| `Delete` / `Backspace` | Seçili sil | **1C** |
| `Ctrl+A` | Tümünü seç | 1C |
| `Ctrl+C` / `Ctrl+V` / `Ctrl+X` | Kopyala / yapıştır / kes | Faz 1 sonu |
| `Ctrl+G` | Grupla | Faz 1+ |
| `Ctrl+S` | Kaydet | Faz 1–2 (format gelince) |

## 4. Seçim mantığı (AutoCAD davranışı)
- **Tek tık:** altındaki entity'yi seç.
- **Soldan-sağa pencere (mavi, dolu):** yalnızca **tamamen içinde** olanları seç.
- **Sağdan-sola pencere (yeşil, kesik):** pencereye **dokunan** her şeyi seç.
- `Shift`+tık: seçime ekle/çıkar.

## 5. Snapping (yakalama)
Her biri **aç/kapa** edilebilir ve aktifken ekranda gösterge (marker) çıkar:
- Uç nokta (endpoint) · Orta nokta (midpoint) · Kesişim (intersection) · Dik (perpendicular) · Paralel · Grid.
- Snap önceliği ve toleransı `packages/tools` içinde merkezi; çizim sırasında en yakın geçerli snap vurgulanır.
- 1C'de en az **uç nokta + grid** snap'i devreye girer; diğerleri Faz 1 boyunca eklenir.

## 6. İleride
- **Kullanıcı kısayolu özelleştirme** (keymap'i kullanıcı override eder).
- Sağ tık bağlam menüsü; radial/quick menü.
- Dokunmatik/kalem jestleri (tablet).
