/**
 * Duvar yapı malzemesi kütüphanesi — duvara atanabilir (Wall.material). Zemin kaplaması
 * (materials.ts) değil; yapı malzemesi (tuğla/beton/gazbeton…). Saf veri: id + Türkçe etiket +
 * yoğunluk (kg/m³, kaba ağırlık/metraj tahmini için). Atanmazsa "belirsiz".
 */
export interface WallMaterial {
  readonly id: string;
  readonly label: string;
  /** Yoğunluk (kg/m³) — kaba ağırlık tahmini için. */
  readonly densityKgM3: number;
}

export const WALL_MATERIALS: readonly WallMaterial[] = [
  { id: 'brick', label: 'Tuğla', densityKgM3: 1800 },
  { id: 'aerated', label: 'Gazbeton', densityKgM3: 600 },
  { id: 'concrete', label: 'Betonarme', densityKgM3: 2400 },
  { id: 'briquette', label: 'Bims/Briket', densityKgM3: 900 },
  { id: 'drywall', label: 'Alçıpan', densityKgM3: 800 },
  { id: 'wood', label: 'Ahşap', densityKgM3: 600 },
] as const;

/** Id ile duvar malzemesini bulur (yoksa undefined). */
export function wallMaterialById(id: string | undefined): WallMaterial | undefined {
  return id ? WALL_MATERIALS.find((m) => m.id === id) : undefined;
}
