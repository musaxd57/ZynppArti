# DECISIONS — Mimari Karar Kaydı (ADR)

> Her kalıcı teknik karar burada: **Bağlam → Karar → Sonuç/Takas**. En yeni üstte.
> CLAUDE.md ile çelişen bir karar alınırsa önce CLAUDE.md güncellenir, sonra buraya ADR eklenir.

---

## ADR-0018 — Copilot önce deterministik kural motoru (LLM'siz), `packages/copilot` (2B)
**Tarih:** 2026-06-20 · **Durum:** Kabul
**Bağlam:** Copilot iki ayaklı (ADR-0014): (1) kaynak-gösteren öneri, (2) canlı metrik (2A'da yapıldı). Öneri ayağı "geometri kuralı + LLM" olarak tanımlı. Ama LLM katmanı API key + sağlayıcı/maliyet kararı ister (ADR-0006/0017, Moses onayı). Asıl farklılaştırıcı değer ise **atıflı, doğru madde** (FAZ2-NOTES §2a) — bu deterministik kuralla, LLM olmadan üretilebilir.
**Karar:** Copilot öneri ayağı **önce saf TS deterministik kural motoru** olarak kurulur: yeni `packages/copilot` (geometri + document'e bağlı, UI yok, test edilebilir). `runCopilotChecks(spaces, walls) → Finding[]`; her bulgu **atıflı** (ör. TS 9111 koridor ≥120 cm; İmar yatak odası ≥9 m², oturma ≥12 m²). **Seviye 1 (salt-okunur)** — modeli değiştirmez (AI-AGENT-VISION §2). LLM doğal-dil katmanı bunun üstüne, sağlayıcı/maliyet kararından sonra (ADR-0006) biner.
**Sonuç:** API key/maliyet olmadan hemen görünür, doğrulanabilir değer; testle garanti (geometri `polygonMinWidth` koridor genişliği + alan kontrolleri). Web'de `CopilotPanel` canlı çalışır. Takas: doğal-dil soru-cevap ve serbest öneri yok (sıradaki adım); koridor genişliği konveks-kabuk yaklaşımı (L/T planda kapsayıcı genişlik, ileride medial-axis ile sıkışır).

## ADR-0017 — AI render altyapısı: basit/doğrudan API başlangıç, kuyruk yük artınca eklenir
**Tarih:** 2026-06-20 · **Durum:** Kabul (Moses kararı, Faz 2 planı)
**Bağlam:** ADR-0013 "uygulama içi canlı render paneli" diyor; CLAUDE.md §8.7 asenkron BullMQ kuyruğu öngörüyor. Ama Faz 2'nin render ayağına (2D) henüz gelmedik; sağlayıcı seçimi ertelendi, maliyet için önce ücretsiz krediler kullanılacak. Bu aşamada Redis+BullMQ kurmak gereğinden ağır ve kurulumu yavaşlatır.
**Karar:**
- Render MVP'si **doğrudan API** ile çalışır: `apps/web` route'undan sağlayıcıya senkron çağrı, **kuyruk yok**.
- Ama mantık **`services/ai-render` içinde baştan izole** kurulur (render isteği → sağlayıcı adapteri → sonuç). Web yalnızca bu servisi çağırır; render mantığını web'e gömmek YOK.
- Böylece **yük artınca Redis + BullMQ kuyruğu**, çağrı yerini (sync→queue) değiştirerek eklenir; hiçbir şey söküp atılmaz. İzolasyon sınırı bugünden korunur.
- Sağlayıcı (Replicate/Fal) ve gerçek bütçe **2D'ye gelince** birlikte test edilip seçilir; başlangıçta sağlayıcıların ücretsiz kredileri kullanılır. İlişkili: [ADR-0006] (provider-agnostic adapter), [ADR-0013].
**Sonuç:** Hızlı MVP + temiz büyüme yolu. Takas: ilk sürümde uzun render'larda istek bloklayabilir (kullanıcıya "üretiliyor" durumu gösterilir); kuyruk gelince çözülür.

## ADR-0016 — Kesit gerçeği: hafif şematik kesit (Faz 3) → tam 3B kesit (Faz 5)
**Tarih:** 2026-06-19 · **Durum:** Kabul (beklenti düzeltmesi)
**Bağlam:** "Plandan otomatik kesit" istendi; ama gerçek kesit dikey bilgi (duvar yüksekliği, döşeme, çatı) gerektirir — saf 2B planda yok. Otomatik kesit özünde bir 3B/BIM işidir (BricsCAD BIM/OrthoGen/Revit: 3B modeli düzlemle keser). Bkz. `docs/FAZ2-NOTES.md §4`.
**Karar:** "Faz 2'de tek tıkla foto-kesit" sözü VERİLMEZ. (B) **hafif şematik kesit** — duvarlara yükseklik özelliği + plana kesit çizgisi → ekstrüzyonla düzenlenebilir şematik kesit — **~Faz 3**. (A) **tam 3B kesit** (hacmi düzlemle kes) **Faz 5**. AI render kesite de uygulanır ama bu temelin üstüne biner.
**Sonuç:** Dürüst yol haritası, hayal kırıklığı yok. Takas: erken fazda gerçek kesit yok; şematikle başlanır.

## ADR-0015 — Türkçe yönetmelik bilinci = premium farklılaştırıcı
**Tarih:** 2026-06-19 · **Durum:** Kabul (ürün stratejisi)
**Bağlam:** Piyasadaki kod/uyum copilot'ları (UpCodes vb.) ABD odaklı; diğer ülke kodları çoğunlukla desteklenmiyor. Türkiye için İmar/TBDY/Otopark/TS 9111 farkında bir copilot neredeyse yok (FAZ2-NOTES §3).
**Karar:** Copilot'un **Türkçe yönetmelik bilgisi** uzun vadeli farklılaştırıcı olarak işaretlenir. Faz 2 tohum: çekme mesafesi/kat/koridor/otopark gibi temel kurallar; ileride genişler. Fiyatlandırmada premium özellik (BUSINESS-PRICING.md).
**Sonuç:** Türk mimar için "olmazsa olmaz" değer — Rayon'da da, ABD araçlarında da yok. Takas: yönetmelik verisi bakımı gerektirir (güncel tutma).

## ADR-0014 — Copilot iki ayaklı: kaynak-gösteren öneri + canlı metrik paneli
**Tarih:** 2026-06-19 · **Durum:** Kabul
**Bağlam:** "Öneri" tek başına yetmez. (a) Yapı/yönetmelik can güvenliğidir → öneri **atıflı** olmalı (palavra değil; UpCodes dersi). (b) En iyi araçlar (Architechtures/Finch/Blueprints AI) çizerken **canlı metrik** verir. Bkz. FAZ2-NOTES §2.
**Karar:** Copilot = (1) **kaynak-gösteren öneri motoru** (geometri kuralı + LLM; her öneri hangi kurala/ölçüye dayandığını gösterir, ör. "TS 9111: koridor min 120 cm; seninki 90"), (2) **canlı metrik paneli** (mahal/m² özelliğinin üstüne: toplam/net/brüt m², oda tipi dağılımı, ileride verim/gün ışığı).
**Sonuç:** Güvenilir + sürekli geri bildirim. Mevcut RoomList paneli bu metrik panelinin çekirdeğidir.

## ADR-0013 — AI render: uygulama içi canlı panel (export-yükle değil)
**Tarih:** 2026-06-19 · **Durum:** Kabul
**Bağlam:** Eski akış "dışa aktar → ayrı AI aracına yükle → bekle" zayıf. Modern araçlar (Veras, Archicad AI Visualizer) uygulama içi prompt paneliyle canlı modele uygular; plan/kesit değişince görsel güncellenir (FAZ2-NOTES §1).
**Karar:** `services/ai-render` **uygulama içi canlı render paneli** (export-yükle akışı değil). Girdi: plan **ve kesit**. İki mod: "yaratıcı" + "geometriyi koru" (ControlNet, LANDSCAPE §4). Sonraki adım: image→video. ADR-0005'i (aşamalı render) somutlaştırır.
**Sonuç:** Akıcı UX, hızlı iterasyon. Takas: canlı panel + kuyruk + önbellek mimarisi gerektirir (BullMQ; maliyet kotası).

## ADR-0012 — Mahaller türetilmiş veri: Command ile ama History dışı (1E)
**Tarih:** 2026-06-19 · **Durum:** Kabul (otonom varsayım)
**Bağlam:** Mahaller (Space) duvarlardan otomatik türetilir (planar graf yüz-bulma, ENGINEERING-NOTES §1). Her duvar düzenlemesinde yeniden hesaplanır. Bunları undo geçmişine koymak undo'yu kirletir (her duvar hamlesi + bir de mahal hamlesi).
**Karar:** `RoomManager` mahalleri store'a **Command.apply ile doğrudan** uygular (AddEntity/RemoveEntity), **History'ye girmez**. "Model yalnız Command'den değişir" kuralı korunur (değişim yine Command nesneleridir), ama türetilmiş veri geri-alınabilir geçmişe sokulmaz. Yeniden-giriş `recomputing` bayrağıyla, yalnız-duvar tetikleme `knownWalls` izleyiciyle sağlanır. Mahal **adı** kullanıcı eylemidir → o UpdateEntity History'den geçer (geri alınabilir) ve yeniden-hesapta centroid yakınlığıyla korunur.
**Sonuç:** Temiz undo (yalnız kullanıcı eylemleri) + canlı m². Takas: mahal bulma/silme geri alınamaz (zaten duvarın türevi). Türkçe etiketler için metin atlası `TR_CHARSET` ile baştan yüklenir (I18N-TEXT.md); BitmapText kullanıldığından "ş görünmüyor" tuzağı kapalı.

## ADR-0011 — DXF import & kalibrasyon kapsam kararları (1D)
**Tarih:** 2026-06-19 · **Durum:** Kabul (otonom varsayımlar)
**Bağlam:** 1D'de DXF import + ölçekleme hızlı ve kullanışlı olmalı; mükemmel CAD-uyumu Faz 1 hedefi değil.
**Karar:**
- DXF entity eşlemesi: yalnız **LINE / LWPOLYLINE / POLYLINE → Wall** (kapalı polyline son kenarı da). Diğerleri (ARC, CIRCLE, INSERT, TEXT…) şimdilik atlanır.
- DXF çizgilerinde kalınlık yok → duvarlara **varsayılan 15 cm** kalınlık atanır.
- Birim: `$INSUNITS` → cm (in/ft/mm/cm/m); bilinmiyorsa 1 (cm) kabul + **2-nokta kalibrasyon** düzeltir.
- Kalibrasyon: gerçek mesafe Faz 1'de **`window.prompt`** ile alınır (basit; ileride uygun UI). Ölçek **tüm dokümana**, ilk seçilen nokta merkez alınarak uygulanır; tek undo (`BatchCommand`).
- Export: minimal R12-tarzı DXF (LINE) + PNG (Pixi extract). PDF/IFC ertelendi.
**Sonuç:** Hızlı, çalışan import/scale/export. Takas: ARC/blok/temizleme (kopuk uç, çift çizgi) yok → gerçek karışık DXF'lerde 1E öncesi temizleme adımı gerekebilir (ENGINEERING-NOTES §4). `docs/FILE-FORMATS.md` ileride detaylandırır.

## ADR-0010 — Araç FSM deseni: xstate makine (durum) + sınıf (efekt)
**Tarih:** 2026-06-19 · **Durum:** Kabul (otonom çalışmada alınan varsayım)
**Bağlam:** CLAUDE.md §5/§8.3 araçların XState FSM olmasını ister. xstate v5 aksiyonlarına servis (store/history/pixi) enjekte etmek boilerplate yükü getiriyor; ama saf makine de side-effect içermemeli.
**Karar:** Her araç için xstate makinesi **durumun tek kaynağıdır** (idle/drawing; idle/pressed/dragging). WallTool: efekt (segment ekleme) makine `commit` aksiyonundan, `input` ile verilen callback üzerinden yapılır. SelectTool: makine yalnız pointer fazını tutar; hit-test/komut gibi efektler sınıfta yapılır, faz makineden okunur. EraseTool gibi tek-durumlu araçlar makinesiz.
**Sonuç:** FSM gereği korunur + makineler saf/test edilebilir (transition testleri). Pixi/efekt sınıfta izole. Takas: SelectTool'da faz makine ile sınıf mantığı biraz dağınık; tek-FSM'e (efektleri aksiyonlara taşıyarak) ileride sıkılaştırılabilir.

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
