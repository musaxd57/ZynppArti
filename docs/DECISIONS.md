# DECISIONS — Mimari Karar Kaydı (ADR)

> Her kalıcı teknik karar burada: **Bağlam → Karar → Sonuç/Takas**. En yeni üstte.
> CLAUDE.md ile çelişen bir karar alınırsa önce CLAUDE.md güncellenir, sonra buraya ADR eklenir.

---

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
