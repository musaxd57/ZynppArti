# YARIN — Günlük çalışma planı

> Geçici çalışma dosyası (her gün güncellenir; tamamlananlar `docs/STATE.md`'ye geçince buradan silinir).
> Kalıcı ilerleme kaydı = `docs/STATE.md`. Bu dosya = "yarın nereden başlayalım".
> **Ritüel (her gün uyumadan):** ① bugünü STATE.md'ye yaz ② yarını buraya yaz ③ commit + push.

---

## ✅ 2026-06-28 — DENETİM + SELF-REVIEW + UI ELDEN GEÇİRME (main'de canlı, son `85c3abb`)
- **30+ ajan denetimi** (72 onaylı bulgu) → tüm otonom-güvenli bulgular düzeltildi (4 HIGH dahil: plan
  self-upgrade açığı, Paddle paying→free downgrade, **oda adı veri kaybı**) + **self-review** (kendi diff'imde
  1 regresyon yakalandı + düzeltildi). ~24 commit.
- **UI:** tam-ekran proje galerisi + canlı thumbnail + satır sil/paylaş · giriş→direkt galeri (AppRedirect) ·
  üst çubuk sadeleştirme (Bulut/Aç/Ücretsiz kalktı, 4 indir → "İndir ▾" portal menü).
- Detay: `docs/STATE.md` en üstte. **Moses schema.sql'i prod'da çalıştırdı → H1/M8 canlıda kapalı.**

---

## 0. ÖNCE — Moses'ın tarayıcı doğrulaması (maliyetsiz, kritik)
Bugünkü UI işi canlıda ama gözle teyit edilmeli:
- [ ] **Galeri:** giriş yapılı `vesna.design` → projeler ızgarada, **thumbnail'lar** çiziliyor mu? Kart üzerine
  gel → **Sil + Paylaş** beliriyor mu? Sil onaylı çalışıyor mu?
- [ ] **Redirect:** giriş yapınca `vesna.design` direkt galeriye düşüyor mu (landing CTA'sız)?
- [ ] **Üst çubuk:** "İndir ▾" butonun altında **tam görünüyor mu** (kaydırmasız)? Aç/Bulut/Ücretsiz gitti mi?
- [ ] **Oda adı (en kritik fix):** çiz → Ctrl+S → kapat → tekrar gir → galeriden aç → **oda adların geri geldi mi?**

## 1. Bekleyen küçük öneriler (Moses onaylarsa)
- [x] **"← Projelerim" butonu** ✅ (`43e36b3`): üst çubuğun en başına eklendi → galeriye (StartScreen) döner.
  Kaydedilmemiş çizim varsa onay ister (Kaydet hatırlatması). Zincir yeşil. *(Tarayıcı teyidi Moses'ta.)*
- [ ] **Thumbnail hızlandırma**: her kart TAM JSON indiriyor (çok projede yavaş) → kaydederken küçük önizleme sakla.
- [ ] **Sunum (3B kamera turu)**: görünümler kalıcı değil + video export yok → kalıcı + MP4/GIF export.
- [ ] **Redirect davranışı**: giriş yapan kullanıcı kökte landing'i göremiyor — istenirse "Site'ye dön" geçişi.

## 2. Denetimden KALAN — yalnız Moses kararı/altyapı (otonom dokunulmadı)
- [ ] **M9/M11 Paddle event-sıralama:** `profiles.plan_updated_at` + webhook'ta eski `occurred_at`'i atla.
- [ ] **M10 ücretsiz kota sunucu-tarafı:** şu an istemci kapısı; kesin sınır için DB trigger/RPC.
- [ ] **M12 rate-limit:** in-memory limiter Vercel serverless'te etkisiz → Upstash/Redis (maliyet kararı).
- [ ] **M17 katman klavye erişimi:** sürükle-sırala/yeniden-adlandır klavyeyle (UX, görsel doğrulama).
- [ ] **M23 grid viewport-relative:** uzak/import çizimde ızgara kayboluyor; core render + pan-perf → görsel doğrulama şart.

## 3. Faz haritası (büyük resim — ROADMAP.md)
- Faz 2 AI render/LLM maliyetli kısım ertelenmiş; deterministik her şey hazır.
- Faz 3 kalıcı çok-yazar (Yjs presence var; commit-log north-star).
- Faz 4 boş plandan üretim (AI üretici — en zor).
- Faz 5 gerçek 3B + animasyon + BIM (web-ifc) — sunum/GLB tohumu.
