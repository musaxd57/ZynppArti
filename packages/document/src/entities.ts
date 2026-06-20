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
export type RoomType =
  | 'living'
  | 'kitchen'
  | 'bathroom'
  | 'wet'
  | 'sleeping'
  | 'circulation'
  | 'service'
  | 'other';

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
 * Boşluk (kapı/pencere) — bir duvarın üstüne oturur (binding ile bağlı; CLAUDE.md §7).
 * Konum `wallId` duvarı boyunca `t∈[0,1]` ile parametriktir → duvar değişince boşluk uyumlu kalır.
 * `width` net geçiş (cm); kapı genişliği yönetmelik denetimine girer (TS 9111, ADR-0018).
 */
export interface Opening extends EntityBase {
  readonly type: 'opening';
  readonly wallId: EntityId;
  /** Duvar orta-çizgisi boyunca konum (0 = start, 1 = end). */
  readonly t: number;
  readonly width: number;
  readonly kind: 'door' | 'window';
}

/**
 * Ölçülendirme (dimension) — iki nokta arası lineer ölçü. `offset` ölçü çizgisinin ölçülen
 * doğrudan dik uzaklığıdır (cm; işaret hangi tarafta olduğunu belirler). Uzunluk a/b'den türetilir.
 */
export interface Dimension extends EntityBase {
  readonly type: 'dimension';
  readonly a: Vec2;
  readonly b: Vec2;
  readonly offset: number;
}

/**
 * Parsel (arsa) sınırı — imar/çekme denetimi için arsa poligonu (CLAUDE.md §7 site). Tek parsel
 * tipik; `boundary` kapalı poligon (cm). Çekme (setback) = yapının bu sınıra uzaklığı.
 */
export interface Parcel extends EntityBase {
  readonly type: 'parcel';
  readonly boundary: readonly Vec2[];
}

/**
 * Entity birliği (discriminated union). `type` alanı ayırıcıdır.
 * İleride Annotation/Block... eklenecek.
 */
export type Entity = Wall | Space | Opening | Dimension | Parcel;

export type EntityType = Entity['type'];
