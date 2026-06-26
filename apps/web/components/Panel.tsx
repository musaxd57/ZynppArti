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
  // v3: Bloklar/Kesit/Copilot kapalı gelsin (Moses isteği) → eski kayıtlı "açık" durumlar sıfırlansın.
  const storageKey = `zynpparti.panel.v3.${title}`;
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
    <div
      className={`${widthClass} overflow-hidden rounded-lg text-sm ring-1`}
      style={{ background: 'var(--surface-1)', color: 'var(--text-1)', boxShadow: 'inset 0 0 0 1px var(--border-soft)' }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-full items-center gap-2 px-3 text-left text-[11px] font-semibold uppercase tracking-[0.05em] transition-colors"
        style={{ color: 'var(--text-2)' }}
        title={open ? 'Katla' : 'Aç'}
      >
        <span className="text-[10px] opacity-70">{open ? '▾' : '▸'}</span>
        <span className="flex-1 truncate">{title}</span>
        {badge != null && (
          <span className="tnum text-[11px] font-normal normal-case tracking-normal" style={{ color: 'var(--text-3)' }}>
            {badge}
          </span>
        )}
      </button>
      {open && (
        <div className="px-3 pb-3" style={{ borderTop: '1px solid var(--border-hair)', paddingTop: '8px' }}>
          {children}
        </div>
      )}
    </div>
  );
}
