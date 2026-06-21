import { setup, createActor, type ActorRefFrom } from 'xstate';
import { Graphics } from 'pixi.js';
import type { Vec2 } from '@zynpparti/geometry';
import {
  BatchCommand,
  RemoveEntity,
  UpdateEntity,
  annotationSize,
  blockCorners,
  dimensionGeometry,
  openingFrame,
  type Entity,
  type EntityId,
} from '@zynpparti/document';
import { hitTest, type SceneTool, type ScenePointer } from '@zynpparti/engine';
import type { ToolContext } from './context';

const HIT_PX = 8;
const DRAG_PX = 4;
const HANDLE_PX = 5; // tutamaç yarı-boyu (ekran px)
const SELECT_COLOR = 0xffb454;

/**
 * Pointer faz FSM'i (CLAUDE.md §8.3): idle → pressed → dragging. Makine yalnız fazı tutar;
 * hit-test/komut gibi efektler sınıfta yapılır (faz makineden okunur). Tek-tık = seçim,
 * eşik aşılınca = sürükleyerek taşıma. Tutamaç (handle) sürüklemesi ayrı moddur.
 */
export const selectPhaseMachine = setup({
  types: {} as { events: { type: 'DOWN' } | { type: 'DRAG' } | { type: 'UP' } | { type: 'RESET' } },
}).createMachine({
  initial: 'idle',
  states: {
    idle: { on: { DOWN: 'pressed' } },
    pressed: { on: { DRAG: 'dragging', UP: 'idle', RESET: 'idle' } },
    dragging: { on: { UP: 'idle', RESET: 'idle' } },
  },
});

/** Seç (tıkla), taşı (sürükle), tutamaçla düzenle, sil (Delete). */
export class SelectTool implements SceneTool {
  private readonly phase: ActorRefFrom<typeof selectPhaseMachine>;
  private readonly hoverGfx = new Graphics();
  private readonly selectionGfx = new Graphics();
  private readonly handleGfx = new Graphics();
  private readonly ghostGfx = new Graphics();

  private selectedId: EntityId | null = null;
  private hoveredId: EntityId | null = null;
  private downWorld: Vec2 | null = null;
  /** Sürükleyerek taşınan entity'nin başlangıç anlık görüntüsü (duvar/blok taşınabilir). */
  private original: Entity | null = null;
  /** Aktif tutamaç sürüklemesi (entity anlık görüntüsü + tutamaç indeksi). */
  private dragHandle: { entity: Entity; index: number } | null = null;

  constructor(private readonly ctx: ToolContext) {
    this.ctx.overlay.addChild(this.hoverGfx);
    this.ctx.overlay.addChild(this.selectionGfx);
    this.ctx.overlay.addChild(this.handleGfx);
    this.ctx.overlay.addChild(this.ghostGfx);
    this.phase = createActor(selectPhaseMachine);
    this.phase.start();
  }

  private get state(): 'idle' | 'pressed' | 'dragging' {
    return this.phase.getSnapshot().value as 'idle' | 'pressed' | 'dragging';
  }

  private skip = (lid: string): boolean =>
    !!this.ctx.isLayerHidden?.(lid) || !!this.ctx.isLayerLocked?.(lid);

  onPointerDown(p: ScenePointer): void {
    // 1) Seçili entity'nin bir tutamacına basıldıysa → tutamaç sürüklemesi başlat.
    if (this.selectedId) {
      const sel = this.ctx.store.get(this.selectedId);
      if (sel) {
        const idx = this.hitHandle(sel, p.world);
        if (idx >= 0) {
          this.dragHandle = { entity: sel, index: idx };
          this.renderHover(null);
          return;
        }
      }
    }
    // 2) Normal seçim / taşıma.
    const id = hitTest(this.ctx.store, this.ctx.index, p.world, HIT_PX * this.ctx.pixelSize(), this.skip);
    this.renderHover(null);
    this.select(id);
    if (id) {
      const e = this.ctx.store.get(id);
      // Yalnız doğrudan kütlesel taşınanlar sürüklenir (duvar/blok/metin); ölçü/parsel tutamaçla, boşluk duvara bağlı.
      this.original =
        e && (e.type === 'wall' || e.type === 'block' || e.type === 'annotation') ? e : null;
      this.downWorld = p.world;
      this.phase.send({ type: 'DOWN' });
    }
  }

  onPointerMove(p: ScenePointer): void {
    // Tutamaç sürüklemesi — canlı önizleme (snap'li).
    if (this.dragHandle) {
      const np = this.ctx.snap(p.world);
      this.drawGhostEntity(this.applyHandle(this.dragHandle.entity, this.dragHandle.index, np));
      return;
    }
    if (this.state === 'pressed' && this.downWorld) {
      const moved = Math.hypot(p.world.x - this.downWorld.x, p.world.y - this.downWorld.y);
      if (moved > DRAG_PX * this.ctx.pixelSize()) this.phase.send({ type: 'DRAG' });
    }
    if (this.state === 'dragging' && this.downWorld && this.original) {
      const dx = p.world.x - this.downWorld.x;
      const dy = p.world.y - this.downWorld.y;
      this.drawGhostEntity(this.translate(this.original, dx, dy));
      return;
    }
    // Boştayken imleç altındaki entity'yi soluk vurgula (micro-interaction; VISUAL-CRAFT §5/§6).
    if (this.state === 'idle') {
      const id = hitTest(this.ctx.store, this.ctx.index, p.world, HIT_PX * this.ctx.pixelSize(), this.skip);
      this.renderHover(id === this.selectedId ? null : id);
    }
  }

  onPointerUp(p: ScenePointer): void {
    if (this.dragHandle) {
      const np = this.ctx.snap(p.world);
      this.ctx.history.dispatch(
        new UpdateEntity(this.applyHandle(this.dragHandle.entity, this.dragHandle.index, np)),
      );
      this.dragHandle = null;
      this.ghostGfx.clear();
      this.renderSelection();
      return;
    }
    if (this.state === 'dragging' && this.downWorld && this.original) {
      const dx = p.world.x - this.downWorld.x;
      const dy = p.world.y - this.downWorld.y;
      this.ctx.history.dispatch(new UpdateEntity(this.translate(this.original, dx, dy)));
    }
    this.ghostGfx.clear();
    this.downWorld = null;
    this.original = null;
    this.phase.send({ type: 'UP' });
    this.renderSelection();
  }

  onKeyDown(e: KeyboardEvent): void {
    if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedId) {
      const id = this.selectedId;
      this.select(null);
      this.deleteEntity(id);
    } else if ((e.key === 'x' || e.key === 'X') && this.selectedId) {
      // Seçili bloku 90° döndür (BlockTool yerleştirmesindeki 'x' ile tutarlı).
      const sel = this.ctx.store.get(this.selectedId);
      if (sel?.type === 'block') {
        this.ctx.history.dispatch(
          new UpdateEntity({ ...sel, rotation: (sel.rotation + Math.PI / 2) % (Math.PI * 2) }),
        );
        this.renderSelection();
      }
    } else if (e.key === 'Escape') {
      this.select(null);
    }
  }

  /** Entity'yi siler; duvarsa bağlı boşlukları (kapı/pencere) tek undo'da birlikte siler. */
  private deleteEntity(id: EntityId): void {
    const entity = this.ctx.store.get(id);
    if (entity?.type === 'wall') {
      const bound = this.ctx.store
        .all()
        .filter((e) => e.type === 'opening' && e.wallId === id)
        .map((e) => new RemoveEntity(e.id));
      if (bound.length > 0) {
        this.ctx.history.dispatch(
          new BatchCommand('Duvar + boşlukları sil', [new RemoveEntity(id), ...bound]),
        );
        return;
      }
    }
    this.ctx.history.dispatch(new RemoveEntity(id));
  }

  onDeactivate(): void {
    this.select(null);
    this.renderHover(null);
    this.dragHandle = null;
    this.ghostGfx.clear();
    this.phase.send({ type: 'RESET' });
  }

  private select(id: EntityId | null): void {
    this.selectedId = id;
    this.renderSelection();
  }

  /** Taşınabilir bir entity'yi (dx,dy) kadar kaydırır. */
  private translate(entity: Entity, dx: number, dy: number): Entity {
    if (entity.type === 'wall') {
      return {
        ...entity,
        start: { x: entity.start.x + dx, y: entity.start.y + dy },
        end: { x: entity.end.x + dx, y: entity.end.y + dy },
      };
    }
    if (entity.type === 'block' || entity.type === 'annotation') {
      return { ...entity, position: { x: entity.position.x + dx, y: entity.position.y + dy } };
    }
    return entity;
  }

  // --- Tutamaçlar (düzenlenebilir noktalar) ---

  /** Bir entity'nin düzenlenebilir tutamaç noktaları (dünya). */
  private handlePoints(entity: Entity): Vec2[] {
    switch (entity.type) {
      case 'wall':
        return [entity.start, entity.end];
      case 'dimension': {
        const d = dimensionGeometry(entity);
        return [d.a, d.b, d.mid]; // uç, uç, offset
      }
      case 'parcel':
        return [...entity.boundary];
      default:
        return [];
    }
  }

  /** İmleç bir tutamacın üstündeyse indeksini, değilse -1 döndürür. */
  private hitHandle(entity: Entity, world: Vec2): number {
    const r = (HANDLE_PX + 3) * this.ctx.pixelSize();
    const pts = this.handlePoints(entity);
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i]!;
      if (Math.hypot(world.x - p.x, world.y - p.y) <= r) return i;
    }
    return -1;
  }

  /** Tutamaç sürüklemesini uygular → değiştirilmiş entity döndürür. */
  private applyHandle(entity: Entity, index: number, np: Vec2): Entity {
    if (entity.type === 'wall') {
      return index === 0 ? { ...entity, start: np } : { ...entity, end: np };
    }
    if (entity.type === 'dimension') {
      if (index === 0) return { ...entity, a: np };
      if (index === 1) return { ...entity, b: np };
      // offset tutamaç: ölçü çizgisinin ölçülen doğruya dik (işaretli) uzaklığı.
      const dx = entity.b.x - entity.a.x;
      const dy = entity.b.y - entity.a.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const offset = (np.x - entity.a.x) * nx + (np.y - entity.a.y) * ny;
      return { ...entity, offset };
    }
    if (entity.type === 'parcel') {
      return { ...entity, boundary: entity.boundary.map((v, i) => (i === index ? np : v)) };
    }
    return entity;
  }

  // --- Çizim ---

  private renderSelection(): void {
    this.selectionGfx.clear();
    if (!this.selectedId) {
      this.handleGfx.clear();
      return;
    }
    const e = this.ctx.store.get(this.selectedId);
    if (e) this.highlight(this.selectionGfx, e, 0.9);
    this.renderHandles(e);
  }

  private renderHandles(entity: Entity | undefined): void {
    this.handleGfx.clear();
    if (!entity) return;
    const r = HANDLE_PX * this.ctx.pixelSize();
    for (const p of this.handlePoints(entity)) {
      this.handleGfx
        .rect(p.x - r, p.y - r, 2 * r, 2 * r)
        .fill({ color: 0xffffff, alpha: 0.95 })
        .stroke({ width: 1 * this.ctx.pixelSize(), color: SELECT_COLOR });
    }
  }

  private renderHover(id: EntityId | null): void {
    if (id === this.hoveredId) return;
    this.hoveredId = id;
    this.hoverGfx.clear();
    if (!id) return;
    const e = this.ctx.store.get(id);
    if (e) this.highlight(this.hoverGfx, e, 0.35);
  }

  /** Bir entity'yi vurgu rengiyle çizer (seçim/hover/ghost ortak; tüm tipler). */
  private highlight(g: Graphics, entity: Entity, alpha: number): void {
    const px = this.ctx.pixelSize();
    switch (entity.type) {
      case 'wall':
        g.moveTo(entity.start.x, entity.start.y)
          .lineTo(entity.end.x, entity.end.y)
          .stroke({ width: entity.thickness + 4 * px, color: SELECT_COLOR, alpha, cap: 'round' });
        break;
      case 'opening': {
        const w = this.ctx.store.get(entity.wallId);
        if (w?.type !== 'wall') break;
        const f = openingFrame(entity, w);
        const hx = f.normal.x * (f.thickness / 2);
        const hy = f.normal.y * (f.thickness / 2);
        g.poly([
          f.a.x + hx, f.a.y + hy, f.b.x + hx, f.b.y + hy,
          f.b.x - hx, f.b.y - hy, f.a.x - hx, f.a.y - hy,
        ]).stroke({ width: 2.5 * px, color: SELECT_COLOR, alpha });
        break;
      }
      case 'dimension': {
        const d = dimensionGeometry(entity);
        g.moveTo(d.da.x, d.da.y)
          .lineTo(d.db.x, d.db.y)
          .stroke({ width: 3 * px, color: SELECT_COLOR, alpha, cap: 'round' });
        break;
      }
      case 'parcel': {
        const b = entity.boundary;
        if (b.length >= 2) {
          g.moveTo(b[0]!.x, b[0]!.y);
          for (let i = 1; i < b.length; i++) g.lineTo(b[i]!.x, b[i]!.y);
          g.closePath();
          g.stroke({ width: 2 * px, color: SELECT_COLOR, alpha });
        }
        break;
      }
      case 'block': {
        const c = blockCorners(entity);
        g.poly(c.flatMap((p) => [p.x, p.y])).stroke({ width: 2 * px, color: SELECT_COLOR, alpha });
        break;
      }
      case 'annotation': {
        const { w, h } = annotationSize(entity);
        g.rect(entity.position.x, entity.position.y, w, h).stroke({
          width: 1.5 * px,
          color: SELECT_COLOR,
          alpha,
        });
        break;
      }
      case 'space':
        break; // mahaller tıkla-seçilmez (çift tık = ad düzenle)
    }
  }

  private drawGhostEntity(entity: Entity): void {
    this.ghostGfx.clear();
    this.highlight(this.ghostGfx, entity, 0.5);
  }

  dispose(): void {
    this.phase.stop();
    this.hoverGfx.destroy();
    this.selectionGfx.destroy();
    this.handleGfx.destroy();
    this.ghostGfx.destroy();
  }
}
