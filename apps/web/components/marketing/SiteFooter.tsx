import Link from 'next/link';
import { VesnaMark } from './VesnaMark';

const LOGO = 'corner' as const;

/** Paylaşılan footer — marka + ürün/yasal linkleri + telif. */
export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-2)]">
      <div className="mx-auto grid max-w-[1160px] grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-10 px-6 pb-10 pt-14">
        <div className="max-w-[280px]">
          <div className="mb-3.5 flex items-center gap-2.5 text-[var(--accent)]">
            <VesnaMark variant={LOGO} size={22} />
            <span className="text-[17px] font-semibold tracking-tight text-[var(--text)]">Vesna</span>
          </div>
          <p className="text-[0.88rem] leading-relaxed text-[var(--text-3)]">
            Tarayıcıda mimari tasarım, hesaplama ve yapay zekâ. Türkiye&apos;deki mimarlar için.
          </p>
        </div>

        <div>
          <div className="mb-4 text-[0.8rem] font-semibold uppercase tracking-wider text-[var(--text)]">Ürün</div>
          <div className="flex flex-col gap-2.5 text-[0.9rem] text-[var(--text-2)]">
            <Link href="/#ozellikler" className="transition hover:text-[var(--text)]">Özellikler</Link>
            <Link href="/fiyatlandirma" className="transition hover:text-[var(--text)]">Fiyatlandırma</Link>
            <Link href="/app" className="transition hover:text-[var(--text)]">Uygulamayı Aç</Link>
          </div>
        </div>

        <div>
          <div className="mb-4 text-[0.8rem] font-semibold uppercase tracking-wider text-[var(--text)]">Yasal</div>
          <div className="flex flex-col gap-2.5 text-[0.9rem] text-[var(--text-2)]">
            <Link href="/gizlilik" className="transition hover:text-[var(--text)]">Gizlilik Politikası</Link>
            <Link href="/kosullar" className="transition hover:text-[var(--text)]">Kullanım Koşulları</Link>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] px-6 py-5">
        <span className="text-[0.82rem] text-[var(--text-3)]">© 2026 Vesna. Tüm hakları saklıdır.</span>
        <span className="text-[0.82rem] text-[var(--text-3)]">İstanbul, Türkiye 🇹🇷</span>
      </div>
    </footer>
  );
}

export default SiteFooter;
