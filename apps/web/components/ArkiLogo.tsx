/**
 * Arki maskotu (redesign spec §5) — daire-tabanlı, büyük gözlü, gülümseyen dostça mimar figürü;
 * tek mimari aksesuar = yuvarlatılmış inşaat bareti (pergel/cetvel DEĞİL). Gövde `currentColor`
 * (kapsayanın rengine uyar: accent buton üstünde beyaz okunur), baret/yanak amber (sıcaklık),
 * gözler/gülümseme koyu. 16px'te bile tanınır.
 */
export function ArkiLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      {/* gövde/kafa */}
      <circle cx="12" cy="13" r="8" fill="currentColor" />
      {/* baret kubbe + ön siper (amber sıcaklık) */}
      <path d="M4.5 9.5a7.5 7.5 0 0 1 15 0Z" fill="var(--arki-warm, #ffb454)" />
      <rect x="3.4" y="9" width="17.2" height="1.7" rx="0.85" fill="var(--arki-warm, #ffb454)" />
      <rect x="11.2" y="3.6" width="1.6" height="2.2" rx="0.8" fill="var(--arki-warm, #ffb454)" />
      {/* gözler (nokta) + gülümseme */}
      <circle cx="9.3" cy="13.3" r="1.25" fill="#15171c" />
      <circle cx="14.7" cy="13.3" r="1.25" fill="#15171c" />
      <path d="M9.5 16.4q2.5 2 5 0" stroke="#15171c" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      {/* yanak blush */}
      <circle cx="8" cy="15.4" r="1" fill="var(--arki-warm, #ffb454)" opacity="0.4" />
    </svg>
  );
}
