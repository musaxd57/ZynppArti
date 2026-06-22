'use client';

import { useEffect } from 'react';

export interface ContextMenuItem {
  readonly label: string;
  readonly onClick: () => void;
  readonly disabled?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

/**
 * Basit sağ-tık bağlam menüsü. Ekranda (x,y)'de açılır; dışarı tık / Esc / seçim ile kapanır.
 * Öğeler dinamik (seçime göre); eylemler CanvasStage'den gelir.
 */
export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  useEffect(() => {
    const close = (): void => onClose();
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    // Bir sonraki tıkta kapat (capture: menüdeki tık önce çalışır).
    window.addEventListener('pointerdown', close);
    window.addEventListener('keydown', onKey);
    window.addEventListener('blur', close);
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('blur', close);
    };
  }, [onClose]);

  // Ekran kenarından taşmayı kaba önle.
  const left = Math.min(x, (typeof window !== 'undefined' ? window.innerWidth : 9999) - 200);
  const top = Math.min(y, (typeof window !== 'undefined' ? window.innerHeight : 9999) - 8 - items.length * 32);

  return (
    <div
      className="fixed z-[90] min-w-[10rem] overflow-hidden rounded-md border border-white/10 bg-neutral-800/95 py-1 text-sm text-white shadow-xl backdrop-blur"
      style={{ left, top }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {items.map((it, i) => (
        <button
          key={i}
          type="button"
          disabled={it.disabled}
          onClick={() => {
            it.onClick();
            onClose();
          }}
          className="block w-full px-3 py-1.5 text-left hover:bg-white/10 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
