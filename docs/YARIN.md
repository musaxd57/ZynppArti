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

## 🔜 YARIN — denetimde FLAG'lenen işler (Moses ile, "bunları yarın yapıcaz")
> Bugün bilerek dokunulmadı (riskli/büyük/dokümante; "emin olmadan yapma"). Yarın **test yazarak, emin
> olarak** yapılacak. Sıra: yüksek-değer + düşük-risk → büyük/kararlı olanlar.

### A. geometry ★ (test-önce — belkemiği)
- `polygon.ts polygonLabelPoint` — konkav (L/U) odada etiket noktası poligon DIŞINA düşebiliyor; grid
  sıklaştır + bulunamazsa kesin-içeride noktaya düş. Önce başarısız vakayı yakalayan test.
- `hatch.ts clipLineToPolygon` — konkav poligonda tarama boşluğu aşırı-doluyor (ts'leri sırala-eşle).

### B. tools (etkileşim; dikkatli)
- Kendine-snap: entity ucunu sürüklerken kendi diğer ucuna yapışıyor → snapper'a "sürüklenen'i hariç tut".
- Mid-gesture tool-switch: pointer basılıyken araç değişince yarım jest yanlış araca gidiyor → `setTool` guard.
- Opening genişliği duvardan taşması → genişlik-sığar kontrolü.

### C. perf (doğruluk değil; 500k ölçek hedefi — tarayıcıda ölç)
- Çok paftada zoom'da `buildSheet` tam yeniden-çizim → build/stroke ayır (en büyük kazanç burada + render-wall/space).
- `CanvasStage` pageCount aboneliği her store değişiminde O(n) → yalnız sheet değişince/debounce.
- `entity-layer pruneEmptyLayers` toplu silmede O(katman) yavaş.
- `room-font` BitmapFont singleton vs `app.destroy` — SPA remount'ta font bozulabilir (Pixi v8 doğrula).

### D. AI maliyet (ADR-0019 ertelenmiş — birlikte)
- Sağlayıcı/render/design çağrılarında timeout yok (askılı upstream parayı açık tutar).
- `classifyTier` ham metne bakıyor → her istek en pahalı modele zorlanabilir (IP-limit zayıf).

### E. copilot doğruluk
- Koridor/oda min-genişlik konveks-gövdeden ölçülüyor → konkav koridorda dar yeri (90cm) kaçırabilir.

### F. document (latent)
- `BatchCommand` aynı id'de Update+Remove → undo'da fırlatıyor (uygulamada şu an ULAŞILMAZ — guard ekle).

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
