import type { Metadata } from 'next';
import Link from 'next/link';
import { RoomRedirect } from '@/components/RoomRedirect';
import { AuthButtons } from '@/components/AuthButtons';

// Clerk anahtarı varsa giriş/kayıt butonları gösterilir (yoksa gizli — anonim akış aynen çalışır).
const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export const metadata: Metadata = {
  title: 'Vesna — Tarayıcıda mimari tasarım, m² otomasyonu ve yapay zekâ',
  description:
    'Vesna; tarayıcıda çalışan mimari/iç mimari çizim, otomatik mahal & m² hesabı, Türkçe yönetmelik bilen yapay zekâ asistanı, AI plan üretimi ve render platformu. Kurulum yok, link ile paylaş.',
};

/** Ana tanıtım/landing sayfası (satış yüzü). Uygulama `/app`'te. Statik server component → hızlı + SEO. */
export default function Landing() {
  return (
    <main style={{ background: 'var(--surface-0, #0E0E10)', color: 'var(--text-1, #e8e8ea)' }}>
      <RoomRedirect />
      {/* Üst bar */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <span
            className="grid h-8 w-8 place-items-center rounded-lg font-bold text-white"
            style={{ background: 'var(--accent, #5B5BD6)' }}
          >
            V
          </span>
          <span className="text-lg font-semibold">Vesna</span>
        </div>
        <nav className="flex items-center gap-5 text-sm" style={{ color: 'var(--text-2, #c4c4ca)' }}>
          <a href="#ozellikler" className="hidden hover:underline sm:inline">Özellikler</a>
          <a href="#neden" className="hidden hover:underline sm:inline">Neden Vesna</a>
          <Link href="/fiyatlandirma" className="hidden hover:underline sm:inline">Fiyatlar</Link>
          {clerkEnabled && <AuthButtons />}
          <Link
            href="/app"
            className="rounded-md px-4 py-1.5 font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--accent, #5B5BD6)' }}
          >
            Uygulamayı Aç
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-12 text-center sm:pt-20">
        <span
          className="inline-block rounded-full px-3 py-1 text-xs"
          style={{ background: 'var(--surface-2, #1c1c22)', color: 'var(--accent-text, #a5a5ff)' }}
        >
          Tarayıcıda çalışır · Kurulum yok · Link ile paylaş
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
          Mimari tasarımı çiz, <span style={{ color: 'var(--accent-text, #a5a5ff)' }}>hesapla</span> ve yapay zekâ ile{' '}
          <span style={{ color: 'var(--accent-text, #a5a5ff)' }}>üret</span>.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg" style={{ color: 'var(--text-2, #c4c4ca)' }}>
          Vesna; tarayıcıda çalışan, gerçek zamanlı işbirlikçi bir çizim, mahal/m² otomasyonu ve yapay zekâ
          tasarım asistanı platformudur. DWG/DXF aç, mahalleri otomatik bul, Türkçe yönetmeliğe danış,
          tariften plan ürettir.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/app"
            className="rounded-lg px-6 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--accent, #5B5BD6)' }}
          >
            Hemen Başla — Ücretsiz
          </Link>
          <a
            href="#ozellikler"
            className="rounded-lg px-6 py-3 text-base font-medium transition-colors hover:bg-[var(--surface-2,#1c1c22)]"
            style={{ color: 'var(--text-1, #e8e8ea)', boxShadow: 'inset 0 0 0 1px var(--border-soft, #2a2a30)' }}
          >
            Özellikleri gör
          </a>
        </div>
        <p className="mt-4 text-xs" style={{ color: 'var(--text-3, #9a9aa2)' }}>
          Hesap gerekmez · Çizimleriniz cihazınızda kalır
        </p>
      </section>

      {/* Özellikler */}
      <section id="ozellikler" className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-center text-2xl font-semibold sm:text-3xl">Tek araçta, baştan sona</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center" style={{ color: 'var(--text-2, #c4c4ca)' }}>
          AutoCAD’in çizimini, hesap tablosunun metrajını ve bir tasarım asistanının zekâsını bir araya getirir.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Feature key={f.title} icon={f.icon} title={f.title} desc={f.desc} />
          ))}
        </div>
      </section>

      {/* Neden Vesna */}
      <section id="neden" className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded-2xl p-8 sm:p-12" style={{ background: 'var(--surface-1, #151518)' }}>
          <h2 className="text-2xl font-semibold sm:text-3xl">Neden Vesna?</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {REASONS.map((r) => (
              <div key={r.title}>
                <h3 className="font-semibold" style={{ color: 'var(--accent-text, #a5a5ff)' }}>{r.title}</h3>
                <p className="mt-1 text-sm" style={{ color: 'var(--text-2, #c4c4ca)' }}>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA alt */}
      <section className="mx-auto max-w-6xl px-6 py-16 text-center">
        <h2 className="text-2xl font-semibold sm:text-3xl">Birkaç saniyede başla</h2>
        <p className="mx-auto mt-3 max-w-xl" style={{ color: 'var(--text-2, #c4c4ca)' }}>
          İndirme yok, kurulum yok. Tarayıcını aç, çizmeye başla.
        </p>
        <Link
          href="/app"
          className="mt-7 inline-block rounded-lg px-8 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: 'var(--accent, #5B5BD6)' }}
        >
          Uygulamayı Aç
        </Link>
      </section>

      {/* Footer */}
      <footer
        className="border-t px-6 py-8"
        style={{ borderColor: 'var(--border-hair, #2a2a30)', color: 'var(--text-3, #9a9aa2)' }}
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm sm:flex-row">
          <span>© 2026 Vesna · vesna.design</span>
          <nav className="flex items-center gap-5">
            <Link href="/app" className="hover:underline">Uygulama</Link>
            <Link href="/fiyatlandirma" className="hover:underline">Fiyatlar</Link>
            <Link href="/gizlilik" className="hover:underline">Gizlilik</Link>
            <Link href="/kosullar" className="hover:underline">Kullanım Koşulları</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}

function Feature({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div
      className="rounded-xl p-5 transition-colors"
      style={{ background: 'var(--surface-1, #151518)', boxShadow: 'inset 0 0 0 1px var(--border-hair, #2a2a30)' }}
    >
      <div className="text-2xl">{icon}</div>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm" style={{ color: 'var(--text-2, #c4c4ca)' }}>{desc}</p>
    </div>
  );
}

const FEATURES = [
  {
    icon: '📐',
    title: 'DWG/DXF içe aktarma',
    desc: 'AutoCAD dosyanı tarayıcıda aç, katmanları tanı, iki nokta + gerçek mesafe ile tek tıkla ölçekle.',
  },
  {
    icon: '📊',
    title: 'Otomatik mahal & m²',
    desc: 'Duvarlardan mahalleri otomatik bulur, canlı m² hesaplar, oda listesini Excel’e aktarır.',
  },
  {
    icon: '🤖',
    title: 'Türkçe yönetmelik asistanı',
    desc: 'İmar, TBDY ve TS 9111’e dayalı, kaynak gösteren öneriler. Palavra değil; atıflı uyarılar.',
  },
  {
    icon: '✏️',
    title: 'Tariften plan üretimi',
    desc: '“90 m² 3+1 daire” yaz, yapay zekâ taslak kat planını çizsin — geri alınabilir, düzenlenebilir.',
  },
  {
    icon: '🖼️',
    title: 'Plandan AI render',
    desc: 'Atmosfer, malzeme ve ışığı tarif et; planından fotogerçekçi görsel üret.',
  },
  {
    icon: '✂️',
    title: 'Kesit & 3B önizleme',
    desc: 'Kesit çizgisi çek, şematik kesiti gör; planını anında 3B’de incele.',
  },
  {
    icon: '👥',
    title: 'Gerçek zamanlı işbirliği',
    desc: 'Linki paylaş, aynı çizimde birlikte çalışın. İmleçler, seçimler ve yorumlar canlı.',
  },
  {
    icon: '🗂️',
    title: 'Pafta & dışa aktarma',
    desc: 'Pafta düzeni, metraj/maliyet ve PDF · PNG · SVG · DXF · Excel çıktıları.',
  },
  {
    icon: '⚡',
    title: 'Hızlı ve ölçeklenebilir',
    desc: 'WebGL motoru ile büyük çizimlerde akıcı; kurulum yok, her şey tarayıcıda.',
  },
];

const REASONS = [
  {
    title: 'Kurulum yok, her yerde',
    desc: 'Tek ortak payda tarayıcı. Mac, Windows, tablet — indirme/lisans derdi olmadan aç ve çiz.',
  },
  {
    title: 'Türkiye’ye özel zekâ',
    desc: 'Türkçe yönetmelik bilgisi (İmar/TBDY/TS 9111) yerli mimar için gerçek bir fark yaratır.',
  },
  {
    title: 'Çiz + hesapla + üret, tek yerde',
    desc: 'Ayrı çizim, hesap tablosu ve sunum araçları arasında gidip gelmeyi bırak.',
  },
  {
    title: 'Verin sende kalır',
    desc: 'Çizimlerin cihazında tutulur; hesap zorunluluğu yok. İstersen linkle paylaşırsın.',
  },
];
