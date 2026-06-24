# DESIGN-BRIEF — claude.ai/design (veya v0/Lovable) için redesign prompt'u

> Moses bunu claude.ai/design'a yapıştırır → premium redesign üretir → çıktıyı Claude (kod) entegre eder.
> Tek kaynak: marka + içerik + gereksinimler. Kopyala-yapıştır hazır (aşağıdaki "PROMPT" bloğu).

---

## PROMPT (bunu yapıştır)

Sen üst düzey bir ürün/web tasarımcısısın. **Vesna** adlı bir SaaS için premium, modern bir pazarlama sitesi tasarla. Çıktı: **React + Tailwind CSS** bileşenleri (Next.js App Router ile uyumlu, kopyalanabilir kod).

**Vesna nedir:** Tarayıcıda çalışan, gerçek zamanlı işbirlikçi bir **mimari/iç mimari tasarım** platformu. Çizim + DWG/DXF içe aktarma + otomatik mahal/m² hesabı + Türkçe yönetmelik bilen yapay zekâ asistanı + tariften AI plan üretimi + plandan AI render + 3B önizleme. Hedef kitle: **Türkiye'deki mimarlar ve tasarım ofisleri** (arayüz Türkçe). Rakipler: Rayon, Arcol, AutoCAD — ama daha hafif, tarayıcı-öncelikli ve Türkçe yönetmelik avantajlı.

**Marka & his:** İsim **Vesna**. Ton: profesyonel, güvenilir, "mühendislik kalitesi" ama sıcak. Referans estetik: **Linear, Vercel, Stripe, Arcol, Rayon** (temiz, bol boşluk, premium tipografi, ince kenarlıklar, abartısız). Accent rengi **iris/mor `#5B5BD6`**. Tipografi: **Inter**.

**ŞART — Açık + Koyu tema:** İkisini de tasarla, sağ üstte **tema değiştirme butonu** (güneş/ay). Varsayılan koyu; seçim hatırlansın (localStorage). İki temada da kontrast erişilebilir olsun.

**Logo:** "Vesna" için **3 farklı minimal logo işareti öner** (mimari/geometrik; örn. stilize V, pergel/açı, blueprint köşesi). Yanında wordmark "Vesna". Sade ve premium — Linear/Vercel ruhu.

**Sayfalar:**
1. **Landing (/):** üst bar (logo + nav: Özellikler, Neden Vesna, Fiyatlar + Giriş Yap/Kaydol + "Uygulamayı Aç" CTA). Hero (güçlü başlık + alt metin + iki CTA + **ürün görseli/mockup** — bir CAD arayüzü çerçevesi). Özellik grid'i (aşağıdaki 9 madde). "Neden Vesna" bölümü (4 madde). Alt CTA. Footer (yasal linkler).
2. **Fiyatlandırma (/fiyatlandirma):** 3 plan kartı (Ücretsiz / Pro / Stüdyo) + SSS. Pro "Popüler" vurgulu.
3. **Yasal (/gizlilik, /kosullar):** okunur, sade tipografik sayfa şablonu.

**Navigasyon:** sayfalar arası geçiş **akıcı** olsun (sert sayfa atlaması hissi olmasın); "Fiyatlar" ayrı sayfa ama aynı kabuk/şablon → tutarlı.

**Gerçek içerik (Türkçe, bunu kullan):**
- Hero başlık: "Mimari tasarımı çiz, hesapla ve yapay zekâ ile üret."
- Hero alt: "Vesna; tarayıcıda çalışan, gerçek zamanlı işbirlikçi bir çizim, mahal/m² otomasyonu ve yapay zekâ tasarım asistanı platformudur. DWG/DXF aç, mahalleri otomatik bul, Türkçe yönetmeliğe danış, tariften plan ürettir."
- CTA'lar: "Hemen Başla — Ücretsiz" / "Özellikleri gör" / "Uygulamayı Aç"
- 9 özellik (başlık — açıklama):
  1. DWG/DXF içe aktarma — AutoCAD dosyanı tarayıcıda aç, katmanları tanı, iki nokta + gerçek mesafe ile tek tıkla ölçekle.
  2. Otomatik mahal & m² — Duvarlardan mahalleri otomatik bulur, canlı m² hesaplar, oda listesini Excel'e aktarır.
  3. Türkçe yönetmelik asistanı — İmar, TBDY ve TS 9111'e dayalı, kaynak gösteren öneriler.
  4. Tariften plan üretimi — "90 m² 3+1 daire" yaz, yapay zekâ taslak kat planını çizsin.
  5. Plandan AI render — Atmosfer, malzeme ve ışığı tarif et; fotogerçekçi görsel üret.
  6. Kesit & 3B önizleme — Kesit çek, planını anında 3B'de incele.
  7. Gerçek zamanlı işbirliği — Linki paylaş, aynı çizimde birlikte çalış; imleçler ve yorumlar canlı.
  8. Pafta & dışa aktarma — Pafta düzeni, metraj/maliyet ve PDF · PNG · SVG · DXF · Excel.
  9. Hızlı ve ölçeklenebilir — WebGL motoru ile büyük çizimlerde akıcı; kurulum yok.
- Neden Vesna (4): "Kurulum yok, her yerde" / "Türkiye'ye özel zekâ" / "Çiz + hesapla + üret tek yerde" / "Verin sende kalır".
- Fiyat planları: Ücretsiz (₺0) · Pro (~$12/ay, Popüler) · Stüdyo (~$29/ay). (Detay tablo bende var; sade kartlar yeter.)

**Teknik kısıtlar:** React + Tailwind (CSS değişkenleriyle tema). Hazır SVG ikonları (lucide) kullanabilirsin. Responsive (mobil + masaüstü). Erişilebilir (kontrast, odak halkaları). Gereksiz animasyon yok; ince, zarif geçişler olabilir.

**Çıktı:** Her sayfa için tek dosya React bileşeni + paylaşılan tema/token tanımı + 3 logo SVG önerisi.

---

## Entegrasyon notu (Claude/kod için)
- claude.ai/design çıktısı geldiğinde: bileşenleri `apps/web/app/*` ve `components/*`'e uyarla; mevcut rota yapısı (`/`, `/app`, `/fiyatlandirma`, `/gizlilik`, `/kosullar`) + `AuthButtons` (Clerk) + `VesnaMark`/tema toggle korunur.
- Tema toggle: `data-theme` + localStorage; `/app` (canvas) zorla koyu kalır (engine renkleri koyu).
- Marka adı **Vesna**; "ZynppArti"/"Arti" kod adıdır, kullanıcıya gösterilmez.
