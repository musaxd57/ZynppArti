/**
 * Arki maskotu — inşaat kasklı, gülümseyen dostça bir mimar figürü (pergel DEĞİL, bir KARAKTER).
 * Monokrom (currentColor) → gradient buton/avatar üstünde beyaz okunur; 16–24px'te net.
 */
export function ArkiLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      {/* yüz */}
      <circle cx="12" cy="14.5" r="5.6" fill="currentColor" fillOpacity="0.22" />
      <circle cx="12" cy="14.5" r="5.6" stroke="currentColor" strokeWidth="1.5" />
      {/* gözler */}
      <circle cx="9.9" cy="14" r="0.95" fill="currentColor" />
      <circle cx="14.1" cy="14" r="0.95" fill="currentColor" />
      {/* gülümseme */}
      <path
        d="M9.6 16.8 Q12 18.7 14.4 16.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
      {/* inşaat kaskı (mimari/şantiye göndermesi) */}
      <path d="M5.6 10 a6.4 6 0 0 1 12.8 0 Z" fill="currentColor" />
      <rect x="4" y="9.4" width="16" height="2" rx="1" fill="currentColor" />
      <rect x="11.2" y="4.6" width="1.6" height="2.4" rx="0.8" fill="currentColor" />
    </svg>
  );
}
