import type { Metadata } from 'next';
import Link from 'next/link';
import { RoomRedirect } from '@/components/RoomRedirect';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { CadMockup } from '@/components/marketing/CadMockup';
import { DemoVideo } from '@/components/marketing/DemoVideo';

// Hero demo videosu. Boşken DemoVideo dürüst yedeği (CadMockup illüstrasyonu) gösterir.
// Video hazır olunca: '/videos/hero.mp4' yaz (+ poster) — docs/VIDEO-PLAN.md.
const HERO_VIDEO = '';
const HERO_POSTER = '';

export const metadata: Metadata = {
  title: 'Vesna — Tarayıcıda mimari tasarım, m² otomasyonu ve yapay zekâ',
  description:
    'Vesna; tarayıcıda çalışan mimari/iç mimari çizim, otomatik mahal & m² hesabı, Türkçe yönetmelik bilen yapay zekâ asistanı, AI plan üretimi ve render platformu. Kurulum yok, link ile paylaş.',
};

const btnPrimary = {
  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 22px',
  background: 'var(--accent)', color: '#fff', border: '1px solid var(--accent)',
  borderRadius: 11, fontSize: 15, fontWeight: 600, textDecoration: 'none',
} as const;
const btnGhost = {
  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 22px',
  background: 'var(--bg-2)', color: 'var(--text)', border: '1px solid var(--border-2)',
  borderRadius: 11, fontSize: 15, fontWeight: 600, textDecoration: 'none', cursor: 'pointer',
} as const;

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', lineHeight: 1.5 }}>
      <RoomRedirect />
      <SiteHeader />

      <main className="v-fade">
        {/* HERO */}
        <section style={{ position: 'relative', overflow: 'hidden', padding: '0 24px' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(var(--grid) 1px,transparent 1px),linear-gradient(90deg,var(--grid) 1px,transparent 1px)', backgroundSize: '48px 48px', maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%,#000 40%,transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%,#000 40%,transparent 100%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: -120, left: '50%', transform: 'translateX(-50%)', width: 680, height: 420, background: 'radial-gradient(ellipse at center, var(--accent-soft), transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', maxWidth: 880, margin: '0 auto', padding: '88px 0 56px', textAlign: 'center' }}>
            <Link href="/fiyatlandirma" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 13px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 999, fontSize: 13, color: 'var(--text-2)', marginBottom: 28, textDecoration: 'none' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
              Türkçe yönetmelik asistanı — artık canlı
              <span style={{ color: 'var(--text-3)' }}>→</span>
            </Link>
            <h1 style={{ fontSize: 'clamp(2.3rem,5.4vw,4rem)', lineHeight: 1.04, fontWeight: 600, letterSpacing: '-0.035em', margin: '0 0 22px' }}>
              Mimari tasarımı çiz, hesapla ve<br />
              <span style={{ color: 'var(--accent)' }}>yapay zekâ</span> ile üret.
            </h1>
            <p style={{ fontSize: 'clamp(1.02rem,1.6vw,1.22rem)', color: 'var(--text-2)', maxWidth: 640, margin: '0 auto 34px', lineHeight: 1.6 }}>
              Vesna; tarayıcıda çalışan, gerçek zamanlı işbirlikçi bir çizim, mahal/m² otomasyonu ve yapay zekâ tasarım asistanı platformudur. DWG/DXF aç, mahalleri otomatik bul, Türkçe yönetmeliğe danış, tariften plan üret.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
              <Link href="/app" className="v-btn-primary" style={btnPrimary}>Hemen Başla — Ücretsiz</Link>
              <Link href="/#vesna-features" className="v-btn-ghost" style={btnGhost}>Özellikleri gör</Link>
            </div>
          </div>

          {/* Hero medyası: video varsa oynatıcı, yoksa dürüst ürün illüstrasyonu (CadMockup). */}
          <div style={{ position: 'relative', maxWidth: 1060, margin: '0 auto', padding: '0 0 96px' }}>
            <DemoVideo
              mode="player"
              src={HERO_VIDEO || undefined}
              poster={HERO_POSTER || undefined}
              label="Vesna ürün demosu"
              fallback={<CadMockup />}
            />
          </div>
        </section>

        {/* FEATURES */}
        <section id="vesna-features" style={{ maxWidth: 1160, margin: '0 auto', padding: '24px 24px 96px' }}>
          <div style={{ maxWidth: 620, marginBottom: 48 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 14 }}>Tek tuval, baştan sona</div>
            <h2 style={{ fontSize: 'clamp(1.8rem,3.4vw,2.6rem)', fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 14px' }}>Çizimden teslime kadar her şey burada</h2>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-2)', margin: 0, lineHeight: 1.6 }}>Dosyayı aç, mahalleri bul, yönetmeliğe danış, planı üret ve paylaş — araç değiştirmeden, kurulum yapmadan.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 1, background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            {FEATURES.map((f) => (
              <div key={f.title} className="v-card" style={{ background: 'var(--bg-2)', padding: 28 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{f.icon}</svg>
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 8px', letterSpacing: '-0.01em' }}>{f.title}</h3>
                <p style={{ fontSize: '0.94rem', color: 'var(--text-2)', margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* WHY VESNA */}
        <section style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-2)' }}>
          <div style={{ maxWidth: 1160, margin: '0 auto', padding: '80px 24px' }}>
            <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 600, letterSpacing: '-0.03em', margin: '0 0 48px' }}>Neden Vesna</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '40px 32px' }}>
              {WHY.map((w, i) => (
                <div key={w.title}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', marginBottom: 12 }}>{String(i + 1).padStart(2, '0')}</div>
                  <h3 style={{ fontSize: '1.12rem', fontWeight: 600, margin: '0 0 8px', letterSpacing: '-0.01em' }}>{w.title}</h3>
                  <p style={{ fontSize: '0.94rem', color: 'var(--text-2)', margin: 0, lineHeight: 1.6 }}>{w.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section style={{ borderTop: '1px solid var(--border)' }}>
          <div style={{ maxWidth: 1160, margin: '0 auto', padding: 24 }}>
            <div style={{ position: 'relative', overflow: 'hidden', border: '1px solid var(--border)', borderRadius: 20, background: 'var(--bg-2)', padding: '72px 32px', textAlign: 'center' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(var(--grid) 1px,transparent 1px),linear-gradient(90deg,var(--grid) 1px,transparent 1px)', backgroundSize: '40px 40px', maskImage: 'radial-gradient(ellipse 70% 80% at 50% 50%,#000,transparent)', WebkitMaskImage: 'radial-gradient(ellipse 70% 80% at 50% 50%,#000,transparent)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative' }}>
                <h2 style={{ fontSize: 'clamp(1.8rem,3.6vw,2.7rem)', fontWeight: 600, letterSpacing: '-0.03em', margin: '0 0 16px', lineHeight: 1.1 }}>İlk planını bugün üret.</h2>
                <p style={{ fontSize: '1.05rem', color: 'var(--text-2)', maxWidth: 520, margin: '0 auto 30px', lineHeight: 1.6 }}>Ücretsiz başla, kredi kartı gerekmez. Dosyanı aç ve birkaç dakikada mahal listeni çıkar.</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
                  <Link href="/app" className="v-btn-primary" style={btnPrimary}>Hemen Başla — Ücretsiz</Link>
                  <Link href="/fiyatlandirma" className="v-btn-ghost" style={{ ...btnGhost, background: 'transparent' }}>Fiyatları gör</Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

const FEATURES = [
  { title: 'DWG/DXF içe aktarma', desc: 'AutoCAD dosyanı tarayıcıda aç, katmanları tanı, iki nokta + gerçek mesafe ile tek tıkla ölçekle.', icon: <><path d="M12 13V3M8 9l4 4 4-4" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></> },
  { title: 'Otomatik mahal & m²', desc: "Duvarlardan mahalleri otomatik bulur, alanları hesaplar ve mahal listesini Excel'e aktarır.", icon: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></> },
  { title: 'Türkçe yönetmelik asistanı', desc: "İmar, TBDY ve TS 9111'e dayalı, kaynak gösteren öneriler.", icon: <><path d="M12 7v14" /><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" /></> },
  { title: 'Tariften plan üretimi', desc: '"90 m² 3+1 daire" yaz, yapay zekâ yerleşim alternatiflerini saniyeler içinde üretsin.', icon: <path d="M9.9 15.5A2 2 0 0 0 8.5 14L2.4 12.5a.5.5 0 0 1 0-1L8.5 10A2 2 0 0 0 9.9 8.5L11.5 2.4a.5.5 0 0 1 1 0L14 8.5a2 2 0 0 0 1.4 1.4l6.1 1.6a.5.5 0 0 1 0 1L15.5 14a2 2 0 0 0-1.4 1.4l-1.6 6.1a.5.5 0 0 1-1 0z" /> },
  { title: 'Plandan AI render', desc: 'Atmosfer, malzeme ve ışığı tarif et; fotogerçekçi görsel üret.', icon: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" /></> },
  { title: 'Kesit & 3B önizleme', desc: "Kesit çek, planını anında 3B'de incele ve gez.", icon: <><path d="M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5M12 22V12" /></> },
  { title: 'Gerçek zamanlı işbirliği', desc: 'Linki paylaş, aynı çizimde birlikte çalış; imleçler ve yorumlar canlı.', icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></> },
  { title: 'Pafta & dışa aktarma', desc: 'Pafta düzeni, metraj/maliyet ve PDF · PNG · SVG · DXF · Excel çıktısı tek akışta.', icon: <><path d="M14 2v5h5" /><path d="M4 7a2 2 0 0 1 2-2h8l6 6v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" /><path d="m9 14 2 2 4-4" /></> },
  { title: 'Hızlı ve ölçeklenebilir', desc: 'WebGL motoru ile büyük çizimlerde akıcı; kurulum yok.', icon: <path d="M13 2 3 14h9l-1 8 10-12h-9z" /> },
];

const WHY = [
  { title: 'Kurulum yok, her yerde', desc: 'Tarayıcıda açılır; indirme, lisans ve kurulum derdi yok. Mac, Windows, tablet — fark etmez.' },
  { title: "Türkiye'ye özel zekâ", desc: 'İmar yönetmeliği, TBDY ve TS 9111 bilen; kaynak gösteren Türkçe asistan.' },
  { title: 'Çiz + hesapla + üret tek yerde', desc: 'Çizim, mahal/m² otomasyonu ve AI üretim aynı tuvalde; araç değiştirmeden.' },
  { title: 'Verin sende kalır', desc: 'Projeleriniz size ait. Şeffaf gizlilik, dışa aktarma her zaman elinizde.' },
];
