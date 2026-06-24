/**
 * Vesna MARKA işareti (logo) — landing/pazarlama başlıkları için. (Asistan maskotu ayrı: VesnaLogo.)
 * claude.ai/design redesign: stroke-tabanlı, accent renkli 3 minimal varyant. Varsayılan 'v' (stilize
 * V / çatı çizgisi). Logoyu değiştirmek için header/footer'daki `variant`'ı veya buradaki DEFAULT'u
 * değiştirmen yeterli. Saf SVG → her ölçekte keskin, tema accent'iyle uyumlu.
 */
export type LogoVariant = 'v' | 'compass' | 'corner';

/** Tek yerden değiştir: aktif logo varyantı. */
export const DEFAULT_LOGO: LogoVariant = 'v';

export function VesnaMark({
  size = 26,
  variant = DEFAULT_LOGO,
  className,
}: {
  size?: number;
  variant?: LogoVariant;
  className?: string;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 32 32',
    fill: 'none' as const,
    stroke: 'var(--accent)',
    strokeLinejoin: 'round' as const,
    strokeLinecap: 'round' as const,
    className,
    role: 'img',
    'aria-label': 'Vesna',
  };
  if (variant === 'compass') {
    return (
      <svg {...common} strokeWidth="2.4">
        <circle cx="16" cy="7.5" r="2.3" fill="var(--accent)" stroke="none" />
        <path d="M16 9.6 L9 26" />
        <path d="M16 9.6 L23 26" />
        <path d="M12.4 19.5 L19.6 19.5" opacity="0.45" />
      </svg>
    );
  }
  if (variant === 'corner') {
    return (
      <svg {...common} strokeWidth="2.4">
        <path d="M7 13 L7 7 L13 7" />
        <path d="M25 19 L25 25 L19 25" />
        <rect x="13.5" y="13.5" width="5" height="5" rx="1" fill="var(--accent)" stroke="none" />
      </svg>
    );
  }
  // 'v' — stilize V / çatı çizgisi (varsayılan)
  return (
    <svg {...common} strokeWidth="2.6">
      <path d="M5 7 L16 25 L27 7" />
      <path d="M11 7 L16 16 L21 7" opacity="0.45" />
    </svg>
  );
}
