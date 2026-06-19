'use client';

import { useEffect, useState } from 'react';
import type { History } from '@zynpparti/document';
import type { ToolManager, ToolName } from '@zynpparti/tools';

const TOOLS: { name: ToolName; label: string; hotkey: string }[] = [
  { name: 'select', label: 'Seç', hotkey: 'V' },
  { name: 'wall', label: 'Duvar', hotkey: 'L' },
  { name: 'erase', label: 'Sil', hotkey: 'E' },
];

/** Araç çubuğu: araç seçimi + undo/redo. Kısayollar `docs/UX-INTERACTIONS.md`. */
export function Toolbar({ manager, history }: { manager: ToolManager; history: History }) {
  const [active, setActive] = useState<ToolName>(manager.activeTool);

  useEffect(() => manager.subscribe(setActive), [manager]);

  return (
    <div className="absolute left-4 top-16 flex items-center gap-1 rounded-lg bg-black/60 p-1 text-sm text-white backdrop-blur">
      {TOOLS.map((t) => (
        <button
          key={t.name}
          type="button"
          onClick={() => manager.setTool(t.name)}
          className={`rounded px-3 py-1.5 transition-colors ${
            active === t.name ? 'bg-blue-600' : 'hover:bg-white/10'
          }`}
        >
          {t.label} <kbd className="ml-1 opacity-60">{t.hotkey}</kbd>
        </button>
      ))}
      <span className="mx-1 h-5 w-px bg-white/20" />
      <button
        type="button"
        onClick={() => history.undo()}
        className="rounded px-3 py-1.5 hover:bg-white/10"
        title="Geri al (Ctrl+Z)"
      >
        ↶
      </button>
      <button
        type="button"
        onClick={() => history.redo()}
        className="rounded px-3 py-1.5 hover:bg-white/10"
        title="İleri al (Ctrl+Shift+Z)"
      >
        ↷
      </button>
    </div>
  );
}
