'use client';

import { useEffect, useState } from 'react';

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
    ],
  },
];

/**
 * Kısayol yardımı: "?" (Shift+/) ile aç/kapa; sağ-altta küçük "?" düğmesi. Kendi durumunu tutar →
 * artan kısayol setini keşfedilebilir kılar (VISUAL-CRAFT §6 premium his).
 */
export function ShortcutsHelp() {
  const [open, setOpen] = useState(false);

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
        className="absolute bottom-2 right-3 h-7 w-7 rounded-full bg-black/60 text-sm text-white/80 backdrop-blur hover:bg-black/80"
        title="Kısayollar (?)"
      >
        ?
      </button>

      {open && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/40"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[80vh] w-[44rem] max-w-[92vw] overflow-y-auto rounded-lg bg-neutral-900/95 p-5 text-sm text-white shadow-2xl ring-1 ring-white/10"
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
