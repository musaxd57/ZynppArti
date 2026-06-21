# docs/PRO-FEATURES.md — Mimarların Para Ödediği Profesyonel Özellikler (ZynppArti)

> Render ve AI "vitrin" özellikleri ilgi çeker; ama mimarı bir araca **bağımlı** kılan şey aşağıdaki "sıkıcı ama kritik" işlerdir. Rayon bunların çoğunu yapmıyor → fırsat.
> Her madde: **[FAZ]** + tohum + **➤ Türkçe pazar fırsatı** (varsa).
> Not: Pazar/fiyat bilgisi değişir; özellik kurulurken güncel kaynaktan doğrula.
>
> **Durum (güncel):** §1 Metraj ✅ YAPILDI ve §5 Pafta ✅ YAPILDI (ADR-0019 ile öne çekildi); §3 Çizelge motoru ⏳ kısmen. §2 (canlı maliyet), §4 (revizyon), §6 (çakışma) hâlâ ileri faz. Bu dosya backlog/yön belgesidir.

---

## 1. METRAJ / MİKTAR ÇIKARIMI (quantity takeoff) ★★★ — EN KRİTİK · ✅ YAPILDI

Mimar/keşifçi bunun için para öder. Profesyonel araçlar (Revit material takeoff, Navisworks Quantification) modelden **tek işlemde** miktar çıkarır: duvar katmanları (tuğla, sıva, yalıtım), alanlar, hacimler, sayılar, malzeme dökümü.

**Bizim avantajımız:** m²'yi zaten canlı hesaplıyoruz (Faz 1). Bunu **metraja** büyütmek küçük adım, büyük değer:
- Duvar alanı → otomatik **sıva/boya m²**, **tuğla adedi**, **yalıtım m²**.
- Mahal alanı → **döşeme/şap m²**, **süpürgelik mt**.
- Kapı/pencere → **adet + tipe göre döküm** (door/window schedule).
- Hepsi tabloya → Excel (zaten var) + canlı güncellenir.

**➤ Türkçe pazar fırsatı (büyük):** Türkiye'de metraj **poz numaraları + Çevre/Şehircilik Bakanlığı birim fiyatları** ile yapılır. Yerli birim fiyat/poz entegrasyonu → "Türk mimarın metraj + yaklaşık maliyet" aracı. Yabancı araçlarda YOK. (Yönetmelik fırsatıyla aynı mantık — bkz. `FAZ2-NOTES.md §3`.)

**✅ YAPILDI (ADR-0019 ile öne çekildi):** `packages/document/src/takeoff.ts` (`computeTakeoff`: duvar uzunluğu, sıva/boya m², döşeme m², süpürgelik, kapı/pencere çizelgesi + **mobilya çizelgesi**) → web `TakeoffPanel` canlı + Excel (Metraj/Çizelge/Mobilya sayfaları), düzenlenebilir kat yüksekliği. **Hâlâ ☐:** Türkçe **poz/birim fiyat** entegrasyonu (premium tohum), tuğla/yalıtım gibi katman-bazlı malzeme dökümü.

---

## 2. CANLI MALİYET TAHMİNİ (5D) ★★

Modern araçlar (Lemos Real-Time View, ConWize) maliyeti **tasarlarken canlı** gösterir: "şu malzemeyi seçtin → bütçe şöyle değişti". Modeldeki değişiklik → tahmin otomatik güncellenir (statik keşif değil).

**Bizim için:** Metraj (§1) + birim fiyat = **canlı yaklaşık maliyet**. Sen duvar çizdikçe/malzeme atadıkça toplam maliyet güncellenir.

**➤ Türkçe pazar:** Yerel birim fiyat (Bakanlık + piyasa) ile **TL bazında canlı yaklaşık maliyet**. Bu, bir mimar için "vay" dedirten şey.

**➤ Karar:** Metrajın üstüne bir maliyet katmanı (Faz 3-4). Önce kaba (m² × birim fiyat), sonra detaylı.

---

## 3. VERİ TAŞIYAN ENTITY'LER + OTOMATİK GÜNCELLENEN ÇİZELGELER ★★

BIM zekasının özü: nesneler **veri taşır** ve değişiklik **çizelgelere yayılır**. Klasik örnek: "duvarı taşıyınca, ilişkili kapı/pencere çizelgesi otomatik güncellenir" (bi-directional link).

**Bizim için:** Command/entity modelimiz zaten metadata taşıyabiliyor (CLAUDE.md §7). Formalize et:
- Entity'ye **özellik** ekle (malzeme, tip, maliyet, marka).
- Bu özellikler **canlı çizelgeler** üretsin (kapı listesi, mahal listesi, malzeme listesi) — biri değişince hepsi güncellensin.
- Mahal/m² + metraj + maliyet, hepsi bu çizelge altyapısının üstünde.

**Durum:** ⏳ Kısmen yapıldı — mahal listesi (ad/tip/m²/malzeme), kapı/pencere çizelgesi ve mobilya çizelgesi canlı (`takeoff.ts` + RoomList/TakeoffPanel); Excel'e dökülüyor. **Hâlâ ☐:** genel "entity özelliği (marka/maliyet) → otomatik tablo" soyutlaması ve iki-yönlü bağ.

---

## 4. REVİZYON / SÜRÜM TAKİBİ + İŞARETLEME ★★

Architizer: BIM yönetim araçlarının en değerli özelliği **revizyonları takip etmek ve işaretlemek** — ekip güncel sürümde çalışsın, iletişim/uygulama çakışması olmasın. Mimar bunun için ödüyor.

**Bizim için:** Rayon'un "Git-benzeri sürüm kontrolü" north-star'ı (CLAUDE.md §6.7) tam buraya oturuyor:
- "Sürüm A → B'de ne değişti" görünür/işaretlenebilir olsun.
- Revizyon bulutu/işaretleme (mimari "revizyon" geleneği).
- Kim, ne, ne zaman (commit geçmişinden bedava gelir — multiplayer commit-log üstüne).

**➤ Karar:** Sürüm/revizyon takibi Faz 6 (commit-log/version control) ile gelir; ama **revizyon işaretleme (bulut + tarih)** Faz 5 sunum tarafında erken eklenebilir.

---

## 5. PAFTA / DOKÜMANTASYON YÖNETİMİ ★ · ✅ ÇEKİRDEK YAPILDI

Profesyonel araçlar plan/kesit/detay arası **hızlı gezinme + sayfa seti (sheet set)** yönetimi sunar; dokümantasyon hızlanır.

**✅ YAPILDI (çekirdek):** `Sheet` entity (A4–A0 + yön + ölçek 1:N + antet alanları; `document/sheet.ts`), `SheetTool` (F) ile yerleştirme, çerçeve + antet render (`engine/render-sheet.ts`), `SheetPanel` (boyut/yön/ölçek/başlık düzenle), **PDF export** (jsPDF, ilk paftadan sayfa boyutu — ADR-0022).
**Hâlâ ☐:** çoklu pafta **sayfa seti** + otomatik numaralandırma, plan↔kesit↔detay gezinme, paftaya çizim **viewport** gömme, **toplu** PDF (tüm paftalar). Bunlar Faz 5 sunum fazında olgunlaşır.

---

## 6. ÇAKIŞMA DENETİMİ (clash detection) — ileride

Farklı disiplinleri (mimari/tesisat/strüktür) karşılaştırıp **mekânsal çakışmaları** bulma. Büyük projelerde kritik ama **3B + çok disiplin** gerektirir.

**➤ Karar:** Çok ileri (Faz 6+, BIM/3D olgunlaşınca). Şimdilik sadece radarda.

---

## ÖZET — CLAUDE.md/ROADMAP'e eklenecekler

| Özellik | Durum | Türkçe fırsat? | Not |
|---------|-------|----------------|-----|
| **Metraj (quantity takeoff)** | ✅ yapıldı | ✅ poz/birim fiyat (☐ tohum) | m²'nin devamı, çok değerli |
| **Canlı maliyet (5D)** | ☐ Faz 3-4 | ✅ TL birim fiyat | metrajın üstüne |
| **Çizelge motoru (data→tablo)** | ⏳ kısmen | — | mahal/kapı/mobilya çizelgesi canlı |
| **Revizyon/sürüm takibi** | ☐ Faz 5-6 | — | Git-benzeri north-star |
| **Pafta/sheet set** | ⏳ çekirdek ✅ | — | Sheet entity+panel+PDF var; sayfa seti ☐ |
| **Çakışma denetimi** | ☐ Faz 6+ | — | 3B sonrası |

**Stratejik çıkarım:** ZynppArti'nin Türk pazarındaki **üç farklılaştırıcısı** netleşti:
1. **Türkçe yapı yönetmeliği** copilot'u (`FAZ2-NOTES.md §3`)
2. **Türkçe metraj + yaklaşık maliyet** (bu dosya §1-2)
3. AutoCAD/DXF köprüsü + tarayıcı + işbirliği (zaten temel)

Bu üçü, Rayon'da da yabancı araçlarda da yok → savunulabilir bir konum.

### Kaynaklar
- Metraj/takeoff: RevitGods (Revit material takeoff), buildtwin (schedules auto-update), MVN (quantity takeoff)
- Canlı maliyet 5D: Architizer (Lemos Real-Time View), ConWize (BIM cost estimating 2026)
- Revizyon takibi: Architizer (BIM management version control + annotation)
- Çizelge/bi-directional: buildtwin (wall→door/window schedule auto-update)
