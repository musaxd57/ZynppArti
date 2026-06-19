# docs/FAZ2-NOTES.md — Faz 2 (AI Render + Copilot) + Kesit Gerçeği

> Faz 2'ye girmeden önce araştırmadan çıkan, CLAUDE.md/ROADMAP'e işlenecek **yeni** bulgular.
> Önceki dosyalar (LANDSCAPE, ENGINEERING-NOTES, DOCS-BACKLOG) hâlâ geçerli; bu onların üstüne Faz 2'ye özel ekleme.

---

## 1. AI RENDER — "export et" değil, "canlı panel" modeli ★

**Eski yaklaşım (zayıf):** Çizimi dışa aktar → ayrı bir AI render aracına yükle → bekle → geri al.
**Modern yaklaşım (hedefimiz):** Uygulamanın **içinde bir prompt paneli**; kullanıcı atmosfer/malzeme/ışık tarif eder, AI bunu **canlı modele** uygular; plan veya kesit değişince render **export derdi olmadan** güncellenir.

Pazar kanıtı: Archicad AI Visualizer / Veras gibi araçlar "malzeme ve ışığı bir prompt panelinden tarif et, jeneratif algoritma canlı BIM modeline uygular; plan/kesit değişince görsel otomatik güncellenir" mantığında çalışıyor; kullanıcılar çalışma-modeli üretim süresinin ciddi düştüğünü söylüyor.

**➤ Karar (DECISIONS'a):** `services/ai-render` bir "dışa aktar-yükle" akışı değil, **uygulama içi canlı render paneli** olsun. Girdi: plan **ve kesit**. İki mod: "yaratıcı" + "geometriyi koru" (ControlNet — LANDSCAPE §4). Sonraki adım: image→video (Veras dersi).

---

## 2. AI COPILOT — sadece "öneri" değil, (a) kaynak-gösteren + (b) canlı metrik ★

İki kritik ders var:

**(a) Kaynak göstermeli, palavra atmamalı.** Genel LLM'ler "geniş ama sığ" cevap verir; yapı/yönetmelik gibi can güvenliği konularında **doğruluk + atıf** şart. UpCodes Copilot gibi araçlar proje-farkında çalışıp **satır satır yönetmelik atıflı** uyum checklist'i üretiyor; mesele "akıcı cümle" değil, "doğru madde". → Bizim copilot bir öneri verince **hangi kurala/ölçüye dayandığını** göstermeli (örn. "TS 9111 erişilebilirlik: koridor min 120 cm; seninki 90 cm").

**(b) Copilot = canlı metrik paneli (sadece sohbet değil).** Modern araçlar (Architechtures, Finch, Blueprints AI) tasarlarken **gerçek zamanlı** geri bildirim veriyor: inşa edilebilir alan, brüt/net m², birim dağılımı, gün ışığı, enerji, imar uyumu — hepsi sen çizdikçe güncelleniyor. → Bizim mahal/m² özelliğini **canlı metrik paneline** büyüt: toplam m², net/brüt, oda tipi dağılımı, (ileride) verimlilik oranı.

**➤ Karar:** Copilot iki ayaklı: (1) kaynak-gösteren öneri motoru (geometri kuralı + LLM, atıflı), (2) sen çizdikçe güncellenen canlı metrik paneli (m² özelliğinin üstüne).

---

## 3. TÜRKÇE YÖNETMELİK = GERÇEK FARKLILAŞTIRICI (büyük fırsat) ★★

Önemli boşluk: piyasadaki kod/uyum copilot'ları (UpCodes vb.) **ABD yönetmeliklerine** odaklı; başka ülkelerin kodları çoğunlukla desteklenmiyor — açıkça "diğer yargı bölgeleri henüz desteklenmiyor" deniyor.

**Senin avantajın:** Türkiye pazarında **İmar Yönetmeliği, Deprem Yönetmeliği (TBDY), Otopark Yönetmeliği, yangın/erişilebilirlik (TS 9111)** farkında bir copilot **kimsede yok denecek kadar az.** Bu, ZynppArti'yi Türk mimar için "olmazsa olmaz" yapar — Rayon'da da, ABD araçlarında da olmayan şey.

**➤ Karar (ROADMAP'e):** Copilot'un Türkçe-yönetmelik bilgisi bir **uzun vadeli farklılaştırıcı** olarak işaretlensin (Faz 2'de tohum: çekme mesafesi/kat/koridor/otopark kuralları; ileride genişlet). Bu, fiyatlandırmada da premium özellik.

---

## 4. KESİT (SECTION) GERÇEĞİ — beklentiyi düzelt ★

Senin baştan istediğin "kesiti de otomatik yapsın" — ama dürüst teknik gerçek şu:

**Otomatik kesit/cephe, özünde bir 3B/BIM işidir.** BricsCAD BIM, OrthoGen, Revit gibi araçlar kesit/cephe görünüşlerini **3B modeli bir düzlemle keserek** üretir. Saf 2B plandan (yükseklik bilgisi olmadan) gerçek kesit türetilemez — çünkü kesitte duvar yüksekliği, döşeme kalınlığı, çatı eğimi gibi **dikey bilgi** gerekir; bunlar planda yok.

**İki gerçekçi yol:**
- **(A) Tam yol — Faz 5 (3B):** Duvarlara yükseklik ver → 3B hacim → istenen yerden kes → kesit. En doğrusu ama 3B fazını bekler.
- **(B) Hafif ara yol — Faz 2/3'te mümkün:** Plana **kesit çizgisi** koy; duvarlara basit **yükseklik özelliği** ver (kat yüksekliği, döşeme kalınlığı); bu çizgi boyunca duvarları "ekstrüde edip" basit bir **şematik kesit** üret. Foto-gerçekçi değil ama hızlı, düzenlenebilir bir başlangıç. Sonra AI render ile zenginleştir.

**➤ Karar (ROADMAP'e):** Kesit, "Faz 2'de tek tıkla foto-kesit" diye söz verilmesin. Gerçekçi plan: **(B) hafif şematik kesit** (duvar yüksekliği + kesit çizgisi) Faz 3 civarı, **(A) tam 3B kesit** Faz 5. Kesit AI render'ı bu temelin üstüne biner.

---

## 5. FAZ 2 RAKİP HARİTASI (kime bakacağız)

| Alan | İncelenecek | Ders |
|------|-------------|------|
| Entegre canlı render | Veras, Archicad AI Visualizer | Prompt paneli + canlı model + image→video |
| Kod/uyum copilot | UpCodes Copilot Intelligence | Atıflı, proje-farkında, checklist üreten |
| Canlı metrik tasarım | Architechtures, Finch, Blueprints AI | Çizerken gerçek zamanlı m²/uyum/enerji |
| 2B→3B hızlı | Kaedim | Eskiz/plan → 3B mesh (konsept için) |

---

### Özet — CLAUDE.md/ROADMAP'e eklenecekler
- [ ] AI render = uygulama içi **canlı panel** (export değil); plan+kesit; yaratıcı/geometri-koru modu.
- [ ] Copilot = **kaynak-gösteren öneri** + **canlı metrik paneli** (m²'nin üstüne).
- [ ] **Türkçe yönetmelik bilgisi** = premium farklılaştırıcı (İmar/TBDY/TS 9111…).
- [ ] Kesit beklentisini düzelt: hafif şematik kesit (duvar yüksekliği) Faz 3, tam 3B kesit Faz 5.

### Kaynaklar
- Entegre render: Monograph "Best AI for Architecture 2026" (Archicad AI Visualizer/Veras)
- Copilot/kod: UpCodes Copilot Intelligence (buildingenclosureonline), archeyes AI tools 2026 (ABD-kod sınırı)
- Canlı metrik: Architechtures.com, Snaptrude "Top 18 AI tools 2026" (Blueprints AI/Finch)
- Kesit/3B türetme: ScienceDirect S0957417425006402 (BricsCAD BIM/OrthoGen, 3B'den 2B kesit)
