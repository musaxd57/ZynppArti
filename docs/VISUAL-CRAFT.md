# docs/VISUAL-CRAFT.md — Görsel Zanaat: Rayon'u "His" Olarak Geçmek (ZynppArti)

> Özellik yetmez; mimar bir araca baktığında **gözü doymalı.** Bir çizimi profesyonel ya da amatör gösteren şey çoğunlukla görsel zanaattir. Bu dosya, ZynppArti'nin "pahalı durması" için render motoruna ve UI'a girecek somut kurallar.
> Çoğu **render engine** işidir → CLAUDE.md §8.1'e bağlanır. Bazıları Faz 1'de bile iyileştirilebilir.

---

## 1. ÇİZGİ KALINLIĞI HİYERARŞİSİ — EN ÖNEMLİ TEK ŞEY ★★★

**Gerçek:** Bir çizimi anında "amatör" gösteren ya da "profesyonel" gösteren şey budur. Mimar/jüri gözü ilk bunu yakalar.

Sebep estetik değil, **bilişsel:** İnsan beyni görseli kontrastla önceliklendirir. Bir planda **her çizgi 0,25mm ise gözün tutunacağı bir çapa yoktur** — okunmaz, ucuz görünür. Hiyerarşi, nesnelerin fiziksel önemini yansıtır.

**Standart hiyerarşi (ISO 128 / mimari gelenek) — render motoruna birebir uygula:**

| Seviye | Kalınlık | Ne için | ZynppArti'de |
|--------|----------|---------|--------------|
| **Birincil (kalın)** | ~0,6–0,8 mm | **Kesilen** duvar, kolon, strüktür (kesit düzleminin kestiği en kalıcı şeyler) | Duvar **kesit** çizgisi en kalın |
| **Orta** | ~0,35–0,5 mm | Görünen kenarlar, mahal/oda **çevre** çizgisi | Oda sınırı, görünen kenar |
| **İnce** | ~0,2–0,3 mm | Mobilya, ölçü çizgileri, simgeler | Blok, dimension |
| **En ince** | ~0,10–0,13 mm | **Tarama (hatch), poché**, metin, kapı açılış yayı | Hatch + etiket en açık |

**Kritik kural:** *"Çizgi kalınlığı tutarlılığı çizimi profesyonel yapar; yanlış kalınlık, jüri/uzmanın hatayı en hızlı fark ettiği şeydir."* → Yani yanlış kalınlık = **anında ucuz görünür.**

**Bizim için somut iş:** Faz 1'de duvarlar muhtemelen **tek tip kalınlıkta** çiziliyor (amatör görünüm). Premium sıçrama: her entity/katmana **çizgi kalınlığı** ata, zoom'a göre ölçekle (stroke scale), kesilen duvarı kalın, hatch'i en ince çiz.

**➤ CLAUDE.md §8.1'e:** "Çizgi kalınlığı hiyerarşisi (ISO 128): kesit-duvar kalın → oda çevresi orta → mobilya/ölçü ince → hatch/metin en ince. Katman bazlı lineweight + zoom-ölçekli stroke."

---

## 2. ÇİZGİ TİPLERİ (line types) ★★

Kalınlık kadar **tip** de anlam taşır. GPU shader'la çizilecek (CLAUDE.md §8.1'de "dash shader" zaten not edilmişti):

- **Sürekli (kalın):** görünen kenar, kesilen duvar.
- **Kesik (dashed):** **gizli/üstte-altta** olan (üstteki kiriş, alttaki temel, asma kat).
- **Noktalı (dotted):** hareket yolu, merkez çizgisi, referans.
- **Eksen/zincir çizgisi (chain):** **kesit düzlemi** (kesit alma çizgisi) — planda kesitin nereden alındığını gösterir.

**➤ Karar:** En az bu 4 tip render motorunda olsun; özellikle "kesik = gizli" ve "zincir = kesit düzlemi" mimari okunabilirlik için şart.

---

## 3. TARAMA (HATCH) + POCHÉ — malzeme ve ağırlık ★★

- **Hatch:** malzeme/dokuyu gösterir (tuğla = iki yakın paralel diyagonal, beton = noktalı, toprak = çapraz tarama, yalıtım vb.).
- **En ince kalınlıkta çizilir** — yoksa "yan yana birçok çizgi tek bir kalın kara lekeye döner" ve çizimi mahveder.
- **Poché:** kesit/planda **kesilen duvarların içini doldurmak** (klasik mimari: koyu dolgu). ZynppArti'de duvar dolgusunu poché gibi sunmak güçlü "mimari his" verir.

**➤ Karar:** Malzeme-bazlı hatch kütüphanesi (Faz 3, metrajla bağlantılı — hatch = malzeme = metraj). Poché dolgu Faz 1'de bile mahal/duvar dolgusuyla denenebilir.

---

## 4. TİPOGRAFİ — sessiz ama belirleyici ★

- Etiket/ölçü/not metni **ince** (~0,13mm ağırlık hissi), çizimi **bastırmamalı.**
- Mimari his için **tek, temiz, teknik bir font** seç (mimarlar genelde sade grotesk/mono sever; AutoCAD geleneği ROMANS/simplex). Türkçe karakterler atlasta zaten var (Faz 1).
- Ölçü metni, mahal adı, m² — hepsi aynı tipografik sistemde, tutarlı boyut kademesiyle.

**➤ Karar:** Tek bir mimari etiket fontu + tutarlı boyut kademesi (başlık/ölçü/not). Tipografi token'ları (§6).

---

## 5. DERİNLİK & KONTRAST ★

- **Öndeki ağır, arkadaki hafif:** ön plandaki elemana kalın, arka plana ince çizgi → derinlik/üç boyut hissi (2B'de bile).
- Seçili eleman, hover, snap noktası → net ama abartısız vurgu renkleri (mimari paleti bozmadan).

---

## 6. UI "PREMIUM HİS" — tasarım sistemi ★★ (Figma dersleri)

Çizim güzel olsa da **arayüz ucuzsa** ürün ucuz hissedilir. Modern premium aracın olmazsa olmazları:

- **Tasarım token'ları:** renk/boşluk/çizgi-kalınlığı/font-boyutu **tek yerde** değişken olarak tanımlı (Figma "Variables" mantığı). → tutarlılık + temiz **açık/koyu tema** geçişi. (TailwindCSS token'larıyla yapılır.)
- **Koyu, sakin tuval:** CAD geleneği koyu zemin; çizgiler/render öne çıksın, UI geri çekilsin. Kontrast yüksek ama göz yormayan.
- **Mod ayrımı:** "Çiz" / "Sun-İncele" modları ayrı (Figma Dev Mode mantığı) → sunarken yanlışlıkla çizim bozulmaz. (Faz 5 sunum.)
- **Sakin, az ama net araç çubuğu:** Rayon'un sadeliği referans; her şeyi göstermek değil, doğru anda doğru aracı göstermek.
- **Mikro-etkileşim cilası:** yumuşak hover/seçim geçişleri, net imleç durumları (araç başına imleç), snap göstergesi. Bunlar "pahalı his"in %50'si.

**➤ Karar:** `packages/ui` tasarım sistemi token-tabanlı kurulsun (renk/spacing/typography/lineweight token'ları). `frontend-design` skill'i bu dosyayı baz alsın.

---

## 7. ÖZET — nereye, ne zaman

| Öğe | Faz | Etki |
|-----|-----|------|
| **Çizgi kalınlığı hiyerarşisi** | 1-2 (erken!) | ★★★ "profesyonel görünüm"ün tek en büyük kaynağı |
| Çizgi tipleri (dashed/chain) | 2 | ★★ mimari okunabilirlik |
| Hatch + poché | 1 (poché) / 3 (malzeme hatch) | ★★ malzeme + his |
| Tipografi sistemi | 2 | ★ sessiz kalite |
| Derinlik/kontrast | 2 | ★ 3B hissi |
| UI token sistemi + koyu tuval | 1-2 (temel) | ★★ "pahalı" arayüz |

**Stratejik çıkarım:** ZynppArti "özellik" olarak Rayon'a yaklaşıyor; "his" olarak geçmenin yolu **çizgi kalınlığı hiyerarşisi + temiz hatch/poché + token-tabanlı sakin koyu UI.** Bunlar pahalı değil, sadece **bilinçli** olmayı gerektiriyor. Bir mimar 3 saniyede "bu ciddi bir araç" ya da "bu oyuncak" diye karar verir — o 3 saniye bu dosyada.

### Kaynaklar
- Çizgi kalınlığı/hiyerarşi: firstinarchitecture, ISO 128 (caddrafter), archisoup, Life of an Architect, PORTICO
- Çizgi tipleri/hatch/poché: kaarwan, archisoup, Life of an Architect (poché + material hatch)
- UI premium his: Figma Variables/Dev Mode (press.farm 2026 UX guides)
