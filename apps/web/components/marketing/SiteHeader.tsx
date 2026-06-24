import Link from 'next/link';
import { VesnaWordmark } from './VesnaMark';
import ThemeToggle from './ThemeToggle';
import { AuthButtons } from '@/components/AuthButtons';

const LOGO = 'corner' as const; // Kullanıcı seçimi: Blueprint Köşe

// Clerk anahtarı varsa giriş/kayıt butonları gösterilir (yoksa gizli — anonim akış aynen çalışır).
const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/** Paylaşılan üst bar (cam efekt) — logo, nav, tema, Clerk girişi, "Uygulamayı Aç". */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-glass)] backdrop-blur-[14px] backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-[1160px] items-center justify-between gap-4 px-6">
        <Link href="/" aria-label="Vesna ana sayfa">
          <VesnaWordmark variant={LOGO} />
        </Link>

        <nav className="hidden items-center gap-1.5 sm:flex">
          <Link href="/#ozellikler" className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-2)] transition hover:text-[var(--text)]">
            Özellikler
          </Link>
          <Link href="/fiyatlandirma" className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-2)] transition hover:text-[var(--text)]">
            Fiyatlandırma
          </Link>
        </nav>

        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          {clerkEnabled && <AuthButtons />}
          <Link
            href="/app"
            className="inline-flex items-center gap-1.5 rounded-[10px] border border-[var(--accent)] bg-[var(--accent)] px-[15px] py-[9px] text-sm font-semibold text-white transition hover:-translate-y-px hover:bg-[var(--accent-2)]"
          >
            Uygulamayı Aç
          </Link>
        </div>
      </div>
    </header>
  );
}

export default SiteHeader;
