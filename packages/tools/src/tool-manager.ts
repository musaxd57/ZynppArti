import type { SceneTool, ScenePointer } from '@zynpparti/engine';
import type { ToolContext } from './context';
import { WallTool } from './wall-tool';
import { SelectTool } from './select-tool';
import { EraseTool } from './erase-tool';
import { CalibrateTool } from './calibrate-tool';

export type ToolName = 'select' | 'wall' | 'erase' | 'calibrate';

interface DisposableTool extends SceneTool {
  dispose(): void;
}

type ToolListener = (active: ToolName) => void;

/**
 * Aktif aracı yöneten ve klavye kısayollarını işleyen üst katman. Engine'in tek "aktif aracı"
 * budur; içeride alt-araçlar arası geçiş yapar (CLAUDE.md §8.3, kısayollar `docs/UX-INTERACTIONS.md`).
 */
export class ToolManager implements SceneTool {
  private readonly tools: Record<ToolName, DisposableTool>;
  private current: ToolName = 'select';
  private readonly listeners = new Set<ToolListener>();

  constructor(private readonly ctx: ToolContext) {
    this.tools = {
      select: new SelectTool(ctx),
      wall: new WallTool(ctx),
      erase: new EraseTool(ctx),
      calibrate: new CalibrateTool(ctx),
    };
    this.active.onActivate?.();
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
    for (const fn of this.listeners) fn(name);
  }

  subscribe(fn: ToolListener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
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
    if (!ctrl) {
      const k = e.key.toLowerCase();
      if (k === 'v' || k === '1' || k === 'm') return this.setTool('select');
      if (k === 'l') return this.setTool('wall');
      if (k === 'e') return this.setTool('erase');
      if (k === 'k') return this.setTool('calibrate');
    }
    this.active.onKeyDown?.(e);
  }

  destroy(): void {
    this.active.onDeactivate?.();
    for (const tool of Object.values(this.tools)) tool.dispose();
    this.listeners.clear();
  }
}
