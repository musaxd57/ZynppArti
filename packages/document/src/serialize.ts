import type { Entity, EntityType } from './entities';

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
  for (const raw of parsed['entities']) {
    if (isValidEntity(raw)) out.push(raw);
  }
  return out;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

/** Minimal yapısal doğrulama: ortak alanlar + bilinen tip. (Derin alan doğrulaması yapılmaz.) */
function isValidEntity(v: unknown): v is Entity {
  if (!isRecord(v)) return false;
  const type = v['type'];
  return (
    typeof v['id'] === 'string' &&
    typeof v['layerId'] === 'string' &&
    typeof type === 'string' &&
    VALID_TYPES.has(type as EntityType)
  );
}
