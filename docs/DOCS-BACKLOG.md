# docs/DOCS-BACKLOG.md — Eklenebilecek Doküman & İçerik Listesi (ZynppArti)

> Amaç: CLAUDE.md/docs'a ileride eklenecek, "olgun ürün" için gereken ama ilk planda atlanan konuları **tohumlarıyla** toplamak.
> Her madde: **[FAZ]** ne zaman lazım · **[ÖNCELİK]** · kısa tohum içerik.
> Kural (önceki dersimiz): bunları şimdi şişirme. Fazı gelince ilgili `docs/*.md`'yi aç, tohumdan büyüt.
>
> **ŞİMDİ (Faz 1) ilgili olanlar:** UX-INTERACTIONS, I18N-TEXT, TESTING → oluşturuldu (✅). Diğerleri Faz 2+.

---

## 1. UX-INTERACTIONS.md — Kısayollar & etkileşim sözlüğü ✅ oluşturuldu
**[FAZ 1] · [ÖNCELİK: YÜKSEK — şimdi]**
CAD aracı klavyeyle yaşar; kısayol şeması **bir kez** tasarlanır, sonra her araç ona uyar. Sonradan değiştirmek acı verir.
Tohum:
- **Araç kısayolları (tek harf, AutoCAD'e yakın olsun ki mimar yabancılık çekmesin):** `L`=line/wall, `M`=move, `C`=copy, `E`=erase, `R`=rotate, `S`=scale, `D`=dimension, `T`=text, `Z`=zoom, `Spacebar(basılı)`=pan, `Esc`=iptal, `Enter`=onayla.
- **Evrensel:** `Ctrl+Z/Ctrl+Shift+Z`=undo/redo, `Ctrl+C/V/X`, `Ctrl+A`=tümünü seç, `Ctrl+S`=kaydet, `Delete`=sil, `Ctrl+G`=grupla.
- **Snapping geçişleri:** uç nokta / orta / kesişim / dik / paralel / grid — her birini aç/kapa tuşu + ekranda gösterge.
- **Seçim mantığı:** soldan-sağa pencere = tamamen içinde olanlar; sağdan-sola = dokunanlar (AutoCAD davranışı).
- Tüm kısayollar **tek tabloda** ve uygulama içinde "?" ile açılan bir yardım kartında.
- İleride **kullanıcı kısayolu özelleştirme**.

## 2. I18N-TEXT.md — Çok dil + Türkçe metin tuzağı ✅ oluşturuldu
**[FAZ 1] · [ÖNCELİK: YÜKSEK — şimdi]**
Türkçe-öncelikli ama çok dilli olacak. **Kritik teknik tuzak (Rayon'un da yaşadığı MSDF sınırı):** WebGL'de metin önceden bir glyph atlasına render edilir; atlasta olmayan karakter **bozuk/eksik** çıkar. Türkçe karakterler (`ç ş ğ ı İ ö ü Ç Ş Ğ Ö Ü`) ve ileride Arapça/Çince bunu tetikler.
Tohum:
- Render motoru metin atlasına **Türkçe karakter setini baştan dahil et** (boşuna "neden ş görünmüyor" hatası yaşama).
- Uzun vadede vektör-metin render'a geç (sınırsız glyph) — bkz. CLAUDE.md §8.1.
- UI dizeleri **i18n dosyalarında** (hardcode etme); ilk diller TR + EN.
- Ondalık/birim biçimi yerele göre (TR: virgül; m²/ft²).
- Yazı yönü (RTL) ileride Arapça için.

## 3. TESTING.md — Test stratejisi ✅ oluşturuldu
**[FAZ 0–1] · [ÖNCELİK: YÜKSEK]**
"Yeşil test = bitti" kuralının somut hali.
Tohum:
- **`packages/geometry` ve `packages/document`: birim test, %90+ kapsam hedefi** (TDD). Bug → önce onu yakalayan test.
- **`packages/engine`: görsel/etkileşim** — kritik akışlar Playwright e2e (çiz, seç, taşı, undo).
- **Altın test seti:** gerçek bir DXF import → mahal sayısı + m² doğru mu (regression).
- Her PR'da CI: `lint + typecheck + test` zorunlu yeşil.
- Performans testi: 50k/500k entity sahnesinde FPS ölçümü (bkz. PERFORMANCE.md).

## 4. FILE-FORMATS.md — Yerel format + içe/dışa aktarma matrisi + migration
**[FAZ 1–2] · [ÖNCELİK: ORTA-YÜKSEK]**
"Model = dosya" kararının (Rayon dersi) somut spesifikasyonu.
Tohum:
- **Yerel format (`.znp`):** sürüm numaralı JSON/binary; tüm model tek dosyada (blob storage).
- **Lazy migration:** eski sürüm dosya açılınca istemci onu güncel sürüme taşıyan bir commit üretir; toplu migration yok.
- **Import matrisi:** DXF (öncelik), DWG (libredwg-web→ODA fallback), PDF/görsel (referans), ileride IFC.
- **Export matrisi:** DXF, PDF, PNG (yüksek çöz.), mahal listesi → Excel, ileride IFC/Revit köprüsü.
- Her format için "neyi koruyoruz/kaybediyoruz" notu (örn. DWG'de XRef/tablo gelmez).

## 5. SECURITY.md — Uygulama güvenliği
**[FAZ 2+] · [ÖNCELİK: YÜKSEK (backend gelince)]**
Backend/hesap/depolama geldiğinde lansman öncesi minimum standart.
Tohum (2026 SaaS lansman çeklist özeti):
- **Taşımada TLS 1.2+; durağanda AES-256** şifreleme. HTTPS zorunlu, HTTP→HTTPS yönlendir.
- **Kimlik:** güçlü parola + **MFA**; mümkünse SSO/SAML; oturum güvenliği.
- **Gizli anahtarlar** Vault/Secret Manager'da; repo'da asla (CLAUDE.md §0.9).
- **Veritabanı yalnız özel alt ağdan** erişilir; public bind (0.0.0.0) yok.
- **API güvenliği:** rate limiting (brute-force/DoS'a karşı), hata mesajında stack trace gizle.
- **Güvenlik başlıkları:** HSTS, CSP, X-Frame-Options.
- **Audit log:** kim neye erişti/değiştirdi (collab'da zaten commit geçmişi var — onu kullan).
- **Yedekler offsite** ve **geri yükleme test edilmiş**.
- **Bağımlılık taraması** (zafiyetli npm paketi shipping'i engelle).
- **En az ayrıcalık:** bulut IAM rolleri dar; "AdministratorAccess" verme.

## 6. COMPLIANCE.md — KVKK (TR) + GDPR (AB)
**[FAZ 2+] · [ÖNCELİK: YÜKSEK (kullanıcı verisi tutulunca)]**
Moses Türkiye'de → **KVKK** zaten geçerli. AB'den tek kullanıcı bile olursa → **GDPR** de geçerli (şirket AB'de olmasa bile).
Tohum:
- **Açık ve doğru gizlilik politikası** + **çerez onay mekanizması** (onaya kadar zorunlu-olmayan takibi gerçekten engelleyen).
- **Veri minimizasyonu:** gereğinden fazla veri toplama.
- **Kullanıcı hakları:** erişim, düzeltme, **silme (right to deletion)** — teknik olarak uygulanabilir olmalı.
- **Veri saklama (retention) politikası** net; silinen projelerin verisi gerçekten silinsin.
- **İşleyici sözleşmeleri (DPA)** tüm 3. parti sağlayıcılarla (depolama, AI render API'leri).
- **AI ile otomatik karar/profilleme** varsa şeffaflık + insan incelemesi opsiyonu.
- Sınır ötesi veri aktarımı (render için yurtdışı API kullanırsan) → bunu politikada belirt.

## 7. OBSERVABILITY.md — Log, hata takibi, analitik
**[FAZ 2+] · [ÖNCELİK: ORTA]**
"Çalışıyor mu, nerede patladı, kullanıcı ne yapıyor" görünürlüğü.
Tohum:
- **Hata takibi** (Sentry vb.) — istemci + sunucu; kaynak haritalı stack trace.
- **Yapılandırılmış loglama** (kim, ne, ne zaman); kişisel veriyi loglama.
- **Ürün analitiği** (gizlilik-dostu): hangi araçlar kullanılıyor, nerede takılıyor — ama KVKK/GDPR'a uygun (onay + anonimleştirme).
- **Performans izleme:** gerçek kullanıcıda FPS/yükleme süresi.
- **Sağlık kontrolü/uptime** ve uyarılar.

## 8. BUSINESS-PRICING.md — Para kazanma modeli
**[FAZ 2+] · [ÖNCELİK: ORTA]**
AI özellikleri pahalı (render/üretim API maliyeti var) → fiyatlandırma baştan düşünülmeli.
Tohum (rakip pazar gözlemi):
- Sektör normu: **abonelik katmanları** + **üretim başına kredi** (her render/varyant kredi yer). Rakipler ~ aylık $20–50 bandı, kurumsal $250–400+.
- **Önemli karar:** her "yeniden üret"/varyant krediden düşsün mü, yoksa sadece tamamlanan çıktı mı? (Kullanıcı bunu net görmeli.)
- Ücretsiz katman (deneme kredisi) + ücretli katmanlar.
- AI maliyetini (render başına sentler) fiyata yansıt; marj koru.
- Ödeme entegrasyonu (Stripe vb.) — **kart/ödeme verisini sen tutma**, sağlayıcıya bırak.

## 9. ONBOARDING.md — İlk kullanım deneyimi
**[FAZ 1+] · [ÖNCELİK: ORTA]**
Boş tuval korkutur; ilk 60 saniye ürünü sevdirir ya da kaybettirir.
Tohum:
- **Şablonlar/örnek projeler** (boş başlama; "örnek daire planı"ndan başla).
- Kısa **interaktif tur** (çiz, ölçekle, mahal isimle).
- "Başlarken" 4-adım checklist kartı (kayıt → DXF yükle → ölçekle → mahal isimle).
- Boş durumda (empty state) ipucu metinleri.

## 10. ROADMAP-BACKLOG / IDEAS.md — Fikir park yeri
**[HER FAZ] · [ÖNCELİK: DÜŞÜK ama faydalı]**
Akla gelen ama şimdi yapılmayacak fikirler buraya; ROADMAP'i kirletme.
Tohum: maliyet/metraj otomasyonu, güneş/gölge analizi, mobil tarama girişi (CubiCasa tarzı), versiyon/branch UI, yorum→görev dönüşümü, eklenti/API ekosistemi.

---

## Öncelik özeti (ne zaman ne açılır)

| Doküman | Faz | Şimdi mi? |
|---------|-----|-----------|
| UX-INTERACTIONS.md | 1 | **Evet** ✅ |
| I18N-TEXT.md | 1 | **Evet** ✅ (Türkçe glyph tuzağı!) |
| TESTING.md | 0–1 | **Evet** ✅ |
| FILE-FORMATS.md | 1–2 | Yakında |
| ONBOARDING.md | 1+ | Yakında |
| SECURITY.md | 2+ | Sonra |
| COMPLIANCE.md (KVKK/GDPR) | 2+ | Sonra (ama unutma) |
| OBSERVABILITY.md | 2+ | Sonra |
| BUSINESS-PRICING.md | 2+ | Sonra |
| IDEAS.md | her | İstediğin an |

### Kaynaklar (doğrulama)
- SaaS lansman güvenlik çeklisti 2026 (peiko.space, technology.org)
- GDPR SaaS 2026 (feroot, securespells, zylo)
- AI render/plan fiyatlandırma (kredi/üretim modeli — maket.ai, aibuildingtools karşılaştırmaları)
- Türkçe/MSDF glyph sınırı: Rayon kurucu röportajı (bkz. docs/ARCHITECTURE.md, LANDSCAPE.md)
