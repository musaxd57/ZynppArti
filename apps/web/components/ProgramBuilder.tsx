'use client';

import { useState } from 'react';

/**
 * Faz 4 — yapılandırılmış PROGRAM girişi (Çiz modu). Kullanıcı oda tiplerini adetle + toplam m²
 * seçer → serbest metin yerine net, tutarlı bir tarif üretir (üretici daha isabetli çalışır).
 * Çıktıyı `onApply` ile girdi kutusuna yazar (kullanıcı Çiz'e basar).
 */
const ROOMS: { key: string; label: string; def?: number }[] = [
  { key: 'salon', label: 'Salon', def: 1 },
  { key: 'yatak odası', label: 'Yatak Odası', def: 1 },
  { key: 'mutfak', label: 'Mutfak', def: 1 },
  { key: 'banyo', label: 'Banyo', def: 1 },
  { key: 'wc', label: 'WC' },
  { key: 'çalışma odası', label: 'Çalışma' },
  { key: 'antre', label: 'Antre' },
  { key: 'balkon', label: 'Balkon' },
];

export function buildProgramPrompt(
  counts: Record<string, number>,
  totalM2: number,
  notes = '',
): string {
  const parts = ROOMS.filter((r) => (counts[r.key] ?? 0) > 0).map(
    (r) => `${counts[r.key]} ${r.key}`,
  );
  if (parts.length === 0) return '';
  const extra = notes.trim() ? ` Komşuluk/istek: ${notes.trim()}.` : '';
  return `${totalM2} m² daire çiz: ${parts.join(', ')}.${extra} Mantıklı yerleşim yap, ıslak hacimleri (mutfak/banyo/wc) bir arada grupla, her odaya kapı ve dış odalara pencere ekle.`;
}

export function ProgramBuilder({ onApply }: { onApply: (prompt: string) => void }) {
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(ROOMS.map((r) => [r.key, r.def ?? 0])),
  );
  const [totalM2, setTotalM2] = useState(90);
  const [notes, setNotes] = useState('');

  const set = (key: string, delta: number): void =>
    setCounts((c) => ({ ...c, [key]: Math.max(0, Math.min(9, (c[key] ?? 0) + delta)) }));

  return (
    <div className="rounded-lg text-left" style={{ background: 'var(--surface-2)' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-[0.05em]"
        style={{ color: 'var(--text-2)' }}
      >
        <span className="text-[10px] opacity-70">{open ? '▾' : '▸'}</span>
        🏗️ Program ile çiz
      </button>
      {open && (
        <div className="flex flex-col gap-2 px-3 pb-3">
          <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-2)' }}>
            <span>Toplam alan</span>
            <div className="flex items-center overflow-hidden rounded-md" style={{ background: 'var(--surface-3)' }}>
              <button type="button" onClick={() => setTotalM2((v) => Math.max(20, v - 10))} className="px-2 py-0.5 hover:text-white">−</button>
              <span className="tnum w-14 text-center" style={{ color: 'var(--text-1)' }}>{totalM2} m²</span>
              <button type="button" onClick={() => setTotalM2((v) => Math.min(500, v + 10))} className="px-2 py-0.5 hover:text-white">+</button>
            </div>
          </div>
          {ROOMS.map((r) => (
            <div key={r.key} className="flex items-center justify-between text-xs" style={{ color: 'var(--text-2)' }}>
              <span>{r.label}</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => set(r.key, -1)} className="grid h-5 w-5 place-items-center rounded hover:text-white" style={{ background: 'var(--surface-3)' }}>−</button>
                <span className="tnum w-4 text-center" style={{ color: 'var(--text-1)' }}>{counts[r.key] ?? 0}</span>
                <button type="button" onClick={() => set(r.key, 1)} className="grid h-5 w-5 place-items-center rounded hover:text-white" style={{ background: 'var(--surface-3)' }}>+</button>
              </div>
            </div>
          ))}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Komşuluk / istek (ops.): örn. salon-mutfak bitişik, yatak odaları kuzeyde"
            className="mt-1 w-full resize-none rounded-md px-2 py-1.5 text-xs outline-none"
            style={{ background: 'var(--surface-3)', color: 'var(--text-1)' }}
          />
          {(() => {
            const prompt = buildProgramPrompt(counts, totalM2, notes);
            return (
              <button
                type="button"
                disabled={!prompt}
                onClick={() => onApply(prompt)}
                title={prompt ? undefined : 'En az bir oda ekle'}
                className="mt-1 rounded-md px-3 py-1.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: 'var(--accent)' }}
              >
                {prompt ? 'Tarifi hazırla' : 'En az bir oda ekle'}
              </button>
            );
          })()}
        </div>
      )}
    </div>
  );
}
