# I18N-TEXT — Çok Dil & Türkçe Metin Tuzağı

> Kaynak tohum: `docs/DOCS-BACKLOG.md §2`. Türkçe-öncelikli, çok dilli. Bu dosyanın **bir numaralı işi**:
> render metin atlasında Türkçe karakterlerin baştan bulunmasını garanti etmek.

---

## 1. KRİTİK TUZAK — WebGL glyph atlası (öncelik: en yüksek)
WebGL'de (PixiJS dahil) metin, önceden bir **glyph atlasına** (MSDF/bitmap font) render edilir. **Atlasta olmayan karakter ekranda boş/bozuk çıkar.** Rayon bu sınırı yaşadı (bkz. `docs/LANDSCAPE.md §1`, `docs/ARCHITECTURE.md`). Türkçe karakterler tam da bu tuzağa düşer.

> **YOU MUST (CLAUDE):** `packages/engine` metin render'ı eklenirken (mahal etiketleri, ölçü yazıları —
> **Faz 1 / 1E'den ÖNCE**) glyph atlasına aşağıdaki **Türkçe karakter setini baştan kat**. Mahal isimleri
> Türkçe olacak; "neden ş görünmüyor" hatası yaşanmayacak. Bunu bir testle de kilitle (§3).

### Zorunlu karakter seti (atlas başlangıç kümesi)
```
# Temel ASCII (yazdırılabilir)
 !"#$%&'()*+,-./0123456789:;<=>?@
ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`
abcdefghijklmnopqrstuvwxyz{|}~

# Türkçe'ye özgü (KRİTİK)
ç ş ğ ı İ ö ü
Ç Ş Ğ Ö Ü
# Not: küçük 'i'nin büyüğü 'İ' (noktalı), büyük 'I'nın küçüğü 'ı' (noktasız) — Türkçe i/İ ikilisi.

# Mimari/ölçü sembolleri
² ³ ° ø Ø ± × ÷ — – … « » € ₺ $ ™
```
Uygulama notu: Tek bir `TR_CHARSET` sabiti tanımla (`packages/engine` veya paylaşılan), font atlası bu kümeyle
önceden doldurulsun (preload). Eksik glyph istenirse **sessizce boş bırakma** — log/fallback ver.

## 2. Çok dil mimarisi
- **UI dizeleri hardcode EDİLMEZ.** i18n dosyalarında (key → çeviri). İlk diller: **TR (varsayılan) + EN.**
- Dize anahtarları İngilizce, çeviri dosyaları dile göre (`tr.json`, `en.json`).
- **Yerel biçimlendirme:** sayı/ondalık yerele göre (TR: `12,5` virgül; EN: `12.5`). `Intl.NumberFormat` kullan.
- **Birim gösterimi:** m² / ft² yerele ve proje birimine göre (iç birim sabit = 1 cm, bkz. ADR-0008; gösterim ayrı).
- **Tarih/saat:** `Intl.DateTimeFormat`.

## 3. Test kilidi (regression)
- `packages/engine`: atlas/charset testi — `TR_CHARSET` içindeki her karakterin atlasta üretilebildiğini doğrula.
- Görsel duman testi (1E sonrası): "Çağrı Şönü Ğıölü İş" gibi tüm Türkçe karakterleri içeren bir mahal adı render edilip kontrol edilir (Playwright + snapshot).
- Bkz. `docs/TESTING.md`.

## 4. İleride
- **Vektör metin render'a geçiş** (sınırsız glyph; Arapça/Çince/CJK) — CLAUDE.md §8.1 north-star.
- **RTL (sağdan-sola)** Arapça için yazı yönü + layout aynalama.
- Çeviri yönetimi (eksik anahtar tespiti, çeviri platformu).
