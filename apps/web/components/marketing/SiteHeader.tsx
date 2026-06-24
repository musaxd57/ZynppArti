import Link from 'next/link';
import { VesnaMark } from '@/components/VesnaMark';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AuthButtons } from '@/components/AuthButtons';

// Clerk anahtarı varsa giriş/kayıt butonları gösterilir (yoksa gizli — anonim akış aynen çalışır).
const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/** Paylaşılan üst bar — cam efekt, logo, nav, tema değiştirici, Clerk girişi, "Uygulamayı Aç". */
export function SiteHeader() {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'saturate(180%) blur(14px)',
        WebkitBackdropFilter: 'saturate(180%) blur(14px)',
        background: 'var(--bg-glass)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          maxWidth: 1160,
          margin: '0 auto',
          padding: '0 24px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <Link href="/" aria-label="Vesna ana sayfa" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--text)' }}>
          <VesnaMark size={26} />
          <span style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.02em' }}>Vesna</span>
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Link href="/#vesna-features" className="v-navlink" style={{ fontSize: 14, fontWeight: 500, padding: '8px 12px', borderRadius: 8, textDecoration: 'none' }}>
            Özellikler
          </Link>
          <Link href="/fiyatlandirma" className="v-navlink" style={{ fontSize: 14, fontWeight: 500, padding: '8px 12px', borderRadius: 8, textDecoration: 'none' }}>
            Fiyatlandırma
          </Link>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ThemeToggle />
          {clerkEnabled && <AuthButtons />}
          <Link
            href="/app"
            className="v-btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '9px 15px',
              background: 'var(--accent)',
              color: '#fff',
              border: '1px solid var(--accent)',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Uygulamayı Aç
          </Link>
        </div>
      </div>
    </header>
  );
}
