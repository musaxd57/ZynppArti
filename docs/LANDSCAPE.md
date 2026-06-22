# docs/LANDSCAPE.md — Rakip & Teknoloji Araştırması (ZynppArti)

> Amaç: Rayon ve "tek bir konuda bizden çok daha iyi" olan araçları/açık kaynak repoları didik didik incelemek; her birinden **ne öğreneceğimizi/çalacağımızı** çıkarmak. Bu dosya `CLAUDE.md`'ye parça parça eklenmek üzere ham cevherdir.
>
> Her bölümün sonunda **➤ ZynppArti'ye ne katar** kutusu var — CLAUDE.md/docs'a taşınacak madde budur.
>
> Not: Fiyat/özellikler aylık değişir; karar anında ilgili siteden doğrula. (Araştırma tarihi: bu oturum.)

---

## 0. ÖZET — 12 satırda manzara

- **Çizim motoru** için en iyi açık kaynak referanslar: **tldraw** (mimari/reaktif store, ama SDK ticari lisanslı), **Excalidraw** (MIT, özgür), **Konva/PixiJS/Fabric** (alt seviye render).
- **Rayon'un gerçek mimarisi**: UI (TS) + çekirdek (Rust→WASM), iki backend (metadata + realtime), commit-log senkron, model = blob dosya. (Kaynak: kurucu röportajı — `docs/ARCHITECTURE.md`.)
- **AI plan üretimi** Rayon'da YOK; rakipler bu cephede güçlü: **Maket, TestFit, ArkDesign, Hypar, Finch, Snaptrude, qbiq, Archistar**. Ayırt edici: **imar/yönetmelik uyumu** + **canlı metrikler** (gün ışığı, verim).
- **AI render** Rayon'da zayıf; **Veras, PromeAI, Visoid, Vizcom, LookX/Arko, mnml, D5** çok ileride. Teknik temel: **ControlNet** (geometriyi koruyarak görsel üretir).
- **İşbirliği**: **Yjs** (varsayılan), **Loro** (Rust/WASM, en hızlı, "movable Tree" katman hiyerarşisi için ideal), **Automerge** (Git-benzeri geçmiş). Managed: **Liveblocks/PartyKit/Hocuspocus**.
- **DWG/DXF**: `libredwg-web` (WASM, tarayıcıda) + `dxf-parser`; sunucu yedeği ODA.
- **Geometri çekirdek**: 2D için JSTS/Clipper2/polygon-clipping; 3D/BIM için **OpenCascade.js (OCCT→WASM)**.
- **3D/BIM (ileri faz)**: **web-ifc / That Open Engine** (IFC oku-yaz), **Speckle** (AEC veri + Revit/Rhino/AutoCAD bağlayıcıları), **three.js**.
- **İncelenecek açık kaynak mimariler**: tldraw, Chili3D/ifc5cad, mlightcad/cad-viewer, That Open Engine.

---

## 1. ÇİZİM / SONSUZ TUVAL MOTORLARI (canvas engine)

| Araç | Yıldız | Lisans | Güçlü yanı | ZynppArti için ders |
|------|--------|--------|------------|---------------------|
| **tldraw** | ~45k | **Ticari** (prod'da ~yıllık ücret) | Reaktif store + records (Shape/Binding), `ShapeUtil`, Editor merkezi, custom tool/binding, hit-test geometri sistemi, multiplayer sync | **Mimari modeli aynen referans al** (kopyalama, ilham). SDK'yı gömme — lisans var. |
| **Excalidraw** | ~75k | MIT (özgür) | Hafif, PWA, E2E şifreleme, basit element modeli | Özgür lisans örneği; ama CAD hassasiyeti/ölçek yok. Kod okunabilir. |
| **PixiJS** | — | MIT | WebGL 2D, yüksek performans, custom shader | **Bizim render motorumuzun temeli** (CLAUDE.md §5). |
| **Konva** | ~11k | MIT | Scene-graph, layer/grup, event/anim | Scene-graph deseni; orta performans. |
| **Fabric.js** | ~28k | MIT | Nesne-yönelimli canvas, dönüşüm tutamaçları | Seçim/transform UX'i için fikir. |
| **Motion Canvas** | — | MIT | Programatik animasyon (zaman çizelgesi) | **Sunum/animasyon (§8.6)** için keyframe fikri. |

**Kritik gözlem:** Hiçbir açık kaynak SDK "kutudan çıkar gibi" tam editör vermiyor; herkes canvas kütüphanesi + kendi editör mantığını birleştiriyor. Biz de `geometry`/`document`/`engine` ayrımıyla aynı yolu izliyoruz.

**➤ ZynppArti'ye ne katar:** Render = PixiJS. Doküman/store mimarisi = tldraw modeli (records + reaktif + ShapeUtil + Binding + side-effects). tldraw SDK'yı **gömme** (lisans); sadece desenini öğren.

---

## 2. WEB CAD / MİMARİ TASARIM RAKİPLERİ (Rayon ve ötesi)

| Araç | Konum | Bizden/ Rayon'dan iyi olduğu cephe | Ders |
|------|-------|-----------------------------------|------|
| **Rayon** | 2D işbirlikçi CAD | Olgun çizim + m² + sunum, kanıtlı mimari | Ana referans. (Detay: `docs/ARCHITECTURE.md`.) |
| **Snaptrude** | Tarayıcı BIM + AI | **2D↔3D tek araçta**, gerçek zamanlı işbirliği, **Revit/BIM export**, canlı maliyet/alan/uyum | Faz 5 (3D) ve BIM export hedefi için yol gösterici. |
| **Arcol** | Konsept BIM | İşbirliği + sunum odaklı modern UX | Sunum/paydaş akışı UX'i. |
| **TestFit** | Emlak fizibilite | Saniyede **saha yerleşimi**, çözüm konfigüratörü | Faz 4 (üretici) "test fit" mantığı. |
| **Spacemaker / Autodesk Forma** | Kentsel/erken tasarım | Saha analizi, güneş/rüzgar/gürültü simülasyonu | Uzun vade: analiz katmanı. |
| **Foyr Neo / Coohom / Planner 5D** | İç mekan 3D | Hızlı 3D + render + mobilya kütüphanesi | Blok/asset kütüphanesi ve 3D hızı. |
| **CubiCasa** | Tarama→plan | Telefonla tarama → ölçekli plan | İleride mobil tarama girişi. |

**➤ ZynppArti'ye ne katar:** En tehlikeli rakip **Snaptrude** (tarayıcı + AI + BIM + işbirliği). Bizim farkımız: 2D öncelikli sadelik + AutoCAD/DXF köprüsü + AI render'ı **kesite de** uygulamak. "BIM export (IFC/Revit)" hedefini `docs/ROADMAP.md` Faz 5/6'ya not düş.

---

## 3. AI PLAN ÜRETİMİ (Rayon'da YOK — bizim 4. cephemiz)

**Ticari oyuncular ve ayırt edici özellikleri:**
- **Maket.ai** — metin→plan, **imar/setback/kural** girdisi, saniyede varyant; uygun fiyat. Residential odaklı.
- **TestFit** — saha + bütçe + hedef → anlık yerleşim (multifamily/feasibility).
- **ArkDesign.AI** — **kod/yönetmelik uyumu** üretim motoruna gömülü; multifamily/mixed-use.
- **Hypar** — kısıt tanımla → bina geometrisi + sistemleri üret; ücretsiz katman; "binayı tarif et" → plan/strüktür.
- **Finch 3D** — kısıt (birim sayısı, koridor genişliği, gün ışığı) → **canlı performans metrikleriyle** varyant.
- **Snaptrude / Archistar / Laiout / qbiq / ARCHITEChTURES** — kurumsal/uyum/3D tur varyantları.

**Akademik temel (kendi modelimiz için yol):**
- **Graph2Plan** — yerleşim grafiği + sınır → kısıtları sağlayan plan (DB'den retrieval + sinir ağı).
- **House-GAN / House-GAN++** — komşuluk grafiğine koşullu GAN; ++ kapı yerleşimini de öğrenir.
- **HouseDiffusion** — **vektör** plan üreten difüzyon (raster değil → bizim için doğru çıktı tipi).
- **Tell2Design / FPDS / HouseTune** — **dil-güdümlü + LLM-asistanlı** üretim (modern yön).

**Ortak ders:** Girdi temsili = **bubble diagram (komşuluk grafiği) + sınır + program (oda/m²)**. Çıktı **vektör** olmalı. **İmar/yönetmelik uyumunu üretime gömmek** en büyük ticari değer.

**➤ ZynppArti'ye ne katar:** Faz 4 girdi şeması: `{sınır poligonu, oda listesi+m², komşuluk grafiği, kurallar(setback/kat/imar)}` → çıktı **vektör plan** (`packages/document` entity'leri). Önce **retrieval+kural** (Graph2Plan tarzı, daha kontrollü), sonra difüzyon. Detay: `docs/AI-GENERATE.md`.

---

## 4. AI RENDER (plandan/eskizden görsele — bizim 5. cephemiz)

**Teknik temel:** **ControlNet + difüzyon.** ControlNet, mevcut bir görüntüden (eskiz, tel kafes plan, model fotoğrafı, CAD çıktısı) **geometriyi koruyarak** üretir — "ex nihilo" değil, var olanı zenginleştirir. Yani 4 katlı bina 5 kat olmaz (saf prompt'un klasik hatası).

| Araç | Ayırt edici | Ders |
|------|-------------|------|
| **Veras (EvolveLAB/Chaos)** | 7 BIM/CAD platformuna **eklenti** (Revit/SketchUp/Rhino/Archicad…); **image→video walkthrough** (4.0); veriyi eğitime kullanmama politikası | Hedef: render + **kısa yürüyüş animasyonu**. Veri gizliliği duruşu. |
| **PromeAI** | Sketch-to-render, **"constant composition"** (kompozisyonu sabit tutar) | Kontrollü/tekrar üretilebilir render modu. |
| **Vizcom** | Eskiz→render, model screenshot akışı, "creative fusion" | Eskiz girişli hızlı varyant. |
| **Visoid / LookX(Arko) / mnml / ArchiVinci / D5** | Yükle→saniyede foto-gerçekçi, GPU gerektirmez | Bulut kuyruğu + hız beklentisi (30–60 sn). |
| **RoomGPT / Interior AI / Spacely** | Foto→stil varyantı (iç mekan) | Hızlı moodboard/müşteri önizleme; düşük layout kontrolü. |

**Workflow dersi:** Önce yaratıcı/serbest (Midjourney tarzı), sonra **kontrollü** (PromeAI constant composition / Veras sketch) — tasarımı "taşa kazırken" kontrol artar.

**➤ ZynppArti'ye ne katar:** `services/ai-render` = ControlNet koşullu difüzyon; **plan VE kesit** girişi; "yaratıcı mod" + "geometriyi koru modu" iki ayar; sonraki adım image→video. Başlangıç: Replicate/Fal API; sonra kendi host. Detay: `docs/RENDER.md`.

---

## 5. İŞBİRLİĞİ / SENKRON (CRDT & altyapı)

| Çözüm | Tip | Güçlü | Zayıf | ZynppArti notu |
|-------|-----|-------|-------|----------------|
| **Yjs** | CRDT (JS) | Olgun, en büyük ekosistem, hızlı, presence/offline | Çok büyük geçmiş için ek maliyet | **Faz 3 başlangıcı = Yjs.** |
| **Loro** | CRDT (Rust/WASM) | En hızlı; **movable Tree** CRDT; 100k+ op/sn | Genç ekosistem | **Katman hiyerarşisi (nested layer)** için Tree CRDT — Rayon'un "döngü invariant'ı" sorununa zarif çözüm. WASM geçişinde değerlendir. |
| **Automerge** | CRDT (Rust/WASM) | **Git-benzeri tam geçmiş/DAG** | Daha ağır | "Sürüm kontrolü/branch" vizyonu (§6.7) için ilham. |
| **Liveblocks / PartyKit / Hocuspocus** | Managed altyapı | WebSocket/presence/oda/persist hazır | Bağımlılık/maliyet | Kendi sync backend'ini yazana kadar hız kazandırır. |
| **Rayon yaklaşımı** | Commit-log + merkezi otorite | **Invariant garantisi** (döngü yok), nedensellik, sürüm kontrolü temeli | Kendin yazarsın | **North star** (Faz 6): ölçekte CRDT'den buna geçiş seçeneği. |

**Önemli nüans:** "Çakışma" CRDT'de yoktur, "eşzamanlı güncelleme" vardır — kullanıcı asla "çakışan sürüm" popup'ı görmez. Ama **invariant** (örn. katman döngüsü) CRDT'nin tek başına çözemediği şeydir; onu veri katmanında zorlamak gerekir (Rayon dersi).

**➤ ZynppArti'ye ne katar:** Faz 3 = Yjs + Hocuspocus. `docs/DECISIONS.md`'ye yaz: "Ölçek/sürüm-kontrolü kritikleşince Loro (Tree CRDT) veya Rayon-tarzı commit-log değerlendirilecek." Katman hiyerarşisini baştan **döngüsüz** kuracak invariant ekle.

---

## 6. DWG / DXF / 2D GEOMETRİ

- **DXF okuma:** `dxf-parser` / `@mlightcad/dxf-json` (hafif, tarayıcı). **İlk hedef bu.**
- **DWG okuma (tarayıcı):** `@mlightcad/libredwg-web` (libredwg→WASM, backend'siz). Sınırlar: R2010+ bazı entity'ler atlanır, **XRef yok, tablo yok**, bazı dosyalar açılmaz, SHX font kodlaması (Latin-dışı) bozulabilir.
- **DWG güvenilir:** sunucuda **ODA File Converter** (lisanslı) DWG→DXF; LibreDWG açık yedek.
- **Referans repo:** `mlightcad/cad-viewer` — tarayıcıda **tam 2D AutoCAD benzeri** görüntüleyici+editör (WASM+WebGL, modüler). **İncelenecek.**
- **2D geometri çekirdek seçenekleri:** `polygon-clipping`/`martinez` (boolean/alan), **JSTS** (JTS portu — sağlam ama ağır), **Clipper2** (offset/clip — duvar ofseti için çok iyi), `@flatten-js/core` (temel primitive).

**➤ ZynppArti'ye ne katar:** `packages/io`: DXF first → libredwg-web → ODA fallback. `packages/geometry`: Clipper2 (offset/boolean) + flatten-js (primitive). cad-viewer repo'sunu mahal-bulma ve katman eşleme için kaynak olarak oku.

---

## 7. 3D / BIM / AEC VERİ (ileri fazlar: 5–6)

| Araç | Ne işe yarar | ZynppArti faz |
|------|--------------|---------------|
| **three.js / react-three-fiber** | Web 3D temel | Faz 5 (2D→3D hacim). |
| **OpenCascade.js (OCCT→WASM)** | Endüstriyel **3D geometri çekirdeği** (katı modelleme, boolean, fillet) | Faz 5+ ciddi 3D. |
| **web-ifc / That Open Engine** | IFC dosyalarını **native hızda oku-yaz**, BIM araçları (kesit, ölçü, 2D plan üretimi) | **BIM köprüsü** — Revit dünyasına açılır. |
| **Speckle** | AEC **veri platformu**: Revit/Rhino/Blender/AutoCAD/Tekla bağlayıcıları, viewer, GraphQL API | Faz 6: kurumsal entegrasyon/interop. |
| **Chili3D / ifc5cad** | Tarayıcıda CAD: **OCCT(WASM)+three.js**, temiz entity-component paket yapısı (chili-core/geo/wasm/three…) | **Mimari referans** — 3D'ye geçerken paket ayrımı buradan öğrenilir. |
| **Hypar** | Kısıt→bina geometrisi/sistemleri (generative) | Faz 4 üretici ilhamı. |

**➤ ZynppArti'ye ne katar:** 3D'ye geçince saf 2D mimariyi bozma; `packages/geometry`'yi koru, 3D'yi ayrı paket yap (Chili3D'nin chili-geo/chili-three ayrımı gibi). BIM dünyasına köprü = web-ifc (IFC import/export) + uzun vadede Speckle. Bunları `docs/ROADMAP.md` Faz 5–6'ya işle.

---

## 8. İNCELENECEK AÇIK KAYNAK MİMARİLER (repo okuma listesi)

1. **tldraw** (`tldraw/tldraw`) — store/records/ShapeUtil/Editor/Binding/side-effects deseni. **En öncelikli.**
2. **Chili3D / ifc5cad** (`louistrue/ifc5cad`) — tarayıcı CAD, OCCT-WASM + three.js, paket ayrımı.
3. **mlightcad/cad-viewer** — tarayıcıda DWG/DXF görüntüleyici+editör (WASM+WebGL), mahal/katman.
4. **That Open Engine** (`ThatOpen/engine_web-ifc`) — IFC oku-yaz; BIM araç desenleri.
5. **Excalidraw** — özgür lisanslı, okunabilir element/collab kodu.
6. **Loro** (`loro-dev/loro`) — Tree CRDT; katman hiyerarşisi senkronu.

**Kural (CLAUDE.md'ye):** Bir özelliği yazmadan önce, yukarıdaki listede o özelliğin "en iyi yapan" repo'su varsa, önce oranın yaklaşımını oku, sonra kendi sade versiyonunu yaz. Tekerleği yeniden icat etme; ama lisansa dikkat (tldraw SDK ticari).

---

## 9. CLAUDE.md'ye EKLENECEK MADDELER (özet checklist)

- [ ] §5 Stack: 2D geometri için **Clipper2** + flatten-js; (JSTS ağır, gerekirse).
- [ ] §6.4 Collab: Yjs+Hocuspocus ile başla; **Loro (Tree CRDT)** ve **commit-log** north-star olarak DECISIONS'a.
- [ ] §6.2 Store: **tldraw record/ShapeUtil/Binding** desenini benimse.
- [ ] §8.4 IO: DXF→libredwg-web→ODA fallback zinciri (yazıldı, koru).
- [ ] §8.7 Render: ControlNet "yaratıcı mod / geometri-koru modu" iki ayarı; kesit girişi; sonraki adım image→video (Veras dersi).
- [ ] §8.8 Üretici: girdi=bubble diagram+sınır+kural, çıktı=vektör; **imar/yönetmelik uyumu** ticari değer (Maket/ArkDesign dersi).
- [ ] Roadmap: Faz 5–6'ya **BIM köprüsü (web-ifc/IFC)** ve **Speckle interop** ve **2D→3D (OCCT-WASM)**.
- [x] Yeni `docs/` dosyaları: `RENDER.md`, `AI-GENERATE.md` (⏳ araştırma tohumu), `ARCHITECTURE.md` (✅ sevk edilen mimariyle dolduruldu, 2026-06-22). DWG/WASM (`libredwg-web`) hâlâ ☐ (kurulu değil).
- [ ] Repo okuma listesi (§8) CLAUDE.md "Çalışma kuralları"na referans olarak eklensin.

---

### Seçili kaynaklar (doğrulama için)
- Rayon mimari röportajı: digest.browsertech.com (How Rayon is making CAD)
- tldraw: tldraw.dev / github.com/tldraw/tldraw
- libredwg-web: github.com/mlightcad/libredwg-web ; cad-viewer: github.com/mlightcad/cad-viewer
- AI plan: Graph2Plan (ACM TOG), House-GAN++ (arXiv:2103.02574), HouseDiffusion
- AI render: blog.chaos.com (Veras), educasium ControlNet karşılaştırması
- CRDT: pkgpulse Yjs/Automerge/Loro 2026; loro.dev
- BIM: ThatOpen/engine_web-ifc ; Speckle ; louistrue/ifc5cad (Chili3D/OCCT-WASM)

*Bu dosya "ansiklopedi"dir; özetleri CLAUDE.md'ye taşıdıkça burayı kaynak olarak bırak.*
