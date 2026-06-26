# SUPABASE-SETUP — Faz 3 backend kurulumu (Moses adımları)

> Karar: `docs/DECISIONS.md` ADR-0047. Şema: `supabase/schema.sql`.
> **Bu adımları SEN (Moses) yaparsın** (hesap + anahtar = senin); sonra Claude kodu bağlar.
> İlke: auth **additif** — anahtar girmezsen uygulama eskisi gibi anonim çalışır (canlı site kırılmaz).

---

## Neden Supabase?
Tek serviste: **giriş/kayıt (Auth) + veritabanı (Postgres) + dosya saklama (Storage) + güvenlik (RLS)**.
Cömert ücretsiz katman. Üç ayrı sağlayıcı yerine tek hesap, tek fatura. (ADR-0047.)

---

## Adımlar

### 1) Proje oluştur (~3 dk)
1. https://supabase.com → **Sign in** (GitHub ile olur) → **New project**.
2. **Name:** `vesna` (veya istediğin). **Database password:** güçlü bir şifre üret → **bir yere kaydet** (DB'ye doğrudan bağlanırsan lazım; uygulama anon/service key kullanır, bu şifreyi değil).
3. **Region:** `Frankfurt (eu-central-1)` (Türkiye'ye en yakın, hız + KVKK için AB).
4. **Create new project** → ~2 dk kurulum bekler.

### 2) Şemayı çalıştır (~1 dk)
1. Sol menü → **SQL Editor** → **New query**.
2. `supabase/schema.sql` dosyasının **tüm içeriğini** yapıştır → **Run**.
3. "Success. No rows returned" görmelisin. (Tablolar + RLS + `models` Storage bucket'ı oluştu.)
   - Tekrar çalıştırman güvenli (idempotent) — hata vermez.

### 3) Anahtarları kopyala (~1 dk)
Sol menü → **Project Settings** (dişli) → **API Keys**:
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **publishable** key (`sb_publishable_…`) → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (public olması NORMAL — RLS korur)
  - _(Eski projelerde "anon/public" JWT görürsün → `NEXT_PUBLIC_SUPABASE_ANON_KEY`; kod ikisini de kabul eder.)_
- **secret** key (`sb_secret_…`) → `SUPABASE_SECRET_KEY` (**GİZLİ** — asla tarayıcıya/commit'e gitmez; yalnız sunucu)

### 4) Anahtarları gir
**Yerelde** (`apps/web/.env.local` — gitignore'lu, `.env.example`'a bak):
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
```
**Canlıda** (Vercel → Project → Settings → Environment Variables) → aynı üçünü ekle → **Redeploy**.

### 5) (Opsiyonel) Auth sağlayıcıları
- **E-posta/parola** varsayılan açık. İstersen **Authentication → Providers → Google** ile Google girişi aç.
- **Authentication → URL Configuration → Site URL** = `https://vesna.design` (+ yerelde `http://localhost:3000`).

---

## Kod tarafı — ÇOĞU HAZIR (branch `feat/faz3-supabase`)
✅ Yapıldı (anahtarsız bile build/anonim çalışır):
1. `@supabase/supabase-js` + `@supabase/ssr` istemcileri (additive — anahtar yoksa anonim).
2. **Giriş/kayıt UI** (`/giris` — e-posta+parola + Google) + oturum tazeleme middleware'i. **Clerk söküldü.**
3. **Buluta Kaydet / Aç** — toolbar "Bulut" menüsü; model JSON zarfını `models/<uid>/<id>.json` Storage'a yaz/oku; `projects` satırı metadata.

☐ Sonraki (anahtarlar girilip canlı doğrulandıktan SONRA):
4. **Paylaşım** (project_members) + yorum kalıcılığı (Yjs presence zaten var, ADR-0044).
5. Paddle abonelik (plan kapısı) — ADR-0046 §Paddle planı.

## Sen "hazır" deyince ben ne yaparım
Adım 1–4'ü (proje + şema + anahtar) bitirip **"hazır"** de → tarayıcıda birlikte doğrularız:
giriş/kayıt → Google → **Buluta Kaydet** → sayfa yenile → **Buluttan Aç**. Bir hata çıkarsa düzeltirim.

> **Anahtarsız durum:** Kod şu an anahtarsız anonim çalışıyor (giriş/Bulut butonları gizli). Anahtar girince beliriyor.
> **Google girişi (opsiyonel):** Çalışması için Supabase → Authentication → Providers → Google'ı açıp
>   **Redirect URL**'e `https://<proje>.supabase.co/auth/v1/callback` koymalısın (Supabase ekranı söyler).
> **Güvenlik:** secret key RLS'i atlar — yalnız sunucu env'inde, asla `NEXT_PUBLIC_*` değil, asla commit değil.
