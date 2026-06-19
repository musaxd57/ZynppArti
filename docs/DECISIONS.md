# DECISIONS — Mimari Karar Kaydı (ADR)

> Her kalıcı teknik karar burada: **Bağlam → Karar → Sonuç/Takas**. En yeni üstte.
> CLAUDE.md ile çelişen bir karar alınırsa önce CLAUDE.md güncellenir, sonra buraya ADR eklenir.

---

## ADR-0009 — Faz 1 inşa sırası: önce saf doküman çekirdeği (1A)
**Tarih:** 2026-06-19 · **Durum:** Kabul
**Bağlam:** İnteraktif duvar düzenleme üç parçaya bağlı: doküman modeli (entity+Command+undo/redo), engine'in çizmesi, araçların input→Command çevirmesi. Hangisiyle başlamalı?
**Karar:** Faz 1, **1A = `packages/document`** (saf TS: store + Command + history) ile başlar; sonra 1B (engine render), 1C (tools+kısayol), 1D (DXF), 1E (mahal/m²).
**Sonuç:** En test edilebilir, UI'siz çekirdek önce sağlamlaşır (TDD); interaktif çizim onun üstüne güvenle oturur. Sıralama `docs/STATE.md` ve `docs/ROADMAP.md`'de izlenir.

## ADR-0008 — İç birim: 1 birim = 1 cm
**Tarih:** 2026-06-19 · **Durum:** Kabul
**Bağlam:** m² hesabı (mahal) ve ölçeklendirme için iç koordinat birimi sabitlenmeli. DXF dosyaları mm/m/inch olabilir.
**Karar:** İç koordinat birimi **1 = 1 santimetre**. 100 birim = 1 m; alan / 10.000 = m². DXF import'taki 2-nokta kalibrasyonu gelen çizimi bu birime ölçekler. Gösterim (m²/ft², ondalık) yereldir ve iç birimden bağımsızdır (bkz. `docs/I18N-TEXT.md`).
**Sonuç:** Alan/ölçü hesapları net ve tek tip. Risk: çok büyük projelerde float hassasiyeti → epsilon kullan (CLAUDE.md §8.1). Birim gösterimi katmanı ayrı tutulur.

## ADR-0007 — Duvar temsili: segment + kalınlık
**Tarih:** 2026-06-19 · **Durum:** Kabul
**Bağlam:** Faz 1 duvar nasıl modellenecek? Tek segment mi, birleşik polyline mı?
**Karar:** Faz 1'de **duvar = tek segment** (`start`/`end` Vec2) **+ kalınlık** + layerId. Duvar zincirleri, uçları snap'le bağlı ayrı segmentler olarak kurulur.
**Sonuç:** Basit, test edilebilir; mahal bulma segment grafiği üzerinde çalışır (kapalı bölge = döngü). Takas: birleşik/parametrik duvar, T-kesişim temizliği, otomatik köşe birleştirme ileriye (Faz 1 sonu / sonrası) bırakıldı.

## ADR-0006 — AI çağrıları için sağlayıcı-bağımsız (provider-agnostic) adapter
**Tarih:** 2026-06-19 · **Durum:** Önerildi (Faz 0'da KURULMAZ — yalnızca tasarım notu)
**Bağlam:** AI özellikleri (render prompt'ları, copilot önerileri, layout üretimi) farklı sağlayıcılara gidebilir. Tek sağlayıcıya kilitlenmek risklidir; maliyet, performans, model yetenekleri ve erişilebilirlik zamanla değişir.
**Karar:** Tüm LLM/AI metin çağrıları `packages/ai` içinde **tek bir adapter arayüzü** arkasına konur. En az iki sağlayıcı desteklenir: **Anthropic** ve **OpenAI**. Seçim iki modda çalışır:
- **(a) Statik mod:** `.env`'deki `AI_PROVIDER` + `AI_MODEL` ile sabit seçim (Faz 2'de ilk bu kurulur).
- **(b) Router modu (ileri faz):** göreve göre otomatik seçim — basit görev → ucuz/küçük model, karmaşık görev → güçlü model; bir sağlayıcı/model çökerse diğerine **fallback** (retry + circuit-breaker + sağlık takibi).

Arayüz taslağı (sözleşme): `generate(messages, { task, schema?, stream? }) → normalize edilmiş cevap`. Sağlayıcılar arası farklar (tool-use formatı, streaming, token sayımı, hata kodları) **adapter içinde** soyutlanır; çağıran kod sağlayıcıyı bilmez. Router, `task` etiketine ve canlı sağlık/maliyet sinyallerine göre adapter seçer.
**Sonuç:** Sağlayıcı bağımsızlığı + maliyet optimizasyonu + dayanıklılık (biri düşerse hizmet durmaz). **Faz 0'da yalnızca bu karar yazıldı; implementasyon Faz 2** (copilot/render) ile gelir. Varsayılan güçlü model: `claude-opus-4-8` (bkz. CLAUDE.md §5). İlişkili: [ADR-0005].

## ADR-0005 — AI render aşamalı: önce görsel, sonra gerçek 3D
**Tarih:** 2026-06-19 · **Durum:** Kabul
**Bağlam:** Plandan görselleştirme iki yolla yapılabilir: (a) generative AI ile 2D plandan fotogerçekçi görsel, (b) plandan gerçek 3D geometri kurup klasik render. (a) saniyeler sürer, ucuz, etkileyici; (b) tam kontrol verir ama aylarca sürer.
**Karar:** Faz 2'de AI görsel render (ControlNet + diffusion), Faz 5'te gerçek 3D + animasyon.
**Sonuç:** Kullanıcı erkenden değer görür; 3D yükü ileri faza ertelenir. `services/ai-render` ve `services/ai-layout` ayrı tutulur.

## ADR-0004 — İşbirliği: Yjs (CRDT) ile başla, commit-log'a geçiş açık
**Tarih:** 2026-06-19 · **Durum:** Kabul
**Bağlam:** Gerçek zamanlı çok kullanıcılı düzenleme şart. Seçenekler: olgun CRDT (Yjs) vs Rayon-tarzı merkezi commit-log + invariant doğrulama.
**Karar:** Faz 3'te Yjs + Hocuspocus (presence + offline + otomatik merge bedava). Ölçek/sürüm-kontrolü kritikleşince **north-star alternatifleri** açık tutulur: (a) **Loro** — Rust/WASM, movable **Tree CRDT** (katman hiyerarşisi/döngü sorununa zarif), (b) Rayon-tarzı **commit-log + merkezi otorite** (invariant garantisi + sürüm kontrolü temeli).
**Sonuç:** Hızlı başlangıç. Risk: katman döngüsü gibi invariant'lar Yjs'te garanti edilemez → katman hiyerarşisi baştan döngüsüz invariant'la kurulur; ölçekte Loro Tree CRDT veya commit-log'a geçilir (bkz. CLAUDE.md §6.4, `docs/LANDSCAPE.md §5`).

## ADR-0003 — Render motoru: PixiJS (WebGL), engine izole
**Tarih:** 2026-06-19 · **Durum:** Kabul
**Bağlam:** Hedef 500k entity'de 60 FPS. Canvas2D bu ölçekte çöker.
**Karar:** WebGL üzerinden PixiJS. `packages/engine` tüm render'ı kapsar ve izole tutulur; ileride kritik parçalar Rust→WASM renderer'a taşınabilir.
**Sonuç:** Yüksek performans + değiştirilebilirlik. Takas: WebGL özel shader (dash/hatch) işçiliği gerekir.

## ADR-0002 — Çekirdek paketler saf TypeScript (geometry, document)
**Tarih:** 2026-06-19 · **Durum:** Kabul
**Bağlam:** Geometri ve doküman modeli hem tarayıcıda hem sunucuda (AI üretici, invariant kontrolü) çalışmalı.
**Karar:** `packages/geometry` ve `packages/document` React/DOM/PixiJS/`window` içermez; %100'e yakın test.
**Sonuç:** Test edilebilir, paylaşılabilir, WASM'e taşınabilir çekirdek. (CLAUDE.md §0.8, §13.)

## ADR-0001 — TypeScript-first stack (Rust+WASM değil, henüz)
**Tarih:** 2026-06-19 · **Durum:** Kabul
**Bağlam:** Rayon Rust+WASM kullanıyor (maksimum performans) ama öğrenme eğrisi dik ve geliştirme yavaş. Kodun çoğunu Claude yazacak, Moses mimar (profesyonel yazılımcı değil).
**Karar:** TypeScript-first: Next.js + React + PixiJS + Yjs. Performans-kritik parçalar Faz 6'da Rust→WASM'e taşınabilecek şekilde izole.
**Sonuç:** En hızlı, en sürdürülebilir başlangıç + en geniş ekosistem/doküman. WASM kapısı mimaride açık bırakıldı.
