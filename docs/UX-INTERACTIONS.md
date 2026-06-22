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
| `B` | Blok (block) | ✅ (toggle; blok türü palet panelinden seçilir) |
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
| `Ctrl+S` | Modeli kaydet (.json) | ✅ |
| `Ctrl+O` | Model aç (.json) | ✅ |
| `Ctrl+X` (kes) · `Ctrl+G` (grupla) | — | ☐ henüz yok |

## 3.1 Dosya işlemleri (Toolbar butonları — kısayol yok)
| Buton | İşlem | Durum |
|-------|-------|-------|
| Yeni | Çizimi temizle (geri alınabilir, onaylı) | ✅ |
| Kaydet | Modeli `.json` indir (serializeModel) | ✅ |
| Aç | `.json` model yükle (değiştir, tek undo) | ✅ |
| DXF Yükle | DXF içe aktar (LINE/POLYLINE/CIRCLE/ARC/TEXT) | ✅ |
| DXF İndir | Tüm entity'leri DXF'e | ✅ |
| SVG İndir | Vektör SVG export | ✅ |
| PNG İndir | Raster görüntü | ✅ |
| PDF İndir | jsPDF (raster gömme) | ✅ |
| Excel İndir | Mahal listesi / metraj (.xlsx) | ✅ (RoomList/Metraj panelinde) |

> `Ctrl+S` (kaydet) / `Ctrl+O` (aç) klavye kısayolları bağlı (tarayıcı diyaloğu bastırılır).

## 4. Seçim mantığı
- **Tek tık:** altındaki entity'yi seç. ✅
- **Boş alanda sürükle → kutu (marquee) seçim:** kutuyla **kesişen** seçilebilir entity'ler seçilir (mahaller hariç; gizli/kilitli katman atlanır). ✅ *(Şu an tek-mod kesişim; AutoCAD'in mavi=içeride / yeşil=dokunan çift-modu ☐ ileride.)*
- `Shift`+tık: seçime ekle/çıkar; `Shift`+kutu: mevcut seçime ekler. ✅
- Tek seçimde düzenleme **tutamaçları** (uç/offset/köşe) çıkar. ✅

## 5. Snapping (yakalama)
- ✅ Şu an (öncelik sırasıyla, `tools/context.ts createSnapper`): **köşe/uç + orta nokta** (duvar/ölçü/parsel) → **kesişim** (segment çaprazları) → **kenar-üstü (dik iz düşüm)** → **eksen hizalama** (yatay/dikey kılavuz) → **ızgara**.
- ✅ Snap göstergesi türe göre glyph değiştirir: **köşe=eşkenar dörtgen, orta=üçgen, kenar=kare, kesişim=X**; eksen hizalamada pembe kılavuz çizgisi.
- ☐ Henüz yok: paralel snap; snap türlerini ayrı ayrı aç/kapa anahtarı.

## 6. İleride
- **Kullanıcı kısayolu özelleştirme** (keymap'i kullanıcı override eder).
- Sağ tık bağlam menüsü; radial/quick menü.
- Dokunmatik/kalem jestleri (tablet).
