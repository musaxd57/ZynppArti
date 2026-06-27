'use client';

import { useEffect, useRef, useState } from 'react';
import { useFocusTrap } from '@/lib/use-focus-trap';

const GROUPS: { title: string; items: [string, string][] }[] = [
  {
    title: 'Araçlar',
    items: [
      ['V', 'Seç'],
      ['L', 'Duvar'],
      ['D', 'Kapı'],
      ['P', 'Pencere'],
      ['O', 'Ölçü'],
      ['R', 'Parsel'],
      ['B', 'Blok'],
      ['T', 'Metin'],
      ['F', 'Pafta'],
      ['C', 'Kesit (şematik)'],
      ['M', 'Yorum'],
      ['E', 'Sil'],
      ['K', 'Ölçekle'],
    ],
  },
  {
    title: 'Düzenleme',
    items: [
      ['Ctrl+Z', 'Geri al'],
      ['Ctrl+Shift+Z / Ctrl+Y', 'İleri al'],
      ['Ctrl+C / V', 'Kopyala / Yapıştır'],
      ['Ctrl+D', 'Çoğalt'],
      ['Ctrl+A', 'Tümünü seç'],
      ['Delete', 'Sil'],
      ['x', 'Bloğu döndür'],
    ],
  },
  {
    title: 'Görünüm & Hareket',
    items: [
      ['Ok tuşları', 'İt (Shift: 100 cm)'],
      ['Esc', 'Seç moduna dön / temizle'],
      ['Space + sürükle', 'Kaydır (pan)'],
      ['Tekerlek', 'Yakınlaş'],
      ['Home', 'İçeriğe sığdır'],
      ['Shift + tık / kutu', 'Çoklu seçim'],
      ['Shift (çizerken)', 'Ortho: 45° kilit'],
    ],
  },
  {
    title: 'Dosya & Komut',
    items: [
      ['Ctrl+S / Ctrl+O', 'Kaydet / Aç (JSON)'],
      ['Ctrl+K', 'Komut paleti'],
      ['Sağ tık', 'Bağlam menüsü'],
    ],
  },
];

/**
 * Kısayol yardımı: "?" (Shift+/) ile aç/kapa; sağ-altta küçük "?" düğmesi. Kendi durumunu tutar →
 * artan kısayol setini keşfedilebilir kılar (VISUAL-CRAFT §6 premium his).
 */
export function ShortcutsHelp() {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');
      if (!typing && e.key === '?') {
        setOpen((v) => !v);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="absolute bottom-2 right-3 h-7 w-7 rounded-full border border-[var(--border-soft)] bg-[var(--surface-2)] text-sm text-[var(--text-2)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text-1)]"
        title="Klavye kısayolları (?)"
      >
        ?
      </button>

      {open && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/40"
          onClick={() => setOpen(false)}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Klavye kısayolları"
            tabIndex={-1}
            className="max-h-[80vh] w-[44rem] max-w-[92vw] overflow-y-auto rounded-xl bg-[var(--overlay)] p-5 text-sm text-[var(--text-1)] shadow-2xl ring-1 ring-[var(--border-soft)] outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">Klavye Kısayolları</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded px-2 py-0.5 opacity-70 hover:bg-white/10 hover:opacity-100"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {GROUPS.map((g) => (
                <div key={g.title}>
                  <div className="mb-1 text-xs uppercase tracking-wide opacity-50">{g.title}</div>
                  <ul className="flex flex-col gap-1">
                    {g.items.map(([key, label]) => (
                      <li key={key} className="flex items-baseline justify-between gap-2">
                        <span className="opacity-80">{label}</span>
                        <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-xs">{key}</kbd>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
