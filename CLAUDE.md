# CLAUDE.md — ZynppArti

> **Proje kod adı: `ZynppArti`.** Değiştirmek istersen sadece bu satırı ve repo adını güncelle; ben (Claude) bu addan ilerlerim.
>
> **Tek cümlede:** Tarayıcıda çalışan, gerçek zamanlı işbirlikçi, AutoCAD'den daha hafif ama Rayon.design'dan **daha ölçeklenebilir** bir mimari/iç mimari **çizim + mahal/m² otomasyonu + plandan AI render + kesit + sunum/animasyon + AI tasarım asistanı** platformu.
>
> Bu dosya projenin **anayasasıdır**. Her oturumda otomatik okunur. Kısa cümleler, net kurallar. Derin teknik detaylar `docs/` altındadır; buradan oraya link verilir.

---

## 0. CLAUDE İÇİN ALTIN KURALLAR (önce bunları oku)

> **IMPORTANT:** Aşağıdaki kurallar tercih değil, kısıttır. Bir kuralı çiğnemeden önce dur ve Moses'a sor.

1. **YOU MUST:** Her oturuma `CLAUDE.md` + `docs/STATE.md` okuyarak başla. "Nerede kaldık?" sorusunun cevabı `docs/STATE.md`'de. Oturum sonunda `docs/STATE.md`'yi güncelle.
2. **YOU MUST:** Moses ile **Türkçe** konuş. Kod, tip adları, commit mesajları, teknik doküman başlıkları **İngilizce**. Kod içi yorum Türkçe olabilir.
3. **Moses bir mimar, profesyonel yazılımcı değil.** Teknik kararı sen ver; ama *neden* yaptığını 1–2 cümleyle, jargonsuz açıkla.
4. **IMPORTANT: Küçük, doğrulanabilir adımlarla ilerle.** Bir oturumda onlarca dosya birden üretme. Her anlamlı adımdan sonra `pnpm typecheck && pnpm test` çalıştır, çalıştığını göster.
5. **IMPORTANT: Çalışmayan ya da derlenmeyen kod teslim etme.** Yeşil testten geçmeyen şey "bitti" değildir.
6. **Belirsizlik = dur ve TEK soru sor.** Tahminle 2 saat yanlış yöne gitmektense baştan netleştir. Verdiğin mimari kararı `docs/DECISIONS.md`'ye yaz.
7. **Modeli ASLA komut (Command) sistemi dışından değiştirme.** Undo/redo ve çoklu kullanıcı bunun üstüne kuruludur (bkz. §6.3, §6.4).
8. **`packages/geometry` ve `packages/document` saf TypeScript'tir.** İçlerine React/DOM/PixiJS/`window` sızdırma. (Neden: bu paketler hem tarayıcıda hem sunucuda — AI üretici için — çalışacak.)
9. **Gizli anahtar (API key/token) commit'leme.** `.env` kullan, `.env.example` paylaş.
10. **Moses hızlı iterasyon sever, açıklama yükü istemez, sert ve net geri bildirim verir.** Alınma; düzelt, devam et.

---

## 1. VİZYON & FARKLILAŞMA — Rayon'u nerede geçiyoruz?

Rayon'un kanıtlanmış formülünü koruyoruz (2D öncelikli, tarayıcı öncelikli, çok oyunculu), ama **8 cephede** üstüne çıkıyoruz:

| # | Yetenek | Rayon (referans) | ZynppArti hedefi (fark) |
|---|---------|------------------|-------------------------|
| 1 | DWG/DXF içe aktarma | Var | **Tarayıcıda WASM ile parse** + akıllı katman tanıma + otomatik temizleme |
| 2 | Ölçekleme | Var | İki nokta + gerçek mesafe ile **1 tık kalibrasyon** |
| 3 | Mahal isimlendirme + m² | Var (zone/SQM) | **Duvarlardan otomatik mahal bulma** + canlı m² + tablo/Excel |
| 4 | Plandan görsel | Sınırlı | **AI render** (ControlNet + diffusion) — plan **ve kesit** için |
| 5 | Sunum/animasyon | Var | **Kamera keyframe zaman çizelgesi** + paper/pafta düzeni |
| 6 | Kesit (section) | Var | **Plandan yarı-otomatik kesit türetme** |
| 7 | Öneri / asistan | Yok | **AI copilot:** "bu koridor dar", "ıslak hacimleri grupla" |
| 8 | Boş plandan tasarım | Yok | **AI üretici:** sınır + program (oda/m²) → tam yerleşim planı |

**Ölçeklenebilirlik hedefi (Rayon'un kendi açıkladığı sınırlar baz alınarak):**
- Ortalama model ~50.000 entity, büyük model ~500.000 entity. **Hepsinde 60 FPS.**
- Bu yüzden mimari, kritik geometri/render parçalarını ileride **Rust→WASM**'e taşıyabilecek şekilde ayrıştırılmıştır (north star: Figma/Rayon mimarisi).

**Korunacak ürün ilkeleri:** Kurulum yok. Link ile paylaşım. Tek ortak payda = tarayıcı. AutoCAD + Illustrator + InDesign'ın işini tek araçta topla.

---

## 2. ŞU ANKİ DURUM

> Bu bölüm sadece **tek satır** özet içerir; gerçek durum `docs/STATE.md`'de.

**Faz 0 — İskelet TAMAM.** (Monorepo + pan/zoom canvas + yeşil CI. Sıradaki: Faz 1. Detay: `docs/STATE.md`.)

---

## 3. KOMUTLAR

> **IMPORTANT:** Komutları tahmin etme, bunları kullan. Faz 0'da bunları gerçek hale getir ve burayı güncel tut.

```bash
pnpm install            # bağımlılıklar (paket yöneticisi: pnpm, npm/yarn DEĞİL)
pnpm dev                # tüm uygulamaları geliştirme modunda çalıştır (turbo)
pnpm build              # production build
pnpm test               # birim testleri (Vitest)
pnpm test:watch         # izleme modunda test
pnpm test:e2e           # uçtan uca testler (Playwright)
pnpm lint               # ESLint
pnpm format             # Prettier
pnpm typecheck          # tsc --noEmit (TÜM paketlerde tip kontrolü)

# Tek bir paketi hedeflemek için:
pnpm --filter @zynpparti/geometry test
pnpm --filter @zynpparti/web dev
```

**Kural:** Yeni bir komut/script eklediğinde buraya da ekle.

---

## 4. REPO YAPISI (monorepo)

> Araç: **pnpm workspaces + Turborepo**. Tek depo, çok paket. Amaç: bir parça değişince diğerleri etkilenmesin.

```
zynpparti/
├── CLAUDE.md                  ← bu dosya (anayasa)
├── docs/                      ← derin dokümanlar (CLAUDE.md buralara link verir)
│   ├── STATE.md               ← NEREDE KALDIK (her oturum güncelle) ★
│   ├── DECISIONS.md           ← mimari kararlar + gerekçe (ADR formatı) ★
│   ├── ARCHITECTURE.md        ← §6'nın uzun, diyagramlı hali
│   ├── DOMAIN.md              ← §7'nin uzun hali (CAD veri modeli, şemalar)
│   ├── ROADMAP.md             ← §10'un uzun hali (faz detayları, kabul kriterleri)
│   ├── RENDER.md              ← AI render hattı (modeller, prompt, maliyet)
│   ├── AI-GENERATE.md         ← otomatik plan üretimi (araştırma + plan)
│   └── PERFORMANCE.md         ← performans bütçeleri ve ölçüm
├── packages/
│   ├── geometry/              ← SAF 2D geometri/CAD matematiği (UI yok, %100 test) ★
│   ├── document/              ← doküman modeli: entity'ler, Command, undo/redo ★
│   ├── engine/                ← WebGL render motoru (çizim, pan/zoom/snap, hit-test)
│   ├── tools/                 ← çizim araçları (XState FSM'leri: duvar, ölçü, seçim…)
│   ├── collab/                ← gerçek zamanlı senkron (Yjs / commit-log)
│   ├── io/                    ← DWG/DXF/PDF import + export (PDF/PNG/DXF/Excel)
│   ├── blocks/                ← mobilya/sembol blok kütüphanesi
│   └── ui/                    ← paylaşılan React bileşenleri + tasarım sistemi
├── apps/
│   ├── web/                   ← ana uygulama (Next.js + React, canvas burada gömülü)
│   ├── api/                   ← metadata backend (kullanıcı, proje, yorum, izin)
│   └── sync/                  ← gerçek zamanlı multiplayer backend (WebSocket)
└── services/                  ← ağır/asenkron işler (ayrı ölçeklenir, Python olabilir)
    ├── dwg-convert/           ← sunucu tarafı DWG↔DXF (ODA/LibreDWG yedeği)
    ├── ai-render/             ← plan/kesit → fotogerçekçi görsel (diffusion)
    └── ai-layout/             ← boş plandan tasarım üretimi (Faz 4)
```

★ = projenin belkemiği. Buralarda hata = her yerde hata. En çok özen burada.

> **Alt-ağaç CLAUDE.md:** Büyük paketlerin (örn. `packages/engine`) kendi `CLAUDE.md`'si olabilir; Claude o klasördeki dosyaları okurken otomatik yüklenir. Genel kural burada, pakete özel detay orada.

---

## 5. TEKNOLOJİ YIĞINI

> Bunlar **kararlaştırılmış** seçimlerdir (bkz. `docs/DECISIONS.md`). Değiştirmeden önce oraya gerekçe yaz.

**Frontend**
- **TypeScript (strict)** — her yerde. `any` yasak; `unknown` + daraltma.
- **Next.js + React** — uygulama kabuğu, yönlendirme, auth, basit API route'ları.
- **Render: PixiJS (WebGL)** — canvas motoru. (Canvas2D 500k entity'de çöker; WebGL şart.) İleride performans-kritik parçalar **Rust→WASM** renderer'a taşınabilecek şekilde `packages/engine` izole tutulur.
- **XState** — çizim araçlarının (CAD komutları) durum makineleri. (Komutlar mouse/klavye olaylarını farklı durumlarda işler; FSM tam buna göredir.)
- **Zustand** — hafif UI state (panel açık/kapalı, aktif araç vb.). Doküman state'i burada DEĞİL (§6.1).
- **TailwindCSS** — stil.

**İşbirliği / senkron**
- **Yjs (CRDT) + Hocuspocus** ile başla (hızlı, olgun, presence + offline). Ölçek/sürüm-kontrolü kritikleşince **Loro (Tree CRDT)** veya Rayon-tarzı **commit-log + invariant doğrulama** north-star olarak açık tutulur (bkz. §6.4, `docs/DECISIONS.md`, `docs/LANDSCAPE.md §5`).

**Geometri / CAD çekirdeği**
- `@flatten-js/core` — nokta/çizgi/poligon/kesişim (temel primitive).
- **Clipper2** — offset/boolean (duvar ofseti + m² + oda birleştirme için tercih). `polygon-clipping` basit alan için yedek; JSTS ağır, sadece gerekirse.
- DXF: `dxf-parser` veya `@mlightcad/dxf-json` (hafif). DWG: `@mlightcad/libredwg-web` (WASM, tarayıcıda).

> Kütüphane karşılaştırması ve gerekçe: `docs/LANDSCAPE.md §6`.

**Backend**
- **Node.js + Fastify** (büyürse NestJS) — metadata API.
- **PostgreSQL + Prisma** — kullanıcı, proje, organizasyon, yorum, izin **metadata'sı**. (Entity'ler burada DEĞİL — §6.5.)
- **Blob storage (S3/R2/MinIO)** — model dosyaları (her model = bir dosya), DWG yüklemeleri, render çıktıları.
- **Gerçek zamanlı backend** — WebSocket (Hocuspocus/y-websocket veya özel). Oturum-ömürlü, model başına tek otorite.
- **Redis + BullMQ** — iş kuyruğu (render, dönüştürme, AI).

**AI / ağır işlem (`services/`)**
- **Plandan render:** ControlNet + diffusion (kenar/segment koşullu). Başlangıç: Replicate/Fal API; sonra kendi modeli/host. Yaklaşık maliyet referansı: render başına düşük sentler mertebesi → `docs/RENDER.md`.
- **Otomatik plan üretimi:** literatür Graph2Plan, House-GAN++, HouseDiffusion, dil-güdümlü (Tell2Design) + LLM-asistanlı yaklaşımlar → `docs/AI-GENERATE.md`. Girdi temsili: **bubble diagram / komşuluk grafiği** + sınır.
- **Öneri copilot:** geometrik kural motoru + LLM (Claude API).
- **Animasyon (Faz 5):** kamera fly-through + video generation API (ör. Runway/Higgsfield türü).

> **Model notu:** AI uçlarında **en güncel ve yetenekli Claude modelini** kullan — şu an varsayılan `claude-opus-4-8`. Anthropic API ile çalışırken model id, fiyat, tool-use ve caching için `/claude-api` referansını kontrol et; ezbere yazma.
> **Sağlayıcı bağımsızlığı:** Tüm AI çağrıları `packages/ai` içinde sağlayıcı-bağımsız bir adapter arkasına konur (Anthropic + OpenAI; statik `.env` seçimi → ileride task-router + fallback). Karar: `docs/DECISIONS.md` ADR-0006. Faz 2'de kurulur.

**Altyapı:** Turborepo, Vitest, Playwright, ESLint+Prettier, GitHub Actions (CI: lint+typecheck+test zorunlu).

---

## 6. MİMARİ (didik didik)

> Tam diyagramlar `docs/ARCHITECTURE.md`'de. Buradaki ilkeler **load-bearing** (taşıyıcı) — bozulursa her şey çöker.

```
TARAYICI
┌────────────────────────────────────────────────────────────┐
│  React UI (paneller, menü, araç çubuğu)   ← Zustand UI state │
│        ▲ olaylar               ▼ komut                        │
│  ┌─────┴───────────────────────┴──────────────────────────┐ │
│  │  ENGINE (WebGL render) ⇄ DOCUMENT (entity + Command)    │ │
│  │              ▲ doğruluk kaynağı (source of truth)        │ │
│  └──────────────┬──────────────────────────────────────────┘ │
│                 ▼ COLLAB (Yjs / commit-log)                   │
└─────────────────┬────────────────────────────────────────────┘
                  │ WebSocket
        ┌─────────▼─────────┐        ┌──────────────────────────┐
        │ SYNC backend       │        │ METADATA backend (API)   │
        │ (otorite,          │        │ kullanıcı/proje/yorum/    │
        │  invariant kontrol)│        │ izin → Postgres          │
        └─────────┬──────────┘        └──────────────────────────┘
                  ▼
         BLOB STORAGE (model = dosya)        JOB QUEUE → AI/render servisleri
```

### 6.1 Doğruluk kaynağı (source of truth)
- **Doküman verisi `packages/document` içinde yaşar.** React/Zustand sadece UI durumunu tutar, doküman entity'lerini DEĞİL.
- İleride WASM'e geçilirse: veri WASM lineer belleğinde yaşar, JS sadece aracıdır. **Veriyi iki yerde tutma** (büyük modellerde felaket olur).

### 6.2 Entity & reaktif store
- Entity'ler kayıt (record) olarak tutulur; **tldraw deseni benimsenir**: tipli kayıtlar + reaktif sinyaller + her shape için `ShapeUtil` (çizim, hit-test, sınır kutusu) + `Binding` + side-effects. (Sadece **desen** alınır; tldraw SDK gömülmez — lisans ticari. Bkz. `docs/LANDSCAPE.md §1`.)
- Render motoru store'u dinler; sadece **değişen ve görünür** entity'leri yeniden çizer.

### 6.3 Komut sistemi & undo/redo
- **Modeli değiştiren her işlem bir Command'dir** (`AddWall`, `RenameRoom`, `MoveEntity`…).
- Her Command: `apply()` ve `invert()` tanımlar. Undo/redo = invert/apply yığını.
- **YOU MUST:** Store'a doğrudan yazma yok; her şey Command'den geçer. (Aksi halde undo ve collab bozulur.)

### 6.4 Gerçek zamanlı işbirliği
- **Faz 3 başlangıcı: Yjs + Hocuspocus.** Komutlar Yjs dökümanına uygulanır; presence (imleç/seçim), offline, otomatik birleştirme bedava gelir. Katman hiyerarşisini baştan **döngüsüz** kuracak invariant ekle (CRDT tek başına garanti etmez). Alternatifler (Loro Tree CRDT / commit-log): `docs/LANDSCAPE.md §5`.
- **Ölçek/tutarlılık kritikleştiğinde (north star): commit-log modeli** (Rayon yaklaşımı):
  - İstemci, model state'inin **diff'i olan commit**'ler üretir.
  - Commit'ler **merkezi otoriteye** (sync backend) gider; otorite **invariant**'ları kontrol eder; geçerse uygular ve tüm istemcilere yayar.
  - İki çakışan commit → backend'e **varış sırasıyla** uygulanır (nedensellik korunur). Geçersiz commit reddedilir; istemci geri alır.
- **Invariant örneği:** Katmanlar iç içe olabilir (Illustrator gibi); iki kişi aynı anda düzenleyince **döngü (cycle)** oluşabilir. Bunu yalnızca **veri katmanı/backend** garanti edebilir → asla döngülü model persist edilmez.
- **IMPORTANT:** Multiplayer'da undo/redo köşe durumları zordur (ör. ben rengi değiştirdim, başkası nesneyi sildi; ben undo yaparsam ne olur?). Bu vakalar `docs/ARCHITECTURE.md`'de tek tek tanımlanır; uydurmadan uygula.

### 6.5 Kalıcılık (persistence)
- **YOU MUST: Entity'leri ilişkisel DB'ye satır satır YAZMA.** 100 model bile milyonlarca satır eder; ölçeklenmez.
- **Her model = blob storage'da tek dosya.** Açılışta belleğe yüklenir, periyodik geri yazılır. (Backend invariant kontrolü için zaten tüm modeli bellekte ister.)
- Postgres yalnızca **metadata** içindir (kim, hangi proje, hangi izin, yorum başlıkları).
- **Lazy migration:** Eski formatlı model açılınca, istemci önce onu güncel formata taşıyan bir commit üretir. Toplu migration yok.

### 6.6 Paylaşılan kod
- Serileştirme/yapılar `packages/document` + `packages/geometry`'de tek yerde; hem istemci hem backend (invariant kontrolü, AI üretici) **aynı kodu** kullanır.

### 6.7 Sürüm kontrolü (uzun vadeli farklılaştırıcı)
- Hedef: CAD'e **Git benzeri sürüm geçmişi** — kim, ne, ne zaman; **branch + merge**. Ama kullanıcıya rebase/squash karmaşası gösterilmez. Multiplayer tutarlı bir commit geçmişi üstüne kurulursa bu "bedava" gelir. Detay: `docs/ARCHITECTURE.md`.

---

## 7. DOMAIN MODELİ (CAD sözlüğü)

> Uzun hali + şemalar: `docs/DOMAIN.md`. Bunlar yanlış kurulursa proje çöker.

**Model (Project):** Kullanıcının üzerinde çalıştığı dosya. İçinde bir/çok **Canvas**.

**Canvas (iki tür):**
- **Model canvas:** Gerçek ölçek (metre/feet). Plan, kesit, görünüş burada. Stroke scale ~1/40, zemin beyaz.
- **Paper canvas:** Pafta/sayfa düzeni (cm/inch). Export çıktısı burada. Stroke scale 1/1, zemin gri, sayfalar beyaz.

**Entity türleri:**
- **Wall (duvar):** Kalınlıklı çizgi; oda sınırlarını kurar.
- **Opening (boşluk):** Kapı/pencere — bir duvarın üstüne oturur (binding ile bağlı).
- **Room/Zone (mahal):** Kapalı alan; **adı + canlı m²'si var.** ("Locallere isim verme" = bu.)
- **Block (blok):** Kütüphaneden mobilya/sembol (üst/yan/ön görünüş). DWG blok import + özel blok çizimi.
- **Dimension (ölçü):** Ölçülendirme.
- **Annotation:** Metin, ok, etiket.
- **Image/Reference:** Mood board, referans görsel, import edilmiş PDF/plan.

**Layer (katman):** Entity grupları; iç içe olabilir (hiyerarşi). Projenin adı buradan: ZynppArti = katman + artı.

**Style:** Görünüm — renk, dolgu, çizgi kalınlığı, font, doku/hatch.

**Metadata:** Entity'ye takılan veri (malzeme, tedarikçi, maliyet) → otomatik **metraj/takeoff** tablosu üretir.

**Binding:** İki entity arası ilişki (kapı↔duvar gibi). Biri değişince diğeri uyumlu kalır. (tldraw "binding" kavramı referans.)

**Command:** Modeli değiştiren her işlem (§6.3). **Kutsal kural:** model yalnızca Command ile değişir.

---

## 8. ÇEKİRDEK SİSTEMLER (alt sistem alt sistem)

### 8.1 Render Engine — `packages/engine`
- PixiJS sahnesi; dünya↔ekran dönüşümü.
- **Hedef: 500k entity'de 60 FPS.** Yöntemler: viewport culling (görünmeyeni çizme), batching, dirty-rect/dirty-entity yeniden çizim, LOD (uzakta basitleştir).
- **Özel shader'lar:** kesik çizgi (dash), tarama (hatch), kalınlık → CPU'da milyon çizgi yerine GPU'da. (Rayon yaklaşımı.)
- **Metin:** başlangıç MSDF (hızlı), uzun vadede **vektör metin** (çoklu dil/glyph sınırı için). Bkz. `docs/ARCHITECTURE.md`.
- **Snapping:** uç/orta/dik/kesişim/hizalama + grid. CAD'in ruhu burada.
- **Mekânsal indeks (zorunlu):** hit-test + viewport culling + snapping için **rbush (R-tree)** — broad phase (rbush AABB ile aday bul) → narrow phase (kesin geometri: `distanceToSegment`/`pointInPolygon`). Saf döngü 500k entity'de donar. Detay: `docs/ENGINEERING-NOTES §2`. Picking/performans yazmadan önce `infinitecanvas.cc` Ders 8'i oku.
- **KRİTİK TUZAK — koordinat ölçeği:** `getBoundingClientRect`'ten gelen ekran koordinatını CSS scale faktörüne **böl**. (Tasarım uzayı sabit, container ölçekleniyorsa hizalama kayar.)
- **Float hassasiyeti:** çok küçük sayı karşılaştırmalarında epsilon kullan.

### 8.2 Geometry Kernel — `packages/geometry`
- Saf fonksiyonlar: kesişim, ofset (duvar kalınlığı), poligon alanı, boolean, kapalı-bölge bulma.
- **YOU MUST: %100'e yakın test kapsamı.** Bug yakaladığında önce onu yakalayan testi yaz.

### 8.3 Doküman Modeli & Araçlar — `packages/document`, `packages/tools`
- Entity store + Command + undo/redo (§6.3).
- Araçlar XState FSM: örn. **Wall tool** durumları: `idle → firstPoint → drawing → (esc/enter)`. Her durum mouse/klavye olaylarını farklı işler.

### 8.4 İçe/Dışa Aktarma — `packages/io` (+ `services/dwg-convert`)
- **DXF:** `dxf-parser`/`dxf-json` ile tarayıcıda. Hafif, güvenilir. **Önce bunu hedefle.** (Moses AutoCAD'de `Farklı Kaydet → DXF` = 1 tık.)
- **DWG (tarayıcıda):** `@mlightcad/libredwg-web` (WASM). Backend gerektirmez. **Bilinen sınırlar:** R2010+ bazı ileri entity'ler atlanır; XRef desteklenmez; tablo entity'leri (çizgiyle çizilmemişse) okunmaz; bazı dosyalar açılmayabilir; SHX font kodlaması bozuk gelebilir (özellikle Latin-dışı). → Bu yüzden:
- **DWG (güvenilir yol):** `services/dwg-convert` sunucuda DWG→DXF (ODA File Converter lisanslı, en sağlam; LibreDWG açık kaynak yedek). Tarayıcı parse başarısız olursa otomatik buna düş.
- **Ölçekleme:** import sonrası kullanıcı iki nokta seçer + gerçek mesafeyi girer → tüm çizim otomatik kalibre olur.
- **Katman eşleme:** DXF/DWG katmanlarını ZynppArti layer'larına haritalandır.
- **Export:** DXF, PDF, PNG (yüksek çözünürlük), mahal listesi → Excel.
- Fallback zinciri **DXF → libredwg-web → ODA**; referans repo `mlightcad/cad-viewer` (mahal-bulma + katman eşleme için oku). Detay: `docs/LANDSCAPE.md §6`.

### 8.5 Mahal & m² Otomasyonu
- Duvarlardan **kapalı alanları otomatik bul**: **planar graf yüz-bulma (face-finding), ML DEĞİL**. Reçete: snap (uçları yapıştır) → kesişimlerden böl → minimal döngüler (half-edge) → kapı/pencere boşluklarını kapat → **Shoelace** alan. Detay: `docs/ENGINEERING-NOTES §1`.
- Mahale tıkla → ad ver → m² **canlı** hesaplansın, çizim değişince güncellensin.
- Mahal/zon tablosu → toplam m², Excel export. Metadata ile metraj.

### 8.6 Sunum & Animasyon
- Paper canvas + pafta düzeni; plan/kesit/detay/mood board tek tuvalde.
- **Kamera keyframe zaman çizelgesi:** kayıtlı görünümler arası animasyonlu geçiş (plan→kesit→detay). Link ile sunum paylaşımı (görüntüle/yorum izinleri).

### 8.7 AI Render — `services/ai-render`
- Plan/kesit kenar çizgileri → **ControlNet koşulu** → diffusion ile fotogerçekçi görsel. **Hem plan hem kesit** girişi desteklenir.
- İki mod: **"yaratıcı mod"** (serbest) ve **"geometriyi koru modu"** (kompozisyon sabit — bina kat sayısı değişmez). Sonraki adım: image→video walkthrough.
- Asenkron: BullMQ kuyruğunda çalışır; bitince istemciye push.
- Malzeme/stil swatch'ları, varyant üretimi. Rakip analizi + prompt şablonları + maliyet: `docs/RENDER.md`, `docs/LANDSCAPE.md §4`.

### 8.8 AI Üretici & Copilot — `services/ai-layout`
- **Copilot (önce bu):** geometrik kurallar (oran, geçiş genişliği, ıslak hacim grupları) + LLM ile **öneri** ("bu koridor dar, şu duvarı 20 cm kaydır").
- **Üretici (uzun vade):** girdi = `{sınır poligonu, oda listesi+m², komşuluk grafiği (bubble diagram), kurallar (setback/kat/imar)}` → çıktı **vektör** plan (raster değil). Önce retrieval+kural (Graph2Plan tarzı, kontrollü), sonra difüzyon. **İmar/yönetmelik uyumunu üretime gömmek en büyük ticari değer** (Maket/ArkDesign dersi). Plan + literatür + rakipler: `docs/AI-GENERATE.md`, `docs/LANDSCAPE.md §3`.
- **IMPORTANT:** Üretici en zor parça. **Faz 4'e kadar dokunma**; önce sağlam çizim motoru + domain modeli şart.

---

## 9. PERFORMANS & ÖLÇEKLENEBİLİRLİK

> Bütçeler ve ölçüm: `docs/PERFORMANCE.md`.

- **Render:** 50k entity akıcı, 500k entity 60 FPS hedef. Culling + batching + dirty-render zorunlu.
- **Bellek:** büyük modelde veri tek yerde (§6.1). Kopyalamadan kaçın.
- **Ağ:** commit/diff bazlı senkron; tüm modeli her seferinde gönderme.
- **Depolama:** model = dosya; ilişkisel DB'yi entity ile şişirme (§6.5).
- **Erken optimize etme**, ama **mimariyi** baştan ölçeğe uygun kur (izole `engine`, saf `geometry`, WASM yolu açık).

---

## 10. YOL HARİTASI (faz faz)

> Detay + kabul kriterleri: `docs/ROADMAP.md`. **Her faz çalışan, gösterilebilir bir ürünle biter.** Önceki faz bitmeden sonrakine geçme.

- **Faz 0 — İskelet:** Monorepo (pnpm+turbo), Next.js+React+PixiJS iskeleti, pan/zoom yapan boş canvas, CI yeşil. **✅ =** zoom'lanabilir boş tuval + testler geçiyor.
- **Faz 1 — Çizim + Import + Mahal:** Duvar/aç/sil/seç/taşı, undo/redo, snapping, katman, stil; DXF (sonra DWG) import + 2-nokta ölçekleme; otomatik mahal bulma + isim + m² + tablo/Excel. **✅ =** AutoCAD'den DXF gelip ölçekleniyor, mahaller isimlenip m²'leniyor.
- **Faz 2 — AI Render + Copilot:** Plan/kesit → görsel; ilk öneri copilot'u. **✅ =** tek tıkla render + ilk akıllı öneriler.
- **Faz 3 — Gerçek Zamanlı İşbirliği:** Yjs multiplayer, presence, link paylaşımı, yorum/markup. **✅ =** iki kişi aynı anda çiziyor.
- **Faz 4 — Boş Plandan Üretim:** Sınır + program → plan/kesit üretimi (AI). **✅ =** boş plan + istekten otomatik yerleşim.
- **Faz 5 — Gerçek 3D + Animasyon:** 2D'den hacim (OCCT-WASM/three.js), kamera animasyonu, sunum modu olgunlaşır; **BIM köprüsü (web-ifc / IFC import-export)** başlar. **✅ =** plandan 3B + animasyonlu sunum.
- **Faz 6 — Ölçek & Kurumsal:** WASM geçişi (kritik parçalar), commit-log senkron, sürüm geçmişi/branch, **Speckle interop** (Revit/Rhino/AutoCAD), izin/organizasyon, performans sertleştirme. **✅ =** 500k entity'de akıcı + sürüm kontrolü.
  > 3D/BIM araç manzarası: `docs/LANDSCAPE.md §7`.

---

## 11. KOD STANDARTLARI

- **TypeScript strict.** `any` yok; `unknown` + daraltma.
- Küçük, tek işli fonksiyonlar; açıklayıcı isimler; mümkünse saf (yan etkisiz) — özellikle geometride.
- Dosya 300 satırı geçerse böl.
- Hata yönetimi: sessizce yutma; anlamlı hata fırlat/logla.
- Yorum: *ne* değil **neden**. Karmaşık geometri/algoritma açıklamaları Türkçe olabilir.
- **Klavye kısayolları ve erişilebilirlik (a11y) baştan düşünülür** — CAD aracı klavyeyle yaşar.
- Test: yeni mantık → yeni test. `geometry`/`document` için TDD tercih.

---

## 12. ÇALIŞMA KURALLARI (Claude Code akışı)

- **Git:** her özellik için yeni branch (`feat/...`, `fix/...`, `chore/...`). Küçük, anlamlı commit'ler; Conventional Commits, İngilizce.
- **Commit trailer:** Her commit mesajını şu satırla bitir:
  ```
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  ```
- **Commit/push'u Moses istemeden yapma.** `main`'e doğrudan commit'leme; önce branch aç.
- **Bir oturum = bir net hedef.** Başta hedefi tek cümle söyle; sonunda ne yaptığını + `docs/STATE.md` güncellemeni özetle.
- **Bağımlılık eklemeden önce sor** — yeni paket ciddi karardır, `docs/DECISIONS.md`'ye yaz.
- **Büyük mimari değişiklik → önce kısa plan, sonra kod.**
- **Tekerleği yeniden icat etme:** Bir özelliği yazmadan önce `docs/LANDSCAPE.md §8` repo okuma listesinde o işi "en iyi yapan" repo varsa önce yaklaşımını oku, sonra kendi sade versiyonunu yaz (lisansa dikkat — tldraw SDK ticari). Engine performans/picking için ek olarak `infinitecanvas.cc` Ders 8 (`docs/ENGINEERING-NOTES §3`).
- **Test/typecheck geçmeden "bitti" deme.**

---

## 13. YAPMA / DİKKAT (negatif kurallar)

- ❌ Modeli Command dışından değiştirme (undo + collab bozulur).
- ❌ `geometry`/`document` paketlerine React/DOM/PixiJS import etme.
- ❌ Entity'leri ilişkisel DB'ye satır satır yazma (§6.5).
- ❌ Doküman verisini iki yerde tutma (§6.1).
- ❌ Faz atlama (AI üretim Faz 4'ten önce başlamaz).
- ❌ DWG'yi "her dosya açılır" varsayma — sınırlar var (§8.4); sunucu yedeğini unutma.
- ❌ Gizli anahtar commit'leme.
- ⚠️ Koordinatta CSS scale faktörünü bölmeyi unutma.
- ⚠️ Geometride epsilon kullan.
- ⚠️ Multiplayer undo köşe durumlarını uydurma — `docs/ARCHITECTURE.md`'den uygula.

---

## 14. SÖZLÜK (TR ↔ EN)

| Türkçe | English | Açıklama |
|--------|---------|----------|
| mahal / oda | room / zone | Adı + canlı m²'si olan kapalı alan |
| duvar | wall | Kalınlıklı çizgi |
| kapı/pencere | opening | Duvar üstündeki boşluk (binding'li) |
| kesit | section | Binanın dikey kesiti |
| görünüş | elevation | Cephe görünümü |
| pafta | sheet / paper | Export edilen sayfa düzeni |
| katman | layer | Entity grupları (iç içe olabilir) |
| blok | block | Mobilya/sembol nesnesi |
| ölçek/ölçekleme | scale / calibrate | Çizim↔gerçek oranı |
| metraj | takeoff | Malzeme/miktar listesi |
| bağ | binding | İki entity arası ilişki |
| komut | command | Modeli değiştiren atomik işlem |
| değişmez | invariant | Hiç bozulmaması gereken kural (ör. katman döngüsü yok) |
| komşuluk grafiği | bubble diagram | Odaların komşuluk ilişkisi (AI üretici girdisi) |

---

## 15. KARARLAR

> Her kalıcı teknik karar (stack, kütüphane, mimari tercih) **gerekçesiyle** `docs/DECISIONS.md`'ye yazılır (ADR formatı: bağlam → karar → sonuç). CLAUDE.md ile çelişen bir karar alınırsa **önce bu dosya güncellenir.**

---

*Bu dosyayı sade ve güncel tut. Derin detay büyüdükçe `docs/` altına taşınır; CLAUDE.md "harita", `docs/` "ansiklopedi"dir. Son düzenleme: ilk kurulum.*
