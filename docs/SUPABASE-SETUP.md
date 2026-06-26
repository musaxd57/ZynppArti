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
Sol menü → **Project Settings** (dişli) → **API**:
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon / public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public olması NORMAL — RLS korur)
- **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (**GİZLİ** — asla tarayıcıya/commit'e gitmez; yalnız sunucu route'u)

### 4) Anahtarları gir
**Yerelde** (`apps/web/.env.local` — gitignore'lu, `.env.example`'a bak):
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```
**Canlıda** (Vercel → Project → Settings → Environment Variables) → aynı üçünü ekle → **Redeploy**.

### 5) (Opsiyonel) Auth sağlayıcıları
- **E-posta/parola** varsayılan açık. İstersen **Authentication → Providers → Google** ile Google girişi aç.
- **Authentication → URL Configuration → Site URL** = `https://vesna.design` (+ yerelde `http://localhost:3000`).

---

## Bana (Claude) "hazır" de — sonra ben şunları bağlarım (branch `feat/faz3-supabase`):
1. `@supabase/supabase-js` istemcisi (additive — anahtar yoksa anonim, build kırılmaz).
2. **Giriş/kayıt UI** (Supabase Auth) — Clerk yerine.
3. **Buluta Kaydet / Aç** — model JSON zarfını `models/<uid>/<project>.json` olarak Storage'a yaz/oku; `projects` satırı metadata.
4. **Paylaşım** (project_members) + yorum kalıcılığı.
5. Clerk söküm + ADR-0046 → 0047 geçiş temizliği.

> **Anahtarsız test:** Adım 1-4 bitmeden de kod yazılır; ama gerçek giriş/kaydet ancak anahtarlar girilince çalışır.
> **Güvenlik:** `service_role` key her şeyi açar (RLS'i atlar) — yalnız sunucu env'inde, asla `NEXT_PUBLIC_*` değil, asla commit değil.
