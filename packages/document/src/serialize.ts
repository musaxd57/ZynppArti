import type { Entity, EntityType } from './entities';
import { BLOCK_DEFS } from './block';
import { SHEET_SIZES } from './sheet';

/**
 * Model serileştirme (saf TS) — tüm çizimi tek JSON dosyasına yazar/okur. Kalıcılık çekirdeği:
 * istemci "Kaydet/Aç" buradan geçer; ileride backend (model = dosya, CLAUDE.md §6.5) **aynı** kodu
 * kullanır. Versiyonlu zarf → ileride lazy migration (eski formatı güncel formata taşıma) eklenebilir.
 *
 * React/DOM yok — saf veri dönüşümü (ADR-0002).
 */

/** Geçerli zarf formatı sürümü. Format değişirse artırılır + migration eklenir. */
export const MODEL_FORMAT_VERSION = 1;

export interface ModelFile {
  readonly format: 'zynpparti-model';
  readonly version: number;
  readonly entities: readonly Entity[];
}

const VALID_TYPES: ReadonlySet<EntityType> = new Set<EntityType>([
  'wall',
  'space',
  'opening',
  'dimension',
  'parcel',
  'block',
  'annotation',
  'sheet',
  'section',
  'comment',
]);

/** Entity'leri kararlı JSON metnine yazar (girintili, okunabilir). */
export function serializeModel(entities: readonly Entity[]): string {
  const file: ModelFile = {
    format: 'zynpparti-model',
    version: MODEL_FORMAT_VERSION,
    entities,
  };
  return JSON.stringify(file, null, 2);
}

/**
 * JSON metnini entity listesine çözer. Zarf geçersizse (bozuk JSON / yanlış format) hata fırlatır;
 * tek tek geçersiz/bilinmeyen entity'ler **atlanır** (toleranslı — kısmi bozulma tüm dosyayı düşürmez).
 */
export function deserializeModel(json: string): Entity[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Model dosyası okunamadı (geçersiz JSON).');
  }
  if (!isRecord(parsed) || parsed['format'] !== 'zynpparti-model' || !Array.isArray(parsed['entities'])) {
    throw new Error('Model dosyası tanınmadı (zynpparti-model değil).');
  }
  const out: Entity[] = [];
  let skipped = 0;
  for (const raw of parsed['entities']) {
    if (isValidEntity(raw)) out.push(raw);
    else skipped++;
  }
  // Atlanan entity'ler sessizce kaybolmasın — bozuk/elle-düzenlenmiş dosya teşhisi için logla.
  if (skipped > 0) console.warn(`deserializeModel: ${skipped} geçersiz entity atlandı (bozuk alan).`);
  return out;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function isFiniteNum(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

/** Geçerli {x,y} — ikisi de sonlu sayı (NaN/Infinity koordinat indeksi/geometriyi bozar). */
function isVec2(v: unknown): boolean {
  return isRecord(v) && isFiniteNum(v['x']) && isFiniteNum(v['y']);
}

function isVec2Array(v: unknown, min: number): boolean {
  return Array.isArray(v) && v.length >= min && v.every(isVec2);
}

/**
 * Yapısal + TİP-BAZLI alan doğrulaması. Ortak alanların yanında her tipin taşıyıcı alanlarını
 * (koordinat/sayı/ad) doğrular → NaN/eksik alanlı entity belleğe (ve rbush/metraj/maliyet hesabına)
 * sızmaz. Geçersiz entity yüklemede atlanır (toleranslı kısmi-bozulma).
 */
function isValidEntity(v: unknown): v is Entity {
  if (!isRecord(v)) return false;
  const type = v['type'];
  if (
    typeof v['id'] !== 'string' ||
    typeof v['layerId'] !== 'string' ||
    typeof type !== 'string' ||
    !VALID_TYPES.has(type as EntityType)
  ) {
    return false;
  }
  switch (type as EntityType) {
    case 'wall':
      return isVec2(v['start']) && isVec2(v['end']) && isFiniteNum(v['thickness']);
    case 'space':
      return typeof v['name'] === 'string' && isVec2Array(v['boundary'], 3);
    case 'parcel':
      return isVec2Array(v['boundary'], 3);
    case 'opening':
      return (
        typeof v['wallId'] === 'string' &&
        (v['kind'] === 'door' || v['kind'] === 'window') &&
        isFiniteNum(v['t']) &&
        isFiniteNum(v['width'])
      );
    case 'dimension':
      // offset NaN → ölçü çizgisi konumu bozulur (render-dimension dik kaydırma).
      return isVec2(v['a']) && isVec2(v['b']) && isFiniteNum(v['offset']);
    case 'section':
      // label baş harfi (A—A') ekran-sabit etiket olarak çizilir; eksikse render patlar.
      return isVec2(v['a']) && isVec2(v['b']) && typeof v['label'] === 'string';
    case 'block':
      // kind, BLOCK_DEFS kataloğunda olmalı (yoksa boyut/sembol araması undefined → çizim/AABB çöker).
      return (
        typeof v['kind'] === 'string' &&
        Object.prototype.hasOwnProperty.call(BLOCK_DEFS, v['kind'] as string) &&
        isVec2(v['position']) &&
        isFiniteNum(v['rotation'])
      );
    case 'sheet':
      // size/orientation/scale paftanın model-uzayı boyutunu türetir (sheetModelSize); geçersizse NaN boyut.
      return (
        isVec2(v['position']) &&
        SHEET_SIZES.includes(v['size'] as (typeof SHEET_SIZES)[number]) &&
        (v['orientation'] === 'portrait' || v['orientation'] === 'landscape') &&
        isFiniteNum(v['scale']) &&
        (v['scale'] as number) > 0 &&
        typeof v['title'] === 'string'
      );
    case 'annotation':
      // height (satır yüksekliği, dünya cm) NaN → metin atlası ölçeklemesi bozulur.
      return isVec2(v['position']) && typeof v['text'] === 'string' && isFiniteNum(v['height']);
    case 'comment':
      return isVec2(v['position']) && typeof v['text'] === 'string';
    default:
      return false;
  }
}
