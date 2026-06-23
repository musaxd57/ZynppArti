# YARIN — Günlük çalışma planı

> Geçici çalışma dosyası (her gün güncellenir; tamamlananlar `docs/STATE.md`'ye geçince buradan silinir).
> Kalıcı ilerleme kaydı = `docs/STATE.md`. Bu dosya = "yarın nereden başlayalım".
> **Ritüel (her gün uyumadan):** ① bugünü STATE.md'ye yaz ② yarını buraya yaz ③ commit + push.

---

## ✅ 2026-06-23 — bugün ne yaptık (özet)
- **CANLI YAYINA ALDIK:** `vesna.design` (Vercel) + sync sunucusu (Railway). Domain + SSL + DNS bağlandı.
- AI adı **Arki → Vesna** (domain: vesna.design). 3 AI anahtarı Vercel'de.
- **DWG import** eklendi (libredwg WASM) — bir tarayıcı hatası bulundu ve düzeltildi.
- **Yorum/markup** (💬), **kamera keyframe sunumu** (3B), **presence-seçim** (canlı), **3B kesit + glTF** eklendi.
- **Hız:** AI routing OpenAI-öncelikli yapıldı (warm ~1 sn; eskiden ~8 sn).
- **5-ajan denetim turu** + ~11 düzeltme + 5 yeni test. Zincir yeşil, deploy edildi.

---

## 🌅 YARIN — yapılacaklar (öncelik sırası)

### 1) Canlıda gerçek test (Moses + Claude birlikte) — ÖNCE BU
- [ ] `vesna.design`'da **DWG dosyası yükle** → çiziliyor mu? (bugün düzeltildi, tarayıcıda doğrulanmadı)
- [ ] **Vesna**'ya Sor/Çiz/Render → üçü de cevap veriyor mu, hız iyi mi?
- [ ] **İki sekmede Canlı Paylaş** → imleç + seçim + çizim eşleşiyor mu?
- [ ] Telefon/tablet'te aç → kullanılabilir mi (responsive kontrol)?
- > Bulunan her hatayı buraya not düş, sonra düzeltiriz.

### 2) Hızlı kazanımlar (maliyetsiz, düşük risk)
- [ ] Yorum + metin ekleme `window.prompt` yerine **temalı diyalog** (calibrate gibi).
- [ ] Yorum için **düzenle / sil / "çözüldü" işareti** (şimdilik sadece ekleniyor).
- [ ] AI: bir sağlayıcı **boş cevap** dönerse sıradakine düşsün (şu an boş string "başarı" sayılıyor).
- [ ] Render modu canlıda gerçekten çalışıyor mu — değilse OPENAI_IMAGE ayarını netle.

### 3) Faz 3 olgunlaşma (backend gerektirir — karar + bütçe)
- [ ] Collab **kalıcılık**: oda boşalınca çizim kayboluyor (şu an v1). Hocuspocus / kalıcı y-websocket.
- [ ] Basit **auth** (kim hangi projeye girebilir) + link izinleri (görüntüle/yorum/düzenle).
- [ ] Multiplayer undo köşe durumları + katman döngüsü invariant'ı (ARCHITECTURE'dan).

### 4) Daha sonra (büyük/uzun)
- [ ] AI Render hattını gerçek ControlNet "geometriyi koru" moduna taşı (paralı GPU).
- [ ] Faz 4 üretici: bubble diagram + sınırdan tam plan üretimi.
- [ ] Performans: 500k entity 60 FPS (culling/batching/WASM) — uzun vade.

---

## 📌 Açık notlar / kararlar
- Railway sync **kalıcılık tutmuyor** (bilinçli v1) → yukarıdaki 3. madde.
- Akash GLM-5.2 yavaş (reasoning) → yalnız yedek; ana trafik OpenAI/Claude.
- Domain `vesna.design`; ürün kod adı hâlâ ZynppArti (repo/paket adları).
