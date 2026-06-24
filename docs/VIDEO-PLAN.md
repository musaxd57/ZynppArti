# VIDEO-PLAN — Pazarlama videoları (yerleşim + spesifikasyon + dürüstlük)

> Amaç: landing/pazarlama sayfalarına gerçek ürün demosu videoları koymak. Bileşen: `DemoVideo`
> (`apps/web/components/marketing/DemoVideo.tsx`). Dosyalar: `apps/web/public/videos/`.
> **Altın kural (Moses): müşteriyi yanıltma.** Sadece gerçek ürün kayıtları; olmayan özelliği varmış
> gibi gösterme; bir özellik hazır değilse videoda hazırmış gibi sunma. Video YOKKEN bileşen sahte
> oynat-düğmesi değil, dürüst yedek (ürün illüstrasyonu CadMockup) gösterir.

---

## Video yuvaları (nereye, ne amaçla, ne kadar)

| # | Yer | Amaç | Mod | Süre | Ses |
|---|-----|------|-----|------|-----|
| 1 | **Hero** (landing üst) | Asıl "vaadi göster": çiz → mahal otomatik bulunsun → m² → AI önersin. İlk 10 sn'de değeri anlat. | `player` (poster + tıkla-oynat) veya `ambient` (sessiz döngü) | 20–45 sn | Player'da ops. anlatım; ambient'te ses YOK |
| 2 | **Özellik klipleri** (özellik grid'i — ops.) | Her kilit özelliğin 1 cümlelik kanıtı: DWG import, mahal/m², AI Çiz, Render. | `ambient` (kısa sessiz döngü) | 4–8 sn | YOK |
| 3 | **"Nasıl çalışır"** (ops. ayrı bölüm) | Uçtan uca akış, sesli anlatım. | `player` | 60–90 sn | VAR (anlatım) |

> Başlamak için **yalnız #1 (hero)** yeter. Diğerleri sonra eklenebilir.

## Çekim içeriği (dürüst senaryo — hero)
Gerçek uygulamada, gerçek ekran kaydı:
1. Boş tuval → birkaç duvar çiz (snap'ler görünsün).
2. Mahaller **otomatik** bulunsun + m² canlı çıksın (asıl "vay" anı).
3. Bir mahale ad/tip ver → metrik panelinde görünsün.
4. (Ops.) AI'a "90 m² 3+1 öner" → taslak çizilsin **veya** yönetmelik sorusu → atıflı cevap.
- Var olmayan/yarım özelliği gösterme. Render/3B yalnız gerçekten çalışıyorsa koy.

## Teknik spesifikasyon
- **Format:** `.mp4` (H.264/AAC) zorunlu; ops. `.webm` (VP9) daha küçük → varsa bileşen onu seçer.
- **Çözünürlük:** 1920×1080 veya 1280×720. En-boy **16:9** (bileşen varsayılanı).
- **Boyut:** hero için hedef **< 6–8 MB** (ambient döngü daha da küçük). Büyükse sıkıştır (Handbrake/ffmpeg).
  Örnek: `ffmpeg -i kayit.mp4 -vf scale=1280:-2 -c:v libx264 -crf 26 -preset slow -an hero.mp4` (ses çıkar = `-an`).
- **Poster:** `hero-poster.jpg` (videonun ilk iyi karesi) → yüklenmeden gösterilir, hız + dürüstlük.
- **Çok büyük/çok video olursa:** dosya depolama/CDN'e taşınır (R2/Vercel Blob); şimdilik `public/` yeter.

## Nasıl eklenir (3 adım)
1. Videoyu `apps/web/public/videos/hero.mp4` (+ poster `hero-poster.jpg`) olarak koy.
2. İlgili sayfada yuvayı doldur:
   ```tsx
   <DemoVideo mode="player" src="/videos/hero.mp4" poster="/videos/hero-poster.jpg" fallback={<CadMockup />} />
   ```
3. Bitti. `src` boşken `fallback` (CadMockup) görünür → dürüst placeholder, kullanıcı kandırılmaz.

## Durum
- ✅ `DemoVideo` bileşeni hazır (ambient + player + dürüst yedek).
- ✅ Hero yuvası landing'e bağlı (`src` boş → CadMockup gösteriyor; video gelince tek satır `src`).
- ☐ Gerçek videolar (Moses çekiyor). Geldiğinde `public/videos/`'a konur + `src` verilir.
- ☐ claude.ai/design'ın yeni React sürümü gelince yuvalar oraya taşınır (aynı bileşen).
