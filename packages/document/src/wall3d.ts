import type { Opening, Wall } from './entities';
import { openingCenterT } from './opening';
import {
  DEFAULT_WALL_HEIGHT_CM,
  DEFAULT_DOOR_HEAD_CM,
  DEFAULT_WINDOW_SILL_CM,
  DEFAULT_WINDOW_HEAD_CM,
} from './section';

/** Bir duvarın 3B kutu parametreleri (saf — three.js/DOM yok; engine/web üretir). */
export interface Wall3DBox {
  /** Kutu merkezi (plan düzleminde, cm). */
  readonly cx: number;
  readonly cy: number;
  /** Duvar uzunluğu (cm) = kutu uzun kenarı. */
  readonly length: number;
  /** Plan düzleminde dönüş açısı (radyan). */
  readonly angleRad: number;
  readonly thickness: number;
  readonly height: number;
  /** Kutunun alt kotu (cm) — lento/denizlik parçaları için (varsayılan 0 = zemin). */
  readonly baseHeight?: number;
}

// Boşluk varsayımları (cm) — şematik 3B. 2B kesit (section.ts) ile TEK KAYNAK (§6.6): aynı pencere
// hem 3B'de hem kesitte aynı denizlik/lento kotuyla çizilsin (eskiden 3B lento 220, kesit 210 → tutarsızdı).
const DOOR_HEIGHT = DEFAULT_DOOR_HEAD_CM;
const WINDOW_SILL = DEFAULT_WINDOW_SILL_CM;
const WINDOW_HEAD = DEFAULT_WINDOW_HEAD_CM;

/**
 * Duvarları 3B kutu parametrelerine çevirir (Faz 5 şematik 3B). Saf fonksiyon: her duvar, plan
 * orta noktasında, uzunluğu × kalınlığı × yüksekliğiyle ekstrüde edilmiş bir kutu olur.
 */
export function wallBoxes(
  walls: readonly Wall[],
  defaultHeight: number = DEFAULT_WALL_HEIGHT_CM,
): Wall3DBox[] {
  return walls.map((w) => {
    const dx = w.end.x - w.start.x;
    const dy = w.end.y - w.start.y;
    return {
      cx: (w.start.x + w.end.x) / 2,
      cy: (w.start.y + w.end.y) / 2,
      length: Math.hypot(dx, dy),
      angleRad: Math.atan2(dy, dx),
      thickness: w.thickness,
      height: w.height && w.height > 0 ? w.height : defaultHeight,
    };
  });
}

/**
 * Duvarları, üzerlerindeki boşlukları (kapı/pencere) OYARAK 3B kutulara çevirir (Faz 5 deepen).
 * Kapı = tam-yükseklik boşluk; pencere = denizlik (altta) + lento (üstte) bırakıp ortayı boşaltır.
 * Boşluk yokken `wallBoxes` ile aynı sonucu verir. Saf fonksiyon.
 */
export function wallBoxesWithOpenings(
  walls: readonly Wall[],
  openings: readonly Opening[],
  defaultHeight: number = DEFAULT_WALL_HEIGHT_CM,
): Wall3DBox[] {
  const byWall = new Map<string, Opening[]>();
  for (const o of openings) {
    const list = byWall.get(o.wallId);
    if (list) list.push(o);
    else byWall.set(o.wallId, [o]);
  }

  const out: Wall3DBox[] = [];
  for (const w of walls) {
    const dx = w.end.x - w.start.x;
    const dy = w.end.y - w.start.y;
    const len = Math.hypot(dx, dy);
    const h = w.height && w.height > 0 ? w.height : defaultHeight;
    const ux = len > 0 ? dx / len : 1;
    const uy = len > 0 ? dy / len : 0;
    const angleRad = Math.atan2(dy, dx);
    const ops = (byWall.get(w.id) ?? [])
      // Sığdırılmış t (plan/kesit/metraj ile aynı) — ham o.t kısaltılmış duvarda kayardı (L5).
      .map((o) => {
        const c = openingCenterT(w, o) * len;
        return { a: Math.max(0, c - o.width / 2), b: Math.min(len, c + o.width / 2), kind: o.kind };
      })
      .filter((o) => o.b > o.a)
      .sort((p, q) => p.a - q.a);

    // Boşluk merkezli plan noktası → kutu cx/cy üretici.
    const box = (s0: number, s1: number, height: number, baseHeight: number): void => {
      if (s1 - s0 < 1 || height < 1) return;
      const mid = (s0 + s1) / 2;
      out.push({
        cx: w.start.x + ux * mid,
        cy: w.start.y + uy * mid,
        length: s1 - s0,
        angleRad,
        thickness: w.thickness,
        height,
        baseHeight,
      });
    };

    let cursor = 0;
    for (const o of ops) {
      box(cursor, o.a, h, 0); // boşluktan önceki dolu parça
      if (o.kind === 'window') {
        box(o.a, o.b, Math.min(WINDOW_SILL, h), 0); // denizlik (kısa duvarda h'yi aşmasın — section.ts ile tutarlı)
        box(o.a, o.b, h - WINDOW_HEAD, WINDOW_HEAD); // lento
      } else {
        box(o.a, o.b, h - DOOR_HEIGHT, DOOR_HEIGHT); // kapı üstü lento
      }
      cursor = o.b;
    }
    box(cursor, len, h, 0); // son dolu parça
  }
  return out;
}
