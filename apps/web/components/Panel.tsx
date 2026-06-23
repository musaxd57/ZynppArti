'use client';

import { useEffect, useState, type ReactNode } from 'react';

interface PanelProps {
  title: string;
  children: ReactNode;
  /** Sağ tarafta gösterilen kısa bilgi (ör. bulgu sayısı). */
  badge?: ReactNode;
  defaultOpen?: boolean;
  /** Genişlik sınıfı (panele göre değişir). */
  widthClass?: string;
}

/**
 * Katlanabilir panel kabuğu (UX cilası): başlık çubuğu + katla/aç düğmesi. Kapalıyken yalnız
 * başlık sekmesi görünür → kullanıcı istemediğini kapatıp temiz tuval elde eder. Tüm sağ/sol
 * paneller bunu kullanır; kolon düzeni (CanvasStage) üst üste binmeyi engeller.
 */
export function Panel({
  title,
  children,
  badge,
  defaultOpen = true,
  widthClass = 'w-64',
}: PanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  // Aç/kapa durumunu hatırla (localStorage). İlk render defaultOpen (SSR ile aynı → hidrasyon
  // uyumsuzluğu yok); kayıtlı değer mount sonrası effect'te uygulanır.
  // v2: accordion varsayılanları yenilendi (yalnız Mahal Listesi açık) → eski kayıtlı durumlar sıfırlansın.
  const storageKey = `zynpparti.panel.v2.${title}`;
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved != null) setOpen(saved === '1');
    } catch {
      /* localStorage erişilemiyor → varsayılanla devam */
    }
  }, [storageKey]);
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, open ? '1' : '0');
    } catch {
      /* yoksay */
    }
  }, [storageKey, open]);
  return (
    <div className={`${widthClass} rounded-lg bg-black/60 text-sm text-white shadow-lg backdrop-blur`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-2 py-1.5 text-left font-semibold opacity-90 hover:opacity-100"
        title={open ? 'Katla' : 'Aç'}
      >
        <span className="w-3 text-center text-xs opacity-60">{open ? '▾' : '▸'}</span>
        <span className="flex-1 truncate">{title}</span>
        {badge != null && <span className="text-xs font-normal opacity-50">{badge}</span>}
      </button>
      {open && <div className="px-2 pb-2">{children}</div>}
    </div>
  );
}
