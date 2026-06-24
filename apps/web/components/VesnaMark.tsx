/**
 * Vesna MARKA işareti (logo) — landing/pazarlama başlıkları için. (Asistan maskotu ayrı: VesnaLogo.)
 * Mimari/blueprint hissi: iris degrade yuvarlatılmış kare + stilize "V" (pergel/çatı: iki keskin çizgi
 * tabanda buluşur) + ince zemin çizgisi + tepe noktası. Saf SVG → her ölçekte keskin.
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
        <linearGradient id="vesna-mark-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7B78F2" />
          <stop offset="1" stopColor="#4B45C7" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8.5" fill="url(#vesna-mark-grad)" />
      {/* Stilize V — pergel/çatı: iki çizgi tabanda buluşur */}
      <path
        d="M8.5 8.5 L16 22.5 L23.5 8.5"
        stroke="white"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Zemin/plan çizgisi — mimari ima, ince + yarı saydam */}
      <path d="M11 13.4 L21 13.4" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      {/* Tepe noktası — pergel ucu vurgusu */}
      <circle cx="16" cy="6.6" r="1.5" fill="white" opacity="0.9" />
    </svg>
  );
}
