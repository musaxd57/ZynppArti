# COMPLIANCE — KVKK (TR) + GDPR (AB)

> Durum: ürün **CANLI** (`vesna.design`), şirket/kullanıcı Türkiye'de → **KVKK** zaten geçerli.
> AB'den tek kullanıcı bile olursa **GDPR** de geçerli. Bu dosya DOCS-BACKLOG #6 tohumunun
> büyütülmüş hâli; kapsam **minimum + dürüst** (şu an ne tutuyoruz, ne lazım).

---

## 1. Şu an hangi veriyi tutuyoruz? (gerçek durum)
- **Sunucuda kalıcı kullanıcı verisi YOK.** Model = istemcide (tarayıcı belleği + kullanıcının indirdiği JSON). Sync v1 kalıcılık tutmaz (oda boşalınca gider).
- **Geçici işlenen veri:** (a) AI istekleri → prompt + proje bağlamı **3. parti sağlayıcılara** (OpenAI/Anthropic/Akash) gider; (b) collab çizim verisi Railway sync üzerinden **anlık** geçer (saklanmaz).
- **Hesap/kimlik verisi YOK** (auth yok).

→ Yani şu an "veri tabanında kişisel veri biriktiren" bir ürün değiliz; ama **prompt'lar ve çizimler yurtdışı API'lere gidiyor** → bu KVKK'da "yurt dışına aktarım" + şeffaflık konusudur.

## 2. Canlı ürün için MİNİMUM (şimdi eksik)
- [ ] **Gizlilik politikası** sayfası — en az: hangi veri, neden, kimlerle (OpenAI/Anthropic/Akash sağlayıcıları), ne kadar süre. Yurtdışı aktarımı **açıkça** belirt.
- [ ] **Çerez/analitik onayı** — analitik eklenirse onaya kadar zorunlu-olmayan takibi gerçekten engelle.
- [ ] **İletişim/sorumlu** (veri sorumlusu kim) + başvuru kanalı.
- [ ] AI çıktısının **deneysel** olduğu uyarısı (zaten "deneysel" etiketi var; politikada da geçsin — otomatik karar/profilleme şeffaflığı).

## 3. Backend (auth/persistence) gelince
- **Veri minimizasyonu:** gereğinden fazla toplama.
- **Kullanıcı hakları:** erişim, düzeltme, **silme (right to deletion)** — teknik olarak uygulanabilir (silinen proje verisi gerçekten silinsin).
- **Saklama (retention) politikası** net + uygulanır.
- **DPA (işleyici sözleşmesi)** tüm 3. parti sağlayıcılarla (AI API'leri, blob storage).
- **Sınır ötesi aktarım** dokümante (render/LLM yurtdışı → politikada açık).

## 4. Pratik öncelik
1. **Basit gizlilik politikası + 3. parti AI aktarım notu** (canlı ürünün en acil eksiği; auth gerektirmez).
2. Analitik eklenmeden önce çerez onayı tasarla (sonradan eklemek acı verir).
3. Auth/DB geldiğinde silme + retention + DPA paketini birlikte kur.

> İlgili: [SECURITY.md](SECURITY.md), [DEPLOY.md](DEPLOY.md). Not: bu bir hukuki danışmanlık değil; lansman büyürse KVKK/GDPR uzmanı doğrulaması alınmalı.
