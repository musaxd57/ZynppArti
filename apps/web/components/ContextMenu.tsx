'use client';

import { useEffect, useRef } from 'react';

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
  const menuRef = useRef<HTMLDivElement>(null);

  // Açılışta ilk etkin öğeye odaklan → menü klavyeyle kullanılabilir (a11y); sayfayı baştan tab'lamak gerekmez.
  useEffect(() => {
    const first = menuRef.current?.querySelector<HTMLButtonElement>('button:not([disabled])');
    first?.focus();
  }, []);

  // Ok tuşlarıyla öğeler arası gezinme (menü deseni).
  const onMenuKey = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    const btns = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') ?? []);
    if (btns.length === 0) return;
    const cur = btns.indexOf(document.activeElement as HTMLButtonElement);
    let next = cur;
    if (e.key === 'ArrowDown') next = cur < 0 ? 0 : (cur + 1) % btns.length;
    else if (e.key === 'ArrowUp') next = cur <= 0 ? btns.length - 1 : cur - 1;
    else if (e.key === 'Home') next = 0;
    else next = btns.length - 1;
    btns[next]?.focus();
  };

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
      ref={menuRef}
      role="menu"
      aria-label="Bağlam menüsü"
      className="fixed z-[90] min-w-[10rem] overflow-hidden rounded-md border border-white/10 bg-neutral-800/95 py-1 text-sm text-white shadow-xl backdrop-blur"
      style={{ left, top }}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={onMenuKey}
    >
      {items.map((it, i) => (
        <button
          key={i}
          type="button"
          role="menuitem"
          disabled={it.disabled}
          onClick={() => {
            it.onClick();
            onClose();
          }}
          className="block w-full px-3 py-1.5 text-left hover:bg-white/10 focus:bg-white/10 focus:outline-none disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
