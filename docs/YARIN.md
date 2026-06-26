# YARIN — Günlük çalışma planı

> Geçici çalışma dosyası (her gün güncellenir; tamamlananlar `docs/STATE.md`'ye geçince buradan silinir).
> Kalıcı ilerleme kaydı = `docs/STATE.md`. Bu dosya = "yarın nereden başlayalım".
> **Ritüel (her gün uyumadan):** ① bugünü STATE.md'ye yaz ② yarını buraya yaz ③ commit + push.

---

## 🗓️ 2026-06-27 — 7 SAATLİK PROGRAM (Moses kurguladı; "başla" deyince giriş paneli + sırayla)

> **Kural (Moses):** sormadan ilerle, küçük doğrulanabilir adımlar, her blok sonu typecheck+test+commit+push.
> Maliyetli/irreversible (Paddle canlı checkout, Google Cloud) için Moses'ı bekle; gerisi otonom.

### ⚙️ Blok 0 (15 dk) — Moses'ın elle yapması gerekenler (paralel, bloke etmez)
- **Google girişi açılsın** (şu an "provider is not enabled" hatası): Supabase → Authentication → Providers → **Google** → enable; Google Cloud Console'da OAuth Client (Web) oluştur → Client ID/Secret'ı Supabase'e gir; **Authorized redirect URI** = `https://wybkpmjwtdvvndtoubqq.supabase.co/auth/v1/callback`. + Supabase → Auth → URL Configuration → **Site URL = https://vesna.design**.
- (Opsiyonel) E-posta doğrulamayı test için kapat: Auth → Providers → Email → Confirm email OFF.

### 🔐 Blok 1 (1.5 sa) — GİRİŞ PANELİ (login) — "başla" ilk işi
- ✅ Google logosu eklendi (bugün). Sıradaki: /giris'i **markala** — üstte Vesna wordmark, kart gölgesi/ring, daha iyi tipografi+boşluk, açık/koyu uyum.
- **Şifremi unuttum** (`supabase.auth.resetPasswordForEmail`) + magic-link opsiyonu; `/sifre-sifirla` sayfası.
- Hata/başarı durum cilası (mevcut errText üstüne), loading spinner, autofocus, Enter-gönder, mobil responsive.
- Giriş sonrası üst-bar **kullanıcı menüsü** cilası (AuthButtons: avatar/email + Çıkış + "Bulut projelerim" kısayolu).
- Kayıt akışı: e-posta doğrulama bilgilendirme ekranı; başarıda /app'e yumuşak geçiş.

### ☁️ Blok 2 (1.5 sa) — FAZ 3 BULUT TAMAMLAMA (schema canlı → test edilebilir)
- Bulut proje listesi UI: tarih, sırala, ara, "üzerine yaz" vs "farklı kaydet", sil onayı + boş durum.
- **Paylaşım** (project_members, RLS hazır): "Paylaş" → e-posta ile üye ekle (viewer/editor); paylaşılan proje listesi.
- **Yorum kalıcılığı**: yorumları Supabase `comments`'e yaz/oku (şu an yerel) — proje açılınca yükle.
- Profil/plan göstergesi (`profiles.plan`) üst barda; çıkışta temizle.

### 🧪 Blok 3 (1 sa) — AUDIT FLAG'leri + GÖRSEL DOĞRULAMA
- `updateLineweights` zoom-perf **görsel doğrula** (`?perf` 50k/100k, FPS sayacı); sorun yoksa kapat.
- `buildSheet` build/stroke ayrımı (çok-paftada zoom) + `room-font` BitmapFont SPA-remount.
- DXF **INSERT OCS −Z**; ShortcutsHelp focus-trap; DXF Y-flip + renk **AutoCAD ile** doğrula.

### 💳 Blok 4 (1.5 sa) — PADDLE ABONELİK TEMELİ (ADR-0046; canlı checkout Moses onayı)
- Plan kapısı mantığı: ücretsiz vs pro/studio kota (AI çağrısı/bulut proje sayısı) — `profiles.plan`.
- Paddle entegrasyon iskeleti: checkout butonu (test mode) + webhook route → `profiles.plan` güncelle.
- `/fiyatlandirma` "Yakında" → gerçek checkout'a bağla (test); KDV/fatura Paddle'da.

### 🔍 Blok 5 (1 sa) — DENETİM TURU 5 + KAPANIŞ
- agentlarla **yeni kod** (login/cloud/share/comments/paddle) denetimi → onaylı bulgu düzelt + test.
- STATE.md + YARIN güncelle; tüm zincir yeşil; commit/push; main'e merge.

---

## ✅ 2026-06-25 — bugün ne yaptık (özet)
Proje-adı → tüm indirme adları + üst alan · **karşılama ekranı** (Yeni/Aç) · **gerçek çoklu sayfa**
(plain sheet — "− N sayfa +", kaydolur + PDF'e girer) · **çok-sayfa PDF** (yalnız DOLU sayfa, her sayfa
kendi paftasına kırpılı) · **boş-export koruması** · yorum boyutu · AI viewport-yerleştirme.
Sonra **8-ajan tüm-proje denetimi** → onaylanan güvenli HIGH/MED düzeltildi (NaN guard'lar, collab etiket
karantinası, PDF region kırpma, takeoff duvar-bazlı boşluk + NaN, dblclick layer guard, undo-spam, abort
yarışı, DXF birimleri). Test → **367**, zincir yeşil, hepsi main'de + canlı. Detay: `docs/STATE.md`.

---

## 🚩 2026-06-26 — DERİN DENETİM (2 tur) FLAG'leri (Moses ile — riskli, doğrulama gerek)
> `feat/audit-deep-2026-06-26` (sweep+faz3 merge'li). 2 tur × 25 ajan → 29 düzeltme (367→**402 test**).
> Aşağıdakiler bilerek YAPILMADI (riskli/doğrulama gerek):

### DXF Y-ekseni aynalama (HIGH — interop, #1 iş akışı)
- İç model y-DOWN, DXF y-UP; iki taraf da çevirmiyor → AutoCAD'e/dan import-export **dikey aynalı**.
- Net fix var (IO sınırında Y-negate + yay yönü), in-app round-trip byte-stable kalır. **AMA AutoCAD'le
  doğrulama gerek** + canlıda mevcut tüm DXF import'larının yönünü çevirir (kullanıcı algısı). Moses kararı.

### engine updateLineweights zoom-cull (HIGH — perf, 500k)
- Zoom'da `redrawables` TÜM entity'leri yeniden stroke'luyor (rbush culling'i bozar). Her tekerlek tıkı = O(model).
- Plan hazır: updateLineweights yalnız `prevVisible`'ı çiz; cull-in'de bayat olanı tazele (appliedPx Map).
  Tarayıcı `?perf` ile 50k/500k FPS ölçümü gerek (engine hot-path).

### rooms.ts stabil oda id'leri (LOW — perf + seçim korunması)
- recompute her duvar düzenlemesinde TÜM space'lere yeni id → engine destroy+rebuild (BitmapText churn) +
  oda seçimi/hover kaybı. Fix: matchOf eşleşmesinde eski id'yi koru, yalnız sınır değişince `updated`.
  Belkemiği (RoomManager) → tarayıcı doğrulaması ister.

### ✅ DXF RENK İÇE-AKTARMA — YAPILDI (Moses "sen seç en iyisi" → Rayon/AutoCAD araştırıldı)
- İçe aktarılan geometri KAYNAK rengini taşır (Rayon deseni: katman→wireframe rengi). Gerçek renkler (kırmızı/cyan…) korunur; beyaz/siyah auto → poché (native craft). Opsiyonel `Wall.color`/`Annotation.color` → format kırılmaz, sürüm artışı YOK (eski "riskli" fazla temkinliymiş). render-wall renkli-çizgi/poché + SVG/PDF renk. (INSERT OCS −Z hâlâ yapılmadı — nadir+karmaşık.)

### Eski-kalan (hâlâ geçerli)
- a11y: ShortcutsHelp focus-trap (diğer modallar yapıldı); ALLOWED_ORIGINS Railway env; updateLineweights perf + DXF Y-flip GÖRSEL doğrulama (Moses, FPS sayacı + AutoCAD).

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
