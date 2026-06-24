import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';

export const metadata: Metadata = {
  title: 'Kullanım Koşulları — Vesna',
  description: 'Vesna (vesna.design) kullanım koşulları, sorumluluk reddi ve hizmet şartları.',
};

const EFFECTIVE = '24 Haziran 2026';
const CONTACT_EMAIL = 'musacinar2009@gmail.com';

/**
 * Kullanım Koşulları (Terms of Service). Satışa hazırlık için temel hukuki çerçeve: hizmet tanımı,
 * kullanım kuralları, fikri mülkiyet, sorumluluk reddi (özellikle AI çıktısı), hizmet değişikliği.
 * NOT: hukuki danışmanlık değildir; ticari lansman öncesi uzman doğrulaması alınmalı.
 */
export default function KosullarPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Kullanım Koşulları</h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--text-3)' }}>
        Yürürlük tarihi: {EFFECTIVE} · Hizmet: <strong>Vesna</strong> (vesna.design)
      </p>

      <Section title="1. Taraflar ve Kabul">
        <P>
          Bu Kullanım Koşulları (“Koşullar”), <strong>Vesna</strong> uygulamasını (“Hizmet”) kullanımınızı
          düzenler. Hizmet’i kullanarak bu Koşulları ve ayrılmaz parçası olan{' '}
          <Link href="/gizlilik" className="hover:underline" style={{ color: 'var(--accent)' }}>
            Gizlilik Politikası
          </Link>
          ’nı kabul etmiş sayılırsınız. Koşulları kabul etmiyorsanız Hizmet’i kullanmamalısınız.
        </P>
      </Section>

      <Section title="2. Hizmetin Tanımı">
        <P>
          Vesna; tarayıcı üzerinde çalışan, mimari/iç mimari çizim, mahal ve metraj hesabı, dosya içe/dışa
          aktarma, canlı işbirliği ve yapay zekâ destekli öneri/plan/görsel üretimi sunan bir tasarım
          aracıdır. Hizmet, “olduğu gibi” ve geliştirme hâlinde sunulmaktadır; özellikler zaman içinde
          değişebilir, eklenebilir veya kaldırılabilir.
        </P>
      </Section>

      <Section title="3. Kullanım Kuralları">
        <P>Hizmet’i kullanırken aşağıdakileri kabul edersiniz:</P>
        <Ul>
          <li>Hizmet’i yalnızca hukuka uygun amaçlarla ve geçerli mevzuata uygun kullanmak.</li>
          <li>Hizmet’in altyapısına zarar verecek, aşırı yük bindirecek veya güvenliğini tehlikeye atacak girişimlerde bulunmamak.</li>
          <li>Yetkisiz erişim, tersine mühendislik veya hizmeti kötüye kullanma teşebbüsünde bulunmamak.</li>
          <li>Başkalarının haklarını (fikri mülkiyet, gizlilik vb.) ihlal eden içerik yüklememek.</li>
          <li>Yüklediğiniz dosyalar ve oluşturduğunuz içerik üzerinde gerekli haklara sahip olmak.</li>
        </Ul>
      </Section>

      <Section title="4. Fikri Mülkiyet ve İçeriğiniz">
        <P>
          <strong>İçeriğiniz size aittir.</strong> Uygulamada oluşturduğunuz çizimler, projeler ve dosyalar
          üzerindeki haklar sizde kalır; bunlar tarafımızca sahiplenilmez. Hizmet’in kendisine ait yazılım,
          arayüz, marka ve “Vesna” adı ile ilgili tüm haklar saklıdır ve size bunları kullanma yönünde,
          Hizmet’i kullanmanız için gerekli olanın ötesinde bir lisans verilmez.
        </P>
      </Section>

      <Section title="5. Yapay Zekâ Çıktılarına İlişkin Sorumluluk Reddi">
        <P>
          Yapay zekâ tarafından üretilen planlar, öneriler, yönetmelik/mevzuat yorumları ve görseller
          <strong> deneyseldir, hata içerebilir ve bağlayıcı değildir</strong>. Bunlar profesyonel mimarlık,
          mühendislik veya hukuki danışmanlık hizmetinin yerine geçmez. Üretilen çıktıların doğruluğunu,
          mevzuata uygunluğunu ve uygulanabilirliğini <strong>kullanmadan önce yetkili bir uzmana
          doğrulatmak sizin sorumluluğunuzdadır</strong>. Yapay zekâ çıktılarına dayanarak alacağınız
          kararlardan doğan sonuçlardan Hizmet sorumlu tutulamaz.
        </P>
      </Section>

      <Section title="6. Veri Kaybı ve Yedekleme">
        <P>
          Hizmet, çizim verilerinizi sunucularında kalıcı olarak saklamaz; veriler tarayıcınızda tutulur ve
          yalnızca siz “Kaydet” dediğinizde cihazınıza iner. Canlı işbirliği oturumları kalıcı değildir.
          Çalışmalarınızı düzenli olarak <strong>kaydetmek/yedeklemek sizin sorumluluğunuzdadır</strong>;
          tarayıcı verisinin temizlenmesi, sekmenin kapanması veya oturumun sona ermesi nedeniyle oluşabilecek
          veri kayıplarından Hizmet sorumlu değildir.
        </P>
      </Section>

      <Section title="7. Sorumluluğun Sınırlandırılması">
        <P>
          Hizmet, geçerli mevzuatın izin verdiği azami ölçüde, “olduğu gibi” ve “mevcut hâliyle” sunulur;
          kesintisizlik, hatasızlık veya belirli bir amaca uygunluk dâhil açık ya da örtülü hiçbir garanti
          verilmez. Hizmet’in kullanımı veya kullanılamamasından kaynaklanan dolaylı, arızi veya sonuç
          niteliğindeki zararlardan sorumluluk, yürürlükteki hukukun izin verdiği ölçüde sınırlıdır.
        </P>
      </Section>

      <Section title="8. Üçüncü Taraf Hizmetler">
        <P>
          Hizmet; barındırma (Vercel, Railway) ve yapay zekâ (OpenAI, Anthropic, AkashML) gibi üçüncü taraf
          sağlayıcılara dayanır. Bu sağlayıcıların erişilebilirliği, performansı veya kendi koşulları
          tarafımızın denetimi dışındadır. İlgili veri akışı için{' '}
          <Link href="/gizlilik" className="hover:underline" style={{ color: 'var(--accent)' }}>
            Gizlilik Politikası
          </Link>
          ’na bakınız.
        </P>
      </Section>

      <Section title="9. Hizmette Değişiklik ve Sona Erme">
        <P>
          Hizmet’i veya bu Koşulları zaman zaman güncelleyebilir, askıya alabilir ya da sonlandırabiliriz.
          Önemli değişiklikleri bu sayfada yayımlarız. Değişikliklerin yürürlüğe girmesinden sonra Hizmet’i
          kullanmaya devam etmeniz güncel Koşulları kabul ettiğiniz anlamına gelir.
        </P>
      </Section>

      <Section title="10. Uygulanacak Hukuk">
        <P>
          Bu Koşullar, Türkiye Cumhuriyeti hukukuna tabidir. Koşullardan doğabilecek uyuşmazlıklarda,
          tüketici mevzuatından kaynaklanan haklarınız saklı kalmak kaydıyla, Türkiye’deki yetkili mahkeme
          ve icra daireleri yetkilidir.
        </P>
      </Section>

      <Section title="11. İletişim">
        <P>
          Koşullar hakkındaki sorularınız için:{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:underline" style={{ color: 'var(--accent)' }}>
            {CONTACT_EMAIL}
          </a>
          .
        </P>
      </Section>

      <p className="mt-10 border-t pt-4 text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}>
        Bu metin bilgilendirme amaçlıdır ve hukuki danışmanlık yerine geçmez. Ticari lansman öncesi bir hukuk
        uzmanına doğrulatılması önerilir.
      </p>
      </article>
      <SiteFooter />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>{title}</h2>
      <div className="mt-2 space-y-3 leading-relaxed" style={{ color: 'var(--text-2)' }}>
        {children}
      </div>
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}

function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc space-y-1.5 pl-5">{children}</ul>;
}
