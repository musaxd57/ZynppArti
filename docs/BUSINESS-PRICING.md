# BUSINESS-PRICING — Fiyatlandırma ve Para Kazanma Modeli

> DOCS-BACKLOG #8 tohumunun büyütülmüş hâli. **Öneri/taslaktır** — rakamlar Moses'ın kararıyla netleşir.
> Amaç: ürünü satışa hazırlarken sürdürülebilir (AI maliyetini karşılayan) ama büyümeyi teşvik eden
> bir model kurmak. Ödeme sağlayıcısı: **Paddle** (mevcut hesap; Merchant of Record → KDV/fatura/global
> vergi Paddle'da, ADR notu aşağıda).

---

## 1. Temel mantık: maliyetsiz çekirdek + maliyetli AI
- **Bedava/deterministik** her şey (çizim, DXF/DWG import, mahal/m², metraj, export) → ücretsiz katmanda cömert. Kullanıcıyı içeri alır, alışkanlık kurar.
- **Maliyetli AI** (Sor/Çiz = LLM, Render = görsel üretimi) → her kullanım gerçek para. Bunlar **kotalı**; ücretli katmanlar + ek **kredi** ile karşılanır.
- Kural: bir katmanın AI kotasının maliyeti, o katmanın gelirinden **belirgin düşük** olmalı (marj korunur). Render pahalı (~görsel başına birkaç sent–çeyrek dolar) → kotası tutucu, fazlası kredi paketinden.

## 2. Önerilen katmanlar (rakamlar ayarlanabilir)

| | **Ücretsiz** | **Pro** | **Stüdyo** |
|---|---|---|---|
| Hedef | Deneme / öğrenci / bireysel | Aktif mimar / serbest | Ofis / ekip |
| Fiyat (öneri) | **0** | **~$12/ay** (≈₺400) | **~$29/ay** (≈₺950) |
| Yıllık | — | 2 ay bedava (~$120/yıl) | 2 ay bedava (~$290/yıl) |
| Çizim / proje | Sınırsız | Sınırsız | Sınırsız |
| DXF/DWG import + export | ✅ | ✅ | ✅ |
| Mahal/m² + metraj + Excel | ✅ | ✅ | ✅ |
| **AI "Sor" (yönetmelik/asistan)** | 20 mesaj/ay | 500/ay | Sınırsız |
| **AI "Çiz" (plan üretimi)** | 3/ay | 100/ay | Sınırsız |
| **AI "Render" (görsel)** | ✗ | 20/ay | 80/ay |
| Canlı işbirliği | 1 oda | ✅ | ✅ + ekip (3 koltuk) |
| Öncelikli hız/destek | — | ✅ | ✅✅ |

- **AI kredi paketi (ek, tek seferlik):** render/üretim kotası bitince satın al (örn. **50 render ≈ $9**). Paddle tek-seferlik ürün olarak kurulur.
- **Watermark fikri (opsiyonel):** ücretsiz katmanda export'a küçük "Vesna ile yapıldı" filigranı → organik tanıtım + Pro'ya teşvik.

## 3. Neden bu yapı
- **Freemium**, CAD/tasarım SaaS'ta kanıtlı: düşük sürtünme + viral paylaşım (link ile). Rayon/Arcol bandı ~$20–50; biz **girişe ucuz** (Pro $12) konumlanıp Türkçe yönetmelik + AI üretici ile değer katıyoruz.
- **Kredi sistemi** AI maliyet riskini kullanıcıya adil yansıtır (ağır render kullanan öder; çoğu kullanıcı kotada kalır).
- TL-hassas pazar için Paddle **yerelleştirilmiş fiyat** (TL gösterimi) verebilir; baz para USD tutmak global satışta temiz.

## 4. Teknik bağımlılık sırası (ÖNEMLİ)
Ödeme tek başına yetmez — **ücretli özelliği kapı arkasına almak için kullanıcı kimliği şart.** Sıra:
1. **Auth (hesap/giriş)** — kim hangi planda (Clerk/Supabase). *(ön koşul)*
2. **Plan/abonelik durumu** kullanıcıya bağlanır (Paddle webhook → kullanıcı kaydı).
3. **Kota/gate** — `/api/copilot` istekleri kullanıcının planına+kalan kotasına göre sınırlanır (şu an yalnız IP rate-limit var).
4. **Checkout** — Paddle.js ile ödeme; webhook ile abonelik aktifleşir.

→ Yani **gerçek tahsilat = auth'tan sonra.** Şimdi yapılabilecek (auth'suz, maliyetsiz): **fiyatlandırma sayfası** (`/fiyatlandirma`, pazarlama) + bu strateji.

## 5. Paddle entegrasyon notları (sonra)
- Paddle Dashboard'da Vesna için **ürünler + fiyatlar** (Pro aylık/yıllık, Stüdyo aylık/yıllık, kredi paketi) tanımlanır.
- Frontend: **Paddle.js** overlay checkout (`Paddle.Checkout.open({ items })`).
- Backend: **Paddle webhook** (`subscription.created/updated/canceled`) → kullanıcının plan durumunu günceller.
- Merchant of Record: KDV/sales tax, fatura, iade Paddle'da → bizde vergi entegrasyonu derdi yok.
- Anahtarlar (Paddle API key, webhook secret) yalnız sunucu env'inde (CLAUDE §0.9).

## 6. Açık kararlar (Moses)
- [ ] Fiyatlar: Pro $12 / Stüdyo $29 uygun mu? (TL karşılığı dalgalanır — Paddle yerelleştirir.)
- [ ] Render kotaları (20/80) + kredi paketi fiyatı (50 render ≈ $9) — maliyeti ölçtükçe ayarlanır.
- [ ] Ücretsiz katmanda filigran olsun mu?
- [ ] Auth sağlayıcı tercihi (Clerk önerisi) — ödeme bundan sonra.

> İlgili: [DEPLOY.md](DEPLOY.md), [SECURITY.md](SECURITY.md), [IDEAS.md](IDEAS.md). Rakip/pazar: DOCS-BACKLOG #8 kaynakları.
