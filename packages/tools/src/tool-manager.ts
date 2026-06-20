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
import type { BlockKind } from '@zynpparti/document';

export type ToolName =
  | 'select'
  | 'wall'
  | 'door'
  | 'window'
  | 'dimension'
  | 'parcel'
  | 'block'
  | 'erase'
  | 'calibrate';

interface DisposableTool extends SceneTool {
  dispose(): void;
}

type ToolListener = (active: ToolName) => void;

/** Araç başına tuval imleci (CSS cursor). Seç dışındaki yerleştirme/ölçü araçları artı imleç. */
const CURSOR_BY_TOOL: Record<ToolName, string> = {
  select: 'default',
  wall: 'crosshair',
  door: 'crosshair',
  window: 'crosshair',
  dimension: 'crosshair',
  parcel: 'crosshair',
  block: 'crosshair',
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
  private current: ToolName = 'select';
  private readonly listeners = new Set<ToolListener>();

  constructor(private readonly ctx: ToolContext) {
    this.blockTool = new BlockTool(ctx);
    this.tools = {
      select: new SelectTool(ctx),
      wall: new WallTool(ctx),
      door: new OpeningTool(ctx, 'door', DOOR_WIDTH),
      window: new OpeningTool(ctx, 'window', WINDOW_WIDTH),
      dimension: new DimensionTool(ctx),
      parcel: new ParcelTool(ctx),
      block: this.blockTool,
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
    // Esc her zaman Seç'e döner; zaten Seç'teyse seçimi temizler.
    if (e.key === 'Escape') {
      if (this.current !== 'select') this.setTool('select');
      else this.active.onKeyDown?.(e);
      return;
    }
    if (!ctrl) {
      const k = e.key.toLowerCase();
      if (k === 'v' || k === '1' || k === 'm') return this.setTool('select');
      if (k === 'l') return this.toggleTool('wall'); // tekrar L → kapat, Seç'e dön
      if (k === 'd') return this.toggleTool('door');
      if (k === 'p') return this.toggleTool('window'); // pencere
      if (k === 'o') return this.toggleTool('dimension'); // ölçü
      if (k === 'r') return this.toggleTool('parcel'); // arsa/parsel
      if (k === 'b') return this.toggleTool('block'); // blok/mobilya
      if (k === 'e') return this.toggleTool('erase');
      if (k === 'k') return this.toggleTool('calibrate');
    }
    this.active.onKeyDown?.(e);
  }

  /** Araç zaten aktifse Seç'e döner, değilse o aracı açar (toggle). */
  private toggleTool(name: ToolName): void {
    this.setTool(this.current === name ? 'select' : name);
  }

  destroy(): void {
    this.active.onDeactivate?.();
    for (const tool of Object.values(this.tools)) tool.dispose();
    this.listeners.clear();
  }
}
