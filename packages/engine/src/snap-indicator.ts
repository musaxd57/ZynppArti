import { Container, Graphics } from 'pixi.js';
import type { Vec2 } from '@zynpparti/geometry';

/** Snap göstergesinin rengi — dikkat çeken ama paleti bozmayan camgöbeği. */
const SNAP_COLOR = 0x39e0ff;
/** Hizalama kılavuzu rengi — tasarım araçlarında alışıldık pembe/macenta (snap noktasından ayrışır). */
const GUIDE_COLOR = 0xff4f9a;

/**
 * Snap geri bildirimi: imleç bir anahtar noktaya tam yakalandıysa `point`; bir başka entity'nin
 * anahtar noktasıyla yatay/dikey **hizalandıysa** kılavuz segmenti (`vGuide`/`hGuide`). Üçü de
 * aynı anda dolu olabilir (köşe yakalama yoksa eksen hizalama). Tüm alanlar dünya koordinatı.
 */
export type SnapPointKind = 'endpoint' | 'midpoint' | 'edge';

export interface SnapHint {
  readonly point: Vec2 | null;
  /** Yakalanan noktanın türü → gösterge glyph'ini belirler (köşe/orta/kenar). Yoksa 'endpoint'. */
  readonly pointKind?: SnapPointKind;
  /** Dikey hizalama (x sabit): referans nokta → yakalanan imleç. */
  readonly vGuide: readonly [Vec2, Vec2] | null;
  /** Yatay hizalama (y sabit): referans nokta → yakalanan imleç. */
  readonly hGuide: readonly [Vec2, Vec2] | null;
}

/**
 * Snap göstergesi (VISUAL-CRAFT §6 mikro-etkileşim): imleç bir uç noktaya yakalanınca o noktada
 * küçük eşkenar dörtgen; başka bir entity ile hizalanınca hizalama kılavuz çizgisi gösterir →
 * kullanıcı tıklamadan önce nereye oturacağını görür. Ekran-sabit (pixelSize); overlay'e eklenir.
 */
export function createSnapIndicator(container: Container): {
  show(hint: SnapHint, pixelSize: number): void;
  hide(): void;
  destroy(): void;
} {
  const g = new Graphics();
  container.addChild(g);

  function guide(seg: readonly [Vec2, Vec2], pixelSize: number): void {
    g.moveTo(seg[0].x, seg[0].y)
      .lineTo(seg[1].x, seg[1].y)
      .stroke({ width: 1 * pixelSize, color: GUIDE_COLOR, alpha: 0.7 });
  }

  return {
    show(hint: SnapHint, pixelSize: number): void {
      g.clear();
      if (hint.vGuide) guide(hint.vGuide, pixelSize);
      if (hint.hGuide) guide(hint.hGuide, pixelSize);
      if (hint.point) {
        const r = 6 * pixelSize;
        const { x, y } = hint.point;
        const w = 1.5 * pixelSize;
        // Glyph snap türünü anlatır (CAD geleneği): köşe=eşkenar dörtgen, orta=üçgen, kenar=kare.
        if (hint.pointKind === 'midpoint') {
          g.moveTo(x, y - r)
            .lineTo(x + r, y + r)
            .lineTo(x - r, y + r)
            .closePath()
            .stroke({ width: w, color: SNAP_COLOR, alpha: 0.95 });
        } else if (hint.pointKind === 'edge') {
          g.rect(x - r, y - r, r * 2, r * 2).stroke({ width: w, color: SNAP_COLOR, alpha: 0.95 });
        } else {
          g.moveTo(x, y - r)
            .lineTo(x + r, y)
            .lineTo(x, y + r)
            .lineTo(x - r, y)
            .closePath()
            .stroke({ width: w, color: SNAP_COLOR, alpha: 0.95 });
        }
      }
    },
    hide(): void {
      g.clear();
    },
    destroy(): void {
      g.destroy();
    },
  };
}
