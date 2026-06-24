import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Gizlilik Politikası — Vesna',
  description: 'Vesna (vesna.design) gizlilik politikası ve KVKK aydınlatma metni.',
};

/** Yürürlük tarihi — politika değişince güncelle. */
const EFFECTIVE = '24 Haziran 2026';
/** Veri sorumlusu iletişim — Moses doğrulamalı/güncellemeli. */
const CONTACT_EMAIL = 'musacinar2009@gmail.com';

/**
 * Gizlilik Politikası + KVKK aydınlatma metni (statik sayfa). İçerik docs/COMPLIANCE.md çerçevesine
 * ve gerçek veri akışına dayanır: çizim verisi istemcide kalır, AI istekleri 3. parti sağlayıcılara
 * (yurtdışı) gider, sunucuda kalıcı kullanıcı verisi tutulmaz. NOT: hukuki danışmanlık değildir;
 * ürün büyürse KVKK/GDPR uzmanı doğrulaması alınmalı.
 */
export default function GizlilikPage() {
  return (
    <main
      className="mx-auto min-h-screen max-w-3xl px-6 py-12"
      style={{ background: 'var(--surface-0, #0E0E10)', color: 'var(--text-1, #e8e8ea)' }}
    >
      <Link href="/" className="text-sm hover:underline" style={{ color: 'var(--accent-text, #a5a5ff)' }}>
        ← Uygulamaya dön
      </Link>

      <h1 className="mt-6 text-3xl font-semibold">Gizlilik Politikası</h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--text-3, #9a9aa2)' }}>
        Yürürlük tarihi: {EFFECTIVE} · Hizmet: <strong>Vesna</strong> (vesna.design)
      </p>

      <Section title="1. Kısaca">
        Vesna, tarayıcıda çalışan bir mimari tasarım aracıdır. <strong>Çizimleriniz cihazınızda kalır</strong>;
        sunucularımızda kalıcı olarak saklanmaz. Yapay zekâ özelliklerini (Sor / Çiz / Render)
        kullandığınızda, isteğiniz ve ilgili proje özeti yanıt üretmek üzere üçüncü taraf yapay zekâ
        sağlayıcılarına (yurt dışı) iletilir. Hesap oluşturmanız gerekmez.
      </Section>

      <Section title="2. Veri Sorumlusu">
        Bu hizmet bireysel olarak işletilmektedir. Sorularınız ve KVKK kapsamındaki başvurularınız için:{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} className="hover:underline" style={{ color: 'var(--accent-text, #a5a5ff)' }}>
          {CONTACT_EMAIL}
        </a>
        .
      </Section>

      <Section title="3. Hangi Verileri İşliyoruz?">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Çizim / proje verisi:</strong> Tarayıcınızın belleğinde tutulur ve yalnızca siz
            “Kaydet” dediğinizde cihazınıza bir dosya (JSON) olarak iner. Sunucularımızda saklanmaz.
          </li>
          <li>
            <strong>Yapay zekâ istekleri:</strong> Sor/Çiz/Render kullanırsanız, yazdığınız metin ve
            projenizin özeti (oda/m², duvar/kapı sayıları gibi) yanıt üretimi için sağlayıcıya gönderilir.
          </li>
          <li>
            <strong>Canlı işbirliği (opsiyonel):</strong> “Canlı Paylaş” açarsanız, o oturum boyunca
            çiziminiz ve imleç konumunuz katılımcılarla anlık paylaşılır. Bu veri <strong>kalıcı olarak
            saklanmaz</strong>; oturum bitince kaybolur.
          </li>
          <li>
            <strong>Teknik kayıtlar:</strong> Barındırma sağlayıcıları (Vercel, Railway) hizmetin
            çalışması için standart sunucu kayıtları (örn. IP, tarayıcı türü) tutabilir.
          </li>
        </ul>
        <p className="mt-3">Hesap, parola veya ödeme bilgisi toplamıyoruz (şu an kimlik doğrulama yoktur).</p>
      </Section>

      <Section title="4. Üçüncü Taraf Sağlayıcılar ve Yurt Dışına Aktarım">
        Yapay zekâ yanıtları için isteğiniz şu sağlayıcılardan birine iletilebilir:{' '}
        <strong>OpenAI</strong>, <strong>Anthropic</strong>, <strong>AkashML</strong>. Bu sağlayıcıların
        sunucuları <strong>yurt dışında</strong> bulunabilir; dolayısıyla yapay zekâ kullanımınızda
        verileriniz yurt dışına aktarılır. Barındırma için <strong>Vercel</strong> (web) ve{' '}
        <strong>Railway</strong> (canlı işbirliği) kullanılır. Yapay zekâ özelliklerini kullanmayarak bu
        aktarımdan kaçınabilirsiniz.
      </Section>

      <Section title="5. İşleme Amacı ve Saklama">
        Verileriniz yalnızca <strong>talep ettiğiniz işlevi yerine getirmek</strong> için işlenir (çizimi
        göstermek, yapay zekâ yanıtı üretmek, canlı paylaşımı sağlamak). Tarafımızca kalıcı bir veri
        tabanında saklanmaz. Sağlayıcıların kendi saklama/işleme politikaları geçerlidir.
      </Section>

      <Section title="6. Çerezler ve Yerel Depolama">
        Reklam/izleme çerezi kullanmıyoruz. Uygulama, yalnızca arayüz tercihlerinizi (örn. açık panel,
        dock genişliği) hatırlamak için tarayıcınızın <strong>yerel depolamasını</strong> kullanır; bu veri
        cihazınızdan çıkmaz.
      </Section>

      <Section title="7. Haklarınız (KVKK m. 11)">
        Kişisel verilerinizin işlenip işlenmediğini öğrenme, düzeltilmesini/silinmesini isteme ve işlemeye
        itiraz etme haklarınız vardır. Sunucuda kalıcı veri tutmadığımız için talepleriniz çoğunlukla
        sağlayıcı tarafındaki kayıtlara ilişkindir; başvurunuzu yukarıdaki e-postaya iletebilirsiniz.
      </Section>

      <Section title="8. Yapay Zekâ Çıktıları Hakkında">
        Yapay zekâ tarafından üretilen planlar, öneriler, yönetmelik bilgileri ve görseller{' '}
        <strong>deneyseldir ve hata içerebilir</strong>. Resmî/uygulanabilir kararlar için yetkili bir
        mimar/mühendis tarafından doğrulanmalıdır. Yapay zekâ otomatik olarak sizin adınıza bağlayıcı bir
        karar vermez.
      </Section>

      <Section title="9. Değişiklikler">
        Bu politika güncellenebilir; değişiklikte yürürlük tarihi yenilenir. Önemli değişiklikleri bu
        sayfada yayımlarız.
      </Section>

      <p className="mt-10 text-xs" style={{ color: 'var(--text-3, #9a9aa2)' }}>
        Bu metin bilgilendirme amaçlıdır ve hukuki danışmanlık yerine geçmez.
      </p>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-2 leading-relaxed" style={{ color: 'var(--text-2, #c4c4ca)' }}>
        {children}
      </div>
    </section>
  );
}
