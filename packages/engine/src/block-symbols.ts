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
    case 'door-single': {
      // Menteşeden açılan kanat + çeyrek daire açılım yayı (mimari klasik).
      g.moveTo(-hw, hh).lineTo(-hw, hh - w).stroke(stroke); // açık kanat (yukarı)
      g.arc(-hw, hh, w, -Math.PI / 2, 0).stroke(stroke); // 90° süpürme yayı
      g.moveTo(-hw, hh).lineTo(-hw - 4, hh).stroke(stroke); // jamb
      g.moveTo(hw, hh).lineTo(hw + 4, hh).stroke(stroke);
      break;
    }
    case 'door-double': {
      const r = hw; // her kanat w/2
      g.moveTo(-hw, hh).lineTo(-hw, hh - r).stroke(stroke);
      g.arc(-hw, hh, r, -Math.PI / 2, 0).stroke(stroke);
      g.moveTo(hw, hh).lineTo(hw, hh - r).stroke(stroke);
      g.arc(hw, hh, r, -Math.PI / 2, Math.PI, true).stroke(stroke);
      break;
    }
    case 'car': {
      g.roundRect(-hw, -hh, w, h, 18).stroke(stroke);
      g.moveTo(-hw + 8, -hh + 55).lineTo(hw - 8, -hh + 55).stroke(stroke); // ön cam
      g.moveTo(-hw + 10, -hh + 80).lineTo(hw - 10, -hh + 80).stroke(stroke); // kaput
      break;
    }
    case 'parking-space': {
      g.moveTo(-hw, -hh).lineTo(-hw, hh).lineTo(hw, hh).lineTo(hw, -hh).stroke(stroke); // üç kenar (giriş açık)
      g.moveTo(-hw, hh).lineTo(hw, -hh).stroke(stroke); // çapraz
      break;
    }
    case 'wardrobe': {
      outline();
      const r = (w / 2) * 0.9;
      g.moveTo(-hw, -hh + 8).lineTo(hw, -hh + 8).stroke(stroke); // kapak hattı
      // moveTo(yay başı) ŞART: önceki stroke() son noktayı seed'ler → arc() boş bir kiriş çizgisi ekler
      // (arc2'ninki tam-genişlik yatay hayalet çizgi). (Denetim.)
      g.moveTo(-hw + r, -hh + 8).arc(-hw, -hh + 8, r, 0, Math.PI / 2).stroke(stroke);
      g.moveTo(hw, -hh + 8 + r).arc(hw, -hh + 8, r, Math.PI / 2, Math.PI).stroke(stroke);
      break;
    }
    case 'nightstand': {
      outline();
      g.moveTo(-hw, -hh + 12).lineTo(hw, -hh + 12).stroke(stroke); // çekmece
      g.moveTo(-7, -hh + 6).lineTo(7, -hh + 6).stroke(stroke); // kulp
      break;
    }
    case 'dining-table': {
      outline();
      const chair = (cx: number, cy: number): void => {
        g.rect(cx - 16, cy - 16, 32, 32).stroke(stroke);
      };
      for (const cx of [-w / 3, 0, w / 3]) {
        chair(cx, -hh - 22);
        chair(cx, hh + 22);
      }
      chair(-hw - 22, 0);
      chair(hw + 22, 0);
      break;
    }
    case 'coffee-table': {
      outline();
      g.rect(-hw + 7, -hh + 7, w - 14, h - 14).stroke(stroke); // cam tabla kenarı
      break;
    }
    case 'dishwasher': {
      outline();
      g.rect(-hw + 4, -hh + 4, w - 8, h - 8).stroke(stroke); // kapak çerçevesi
      g.moveTo(-hw + 10, -hh + 9).lineTo(hw - 10, -hh + 9).stroke(stroke); // tutamak
      break;
    }
    case 'vanity': {
      outline();
      g.ellipse(0, 2, hw - 12, hh - 10).stroke(stroke); // çanak
      g.circle(0, -hh + 6, 3).stroke(stroke); // batarya
      break;
    }
    default:
      outline(); // tanımsız kind → en azından ayak izi kutusu
  }
}
