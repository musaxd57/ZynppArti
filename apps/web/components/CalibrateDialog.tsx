'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useFocusTrap } from '@/lib/use-focus-trap';
import { Ruler } from 'lucide-react';
import { getCalibrate, subscribeCalibrate, resolveCalibration } from '@/lib/calibrate-dialog';

/** cm → okunur metre/cm metni (tr-TR). */
function fmtLen(cm: number): string {
  if (cm >= 100) return `${(cm / 100).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} m`;
  return `${cm.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} cm`;
}

/**
 * Ölçek kalibrasyonu diyaloğu (havalı): seçilen mesafeyi gösterir, gerçek değeri sorar, ortaya çıkan
 * ölçek oranını CANLI hesaplar. Inter/iris temalı. Enter=uygula, Esc=iptal.
 */
export function CalibrateDialog() {
  const state = useSyncExternalStore(subscribeCalibrate, getCalibrate, () => null);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, !!state);

  useEffect(() => {
    if (state) {
      setValue(String(Math.round(state.measured)));
      queueMicrotask(() => inputRef.current?.select());
    }
  }, [state]);

  if (!state) return null;

  const real = Number(value.replace(',', '.'));
  const valid = Number.isFinite(real) && real > 0;
  const factor = valid ? real / state.measured : 1;
  const cancel = (): void => resolveCalibration(null);
  const apply = (): void => {
    if (valid) resolveCalibration(real);
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50"
      onPointerDown={cancel}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Ölçeği kalibre et"
        className="w-[26rem] max-w-[92vw] rounded-xl p-5 text-sm shadow-2xl"
        style={{ background: 'var(--overlay)', color: 'var(--text-1)', boxShadow: 'inset 0 0 0 1px var(--border-soft)' }}
        onPointerDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') apply();
          else if (e.key === 'Escape') cancel();
        }}
      >
        <div className="mb-3 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg text-white" style={{ background: 'var(--accent)' }}>
            <Ruler className="h-[18px] w-[18px]" />
          </span>
          <div>
            <div className="font-semibold">Ölçeği kalibre et</div>
            <div className="text-xs" style={{ color: 'var(--text-3)' }}>
              Seçtiğin iki noktanın gerçek mesafesini gir
            </div>
          </div>
        </div>

        <label className="mb-1 block text-xs" style={{ color: 'var(--text-2)' }}>
          Bu iki nokta arası gerçek mesafe (cm)
        </label>
        <input
          ref={inputRef}
          autoFocus
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="tnum mb-3 w-full rounded-md px-3 py-2 text-base outline-none"
          style={{ background: 'var(--surface-2)', boxShadow: 'inset 0 0 0 1px var(--border-soft)' }}
        />

        <div
          className="mb-4 flex items-center justify-between rounded-md px-3 py-2 text-xs"
          style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}
        >
          <span>
            Şu anki ölçü:{' '}
            <span className="tnum" style={{ color: 'var(--text-1)' }}>
              {fmtLen(state.measured)}
            </span>
          </span>
          {valid && (
            <span>
              Ölçek:{' '}
              <span className="tnum font-semibold" style={{ color: 'var(--accent-text)' }}>
                {factor >= 1 ? `${factor.toFixed(2)}× büyür` : `${(1 / factor).toFixed(2)}× küçülür`}
              </span>
            </span>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={cancel}
            className="rounded-md px-4 py-1.5 transition-colors hover:bg-[var(--surface-3)]"
            style={{ color: 'var(--text-2)' }}
          >
            İptal
          </button>
          <button
            type="button"
            onClick={apply}
            disabled={!valid}
            className="rounded-md px-4 py-1.5 font-semibold text-white transition-colors disabled:opacity-40"
            style={{ background: 'var(--accent)' }}
          >
            Uygula
          </button>
        </div>
      </div>
    </div>
  );
}
