import type { Vec2 } from '@zynpparti/geometry';

export type EntityId = string;

/** Tüm entity'lerin ortak alanları. */
interface EntityBase {
  readonly id: EntityId;
  readonly type: string;
  readonly layerId: string;
}

/**
 * Duvar — tek segment + kalınlık (ADR-0007). Koordinat birimi: cm (ADR-0008).
 * Duvar zincirleri, uçları snap'le bağlı ayrı `Wall` segmentleri olarak kurulur.
 */
export interface Wall extends EntityBase {
  readonly type: 'wall';
  readonly start: Vec2;
  readonly end: Vec2;
  readonly thickness: number;
}

/**
 * Mahal tipi — kullanıcı her mahale elle atar (isimden TAHMİN EDİLMEZ; ad serbesttir,
 * tip sınıflandırma için ayrı alandır). Metrikler bu tipe göre gruplanır (Faz 2A).
 * `undefined`/atanmamış = 'other'.
 */
export type RoomType = 'wet' | 'living' | 'sleeping' | 'circulation' | 'service' | 'other';

/**
 * Mahal (oda) — duvarlardan türetilen kapalı bölge (ENGINEERING-NOTES §1).
 * `name` Türkçe olabilir; `boundary` CCW poligon (cm). Alan boundary'den hesaplanır (canlı m²).
 * `roomType` kullanıcı tarafından atanır (Faz 2A canlı metrik paneli); atanmazsa 'other' sayılır.
 */
export interface Space extends EntityBase {
  readonly type: 'space';
  readonly name: string;
  readonly boundary: readonly Vec2[];
  readonly roomType?: RoomType;
}

/**
 * Faz 1 entity birliği (discriminated union). İleride Door/Window/Dimension... eklenecek.
 * `type` alanı ayırıcıdır.
 */
export type Entity = Wall | Space;

export type EntityType = Entity['type'];
