import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';

export const metadata: Metadata = {
  title: 'Fiyatlandırma — Vesna',
  description: 'Vesna fiyatlandırma planları: Ücretsiz, Pro ve Stüdyo. Çizim ücretsiz; yapay zekâ kotalı.',
};

export default function Fiyatlandirma() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', lineHeight: 1.5 }}>
      <SiteHeader />
      <main className="v-fade">
        <section style={{ maxWidth: 1160, margin: '0 auto', padding: '80px 24px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 14 }}>Fiyatlandırma</div>
          <h1 style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 600, letterSpacing: '-0.03em', margin: '0 0 16px' }}>Projene göre ölçeklenen planlar</h1>
          <p style={{ fontSize: '1.08rem', color: 'var(--text-2)', maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>Ücretsiz keşfet, ekibinle büyü. İstediğin zaman yükselt veya iptal et.</p>
        </section>

        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20, alignItems: 'start' }}>
            {TIERS.map((t) => (
              <div
                key={t.name}
                style={{
                  position: 'relative',
                  border: t.popular ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                  borderRadius: 18,
                  background: 'var(--bg-2)',
                  padding: 32,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 24,
                  boxShadow: t.popular ? '0 0 0 4px var(--accent-soft)' : 'none',
                }}
              >
                {t.popular && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 600, padding: '4px 13px', borderRadius: 999 }}>Popüler</div>
                )}
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 6 }}>{t.name}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-2)' }}>{t.tagline}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: '2.6rem', fontWeight: 600, letterSpacing: '-0.03em' }}>{t.price}</span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-3)' }}>{t.period}</span>
                </div>
                <Link
                  href="/app"
                  className={t.popular ? 'v-btn-primary' : 'v-btn-ghost'}
                  style={{
                    textAlign: 'center', padding: 11, borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none',
                    background: t.popular ? 'var(--accent)' : 'var(--bg-3)',
                    color: t.popular ? '#fff' : 'var(--text)',
                    border: t.popular ? '1px solid var(--accent)' : '1px solid var(--border-2)',
                  }}
                >
                  {t.cta}
                </Link>
                <div style={{ height: 1, background: 'var(--border)' }} />
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 13, fontSize: '0.92rem', color: 'var(--text-2)' }}>
                  {t.features.map((f) => (
                    <li key={f} style={{ display: 'flex', gap: 10 }}><span style={{ color: 'var(--accent)', flexShrink: 0 }}>✓</span>{f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-3)', marginTop: 28 }}>
            Ücretli planlar yakında açılıyor — şimdilik ücretsiz başlayabilirsin. Fiyatlar Paddle üzerinden faturalandırılır; KDV dahildir.
          </p>
        </section>

        <section style={{ maxWidth: 760, margin: '0 auto', padding: '72px 24px 96px' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 600, letterSpacing: '-0.03em', margin: '0 0 32px', textAlign: 'center' }}>Sıkça sorulan sorular</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FAQ.map((f) => (
              <details key={f.q} className="v-details" style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-2)' }}>
                <summary style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '18px 20px', fontSize: '1rem', fontWeight: 600, color: 'var(--text)' }}>
                  {f.q}<span style={{ color: 'var(--text-3)', fontSize: '1.3rem', lineHeight: 1 }}>+</span>
                </summary>
                <div style={{ padding: '0 20px 18px', fontSize: '0.94rem', color: 'var(--text-2)', lineHeight: 1.65 }}>{f.a}</div>
              </details>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

const TIERS = [
  {
    name: 'Ücretsiz', tagline: 'Bireysel keşif için.', price: '₺0', period: '/ sonsuza dek', cta: 'Ücretsiz Başla', popular: false,
    features: ['3 aktif proje', 'DWG/DXF içe aktarma', 'Otomatik mahal & m²', 'Temel 3B önizleme', 'AI: aylık deneme kotası'],
  },
  {
    name: 'Pro', tagline: 'Bağımsız mimarlar için.', price: '$12', period: '/ ay', cta: "Pro'ya Geç", popular: true,
    features: ['Sınırsız proje', 'Türkçe yönetmelik asistanı', 'Tariften plan üretimi', 'Plandan AI render (aylık kota)', 'Gerçek zamanlı işbirliği (5 kişi)', 'Pafta & PDF dışa aktarma', 'Öncelikli destek'],
  },
  {
    name: 'Stüdyo', tagline: 'Ekipler ve ofisler için.', price: '$29', period: '/ ay · kullanıcı', cta: "Stüdyo'yu Seç", popular: false,
    features: ["Pro'daki her şey", 'Sınırsız işbirlikçi', 'Yüksek AI render kotası', 'Marka / şablon kütüphanesi', 'Öncelikli destek', 'Özel onboarding'],
  },
];

const FAQ = [
  { q: 'Vesna gerçekten tarayıcıda mı çalışıyor?', a: 'Evet. Hiçbir kurulum, lisans ya da eklenti gerekmez. Modern bir tarayıcı yeterli; çizim motoru WebGL ile cihazında akıcı çalışır.' },
  { q: 'DWG/DXF dosyalarımı içe aktarabilir miyim?', a: 'AutoCAD DWG ve DXF dosyalarını açabilirsin. Katmanlar otomatik tanınır; iki nokta ve gerçek mesafeyle tek tıkla doğru ölçeğe oturtursun.' },
  { q: 'Yapay zekâ önerileri yönetmeliğe uygun mu?', a: 'Asistan; İmar yönetmeliği, TBDY ve TS 9111 gibi kaynaklara dayalı, atıf gösteren öneriler sunar. Nihai sorumluluk projeyi yürüten mimara aittir; öneriler bir karar destek aracıdır.' },
  { q: 'Verilerim güvende mi?', a: 'Çizimleriniz cihazınızda kalır; sunucularımızda kalıcı saklanmaz. Dışa aktarma her zaman açıktır. Ayrıntı için Gizlilik Politikası sayfamıza bakın.' },
  { q: 'Planımı sonradan değiştirebilir veya iptal edebilir miyim?', a: 'Evet, dilediğin zaman yükselt, düşür veya iptal et. İptalde dönem sonuna kadar erişim devam eder, ek ücret alınmaz.' },
];
