import { Graphics } from 'pixi.js';
import type { Vec2 } from '@zynpparti/geometry';
import { distance } from '@zynpparti/geometry';
import { BatchCommand, UpdateEntity, type Wall } from '@zynpparti/document';
import type { SceneTool, ScenePointer } from '@zynpparti/engine';
import type { ToolContext } from './context';

const PREVIEW_COLOR = 0x5be0d6; // parlak ölçü-şeridi rengi (koyu zeminde okunur)

/**
 * Ölçek kalibrasyonu (ADR-0008): iki nokta seç → gerçek mesafeyi gir → tüm duvarları ölçekle.
 * Gerçek mesafe, varsa uygulamanın temalı diyaloğuyla (ctx.requestCalibration) alınır; yoksa
 * `window.prompt`'a düşer (ADR-0011).
 */
export class CalibrateTool implements SceneTool {
  private readonly preview = new Graphics();
  private p1: Vec2 | null = null;
  private cursor: Vec2 | null = null;
  // Araç değişince/Escape ile artar → bekleyen kalibrasyon diyaloğu geç çözülse bile ölçek uygulanmaz.
  private gen = 0;

  constructor(private readonly ctx: ToolContext) {
    this.ctx.overlay.addChild(this.preview);
  }

  onPointerDown(p: ScenePointer): void {
    const at = this.ctx.snap(p.world);
    if (!this.p1) {
      this.p1 = at;
    } else {
      this.applyCalibration(this.p1, at);
      this.p1 = null;
    }
    this.render();
  }

  onPointerMove(p: ScenePointer): void {
    this.cursor = this.ctx.snap(p.world);
    this.render();
  }

  onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      this.gen++; // açık kalibrasyon diyaloğunu iptal et
      this.p1 = null;
      this.render();
    }
  }

  onDeactivate(): void {
    this.gen++; // bekleyen kalibrasyon diyaloğunu geçersiz kıl
    this.p1 = null;
    this.cursor = null;
    this.preview.clear();
  }

  private applyCalibration(a: Vec2, b: Vec2): void {
    const measured = distance(a, b);
    if (!(measured > 0)) return;
    const myGen = this.gen;
    // Gerçek mesafeyi temalı diyalogtan al (yoksa window.prompt yedeği). Asenkron → sonra uygula.
    const ask: Promise<number | null> = this.ctx.requestCalibration
      ? this.ctx.requestCalibration(measured)
      : Promise.resolve(promptFallback());
    ask
      .then((real) => {
        if (this.gen !== myGen) return; // araç değişti/iptal → ölçek uygulama
        if (real == null || !Number.isFinite(real) || real <= 0) return;
        const factor = real / measured;
        const walls = this.ctx.store.all().filter((e): e is Wall => e.type === 'wall');
        if (walls.length === 0) return;
        const cmds = walls.map((w) => new UpdateEntity(this.scaleWall(w, factor, a)));
        this.ctx.history.dispatch(new BatchCommand('Ölçekle', cmds));
      })
      .catch((err) => console.error('Kalibrasyon diyaloğu başarısız:', err));
  }

  private scaleWall(w: Wall, f: number, o: Vec2): Wall {
    return {
      ...w,
      start: { x: o.x + (w.start.x - o.x) * f, y: o.y + (w.start.y - o.y) * f },
      end: { x: o.x + (w.end.x - o.x) * f, y: o.y + (w.end.y - o.y) * f },
      thickness: w.thickness * f,
    };
  }

  private render(): void {
    const r = 4 * this.ctx.pixelSize();
    this.preview.clear();
    for (const p of [this.p1, this.cursor]) {
      if (p) this.preview.circle(p.x, p.y, r).fill({ color: PREVIEW_COLOR });
    }
    if (this.p1 && this.cursor) {
      this.preview
        .moveTo(this.p1.x, this.p1.y)
        .lineTo(this.cursor.x, this.cursor.y)
        .stroke({ width: 2 * this.ctx.pixelSize(), color: PREVIEW_COLOR, alpha: 0.8 });
    }
  }

  dispose(): void {
    this.preview.destroy();
  }
}

/** Diyalog enjekte edilmemişse (test/edge) basit yedek. */
function promptFallback(): number | null {
  if (typeof window === 'undefined') return null;
  const answer = window.prompt('Bu iki nokta arası gerçek mesafe (cm):');
  if (answer == null) return null;
  const real = Number(answer.replace(',', '.'));
  return Number.isFinite(real) && real > 0 ? real : null;
}
