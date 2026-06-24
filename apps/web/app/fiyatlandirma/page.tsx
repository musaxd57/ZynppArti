import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Fiyatlandırma — Vesna',
  description: 'Vesna fiyatlandırma planları: Ücretsiz, Pro ve Stüdyo. Çizim ücretsiz; yapay zekâ kotalı.',
};

/**
 * Fiyatlandırma sayfası (pazarlama). Rakamlar docs/BUSINESS-PRICING.md önerisidir (Moses onayı bekler).
 * Gerçek checkout (Paddle) auth'tan SONRA gelir → ücretli planlarda şimdilik "Yakında". Ücretsiz → /app.
 */
export default function Fiyatlandirma() {
  return (
    <main style={{ background: 'var(--surface-0, #0E0E10)', color: 'var(--text-1, #e8e8ea)' }}>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <span
            className="grid h-8 w-8 place-items-center rounded-lg font-bold text-white"
            style={{ background: 'var(--accent, #5B5BD6)' }}
          >
            V
          </span>
          <span className="text-lg font-semibold">Vesna</span>
        </Link>
        <Link
          href="/app"
          className="rounded-md px-4 py-1.5 font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: 'var(--accent, #5B5BD6)' }}
        >
          Uygulamayı Aç
        </Link>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-8 pt-10 text-center">
        <h1 className="text-3xl font-semibold sm:text-4xl">Basit, adil fiyatlandırma</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg" style={{ color: 'var(--text-2, #c4c4ca)' }}>
          Çizim, içe/dışa aktarma ve mahal/m² <strong>ücretsiz</strong>. Yalnızca yapay zekâyı yoğun
          kullanırsan üst plana geçersin. Hesap gerekmeden hemen başlayabilirsin.
        </p>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-6 pb-16 lg:grid-cols-3">
        {PLANS.map((p) => (
          <Plan key={p.name} {...p} />
        ))}
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-20">
        <h2 className="text-center text-2xl font-semibold">Sık sorulanlar</h2>
        <div className="mt-6 space-y-4">
          {FAQ.map((f) => (
            <div key={f.q} className="rounded-xl p-5" style={{ background: 'var(--surface-1, #151518)' }}>
              <h3 className="font-semibold">{f.q}</h3>
              <p className="mt-1.5 text-sm" style={{ color: 'var(--text-2, #c4c4ca)' }}>{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <footer
        className="border-t px-6 py-8"
        style={{ borderColor: 'var(--border-hair, #2a2a30)', color: 'var(--text-3, #9a9aa2)' }}
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm sm:flex-row">
          <span>© 2026 Vesna · vesna.design</span>
          <nav className="flex items-center gap-5">
            <Link href="/" className="hover:underline">Ana sayfa</Link>
            <Link href="/app" className="hover:underline">Uygulama</Link>
            <Link href="/gizlilik" className="hover:underline">Gizlilik</Link>
            <Link href="/kosullar" className="hover:underline">Koşullar</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}

function Plan({
  name,
  price,
  period,
  desc,
  features,
  cta,
  href,
  highlighted,
  soon,
}: (typeof PLANS)[number]) {
  return (
    <div
      className="flex flex-col rounded-2xl p-6"
      style={{
        background: highlighted ? 'var(--surface-2, #1c1c22)' : 'var(--surface-1, #151518)',
        boxShadow: highlighted
          ? 'inset 0 0 0 1.5px var(--accent, #5B5BD6)'
          : 'inset 0 0 0 1px var(--border-hair, #2a2a30)',
      }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{name}</h3>
        {highlighted && (
          <span className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white" style={{ background: 'var(--accent, #5B5BD6)' }}>
            Popüler
          </span>
        )}
        {soon && (
          <span className="rounded-full px-2.5 py-0.5 text-xs" style={{ background: 'var(--surface-3, #26262e)', color: 'var(--text-2, #c4c4ca)' }}>
            Yakında
          </span>
        )}
      </div>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-3xl font-semibold">{price}</span>
        {period && <span className="text-sm" style={{ color: 'var(--text-3, #9a9aa2)' }}>{period}</span>}
      </div>
      <p className="mt-2 text-sm" style={{ color: 'var(--text-2, #c4c4ca)' }}>{desc}</p>

      <ul className="mt-5 flex-1 space-y-2 text-sm" style={{ color: 'var(--text-2, #c4c4ca)' }}>
        {features.map((f) => (
          <li key={f} className="flex gap-2">
            <span style={{ color: 'var(--accent-text, #a5a5ff)' }}>✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {soon ? (
        <span
          className="mt-6 cursor-default rounded-lg px-4 py-2.5 text-center text-sm font-semibold"
          style={{ background: 'var(--surface-3, #26262e)', color: 'var(--text-3, #9a9aa2)' }}
        >
          {cta}
        </span>
      ) : (
        <Link
          href={href}
          className="mt-6 rounded-lg px-4 py-2.5 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: 'var(--accent, #5B5BD6)' }}
        >
          {cta}
        </Link>
      )}
    </div>
  );
}

const PLANS = [
  {
    name: 'Ücretsiz',
    price: '₺0',
    period: '',
    desc: 'Başlamak ve bireysel kullanım için.',
    features: [
      'Sınırsız çizim ve proje',
      'DXF/DWG içe aktarma + ölçekleme',
      'Otomatik mahal & m² + Excel',
      'PDF · PNG · SVG · DXF dışa aktarma',
      'AI Sor: 20 mesaj/ay',
      'AI Çiz: 3 plan/ay',
      'Canlı işbirliği: 1 oda',
    ],
    cta: 'Ücretsiz Başla',
    href: '/app',
    highlighted: false,
    soon: false,
  },
  {
    name: 'Pro',
    price: '~$12',
    period: '/ay',
    desc: 'Aktif çalışan mimar ve serbest tasarımcı için.',
    features: [
      'Ücretsiz’deki her şey',
      'AI Sor: 500 mesaj/ay',
      'AI Çiz: 100 plan/ay',
      'AI Render: 20 görsel/ay',
      'Sınırsız canlı işbirliği',
      'Öncelikli hız',
    ],
    cta: 'Yakında',
    href: '/app',
    highlighted: true,
    soon: true,
  },
  {
    name: 'Stüdyo',
    price: '~$29',
    period: '/ay',
    desc: 'Ofis ve ekipler için.',
    features: [
      'Pro’daki her şey',
      'AI Sor & Çiz: sınırsız',
      'AI Render: 80 görsel/ay',
      'Ekip: 3 koltuk',
      'Öncelikli destek',
      'Ek render için kredi paketi',
    ],
    cta: 'Yakında',
    href: '/app',
    highlighted: false,
    soon: true,
  },
] as const;

const FAQ = [
  {
    q: 'Ücretsiz planda neler var?',
    a: 'Çizim, DXF/DWG içe aktarma, otomatik mahal/m², metraj ve tüm dışa aktarma biçimleri ücretsizdir. Yapay zekâ özellikleri aylık sınırlı kotayla denenebilir.',
  },
  {
    q: 'Neden yapay zekâ kotalı?',
    a: 'Yapay zekâ yanıtları ve görsel üretimi gerçek bir işlem maliyeti taşır. Bu maliyeti adil paylaşmak için AI kullanımını kotaladık; çoğu kullanıcı kota içinde kalır.',
  },
  {
    q: 'Ücretli planlar ne zaman?',
    a: 'Pro ve Stüdyo yakında açılıyor. Şimdilik ücretsiz başlayabilir, tüm temel özellikleri kullanabilirsiniz.',
  },
  {
    q: 'Verilerim güvende mi?',
    a: 'Çizimleriniz cihazınızda kalır; sunucularımızda kalıcı saklanmaz. Ayrıntı için Gizlilik Politikası sayfamıza bakın.',
  },
] as const;
