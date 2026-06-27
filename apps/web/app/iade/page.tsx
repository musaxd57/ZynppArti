import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';

export const metadata: Metadata = {
  title: 'İade ve İptal Politikası — Vesna',
  description: 'Vesna (vesna.design) abonelik, iptal ve iade/geri ödeme politikası. Ödemeler Paddle üzerinden alınır.',
};

const EFFECTIVE = '27 Haziran 2026';
const CONTACT_EMAIL = 'musacinar2009@gmail.com';

/**
 * İade ve İptal Politikası (Refund & Cancellation Policy). Paddle satıcı (Merchant of Record) domain
 * onayı bu sayfayı + Gizlilik + Kullanım Koşulları'na görünür link ister. SaaS abonelik için iptal,
 * geri ödeme ve faturalandırma şartlarını tanımlar. NOT: hukuki danışmanlık değildir.
 */
export default function IadePage() {
  return (
    <div className="v-page" style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold">İade ve İptal Politikası</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-3)' }}>
          Yürürlük tarihi: {EFFECTIVE} · Hizmet: <strong>Vesna</strong> (vesna.design)
        </p>

        <Section title="1. Kapsam">
          <P>
            Bu politika, <strong>Vesna</strong> (“Hizmet”) için satın alınan ücretli aboneliklerin (Pro,
            Stüdyo) iptal ve iade/geri ödeme koşullarını düzenler. Hizmet’i kullanarak bu politikayı,{' '}
            <Link href="/kosullar" className="hover:underline" style={{ color: 'var(--accent)' }}>
              Kullanım Koşulları
            </Link>{' '}
            ve{' '}
            <Link href="/gizlilik" className="hover:underline" style={{ color: 'var(--accent)' }}>
              Gizlilik Politikası
            </Link>
            ’nı kabul etmiş sayılırsınız.
          </P>
        </Section>

        <Section title="2. Ödeme Altyapısı (Paddle)">
          <P>
            Tüm ödemeler ve faturalandırma, kayıtlı satıcı (Merchant of Record) olarak{' '}
            <strong>Paddle.com Market Limited</strong> tarafından işlenir. Satın alımlarınızda fatura,
            vergi (KDV dâhil) ve ödeme işlemleri Paddle üzerinden gerçekleşir. İade talepleri de Paddle’ın
            ödeme sistemi aracılığıyla, ödemeyi aldığınız yönteme yapılır.
          </P>
        </Section>

        <Section title="3. Abonelik ve Yenileme">
          <P>
            Pro ve Stüdyo planları, seçtiğiniz döneme göre (aylık/yıllık) otomatik yenilenen aboneliklerdir.
            Her dönem başında ilgili ücret, kayıtlı ödeme yönteminizden tahsil edilir. Fiyatlar{' '}
            <Link href="/fiyatlandirma" className="hover:underline" style={{ color: 'var(--accent)' }}>
              Fiyatlandırma
            </Link>{' '}
            sayfasında belirtilir; vergiler ödeme sırasında eklenebilir.
          </P>
        </Section>

        <Section title="4. İptal">
          <P>
            Aboneliğinizi <strong>dilediğiniz zaman</strong> iptal edebilirsiniz. İptal sonrası, içinde
            bulunduğunuz <strong>fatura döneminin sonuna kadar</strong> ücretli özelliklere erişiminiz devam
            eder; dönem sonunda hesabınız ücretsiz plana döner ve bir sonraki yenileme tahsil edilmez. İptal
            için hesabınızdaki abonelik yönetiminden ya da{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="hover:underline" style={{ color: 'var(--accent)' }}>
              {CONTACT_EMAIL}
            </a>{' '}
            adresine yazarak talepte bulunabilirsiniz.
          </P>
        </Section>

        <Section title="5. İade / Geri Ödeme">
          <P>
            Yeni bir abonelik satın alımından sonraki <strong>14 gün içinde</strong>, hizmetten memnun
            kalmazsanız tam iade talep edebilirsiniz. İade talepleri için{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="hover:underline" style={{ color: 'var(--accent)' }}>
              {CONTACT_EMAIL}
            </a>{' '}
            adresine, satın alımda kullandığınız e-posta ve sipariş/fatura numarasıyla başvurun. Onaylanan
            iadeler, ödemenin alındığı yönteme Paddle aracılığıyla, makul bir süre içinde (genellikle 5–10 iş
            günü) yapılır.
          </P>
          <P>
            Aşağıdaki durumlarda iade yapılmayabilir: (a) 14 günlük süre dolduktan sonra geçmiş dönemler için
            yapılan talepler; (b) bu Koşulların veya kullanım kurallarının ihlali nedeniyle sonlandırılan
            hesaplar; (c) yürürlükteki mevzuatın iadeyi zorunlu kılmadığı, hizmetin esaslı ölçüde kullanıldığı
            durumlar. Tüketici mevzuatından doğan haklarınız saklıdır.
          </P>
        </Section>

        <Section title="6. Cayma Hakkı (Tüketiciler)">
          <P>
            Tüketici sıfatıyla yaptığınız aboneliklerde, ilgili mevzuat kapsamında cayma haklarınız saklıdır.
            Dijital hizmetin onayınızla hemen başlatılması hâlinde cayma hakkına ilişkin istisnalar
            uygulanabilir; bu durumda yukarıdaki 14 günlük iade taahhüdümüz geçerli olmaya devam eder.
          </P>
        </Section>

        <Section title="7. Fiyat Değişiklikleri">
          <P>
            Abonelik fiyatlarını ileriye dönük olarak güncelleyebiliriz. Mevcut aboneler için fiyat
            değişiklikleri, makul bir bildirimin ardından bir sonraki yenileme döneminde yürürlüğe girer; bu
            değişikliği kabul etmiyorsanız yenilemeden önce iptal edebilirsiniz.
          </P>
        </Section>

        <Section title="8. İletişim">
          <P>
            İptal ve iade talepleriniz ya da sorularınız için:{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="hover:underline" style={{ color: 'var(--accent)' }}>
              {CONTACT_EMAIL}
            </a>
            .
          </P>
        </Section>

        <p className="mt-10 border-t pt-4 text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}>
          Bu metin bilgilendirme amaçlıdır ve hukuki danışmanlık yerine geçmez. Ticari lansman öncesi bir
          hukuk uzmanına doğrulatılması önerilir.
        </p>
      </article>
      <SiteFooter />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
        {title}
      </h2>
      <div className="mt-2 space-y-3 leading-relaxed" style={{ color: 'var(--text-2)' }}>
        {children}
      </div>
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}
