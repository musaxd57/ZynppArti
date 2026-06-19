# AI-GENERATE — Otomatik plan üretimi (araştırma + plan)

> CLAUDE.md §8.8'in uzun hali. Faz 4'e kadar SADECE araştırma; kod yok.

## Literatür (incelenecek)
- **Graph2Plan** — komşuluk grafiği + sınır → plan
- **House-GAN++** — GAN tabanlı yerleşim iyileştirme
- **HouseDiffusion** — diffusion ile vektör plan üretimi
- **Tell2Design / dil-güdümlü** — metinden plan
- **iPLAN** — etkileşimli/prosedürel yerleşim
- LLM-asistanlı hibrit (kural + Claude API)

## Kapsam (doldurulacak)
- Girdi temsili: bubble diagram (komşuluk grafiği) + arsa/sınır + program (oda/m²)
- Çıktı: **vektör** plan (raster değil) → mevcut Document modeline map
- Çoklu alternatif üretimi + puanlama/sıralama
- Kesit üretimi
- İnsan + AI düzenleme döngüsü (üretileni Command sistemiyle düzenleme)

**Not:** Bu en zor parça. Sağlam çizim motoru + domain modeli olmadan başlanmaz (CLAUDE.md §8.8).
