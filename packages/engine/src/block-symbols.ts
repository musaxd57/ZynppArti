import type { Graphics } from 'pixi.js';
import { BLOCK_DEFS, type BlockKind } from '@zynpparti/document';

/**
 * Blok (mobilya) tip-üstü görünüş sembolleri — YEREL koordinatta çizilir (merkez orijinde),
 * konum/dönüş render-block'ta Graphics transformuyla uygulanır. Çizgiler ince (lw, ekran-sabit).
 * Basit ama tanınır mimari semboller (VISUAL-CRAFT §1: ince mobilya çizgisi).
 */
export function drawBlockSymbol(g: Graphics, kind: BlockKind, lw: number): void {
  const def = BLOCK_DEFS[kind];
  const w = def.w;
  const h = def.h;
  const hw = w / 2;
  const hh = h / 2;
  const stroke = { width: lw, color: 0xcfcfd6 } as const;

  const outline = (): void => {
    g.rect(-hw, -hh, w, h).stroke(stroke);
  };

  switch (kind) {
    case 'bed-single':
    case 'bed-double': {
      outline();
      // Yastık(lar) — üst kenara yakın.
      const pillowH = 30;
      const pw = kind === 'bed-double' ? (w - 30) / 2 : w - 20;
      if (kind === 'bed-double') {
        g.rect(-hw + 10, -hh + 8, pw, pillowH).stroke(stroke);
        g.rect(10, -hh + 8, pw, pillowH).stroke(stroke);
      } else {
        g.rect(-pw / 2, -hh + 8, pw, pillowH).stroke(stroke);
      }
      // Yorgan katlama çizgisi.
      g.moveTo(-hw, -hh + 70).lineTo(hw, -hh + 70).stroke(stroke);
      break;
    }
    case 'sofa': {
      outline();
      g.rect(-hw, -hh, w, 22).stroke(stroke); // sırt
      g.rect(-hw, -hh, 18, h).stroke(stroke); // sol kol
      g.rect(hw - 18, -hh, 18, h).stroke(stroke); // sağ kol
      break;
    }
    case 'armchair': {
      outline();
      g.rect(-hw, -hh, w, 18).stroke(stroke);
      g.rect(-hw, -hh, 14, h).stroke(stroke);
      g.rect(hw - 14, -hh, 14, h).stroke(stroke);
      break;
    }
    case 'table': {
      outline();
      break;
    }
    case 'wc': {
      // Rezervuar + oval hazne.
      g.rect(-hw, -hh, w, 18).stroke(stroke);
      g.ellipse(0, 6, hw - 4, hh - 14).stroke(stroke);
      break;
    }
    case 'sink': {
      outline();
      g.ellipse(0, 2, hw - 8, hh - 8).stroke(stroke);
      g.circle(0, -hh + 6, 3).stroke(stroke); // batarya
      break;
    }
    case 'shower': {
      outline();
      g.moveTo(-hw, -hh).lineTo(hw, hh).stroke(stroke);
      g.moveTo(hw, -hh).lineTo(-hw, hh).stroke(stroke);
      g.circle(0, 0, 4).stroke(stroke); // süzgeç
      break;
    }
    case 'tub': {
      g.rect(-hw, -hh, w, h).stroke(stroke);
      g.ellipse(0, 6, hw - 8, hh - 14).stroke(stroke);
      g.circle(0, hh - 16, 3).stroke(stroke);
      break;
    }
    case 'stove': {
      outline();
      const r = 11;
      const o = 14;
      for (const [sx, sy] of [
        [-o, -o],
        [o, -o],
        [-o, o],
        [o, o],
      ] as const) {
        g.circle(sx, sy, r).stroke(stroke);
      }
      break;
    }
    case 'fridge': {
      outline();
      g.moveTo(-hw, -hh + 22).lineTo(hw, -hh + 22).stroke(stroke); // bölme
      g.circle(hw - 8, 0, 2).stroke(stroke); // kulp
      break;
    }
    case 'stairs': {
      outline();
      const steps = 10;
      const step = h / steps;
      for (let i = 1; i < steps; i++) {
        g.moveTo(-hw, -hh + i * step).lineTo(hw, -hh + i * step).stroke(stroke);
      }
      // Yön oku (orta çizgi).
      g.moveTo(0, hh - 6).lineTo(0, -hh + 6).stroke(stroke);
      g.moveTo(0, -hh + 6).lineTo(-8, -hh + 18).stroke(stroke);
      g.moveTo(0, -hh + 6).lineTo(8, -hh + 18).stroke(stroke);
      break;
    }
  }
}
