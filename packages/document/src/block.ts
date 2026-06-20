import type { Vec2 } from '@zynpparti/geometry';
import type { Block } from './entities';

/**
 * Blok (mobilya/sembol) kütüphanesi tanımları — saf veri + geometri (CLAUDE.md §7 "blok").
 * Her blokun tip-üstü görünüş ayak izi (cm) burada; çizim sembolü engine'de (block-symbols.ts).
 * Konum + dönüş bloka aittir; ayak izinden AABB ve hit-test türetilir.
 */

export type BlockKind =
  | 'bed-single'
  | 'bed-double'
  | 'sofa'
  | 'armchair'
  | 'table'
  | 'wc'
  | 'sink'
  | 'shower'
  | 'tub'
  | 'stove'
  | 'fridge'
  | 'stairs';

export interface BlockDef {
  readonly label: string;
  /** Ayak izi genişliği (cm, yerel x). */
  readonly w: number;
  /** Ayak izi derinliği (cm, yerel y). */
  readonly h: number;
}

/** Blok tanımları — Türkçe etiket + gerçekçi ayak izi (cm). */
export const BLOCK_DEFS: Record<BlockKind, BlockDef> = {
  'bed-single': { label: 'Tek kişilik yatak', w: 90, h: 200 },
  'bed-double': { label: 'Çift kişilik yatak', w: 160, h: 200 },
  sofa: { label: 'Kanepe', w: 200, h: 85 },
  armchair: { label: 'Koltuk', w: 80, h: 80 },
  table: { label: 'Masa', w: 120, h: 80 },
  wc: { label: 'Klozet', w: 40, h: 60 },
  sink: { label: 'Lavabo', w: 50, h: 40 },
  shower: { label: 'Duş', w: 90, h: 90 },
  tub: { label: 'Küvet', w: 70, h: 160 },
  stove: { label: 'Ocak', w: 60, h: 60 },
  fridge: { label: 'Buzdolabı', w: 60, h: 65 },
  stairs: { label: 'Merdiven', w: 100, h: 250 },
};

/** Blok ayak izinin (dönüş uygulanmış) 4 köşesi — dünya koordinatı. */
export function blockCorners(block: Block): Vec2[] {
  const def = BLOCK_DEFS[block.kind];
  const hw = def.w / 2;
  const hh = def.h / 2;
  const c = Math.cos(block.rotation);
  const s = Math.sin(block.rotation);
  const local: Vec2[] = [
    { x: -hw, y: -hh },
    { x: hw, y: -hh },
    { x: hw, y: hh },
    { x: -hw, y: hh },
  ];
  return local.map((p) => ({
    x: block.position.x + p.x * c - p.y * s,
    y: block.position.y + p.x * s + p.y * c,
  }));
}

/** Nokta blok ayak izinin içinde mi? (yerel uzaya çevirip dikdörtgen testi). */
export function pointInBlock(block: Block, p: Vec2): boolean {
  const def = BLOCK_DEFS[block.kind];
  const dx = p.x - block.position.x;
  const dy = p.y - block.position.y;
  const c = Math.cos(-block.rotation);
  const s = Math.sin(-block.rotation);
  const lx = dx * c - dy * s;
  const ly = dx * s + dy * c;
  return Math.abs(lx) <= def.w / 2 && Math.abs(ly) <= def.h / 2;
}
