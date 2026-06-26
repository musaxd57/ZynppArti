# YARIN — Günlük çalışma planı

> Geçici çalışma dosyası (her gün güncellenir; tamamlananlar `docs/STATE.md`'ye geçince buradan silinir).
> Kalıcı ilerleme kaydı = `docs/STATE.md`. Bu dosya = "yarın nereden başlayalım".
> **Ritüel (her gün uyumadan):** ① bugünü STATE.md'ye yaz ② yarını buraya yaz ③ commit + push.

---

## ✅ 2026-06-25 — bugün ne yaptık (özet)
Proje-adı → tüm indirme adları + üst alan · **karşılama ekranı** (Yeni/Aç) · **gerçek çoklu sayfa**
(plain sheet — "− N sayfa +", kaydolur + PDF'e girer) · **çok-sayfa PDF** (yalnız DOLU sayfa, her sayfa
kendi paftasına kırpılı) · **boş-export koruması** · yorum boyutu · AI viewport-yerleştirme.
Sonra **8-ajan tüm-proje denetimi** → onaylanan güvenli HIGH/MED düzeltildi (NaN guard'lar, collab etiket
karantinası, PDF region kırpma, takeoff duvar-bazlı boşluk + NaN, dblclick layer guard, undo-spam, abort
yarışı, DXF birimleri). Test → **367**, zincir yeşil, hepsi main'de + canlı. Detay: `docs/STATE.md`.

---

## ✅ 2026-06-26 — A–F + AI maliyet TAMAM (`feat/yarin-debt-sweep`, merge bekliyor)
A geometry (label-point+hatch), B tools (exclude-snap+mid-gesture+opening-fit), D AI timeout,
E copilot konkav-genişlik, F BatchCommand guard — hepsi test-önce, **367→387 test**, zincir yeşil + push.
**C perf kısmi:** pageCount Set + pruneEmptyLayers toplu. Detay: `docs/STATE.md`. Kalan ↓

## 🔜 SIRADAKI — kalan FLAG'ler (Moses ile)

### C. perf — KALAN (tarayıcıda ölç; engine refactor, körlemesine değil)
- Çok paftada zoom'da `buildSheet` tam yeniden-çizim → build/stroke ayır (+ render-wall/space).
- `room-font` BitmapFont singleton vs `app.destroy` — SPA remount'ta font bozulabilir (Pixi v8 doğrula).

### G. eski-kalan (hâlâ geçerli, karar/doğrulama gerek)
- **findFaces hole-subtraction:** kapalı iç döngüde dış mahal alanı çentik çıkarmıyor (polygon-with-holes).
- **a11y:** modal `role=dialog`+focus-trap (DialogHost/Calibrate/Comment/CommandPalette/View3D); form `<label htmlFor>`.
- **View3D:** slab-mirror L-oda teyidi; render-loop on-demand; clip-plane yönü.
- **ALLOWED_ORIGINS** Railway env (sync WS origin koruması — kod hazır, env set edilecek).

### H. BÜYÜK bilinen eksik (Faz 3)
- Gerçek **backend + auth + kalıcılık** yok: Kaydet/Aç hâlâ yerel JSON; multiplayer kalıcı değil (`docs/ROADMAP.md` Faz 3).

---

## 📌 Canlıda test edilecek (Moses)
- Yeni proje → 1 boş sayfa; "− N sayfa +" çoğalt (gerçek, kaydolur) → çiz → **PDF İndir** (yalnız dolu, kırpılı).
- Boş export → "Projede dışa aktarılacak yapı yok". · Proje adı → dosya adları; Kaydet/Aç isim+sayfa korur.
