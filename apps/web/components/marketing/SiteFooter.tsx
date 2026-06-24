import Link from 'next/link';
import { VesnaMark } from '@/components/VesnaMark';

/** Paylaşılan footer — marka + ürün/yasal linkleri + telif. */
export function SiteFooter() {
  const colTitle = { fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 16 };
  const linkStyle = { fontSize: '0.9rem', textDecoration: 'none' };
  return (
    <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-2)' }}>
      <div
        style={{
          maxWidth: 1160,
          margin: '0 auto',
          padding: '56px 24px 40px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
          gap: 40,
        }}
      >
        <div style={{ maxWidth: 280 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
            <VesnaMark size={26} />
            <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text)' }}>Vesna</span>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-3)', lineHeight: 1.6, margin: 0 }}>
            Tarayıcıda mimari tasarım, hesaplama ve yapay zekâ. Türkiye'deki mimarlar için.
          </p>
        </div>
        <div>
          <div style={colTitle}>Ürün</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            <Link href="/#vesna-features" className="v-footlink" style={linkStyle}>Özellikler</Link>
            <Link href="/fiyatlandirma" className="v-footlink" style={linkStyle}>Fiyatlandırma</Link>
            <Link href="/app" className="v-footlink" style={linkStyle}>Uygulamayı Aç</Link>
          </div>
        </div>
        <div>
          <div style={colTitle}>Yasal</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            <Link href="/gizlilik" className="v-footlink" style={linkStyle}>Gizlilik Politikası</Link>
            <Link href="/kosullar" className="v-footlink" style={linkStyle}>Kullanım Koşulları</Link>
          </div>
        </div>
      </div>
      <div
        style={{
          borderTop: '1px solid var(--border)',
          maxWidth: 1160,
          margin: '0 auto',
          padding: '20px 24px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>© 2026 Vesna. Tüm hakları saklıdır.</span>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>İstanbul, Türkiye 🇹🇷</span>
      </div>
    </footer>
  );
}
