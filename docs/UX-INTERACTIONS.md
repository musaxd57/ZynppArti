# UX-INTERACTIONS — Kısayollar & Etkileşim Sözlüğü

> Kaynak tohum: `docs/DOCS-BACKLOG.md §1`. CAD aracı klavyeyle yaşar; kısayol şeması **bir kez**
> tasarlanır, her araç ona uyar. Sonradan değiştirmek acı verir → baştan sabitliyoruz.
>
> **Uygulama durumu (güncel):** Aşağıdaki tablolar **kodla birebir** tutulur — kaynak: `packages/tools/src/tool-manager.ts` (araç + global kısayollar) ve `select-tool.ts` (seçim/itme/döndür). Uygulama içi yardım: `?` (apps/web `ShortcutsHelp`). Yeni araç eklerken bu tabloyu güncelle.

---

## 1. Tasarım ilkeleri
- **AutoCAD'e yakın ol:** mimarlar AutoCAD'den geliyor; tek-harf araç kısayolları tanıdık olmalı.
- **Tek kaynak:** kısayollar `tool-manager.ts`'te + uygulama içi `?` yardım kartında (`ShortcutsHelp.tsx`). Bu doküman ikisini yansıtır.
- **Esc her zaman Seç'e döner; zaten Seç'teyse seçimi temizler.** ✅ uygulandı.
- **Araç toggle:** aktif araç tuşuna tekrar basmak Seç'e döner (L→aç, L→kapat). ✅
- **Mahal içine çift tık → ad düzenle; metne çift tık → metni düzenle.** Hangi araç açık olursa olsun. ✅
- **Mod yok sürprizi yok:** aktif araç durum çubuğunda görünür; imleç araca göre değişir (yerleştirmede artı). ✅

## 2. Araç kısayolları (tek harf) — `tool-manager.ts` ile birebir

| Tuş | Araç | Durum |
|-----|------|-------|
| `V` / `1` / `M` | Seç (select) | ✅ |
| `L` | Duvar (wall) | ✅ |
| `D` | Kapı (door) | ✅ |
| `P` | Pencere (window) | ✅ |
| `O` | Ölçü (dimension) | ✅ |
| `R` | Parsel (parcel) | ✅ |
| `B` | Blok (block) | ✅ (palet tipi seçer) |
| `T` | Metin (annotation) | ✅ |
| `F` | Pafta (sheet) | ✅ |
| `E` | Sil (erase) | ✅ (ayrıca `Delete`) |
| `K` | Ölçekle (calibrate) | ✅ |
| `Esc` | Seç'e dön / temizle | ✅ |
| `Space` (basılı) | Geçici pan | ✅ |
| `x` | Seçili bloğu 90° döndür | ✅ (SelectTool/BlockTool) |

## 3. Evrensel kısayollar

| Tuş | İşlem | Durum |
|-----|-------|-------|
| `Ctrl+Z` | Geri al | ✅ |
| `Ctrl+Shift+Z` / `Ctrl+Y` | İleri al | ✅ |
| `Delete` / `Backspace` | Seçiliyi sil (toplu) | ✅ |
| `Ctrl+A` | Tümünü seç (mahaller hariç) | ✅ |
| `Ctrl+C` / `Ctrl+V` | Kopyala / yapıştır | ✅ |
| `Ctrl+D` | Çoğalt | ✅ |
| `Ok tuşları` | Seçiliyi it (10 cm; `Shift` 100 cm) | ✅ |
| `Home` | İçeriğe sığdır (zoom extents) | ✅ |
| `Tekerlek` | Yakınlaş/uzaklaş | ✅ |
| `?` | Kısayol yardımı aç/kapa | ✅ |
| `Ctrl+X` (kes) · `Ctrl+G` (grupla) · `Ctrl+S` (kaydet) | — | ☐ henüz yok |

## 4. Seçim mantığı
- **Tek tık:** altındaki entity'yi seç. ✅
- **Boş alanda sürükle → kutu (marquee) seçim:** kutuyla **kesişen** seçilebilir entity'ler seçilir (mahaller hariç; gizli/kilitli katman atlanır). ✅ *(Şu an tek-mod kesişim; AutoCAD'in mavi=içeride / yeşil=dokunan çift-modu ☐ ileride.)*
- `Shift`+tık: seçime ekle/çıkar; `Shift`+kutu: mevcut seçime ekler. ✅
- Tek seçimde düzenleme **tutamaçları** (uç/offset/köşe) çıkar. ✅

## 5. Snapping (yakalama)
- ✅ Şu an: **anahtar nokta** (duvar ucu, blok merkezi, ölçü ucu, metin/parsel köşesi) → **eksen hizalama** (yatay/dikey kılavuz çizgisi) → **ızgara**; öncelik bu sıradadır (`tools/context.ts createSnapper`). Snap noktasında elmas, hizalamada pembe kılavuz gösterilir.
- ☐ Henüz yok: orta nokta (midpoint), kesişim (intersection), dik (perpendicular), paralel; ayrıca snap aç/kapa anahtarı.

## 6. İleride
- **Kullanıcı kısayolu özelleştirme** (keymap'i kullanıcı override eder).
- Sağ tık bağlam menüsü; radial/quick menü.
- Dokunmatik/kalem jestleri (tablet).
