import type { SVGProps } from "react";

export type LogoVariant = "v" | "compass" | "corner";

/**
 * Vesna logo işareti. Kullanıcı seçimi: "corner" (Blueprint Köşe).
 * Renk currentColor'dan gelir — sarmalayıcıya `text-[var(--accent)]` verin.
 */
export function VesnaMark({
  variant = "corner",
  size = 26,
  ...props
}: { variant?: LogoVariant; size?: number } & SVGProps<SVGSVGElement>) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 32 32",
    fill: "none",
    stroke: "currentColor",
    strokeLinejoin: "round" as const,
    strokeLinecap: "round" as const,
    ...props,
  };

  if (variant === "v") {
    return (
      <svg {...common} strokeWidth={2.6}>
        <path d="M5 7 L16 25 L27 7" />
        <path d="M11 7 L16 16 L21 7" opacity={0.45} />
      </svg>
    );
  }
  if (variant === "compass") {
    return (
      <svg {...common} strokeWidth={2.4}>
        <circle cx="16" cy="7.5" r="2.3" fill="currentColor" stroke="none" />
        <path d="M16 9.6 L9 26" />
        <path d="M16 9.6 L23 26" />
        <path d="M12.4 19.5 L19.6 19.5" opacity={0.45} />
      </svg>
    );
  }
  // corner — Blueprint Köşe (varsayılan)
  return (
    <svg {...common} strokeWidth={2.4}>
      <path d="M7 13 L7 7 L13 7" />
      <path d="M25 19 L25 25 L19 25" />
      <rect x="13.5" y="13.5" width="5" height="5" rx="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** İşaret + "Vesna" wordmark. */
export function VesnaWordmark({
  variant = "corner",
  size = 26,
}: {
  variant?: LogoVariant;
  size?: number;
}) {
  return (
    <span className="flex items-center gap-2.5 text-[var(--accent)]">
      <VesnaMark variant={variant} size={size} />
      <span className="text-[19px] font-semibold tracking-tight text-[var(--text)]">Vesna</span>
    </span>
  );
}

export default VesnaMark;
