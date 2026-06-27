# YARIN — Günlük çalışma planı

> Geçici çalışma dosyası (her gün güncellenir; tamamlananlar `docs/STATE.md`'ye geçince buradan silinir).
> Kalıcı ilerleme kaydı = `docs/STATE.md`. Bu dosya = "yarın nereden başlayalım".
> **Ritüel (her gün uyumadan):** ① bugünü STATE.md'ye yaz ② yarını buraya yaz ③ commit + push.

---

## ✅ 2026-06-27 — 7-SAATLİK PROGRAM TAMAM (`feat/login-cloud-2026-06-27`)
Blok 1 (login markalama + şifre sıfırlama + avatar menü) · Blok 2 (PAYLAŞIM RPC+ShareDialog + liste UX
tarih/ara/farklı-kaydet/rozet + PlanBadge) · Blok 3 (engine buildSheet build/stroke ayrımı + ShortcutsHelp
focus-trap) · Blok 4 (Paddle İSKELET: plan modeli + env-gated webhook + runbook) · Blok 5 (3-ajan denetim →
HIGH paylaşılan-kaydet bug + sessiz auth hata + webhook replay düzeltildi). Zincir yeşil, hepsi push'lu.
Detay: `docs/STATE.md`. **Branch Moses'ın merge'ini + tarayıcı testini bekliyor.**

---

## 🗓️ 2026-06-28 — SIRADAKİ (Moses ile öncelik belirle)

> **Önce Moses'ın elle yapması gerekenler** (bloke eder):
> - **Supabase: Google OAuth'u aç** (hâlâ "provider is not enabled"): Authentication → Providers → Google
>   → enable; Google Cloud OAuth Client → ID/Secret; redirect URI = `https://wybkpmjwtdvvndtoubqq.supabase.co/auth/v1/callback`.
> - **`supabase/schema.sql`'i tekrar çalıştır** (yeni `share_project`/`list_project_members` RPC'leri — idempotent).
> - Uçtan-uca tarayıcı testi: giriş → bulut Kaydet/Aç → **Paylaş** (2. hesapla doğrula) → şifre sıfırla.
> - Branch'i main'e merge.

### A. Görsel/AutoCAD doğrulama (yalnız Moses yapabilir — kod hazır)
- `updateLineweights` zoom-perf (`?perf` 50k/100k, FPS sayacı) — sorun yoksa flag'i kapat.
- `buildSheet` build/stroke ayrımı **çok-paftada zoom** görsel teyidi (bugün eklendi).
- DXF **Y-flip + renk AutoCAD ile** round-trip doğrulama (HIGH interop).
- `room-font` BitmapFont SPA-remount (Pixi v8 lifecycle).

### B. Paddle CANLI (Moses onayı + hesap/anahtar gerek → `docs/PADDLE-SETUP.md`)
- `@paddle/paddle-js` (overlay checkout) — **bağımlılık onayı**. Checkout `customData.user_id` ile.
- Plan kotası **enforcement** (ücretsiz 3 bulut proje) — ürün kararı (mevcut kullanıcıları kilitler).
- Webhook **sıra-dışı olay** koruması (`plan_updated_at` + `occurred_at`).

### C. Faz 3 kalan
- **Yorum kalıcılığı kararı:** yorumlar entity (model JSON'da kalıcı). Ayrı `comments` tablosu = sahip-olmayan
  işbirlikçinin markup'ı; konum-modeli netleşmeli (entity-id ref mi, x/y mi). Moses ile tasarla.
- Şematik kesit cilası; Yjs multiplayer kalıcılığı (büyük).

### D. Eski-kalan audit (hâlâ geçerli)
- findFaces hole-subtraction; View3D slab-mirror/clip-plane; ALLOWED_ORIGINS Railway env;
  DXF INSERT OCS −Z (nadir+karmaşık); e-posta enumeration (share_project, owner-gated → düşük).

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
