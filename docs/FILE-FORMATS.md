# FILE-FORMATS — Yerel format + içe/dışa aktarma matrisi

> "Model = dosya" kararının (CLAUDE.md §6.5, Rayon dersi) somut spesifikasyonu. DOCS-BACKLOG #4
> tohumunun büyütülmüş hâli; artık "yakında" değil, kod **mevcut** (`packages/document/serialize.ts`).

---

## 1. Yerel format — `zynpparti-model` (JSON zarfı)
Kaynak: `packages/document/src/serialize.ts` (saf TS — istemci + ileride backend aynı kodu kullanır).

```jsonc
{
  "format": "zynpparti-model",   // sabit imza; değilse "tanınmadı" hatası
  "version": 1,                  // MODEL_FORMAT_VERSION — format değişince artar
  "entities": [ /* Entity[] */ ] // wall|space|opening|dimension|parcel|block|annotation|sheet|section|comment
}
```

**Kurallar (ADR-0028/0029/0034):**
- Zarf **düz/serileştirilebilir** kalır: Map/Set/döngüsel referans/fonksiyon **yok** (JSON-safe).
- **Türetilmiş `space` (mahal) yazılır** ama açılışta duvarlardan yeniden türetilir — ad/tip korunur (merkez eşleştirme).
- **Toleranslı okuma:** bozuk JSON / yanlış imza → **hata** (tüm dosya düşer). Tek tek **geçersiz/bilinmeyen entity → atlanır** (kısmi bozulma dosyayı düşürmez).
- Yeni **opsiyonel alan eklemek format'ı kırmaz** (entity'ler spread'le serialize/clone olur; ör. bugün `Comment.resolved`, `Wall.height` eklendi → eski dosyalar açılır, alan `undefined` kalır). → Bu yüzden alan ekleme **version artırmaz**.
- **Version artışı NE ZAMAN:** bir alanın anlamı/şekli değişince veya zorunlu hâle gelince → `MODEL_FORMAT_VERSION++` + lazy migration.

## 2. Lazy migration (yapı hazır, kuralı yazılı)
Eski sürümlü dosya açılınca: istemci onu **güncel sürüme taşıyan bir adım** uygular (CLAUDE.md §6.5).
Toplu/sunucu migration YOK — dosya açıldığında, yerinde. Şu an tek sürüm (v1) olduğu için migration
fonksiyonu henüz yok; ilk `version: 2` ihtiyacında `deserializeModel` içine `migrate(vN→vN+1)` zinciri eklenir.

> ⚠️ JSON formatını **sessizce kırma** (CLAUDE.md §13). Geriye uyumlu kal; kıracaksan version + migration.

## 3. Import matrisi (içe aktarma) — `packages/io`
| Format | Yol | Durum | Sınırlar / kayıp |
|---|---|---|---|
| **DXF** | `dxf-parser` (tarayıcı) | ✅ | LINE/LWPOLYLINE/POLYLINE/CIRCLE/ARC→Wall; TEXT/MTEXT→Annotation; INSERT (blok) patlatılır; $INSUNITS→cm |
| **DWG** | `@mlightcad/libredwg-web` (WASM) → DXF → importDxf | ✅ | `importDwg(buf, wasmDir?)`. Doğrulandı: gerçek mimari dosya 2337 duvar+24 metin (in→cm). **Kayıp:** MLEADER içeriği (ok+metin bütünü) kısmi; R2010+ bazı entity; XRef; SHX font kodlaması bozuk gelebilir |
| **DWG (sunucu yedeği)** | ODA File Converter / LibreDWG | ☐ | Tarayıcı parse başarısızsa düşülecek (CLAUDE §8.4) — henüz yok |
| **PDF / görsel** | referans/mood board | ☐ | Henüz yok |
| **IFC** | web-ifc | ☐ | Faz 5 BIM köprüsü |

**Ölçekleme:** import sonrası 2-nokta kalibrasyon (K) → tüm çizim gerçek ölçeğe (ADR-0011).

## 4. Export matrisi (dışa aktarma)
| Format | Yer | Durum | Not |
|---|---|---|---|
| **JSON (`.json`)** | document/serialize | ✅ | Kaydet/Aç; tam model |
| **DXF** | io/dxf-export (R12) | ✅ | Tüm entity tipleri + mahal adı TEXT; gizli katman hariç |
| **SVG** | io/svg-export | ✅ | Vektör; katman görünürlüğüne saygılı |
| **PDF** | apps/web (jsPDF + svg2pdf) | ✅ | Vektör (A1'de keskin); hata→raster |
| **PNG** | engine (Pixi extract) | ✅ | Yüksek çöz.; gizli katman hariç |
| **Excel (`.xlsx`)** | apps/web (xlsx) | ✅ | Mahal listesi / metraj |
| **glTF/GLB** | engine (three GLTFExporter) | ✅ (önizleme) | Faz 5 3B |
| **IFC** | — | ☐ | Faz 5/6 |

> İlgili: CLAUDE.md §6.5/§8.4, DECISIONS ADR-0011/0025/0026/0028/0045, [LANDSCAPE.md](LANDSCAPE.md) §6.
