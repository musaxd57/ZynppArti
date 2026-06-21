import type { HatchKind } from '@zynpparti/geometry';

/**
 * Malzeme (zemin kaplaması) kütüphanesi — mahale atanabilir tarama deseni (VISUAL-CRAFT §3).
 * Saf veri: desen (açı/aralık/tür) + çizgi rengi + Türkçe etiket. Geometri `hatchPattern` (geometry)
 * ile çizilir; render engine'dedir. `Space.material` bu id'yi tutar (atanmazsa düz tip-rengi dolgu).
 *
 * Aralık (spacing) dünya birimidir (cm); plan ölçeğinde okunabilir desen sıklığı için seçilmiştir.
 */
export interface Material {
  /** Kararlı anahtar (Space.material'da saklanır). */
  readonly id: string;
  /** Türkçe etiket (panelde gösterilir). */
  readonly label: string;
  /** Tarama çizgisi rengi (0xRRGGBB). */
  readonly color: number;
  /** Çizgi aralığı (cm). */
  readonly spacing: number;
  /** Çizgi açısı (radyan). */
  readonly angle: number;
  readonly kind: HatchKind;
}

const D45 = Math.PI / 4;
const D90 = Math.PI / 2;

/** Malzeme kataloğu — yaygın iç mekân zemin kaplamaları, mimari hatch geleneğine yakın desenlerle. */
export const MATERIALS: readonly Material[] = [
  { id: 'tile', label: 'Fayans / Seramik', color: 0x6fb7c4, spacing: 25, angle: 0, kind: 'cross' },
  { id: 'parquet', label: 'Parke / Ahşap', color: 0xc09356, spacing: 18, angle: 0, kind: 'single' },
  { id: 'laminate', label: 'Laminat', color: 0xbfa06a, spacing: 22, angle: D90, kind: 'single' },
  { id: 'screed', label: 'Şap / Beton', color: 0x9a9a9a, spacing: 45, angle: D45, kind: 'single' },
  { id: 'carpet', label: 'Halı', color: 0x9d8bbf, spacing: 12, angle: D45, kind: 'cross' },
  { id: 'marble', label: 'Mermer', color: 0x8fb0a8, spacing: 60, angle: D90, kind: 'single' },
  { id: 'stone', label: 'Doğal Taş', color: 0x8d8470, spacing: 35, angle: D45, kind: 'cross' },
] as const;

/** Id ile malzemeyi bulur (yoksa undefined → düz dolgu). */
export function materialById(id: string | undefined): Material | undefined {
  return id ? MATERIALS.find((m) => m.id === id) : undefined;
}
