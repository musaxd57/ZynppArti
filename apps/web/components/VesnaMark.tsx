/**
 * Vesna MARKA işareti (logo) — landing/pazarlama başlıkları için. (Asistan maskotu ayrı: VesnaLogo.)
 * MİNİMAL/premium: iris degrade yuvarlatılmış kare + tek temiz, kalın "V" (dağınık öğe yok). Linear/
 * Vercel/Stripe çizgisinde sade monogram. Saf SVG → her ölçekte keskin.
 */
export function VesnaMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      role="img"
      aria-label="Vesna"
    >
      <defs>
        <linearGradient id="vesna-mark-grad" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8A87F5" />
          <stop offset="1" stopColor="#4F49CC" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#vesna-mark-grad)" />
      {/* Tek temiz V — keskin, dengeli, dolu uçlar */}
      <path
        d="M9 9.5 L16 22 L23 9.5"
        stroke="white"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
