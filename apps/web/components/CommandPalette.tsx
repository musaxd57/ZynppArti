'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { History } from '@zynpparti/document';
import type { ToolManager, ToolName } from '@zynpparti/tools';
import { useFocusTrap } from '@/lib/use-focus-trap';

interface Command {
  readonly label: string;
  readonly hint?: string;
  readonly run: () => void;
}

interface CommandPaletteProps {
  manager: ToolManager;
  history: History;
  zoomToFit: () => void;
}

const TOOL_COMMANDS: { name: ToolName; label: string; key: string }[] = [
  { name: 'select', label: 'Seç', key: 'V' },
  { name: 'wall', label: 'Duvar', key: 'L' },
  { name: 'door', label: 'Kapı', key: 'D' },
  { name: 'window', label: 'Pencere', key: 'P' },
  { name: 'dimension', label: 'Ölçü', key: 'O' },
  { name: 'parcel', label: 'Parsel', key: 'R' },
  { name: 'block', label: 'Blok', key: 'B' },
  { name: 'annotation', label: 'Metin', key: 'T' },
  { name: 'sheet', label: 'Pafta', key: 'F' },
  { name: 'section', label: 'Kesit', key: 'C' },
  { name: 'comment', label: 'Yorum', key: 'M' },
  { name: 'erase', label: 'Sil', key: 'E' },
  { name: 'calibrate', label: 'Ölçekle', key: 'K' },
];

/**
 * Komut paleti (Ctrl+K): araç ve eylemleri yazarak ara, Enter/tıkla çalıştır. Mevcut mantığa bağlanır
 * (araçlar setTool; kaydet/aç sentetik kısayolla). Klavye-öncelikli hızlı erişim (AutoCAD/VS Code).
 */
export function CommandPalette({ manager, history, zoomToFit }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);
  useFocusTrap(modalRef, open);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
        setQuery('');
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Klavyeyle seçilen öğeyi görünür alana kaydır (liste height-cap'li; highlight fold altına kaçmasın).
  useEffect(() => {
    if (open) selectedRef.current?.scrollIntoView({ block: 'nearest' });
  }, [open, selected, query]);

  const commands = useMemo<Command[]>(() => {
    const sendKey = (key: string, ctrl = false): void => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key, ctrlKey: ctrl }));
    };
    return [
      ...TOOL_COMMANDS.map((t) => ({
        label: `Araç: ${t.label}`,
        hint: t.key,
        run: () => manager.setTool(t.name),
      })),
      { label: 'Geri al', hint: 'Ctrl+Z', run: () => history.undo() },
      { label: 'İleri al', hint: 'Ctrl+Y', run: () => history.redo() },
      { label: 'İçeriğe sığdır', hint: 'Home', run: () => zoomToFit() },
      { label: 'Tümünü seç', hint: 'Ctrl+A', run: () => sendKey('a', true) },
      { label: 'Kaydet (JSON)', hint: 'Ctrl+S', run: () => sendKey('s', true) },
      { label: 'Aç (JSON)', hint: 'Ctrl+O', run: () => sendKey('o', true) },
    ];
  }, [manager, history, zoomToFit]);

  if (!open) return null;

  const q = query.trim().toLocaleLowerCase('tr');
  const results = q ? commands.filter((c) => c.label.toLocaleLowerCase('tr').includes(q)) : commands;
  // Seçili indeks, daralan sonuçlara sığacak şekilde kıstırılır.
  const sel = results.length ? Math.min(selected, results.length - 1) : 0;

  const runAt = (i: number): void => {
    const cmd = results[i];
    if (cmd) {
      cmd.run();
      setOpen(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[95] flex items-start justify-center bg-black/40 pt-[15vh]"
      onPointerDown={() => setOpen(false)}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Komut paleti"
        className="w-[28rem] max-w-[92vw] overflow-hidden rounded-lg border border-white/10 bg-neutral-800/95 text-sm text-white shadow-2xl backdrop-blur"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') runAt(sel);
            else if (e.key === 'ArrowDown') {
              e.preventDefault();
              setSelected(Math.min(sel + 1, results.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setSelected(Math.max(sel - 1, 0));
            }
          }}
          placeholder="Komut ara… (araç, kaydet, geri al…)"
          className="w-full bg-transparent px-4 py-3 outline-none placeholder:text-white/40"
        />
        <div role="listbox" aria-label="Komutlar" className="max-h-[50vh] overflow-y-auto border-t border-white/10">
          {results.length === 0 ? (
            <div className="px-4 py-3 text-white/50">Sonuç yok.</div>
          ) : (
            results.map((c, i) => (
              <button
                key={i}
                ref={i === sel ? selectedRef : null}
                role="option"
                aria-selected={i === sel}
                type="button"
                onClick={() => runAt(i)}
                // Yalnız seçim gerçekten değişince state güncelle — her piksel hareketinde re-render fırtınası olmasın.
                onPointerMove={() => {
                  if (sel !== i) setSelected(i);
                }}
                className={`flex w-full items-center justify-between px-4 py-2 text-left ${
                  i === sel ? 'bg-white/15' : 'hover:bg-white/10'
                }`}
              >
                <span>{c.label}</span>
                {c.hint && <span className="text-xs opacity-50">{c.hint}</span>}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
