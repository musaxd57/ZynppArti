import { setup, createActor, type ActorRefFrom } from 'xstate';
import { Graphics } from 'pixi.js';
import type { Vec2 } from '@zynpparti/geometry';
import {
  BatchCommand,
  RemoveEntity,
  UpdateEntity,
  dimensionGeometry,
  isClonable,
  offsetEntity,
  type Entity,
  type EntityId,
} from '@zynpparti/document';
import { hitTest, highlightEntity, type SceneTool, type ScenePointer } from '@zynpparti/engine';
import type { ToolContext } from './context';

const HIT_PX = 8;
const DRAG_PX = 4;
const HANDLE_PX = 5; // tutamaç yarı-boyu (ekran px)
const SELECT_COLOR = 0xffb454;

/**
 * Pointer faz FSM'i (CLAUDE.md §8.3): idle → pressed → dragging. Makine yalnız fazı tutar;
 * hit-test/komut gibi efektler sınıfta yapılır (faz makineden okunur). Tek-tık = seçim,
 * eşik aşılınca = sürükleme (entity üstündeyse taşıma, boşluktaysa kutu/marquee seçim).
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

/**
 * Seç (tıkla / Shift-tıkla çoklu / boşlukta kutu-seçim), taşı (sürükle — çoklu), tutamaçla düzenle
 * (yalnız tek seçimde), sil/kopyala (çoklu). Seçim bir kümedir (`selectedIds`).
 */
export class SelectTool implements SceneTool {
  private readonly phase: ActorRefFrom<typeof selectPhaseMachine>;
  private readonly hoverGfx = new Graphics();
  private readonly selectionGfx = new Graphics();
  private readonly handleGfx = new Graphics();
  private readonly ghostGfx = new Graphics();
  private readonly marqueeGfx = new Graphics();

  private selectedIds = new Set<EntityId>();
  private hoveredId: EntityId | null = null;
  private downWorld: Vec2 | null = null;
  /** Down anında tıklanan entity (yoksa boşluk → kutu-seçim). */
  private downHitId: EntityId | null = null;
  /** Down anındaki Shift durumu (çoklu seçim ekle/çıkar). */
  private shiftDown = false;
  /** Çoklu taşıma için seçili taşınabilir entity'lerin anlık görüntüsü. */
  private moveOriginals: Entity[] = [];
  /** Kutu-seçim başlangıcı (dünya). */
  private marqueeStart: Vec2 | null = null;
  /** Aktif tutamaç sürüklemesi (yalnız tek seçimde). */
  private dragHandle: { entity: Entity; index: number } | null = null;

  constructor(private readonly ctx: ToolContext) {
    this.ctx.overlay.addChild(this.hoverGfx);
    this.ctx.overlay.addChild(this.selectionGfx);
    this.ctx.overlay.addChild(this.handleGfx);
    this.ctx.overlay.addChild(this.ghostGfx);
    this.ctx.overlay.addChild(this.marqueeGfx);
    this.phase = createActor(selectPhaseMachine);
    this.phase.start();
  }

  private get state(): 'idle' | 'pressed' | 'dragging' {
    return this.phase.getSnapshot().value as 'idle' | 'pressed' | 'dragging';
  }

  private skip = (lid: string): boolean =>
    !!this.ctx.isLayerHidden?.(lid) || !!this.ctx.isLayerLocked?.(lid);

  onPointerDown(p: ScenePointer): void {
    this.shiftDown = !!p.shiftKey;

    // 1) Tek seçimde, seçili entity'nin tutamacına basıldıysa → tutamaç sürüklemesi.
    // Kilit/gizli katmandaki entity'nin tutamacı sürüklenemez (entity seçimden ÖNCE kilitlenmiş
    // olabilir → seçim kalır ama düzenleme reddedilmeli). Denetim bulgusu (lock bypass).
    if (this.selectedIds.size === 1) {
      const sel = this.firstSelectedEntity();
      if (sel && !this.skip(sel.layerId)) {
        const idx = this.hitHandle(sel, p.world);
        if (idx >= 0) {
          this.dragHandle = { entity: sel, index: idx };
          this.renderHover(null);
          return;
        }
      }
    }

    // 2) Hit-test → entity seçimi/taşıma; boşluk → kutu-seçim.
    const id = hitTest(this.ctx.store, this.ctx.index, p.world, HIT_PX * this.ctx.pixelSize(), this.skip);
    this.renderHover(null);
    this.downWorld = p.world;
    this.downHitId = id;
    if (id) {
      // Shift değilse ve tıklanan henüz seçili değilse → tekil seçime geç (sürükleme bunu taşır).
      if (!this.shiftDown && !this.selectedIds.has(id)) this.setSelection([id]);
      // Shift değilse mevcut seçimin taşınabilir anlık görüntüsünü al (çoklu taşıma).
      if (!this.shiftDown) this.captureMoveOriginals();
    } else {
      // Seçilebilir öğe yok: ya boşluk ya da KİLİTLİ öğe. Kilitli öğeye tıklandıysa geri bildir
      // (gizli hariç ama kilitli dahil ikinci hit-test → kullanıcı "araç bozuk" sanmasın).
      if (this.ctx.onLayerLocked) {
        const onlyHidden = (lid: string): boolean => !!this.ctx.isLayerHidden?.(lid);
        const lockedId = hitTest(this.ctx.store, this.ctx.index, p.world, HIT_PX * this.ctx.pixelSize(), onlyHidden);
        if (lockedId && this.ctx.isLayerLocked?.(this.ctx.store.get(lockedId)?.layerId ?? '')) {
          this.ctx.onLayerLocked();
        }
      }
      this.marqueeStart = p.world;
    }
    this.phase.send({ type: 'DOWN' });
  }

  onPointerMove(p: ScenePointer): void {
    // Tutamaç sürüklemesi — canlı önizleme (snap'li).
    if (this.dragHandle) {
      const np = this.ctx.snap(p.world);
      this.drawGhosts([this.applyHandle(this.dragHandle.entity, this.dragHandle.index, np)]);
      return;
    }
    if (this.state === 'pressed' && this.downWorld) {
      const moved = Math.hypot(p.world.x - this.downWorld.x, p.world.y - this.downWorld.y);
      if (moved > DRAG_PX * this.ctx.pixelSize()) this.phase.send({ type: 'DRAG' });
    }
    if (this.state === 'dragging' && this.downWorld) {
      if (this.downHitId && this.moveOriginals.length > 0) {
        const dx = p.world.x - this.downWorld.x;
        const dy = p.world.y - this.downWorld.y;
        this.drawGhosts(this.moveOriginals.map((e) => offsetEntity(e, dx, dy)));
      } else if (this.marqueeStart) {
        this.drawMarquee(this.marqueeStart, p.world);
      }
      return;
    }
    // Boştayken imleç altındaki (seçili olmayan) entity'yi soluk vurgula (VISUAL-CRAFT §5/§6).
    if (this.state === 'idle') {
      const id = hitTest(this.ctx.store, this.ctx.index, p.world, HIT_PX * this.ctx.pixelSize(), this.skip);
      this.renderHover(id && this.selectedIds.has(id) ? null : id);
    }
  }

  onPointerUp(p: ScenePointer): void {
    // Tutamaç sürüklemesi commit.
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

    if (this.state === 'dragging' && this.downWorld) {
      if (this.downHitId && this.moveOriginals.length > 0) {
        // Çoklu taşıma commit (tek komut = tek undo).
        const dx = p.world.x - this.downWorld.x;
        const dy = p.world.y - this.downWorld.y;
        const cmds = this.moveOriginals.map((e) => new UpdateEntity(offsetEntity(e, dx, dy)));
        this.ctx.history.dispatch(cmds.length === 1 ? cmds[0]! : new BatchCommand('Taşı', cmds));
      } else if (this.marqueeStart) {
        const hits = this.marqueeHits(this.marqueeStart, p.world);
        this.setSelection(this.shiftDown ? [...this.selectedIds, ...hits] : hits);
      }
    } else {
      // Sürükleme yok = tık.
      if (this.downHitId) {
        if (this.shiftDown) this.toggle(this.downHitId);
        else this.setSelection([this.downHitId]); // çokluyu tekile indir
      } else if (!this.shiftDown) {
        this.setSelection([]); // boşluğa tık → temizle
      }
    }
    this.endGesture();
  }

  onKeyDown(e: KeyboardEvent): void {
    if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedIds.size > 0) {
      const ids = [...this.selectedIds];
      this.setSelection([]);
      this.deleteMany(ids);
    } else if ((e.key === 'x' || e.key === 'X') && this.selectedIds.size === 1) {
      // Seçili tek bloku 90° döndür (BlockTool yerleştirmesindeki 'x' ile tutarlı).
      const sel = this.firstSelectedEntity();
      if (sel?.type === 'block' && !this.skip(sel.layerId)) {
        this.ctx.history.dispatch(
          new UpdateEntity({ ...sel, rotation: (sel.rotation + Math.PI / 2) % (Math.PI * 2) }),
        );
        this.renderSelection();
      }
    } else if (e.key.startsWith('Arrow') && this.selectedIds.size > 0) {
      // Ok tuşlarıyla itme: 10 cm, Shift ile 100 cm. (Dünya y aşağı → yukarı = -y.)
      const step = e.shiftKey ? 100 : 10;
      const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[
        e.key
      ];
      if (d) {
        this.nudge(d[0]!, d[1]!);
        e.preventDefault();
      }
    } else if (e.key === 'Escape') {
      this.setSelection([]);
    }
  }

  /** Seçili taşınabilir entity'leri (dx,dy) kadar iter (tek BatchCommand undo). */
  private nudge(dx: number, dy: number): void {
    const movable = [...this.selectedIds]
      .map((id) => this.ctx.store.get(id))
      .filter((e): e is Entity => !!e && isClonable(e) && !this.skip(e.layerId));
    if (movable.length === 0) return;
    const cmds = movable.map((e) => new UpdateEntity(offsetEntity(e, dx, dy)));
    this.ctx.history.dispatch(cmds.length === 1 ? cmds[0]! : new BatchCommand('İt', cmds));
    this.renderSelection();
  }

  /** Seçili entity'leri (id'leri verilen) siler; her duvarın bağlı boşlukları tek undo'da birlikte gider. */
  private deleteMany(ids: EntityId[]): void {
    const toRemove = new Set<EntityId>();
    for (const id of ids) {
      const e = this.ctx.store.get(id);
      if (!e || this.skip(e.layerId)) continue; // kilitli/gizli katman silinemez (lock bypass)
      toRemove.add(id);
      if (e.type === 'wall') {
        for (const o of this.ctx.store.all()) {
          if (o.type === 'opening' && o.wallId === id) toRemove.add(o.id);
        }
      }
    }
    const cmds = [...toRemove].map((id) => new RemoveEntity(id));
    if (cmds.length === 0) return;
    this.ctx.history.dispatch(cmds.length === 1 ? cmds[0]! : new BatchCommand('Sil', cmds));
  }

  onDeactivate(): void {
    this.setSelection([]);
    this.renderHover(null);
    this.dragHandle = null;
    this.endGesture();
    this.phase.send({ type: 'RESET' });
  }

  /** Sürükleme jestini bitirir (geçici durumu ve önizleme grafiklerini temizler). */
  private endGesture(): void {
    this.ghostGfx.clear();
    this.marqueeGfx.clear();
    this.downWorld = null;
    this.downHitId = null;
    this.moveOriginals = [];
    this.marqueeStart = null;
    this.phase.send({ type: 'UP' });
    this.renderSelection();
  }

  // --- Seçim durumu ---

  private setSelection(ids: Iterable<EntityId>): void {
    this.selectedIds = new Set(ids);
    this.renderSelection();
    this.ctx.onSelectionChange?.([...this.selectedIds]);
  }

  private toggle(id: EntityId): void {
    if (this.selectedIds.has(id)) this.selectedIds.delete(id);
    else this.selectedIds.add(id);
    this.renderSelection();
    this.ctx.onSelectionChange?.([...this.selectedIds]);
  }

  private firstSelectedEntity(): Entity | undefined {
    for (const id of this.selectedIds) return this.ctx.store.get(id);
    return undefined;
  }

  private captureMoveOriginals(): void {
    // Kilitli/gizli katmandaki entity sürüklenerek taşınamaz (lock bypass — denetim bulgusu).
    this.moveOriginals = [...this.selectedIds]
      .map((id) => this.ctx.store.get(id))
      .filter((e): e is Entity => !!e && isClonable(e) && !this.skip(e.layerId));
  }

  /** Kutu içindeki seçilebilir entity'ler (mahaller hariç; gizli/kilitli katman atlanır). */
  private marqueeHits(a: Vec2, b: Vec2): EntityId[] {
    const rect = {
      minX: Math.min(a.x, b.x),
      minY: Math.min(a.y, b.y),
      maxX: Math.max(a.x, b.x),
      maxY: Math.max(a.y, b.y),
    };
    return this.ctx.index.search(rect).filter((id) => {
      const e = this.ctx.store.get(id);
      return !!e && e.type !== 'space' && !this.skip(e.layerId);
    });
  }

  /** Seçili entity'leri döndürür (kopyala-yapıştır için ToolManager kullanır). */
  getSelectedEntities(): Entity[] {
    return [...this.selectedIds]
      .map((id) => this.ctx.store.get(id))
      .filter((e): e is Entity => !!e);
  }

  /** Seçimi dışarıdan ayarlar (ör. yapıştırılan entity'leri seçili yapmak için). */
  selectMany(ids: EntityId[]): void {
    this.setSelection(ids);
  }

  // --- Tutamaçlar (düzenlenebilir noktalar; yalnız tek seçimde) ---

  /** Bir entity'nin düzenlenebilir tutamaç noktaları (dünya). */
  private handlePoints(entity: Entity): Vec2[] {
    switch (entity.type) {
      case 'wall':
        return [entity.start, entity.end];
      case 'dimension': {
        try {
          const d = dimensionGeometry(entity);
          return [d.a, d.b, d.mid]; // uç, uç, offset
        } catch (e) {
          console.error('dimensionGeometry başarısız, basit uçlara düşülüyor:', e);
          return [entity.a, entity.b];
        }
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
    this.handleGfx.clear();
    let only: Entity | undefined;
    for (const id of this.selectedIds) {
      const e = this.ctx.store.get(id);
      if (e) {
        this.highlight(this.selectionGfx, e, 0.9);
        only = e;
      }
    }
    // Tutamaçlar yalnız tek seçimde anlamlı (nokta düzenleme).
    if (this.selectedIds.size === 1 && only) this.renderHandles(only);
  }

  private renderHandles(entity: Entity): void {
    this.handleGfx.clear();
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

  /** Bir entity'yi seçim rengiyle vurgular (engine ortak highlightEntity'ye devreder). */
  private highlight(g: Graphics, entity: Entity, alpha: number): void {
    highlightEntity(g, entity, this.ctx.store, SELECT_COLOR, alpha, this.ctx.pixelSize());
  }

  private drawGhosts(entities: Entity[]): void {
    this.ghostGfx.clear();
    for (const e of entities) this.highlight(this.ghostGfx, e, 0.5);
  }

  /** Kutu-seçim dikdörtgenini çizer (soluk dolgu + ekran-sabit kenar). */
  private drawMarquee(a: Vec2, b: Vec2): void {
    const px = this.ctx.pixelSize();
    const x = Math.min(a.x, b.x);
    const y = Math.min(a.y, b.y);
    const w = Math.abs(b.x - a.x);
    const h = Math.abs(b.y - a.y);
    this.marqueeGfx.clear();
    this.marqueeGfx
      .rect(x, y, w, h)
      .fill({ color: SELECT_COLOR, alpha: 0.08 })
      .stroke({ width: 1 * px, color: SELECT_COLOR, alpha: 0.8 });
  }

  dispose(): void {
    this.phase.stop();
    this.hoverGfx.destroy();
    this.selectionGfx.destroy();
    this.handleGfx.destroy();
    this.ghostGfx.destroy();
    this.marqueeGfx.destroy();
  }
}
