import type { SceneTool, ScenePointer } from '@zynpparti/engine';
import type { ToolContext } from './context';
import { WallTool } from './wall-tool';
import { SelectTool } from './select-tool';
import { EraseTool } from './erase-tool';
import { CalibrateTool } from './calibrate-tool';
import { OpeningTool, DOOR_WIDTH, WINDOW_WIDTH } from './opening-tool';
import { DimensionTool } from './dimension-tool';
import { ParcelTool } from './parcel-tool';
import { BlockTool } from './block-tool';
import { AnnotationTool } from './annotation-tool';
import { CommentTool } from './comment-tool';
import { SheetTool } from './sheet-tool';
import { SectionTool } from './section-tool';
import {
  AddEntity,
  BatchCommand,
  isClonable,
  offsetClone,
  type BlockKind,
  type Entity,
} from '@zynpparti/document';

export type ToolName =
  | 'select'
  | 'wall'
  | 'door'
  | 'window'
  | 'dimension'
  | 'parcel'
  | 'block'
  | 'annotation'
  | 'sheet'
  | 'section'
  | 'comment'
  | 'erase'
  | 'calibrate';

interface DisposableTool extends SceneTool {
  dispose(): void;
}

type ToolListener = (active: ToolName) => void;

/** Yapıştırmada kopyanın orijinalden kayma miktarı (cm; tekrar yapıştırınca üst üste birikir). */
const PASTE_OFFSET = 50;

/** Araç başına tuval imleci (CSS cursor). Seç dışındaki yerleştirme/ölçü araçları artı imleç. */
const CURSOR_BY_TOOL: Record<ToolName, string> = {
  select: 'default',
  wall: 'crosshair',
  door: 'crosshair',
  window: 'crosshair',
  dimension: 'crosshair',
  parcel: 'crosshair',
  block: 'crosshair',
  annotation: 'crosshair',
  sheet: 'crosshair',
  section: 'crosshair',
  comment: 'crosshair',
  erase: 'crosshair',
  calibrate: 'crosshair',
};

/**
 * Aktif aracı yöneten ve klavye kısayollarını işleyen üst katman. Engine'in tek "aktif aracı"
 * budur; içeride alt-araçlar arası geçiş yapar (CLAUDE.md §8.3, kısayollar `docs/UX-INTERACTIONS.md`).
 */
export class ToolManager implements SceneTool {
  private readonly tools: Record<ToolName, DisposableTool>;
  private readonly blockTool: BlockTool;
  private readonly selectTool: SelectTool;
  private current: ToolName = 'select';
  private readonly listeners = new Set<ToolListener>();
  /** Kopyala-yapıştır panosu (çoklu; oturum-içi, kalıcı değil). */
  private clipboard: Entity[] = [];

  constructor(private readonly ctx: ToolContext) {
    this.blockTool = new BlockTool(ctx);
    this.selectTool = new SelectTool(ctx);
    this.tools = {
      select: this.selectTool,
      wall: new WallTool(ctx),
      door: new OpeningTool(ctx, 'door', DOOR_WIDTH),
      window: new OpeningTool(ctx, 'window', WINDOW_WIDTH),
      dimension: new DimensionTool(ctx),
      parcel: new ParcelTool(ctx),
      block: this.blockTool,
      annotation: new AnnotationTool(ctx),
      comment: new CommentTool(ctx),
      sheet: new SheetTool(ctx),
      section: new SectionTool(ctx),
      erase: new EraseTool(ctx),
      calibrate: new CalibrateTool(ctx),
    };
    this.active.onActivate?.();
    this.ctx.setCursor?.(CURSOR_BY_TOOL[this.current]);
  }

  private get active(): DisposableTool {
    return this.tools[this.current];
  }

  get activeTool(): ToolName {
    return this.current;
  }

  setTool(name: ToolName): void {
    if (name === this.current) return;
    this.active.onDeactivate?.();
    this.current = name;
    this.active.onActivate?.();
    this.ctx.setCursor?.(CURSOR_BY_TOOL[name]);
    for (const fn of this.listeners) fn(name);
  }

  subscribe(fn: ToolListener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  /** Blok tipini seç ve blok aracına geç (palet). */
  setBlockKind(kind: BlockKind): void {
    this.blockTool.setKind(kind);
    this.setTool('block');
  }

  onPointerDown(p: ScenePointer): void {
    this.active.onPointerDown?.(p);
  }
  onPointerMove(p: ScenePointer): void {
    this.active.onPointerMove?.(p);
  }
  onPointerUp(p: ScenePointer): void {
    this.active.onPointerUp?.(p);
  }

  onKeyDown(e: KeyboardEvent): void {
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && (e.key === 'z' || e.key === 'Z')) {
      if (e.shiftKey) this.ctx.history.redo();
      else this.ctx.history.undo();
      e.preventDefault();
      return;
    }
    if (ctrl && (e.key === 'y' || e.key === 'Y')) {
      this.ctx.history.redo();
      e.preventDefault();
      return;
    }
    if (ctrl && (e.key === 'c' || e.key === 'C')) {
      this.copy();
      e.preventDefault();
      return;
    }
    if (ctrl && (e.key === 'v' || e.key === 'V')) {
      this.paste();
      e.preventDefault();
      return;
    }
    if (ctrl && (e.key === 'd' || e.key === 'D')) {
      this.copy();
      this.paste();
      e.preventDefault();
      return;
    }
    if (ctrl && (e.key === 'a' || e.key === 'A')) {
      this.selectAll();
      e.preventDefault();
      return;
    }
    // Esc her zaman Seç'e döner; zaten Seç'teyse seçimi temizler.
    if (e.key === 'Escape') {
      if (this.current !== 'select') this.setTool('select');
      else this.active.onKeyDown?.(e);
      return;
    }
    if (!ctrl) {
      const k = e.key.toLowerCase();
      if (k === 'v' || k === '1') return this.setTool('select'); // 'm' YOK → yorum aracına ait (aşağıda)
      if (k === 'l') return this.toggleTool('wall'); // tekrar L → kapat, Seç'e dön
      if (k === 'd') return this.toggleTool('door');
      if (k === 'p') return this.toggleTool('window'); // pencere
      if (k === 'o') return this.toggleTool('dimension'); // ölçü
      if (k === 'r') return this.toggleTool('parcel'); // arsa/parsel
      if (k === 'b') return this.toggleTool('block'); // blok/mobilya
      if (k === 't') return this.toggleTool('annotation'); // metin/açıklama
      if (k === 'f') return this.toggleTool('sheet'); // pafta (frame)
      if (k === 'c') return this.toggleTool('section'); // kesit (cross-section)
      if (k === 'm') return this.toggleTool('comment'); // yorum/markup
      if (k === 'e') return this.toggleTool('erase');
      if (k === 'k') return this.toggleTool('calibrate');
    }
    this.active.onKeyDown?.(e);
  }

  /** Araç zaten aktifse Seç'e döner, değilse o aracı açar (toggle). */
  private toggleTool(name: ToolName): void {
    this.setTool(this.current === name ? 'select' : name);
  }

  /** Tüm seçilebilir entity'leri (mahaller hariç) seçer; Seç aracına geçer. */
  private selectAll(): void {
    const ids = this.ctx.store
      .all()
      .filter((e) => e.type !== 'space')
      .map((e) => e.id);
    if (ids.length === 0) return;
    this.setTool('select');
    this.selectTool.selectMany(ids);
  }

  /**
   * Seçili (kopyalanabilir) entity'leri panoya alır. Kopyalanan DUVARLARIN bağlı boşlukları
   * (kapı/pencere) da panoya eklenir → duvarla birlikte yapıştırılır (yoksa kapı kaybolurdu).
   */
  private copy(): void {
    const clonable = this.selectTool.getSelectedEntities().filter(isClonable);
    if (clonable.length === 0) return;
    const wallIds = new Set(clonable.filter((e) => e.type === 'wall').map((e) => e.id));
    const boundOpenings =
      wallIds.size > 0
        ? this.ctx.store.all().filter((e) => e.type === 'opening' && wallIds.has(e.wallId))
        : [];
    this.clipboard = [...clonable, ...boundOpenings];
  }

  /**
   * Panodaki entity'lerin kaydırılmış kopyalarını ekler, seçer ve cascade için panoyu günceller.
   * Eski→yeni id eşlemesiyle boşlukların `wallId`'si yeni duvara yönlendirilir (bağ kopmaz).
   */
  private paste(): void {
    if (this.clipboard.length === 0) return;
    const clones = offsetClone(this.clipboard, PASTE_OFFSET, PASTE_OFFSET);
    const cmds = clones.map((c) => new AddEntity(c));
    this.ctx.history.dispatch(cmds.length === 1 ? cmds[0]! : new BatchCommand('Yapıştır', cmds));
    this.clipboard = clones; // tekrar Ctrl+V → bir önceki kopyalardan kayar (üst üste binmez)
    this.setTool('select');
    this.selectTool.selectMany(clones.map((c) => c.id));
  }

  destroy(): void {
    this.active.onDeactivate?.();
    for (const tool of Object.values(this.tools)) tool.dispose();
    this.listeners.clear();
  }
}
