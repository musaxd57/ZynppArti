# SECURITY — Uygulama güvenliği

> Durum: ürün **CANLI** (`vesna.design`). Bu dosya DOCS-BACKLOG #5 tohumunun büyütülmüş hâli.
> Kapsam bilinçli **minimum + dürüst**: şu an gerçekte ne var, neyi henüz yapmadık. Backend/auth
> geldikçe genişler. CLAUDE.md §0.9 (gizli anahtar commit'leme) bu dosyanın temel kuralıdır.

---

## 1. Bugün ne KORUNUYOR (uygulanmış)
- **API anahtarları yalnız sunucuda.** `OPENAI/ANTHROPIC/AKASHML_API_KEY` yalnız Vercel env + `/api/copilot` (Node route). `@zynpparti/ai` istemciye bundle EDİLMEZ; anahtar tarayıcıya asla gitmez. (ADR-0041.)
- **`.env` commit'lenmez** (`.env.example` paylaşılır). Repo'da gizli anahtar yok (kural §0.9).
- **Rate-limit:** `/api/copilot` IP başına ~30/dk (maliyet-DoS koruması). *(ADR-0042 inceleme bulgusu.)*
- **Girdi sınırı:** route mesaj uzunluğu/sayısı sınırlı (auth'suz uç koruması); design/render prompt kırpılır (4000 char).
- **Hata sızdırmama:** istemciye genel hata mesajı döner; SDK/stack detayı sunucu log'unda kalır.
- **TLS:** Vercel + Railway varsayılan HTTPS/WSS (taşımada şifreli).
- **Boş-yanıt fallback** (ADR-0045): bir sağlayıcı boş dönerse sıradakine düşer (sessiz başarısızlık yutulmaz).

## 2. Henüz YOK (bilinçli açık — backend gelince)
- **Auth yok.** Herkes uygulamayı kullanır; "Canlı Paylaş" odası **tahmin-edilebilir** (URL #room=...). Hassas proje paylaşımı için token/izin gerekir.
- **Persistence/erişim kontrolü yok.** Sync v1 kalıcılık tutmaz; kullanıcı verisi sunucuda saklanmaz (model = istemcide JSON). → DB/blob gelince ACL şart.
- **Güvenlik başlıkları** (HSTS/CSP/X-Frame-Options) Vercel varsayılanları dışında **özelleştirilmedi** — `next.config`'e eklenebilir (düşük efor, yüksek değer).
- **Bağımlılık taraması** (Dependabot/`pnpm audit` CI'da zorunlu değil).

## 3. Backend gelince minimum standart (lansman çekliste)
- Kimlik: güçlü parola + **MFA**; mümkünse SSO. Oturum güvenliği (httpOnly, SameSite).
- Durağanda **AES-256** şifreleme; DB yalnız özel alt ağdan (public 0.0.0.0 bind yok).
- Gizli anahtarlar Secret Manager/Vault'ta; en-az-ayrıcalık IAM (AdministratorAccess verme).
- Güvenlik başlıkları (HSTS, CSP, X-Frame-Options); HTTP→HTTPS yönlendir.
- Audit log (collab commit geçmişi bunu doğal verir — §6.7); yedekler offsite + geri-yükleme test edilmiş.
- Bağımlılık zafiyet taraması CI'da zorunlu (zafiyetli paket shipping'i engelle).

## 4. Hemen yapılabilecek küçük kazanımlar (öneri, sıralı)
1. `next.config` güvenlik başlıkları (HSTS/CSP/X-Frame-Options) — ~10 satır, auth gerektirmez.
2. CI'a `pnpm audit --prod` (uyarı seviyesi) — tedarik zinciri görünürlüğü.
3. "Canlı Paylaş" oda id'sini tahmin-edilemez yap (kısa rastgele yerine uzun token).

> İlgili: [DEPLOY.md](DEPLOY.md) (env + runbook), [COMPLIANCE.md](COMPLIANCE.md) (KVKK/GDPR), DECISIONS ADR-0041/0042/0045.
