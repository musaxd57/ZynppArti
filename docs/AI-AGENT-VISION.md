# docs/AI-AGENT-VISION.md — Copilot'tan Ajana: Uzun Vadeli AI Vizyonu (ZynppArti)

> Not: "Mythos" bir araştırma seviyesi değil, Anthropic'in sınırlı erişimli bir model katmanı. Bu dosya "en üst düzey AI sistemleri" araştırmasının ZynppArti'ye düşen, **gerçekten uygulanabilir** kısmı.
> Bu UZUN VADELİ vizyondur (Faz 4+). Faz 2 hâlâ "öneri veren copilot"tur. Burası nereye gittiğimizi gösterir.

---

## 1. EN ÖNEMLİ İÇGÖRÜ: "AI app" değil "AI agent" — ve bizim mimarimiz buna HAZIR ★★★

Sektördeki ayrım net: **AI app** = düğmeye basınca tek bir iş yapar (örn. bir kural kontrolü). **AI agent** = çok adımlı bir işi, her adımı tek tek istemeden, kendi planlayıp yürütür; sonra yapılandırılmış çıktı üretir. Ajanlar zamanla **birikmeli değer** verir — bir görevi değil, bir **iş akışını** otomatikleştirir.

**ZynppArti'nin gizli kozu:** Bizim doküman modelimiz **Command tabanlı** (Faz 1'de kurduk — model yalnız Command'den değişir). Bu, ajan için **ideal altyapı**:
- Bir AI ajanı "tüm yatak odalarını min 12 m² yap" gibi bir isteği alır → planlar → **Command'ler üretir** → uygular.
- Her AI eylemi bir Command = **undo geçmişinde geri alınabilir** = yerleşik güvenlik ağı + denetim izi (audit trail).
- Yani bizde AI'ın yaptığı her şey **şeffaf, geri alınabilir, izlenebilir.** (Sektörün "kara kutu değil, insan-döngüde kontrol + denetim izi şart" dediği şey bizde mimariden geliyor.)

Akademik destek: text-to-CAD çalışmaları (LLM4CAD vb.) doğal dili **çalıştırılabilir CAD komut dizisine** çeviriyor. Bizim Command sistemimiz tam bu çıktıya göre kurulu — "güney duvara 1m kapı ekle" → Command dizisi → uygulanır.

**➤ Karar:** ZynppArti'nin copilot'u uzun vadede "öneren" değil **"yapan ajan"** olacak; ve bunu güvenli kılan şey Faz 1'de kurduğumuz Command/undo mimarisi. Bunu CLAUDE.md §8.8'e "ajan, Command üretir; her eylem geri alınabilir" diye işle.

---

## 2. GÜVENLİ OLGUNLAŞMA MERDİVENİ (3 seviye) — faz faz

Ajan sistemleri üç olgunluk seviyesinde anlaşılır; biz de **bu sırayla** çıkacağız (atlamak tehlikeli):

| Seviye | Ne yapar | ZynppArti'de | Faz |
|--------|----------|--------------|-----|
| **1 — Asistan / öneri** | Doğal dile göre **çıktı/öneri** üretir; uygulamaz | "Bu koridor dar" (salt-okunur, kaynak-gösteren) | **Faz 2** |
| **2 — Router / önerilen eylem** | Hangi araç/komutun çalışacağına karar verir; **kullanıcı onaylar** | "Şu duvarı 20cm kaydırayım mı?" → onayla → Command uygulanır | Faz 3-4 |
| **3 — Otonom ajan** | Çok adımlı işi kendi planlar, yürütür; insan **kontrol noktalarında** denetler | "Programa göre tüm planı düzenle" → ajan Command zinciri üretir | Faz 5+ |

**Altın kural (sektör + bizim değerlerimiz):** Her seviyede **insan-döngüde (human-in-the-loop)**, **guardrail/devre kesici**, ve **denetim izi** şart. Bizde denetim izi = Command geçmişi; guardrail = invariant kontrolü; geri alma = undo. Yani üçü de mimaride var.

**➤ Karar:** Faz 2 = Seviye 1 (öneri). Ajanı Seviye 2/3'e **acele taşıma**; her seviye kendi fazında, önce onaylı sonra otonom.

---

## 3. NE YAPMA (önemli sınırlar)

- ❌ Faz 2'de ajanı "kendi başına çizim değiştirsin" yapma — önce salt-öneri (Seviye 1). Kullanıcı güveni böyle kazanılır.
- ❌ AI'a Command sistemini **baypas ettirip** doğrudan modeli değiştirtme — o zaman undo/denetim izi/güvenlik biter. AI da herkes gibi Command'den geçer.
- ❌ "En gelişmiş = en otonom" sanma. En gelişmiş = **doğru seviyede, kullanıcı kontrolünde, geri alınabilir.** Otonomi sorumlulukla gelir.
- ⚠️ Her AI eyleminden önce/sonra **invariant kontrol** (geçersiz model üretmesin).

---

## 4. RAKİP/REFERANS (nereye bakılacak)
- **CAD-Assistant / AADvark / LLM4CAD** — doğal dil → CAD komutu (text-to-CAD ajanları).
- **Claude artık Autodesk Fusion içinde CAD kurabiliyor** — sektör bu yöne gidiyor (ajan + CAD).
- **CoLab AutoReview** — mühendislik tasarım incelemesini ajanla otomatikleştiren örnek (öneri→workflow).
- Ajan mimarisi desenleri: algı → planlama → araç kullanımı → bellek (Calmops/Vellum 2026 rehberleri).

---

## ÖZET — CLAUDE.md/ROADMAP'e
- [ ] §8.8 Copilot: "Seviye 1 (öneri, Faz 2) → Seviye 2 (onaylı Command, Faz 3-4) → Seviye 3 (otonom ajan, Faz 5+)".
- [ ] Vurgula: **AI, Command sistemiyle çalışır** → her eylem geri alınabilir + denetlenebilir (bizim yapısal avantajımız).
- [ ] İnsan-döngüde + invariant guardrail + undo denetim izi her seviyede zorunlu.
- [ ] Bu, render/copilot/metraj/yönetmelik üstüne oturan **uzun vadeli tavan**; Faz 2 önceliğini değiştirmez.

### Kaynaklar
- AI app vs agent + olgunluk: CoLab (engineering design agents), Vellum "AI Agent Workflows 2026" (3 seviye), CIO (agentic engineering 2026)
- text-to-CAD: LLM4CAD / CAD-Assistant / AADvark (arXiv 2604.15184, 2604.06747); Claude in Autodesk Fusion (colabsoftware)
- Ajan mimarisi: Calmops "Agentic AI Architecture 2026"
