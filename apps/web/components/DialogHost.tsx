'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { closeDialog, getDialog, subscribeDialog } from '@/lib/dialog';

/**
 * Aktif dialog'u (alert/confirm/prompt) ekranda gösterir. Bir kez render edilir (layout). Store boşsa
 * hiçbir şey çizmez. Enter = onayla, Esc = iptal. prompt için metin girişi.
 */
export function DialogHost() {
  const state = useSyncExternalStore(subscribeDialog, getDialog, () => null);
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state?.kind === 'prompt') {
      setText(state.defaultValue ?? '');
      // odak + seçim
      queueMicrotask(() => inputRef.current?.select());
    }
  }, [state]);

  if (!state) return null;

  const cancel = (): void => closeDialog(state.kind === 'confirm' ? false : null);
  const ok = (): void => closeDialog(state.kind === 'prompt' ? text : true);

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50"
      onPointerDown={cancel}
    >
      <div
        className="w-[24rem] max-w-[92vw] rounded-lg border border-white/10 bg-neutral-800 p-5 text-sm text-white shadow-2xl"
        onPointerDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') ok();
          else if (e.key === 'Escape') cancel();
        }}
      >
        <p className="mb-4 whitespace-pre-line">{state.message}</p>
        {state.kind === 'prompt' && (
          <input
            ref={inputRef}
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mb-4 w-full rounded bg-white/10 px-2 py-1.5 outline-none focus:bg-white/20"
          />
        )}
        <div className="flex justify-end gap-2">
          {state.kind !== 'alert' && (
            <button
              type="button"
              onClick={cancel}
              className="rounded bg-white/10 px-4 py-1.5 hover:bg-white/20"
            >
              {state.kind === 'confirm' ? 'Hayır' : 'İptal'}
            </button>
          )}
          <button
            type="button"
            autoFocus={state.kind !== 'prompt'}
            onClick={ok}
            className="rounded bg-blue-600 px-4 py-1.5 hover:bg-blue-700"
          >
            {state.kind === 'confirm' ? 'Evet' : 'Tamam'}
          </button>
        </div>
      </div>
    </div>
  );
}
