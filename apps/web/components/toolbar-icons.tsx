import {
  MousePointer2,
  DoorOpen,
  Ruler,
  Type,
  FileText,
  Eraser,
  Scaling,
  Armchair,
  type LucideIcon,
} from 'lucide-react';
import type { ToolName } from '@zynpparti/tools';

/**
 * Araç çubuğu ikonları (redesign spec §3): tek ikon ailesi = Lucide. CAD'e özel olup Lucide'de
 * iyi karşılığı olmayan araçlar (duvar/pencere/parsel/kesit) Lucide stilinde (24 viewBox, stroke
 * currentColor 1.75, round) ÖZEL çizildi.
 */
type IconProps = { className?: string };

function svg(children: React.ReactNode): (p: IconProps) => React.ReactElement {
  return ({ className }: IconProps) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

// Duvar — tuğla dizisi (masonry).
const WallIcon = svg(
  <>
    <rect x="3" y="9" width="18" height="6" rx="0.5" />
    <path d="M3 12h18M9 9v3M15 12v3M9 12v-3" />
  </>,
);
// Pencere — çerçeve + kayıt (mullion).
const WindowIcon = svg(
  <>
    <rect x="4" y="4" width="16" height="16" rx="1" />
    <path d="M12 4v16M4 12h16" />
  </>,
);
// Parsel — kesik (dashed) arsa sınırı.
const ParcelIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
    <rect x="3.5" y="3.5" width="17" height="17" rx="1" strokeDasharray="3 2.5" />
  </svg>
);
// Kesit — kesme düzlemi çizgisi + yön oku.
const SectionIcon = svg(
  <>
    <path d="M12 3v18" strokeDasharray="2.5 2.5" />
    <path d="M8.5 6.5 12 3l3.5 3.5" />
  </>,
);

export const TOOL_ICONS: Record<ToolName, LucideIcon | ((p: IconProps) => React.ReactElement)> = {
  select: MousePointer2,
  wall: WallIcon,
  door: DoorOpen,
  window: WindowIcon,
  dimension: Ruler,
  parcel: ParcelIcon,
  annotation: Type,
  sheet: FileText,
  section: SectionIcon,
  erase: Eraser,
  calibrate: Scaling,
  block: Armchair,
};
