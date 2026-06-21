'use client';

import { useEffect, useRef, useState } from 'react';
import { AddEntity, BatchCommand, type EntityStore, type History, type Wall } from '@zynpparti/document';
import type { ToolManager, ToolName } from '@zynpparti/tools';
import { importDxf, exportDxf } from '@zynpparti/io';

const TOOLS: { name: ToolName; label: string; hotkey: string }[] = [
  { name: 'select', label: 'Seç', hotkey: 'V' },
  { name: 'wall', label: 'Duvar', hotkey: 'L' },
  { name: 'door', label: 'Kapı', hotkey: 'D' },
  { name: 'window', label: 'Pencere', hotkey: 'P' },
  { name: 'dimension', label: 'Ölçü', hotkey: 'O' },
  { name: 'parcel', label: 'Parsel', hotkey: 'R' },
  { name: 'annotation', label: 'Metin', hotkey: 'T' },
  { name: 'erase', label: 'Sil', hotkey: 'E' },
  { name: 'calibrate', label: 'Ölçekle', hotkey: 'K' },
];

interface ToolbarProps {
  manager: ToolManager;
  history: History;
  store: EntityStore;
  exportPng: () => Promise<string>;
}

/** Araç çubuğu: araç seçimi, undo/redo, DXF içe/dışa aktarma, PNG dışa aktarma. */
export function Toolbar({ manager, history, store, exportPng }: ToolbarProps) {
  const [active, setActive] = useState<ToolName>(manager.activeTool);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => manager.subscribe(setActive), [manager]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const { walls } = importDxf(await file.text());
      if (walls.length === 0) {
        alert('DXF içinde içe aktarılabilir duvar (LINE/POLYLINE) bulunamadı.');
        return;
      }
      history.dispatch(new BatchCommand('DXF içe aktar', walls.map((w) => new AddEntity(w))));
    } catch (err) {
      alert('DXF okunamadı: ' + (err instanceof Error ? err.message : String(err)));
    }
  }

  function download(href: string, name: string): void {
    const a = document.createElement('a');
    a.href = href;
    a.download = name;
    a.click();
  }

  async function onExportPng(): Promise<void> {
    download(await exportPng(), 'zynpparti.png');
  }

  function onExportDxf(): void {
    const walls = store.all().filter((e): e is Wall => e.type === 'wall');
    const blob = new Blob([exportDxf(walls)], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    download(url, 'zynpparti.dxf');
    URL.revokeObjectURL(url);
  }

  const btn = 'rounded px-3 py-1.5 transition-colors hover:bg-white/10';

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
      <button type="button" onClick={() => history.undo()} className={btn} title="Geri al (Ctrl+Z)">
        ↶
      </button>
      <button type="button" onClick={() => history.redo()} className={btn} title="İleri al (Ctrl+Shift+Z)">
        ↷
      </button>
      <span className="mx-1 h-5 w-px bg-white/20" />
      <button type="button" onClick={() => fileRef.current?.click()} className={btn}>
        DXF Yükle
      </button>
      <button type="button" onClick={onExportDxf} className={btn}>
        DXF İndir
      </button>
      <button type="button" onClick={() => void onExportPng()} className={btn}>
        PNG İndir
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".dxf"
        className="hidden"
        onChange={(e) => void onFile(e)}
      />
    </div>
  );
}
