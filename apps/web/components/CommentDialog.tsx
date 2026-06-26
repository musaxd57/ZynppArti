'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { MessageSquare, Check, RotateCcw, Trash2 } from 'lucide-react';
import { getCommentRequest, subscribeCommentRequest, resolveCommentAction } from '@/lib/comment-dialog';
import { useFocusTrap } from '@/lib/use-focus-trap';

/**
 * Yorum düzenleme diyaloğu: metni düzenle + "çözüldü" işaretini değiştir + sil. Engine çift-tık
 * handler'ı açar. Inter/iris temalı. Enter=kaydet, Esc=iptal.
 */
export function CommentDialog() {
  const state = useSyncExternalStore(subscribeCommentRequest, getCommentRequest, () => null);
  const [text, setText] = useState('');
  const [resolved, setResolved] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, !!state);

  useEffect(() => {
    if (state) {
      setText(state.text);
      setResolved(state.resolved);
      queueMicrotask(() => inputRef.current?.select());
    }
  }, [state]);

  if (!state) return null;

  const cancel = (): void => resolveCommentAction(null);
  const save = (): void => {
    const t = text.trim();
    if (!t) return; // boş yorum kaydetme (silmek için Sil düğmesi)
    resolveCommentAction({ text: t, resolved });
  };
  const remove = (): void => resolveCommentAction({ delete: true });

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50"
      onPointerDown={cancel}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Yorumu düzenle"
        className="w-[26rem] max-w-[92vw] rounded-xl p-5 text-sm shadow-2xl"
        style={{ background: 'var(--overlay)', color: 'var(--text-1)', boxShadow: 'inset 0 0 0 1px var(--border-soft)' }}
        onPointerDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save();
          else if (e.key === 'Escape') cancel();
        }}
      >
        <div className="mb-3 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg text-white" style={{ background: 'var(--accent)' }}>
            <MessageSquare className="h-[18px] w-[18px]" />
          </span>
          <div>
            <div className="font-semibold">Yorumu düzenle</div>
            <div className="text-xs" style={{ color: 'var(--text-3)' }}>
              Metni değiştir, çözüldü işaretle veya sil
            </div>
          </div>
        </div>

        <textarea
          ref={inputRef}
          autoFocus
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="mb-3 w-full resize-none rounded-md px-3 py-2 outline-none"
          style={{ background: 'var(--surface-2)', boxShadow: 'inset 0 0 0 1px var(--border-soft)' }}
        />

        <button
          type="button"
          onClick={() => setResolved((r) => !r)}
          className="mb-4 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs transition-colors hover:bg-[var(--surface-3)]"
          style={{
            background: resolved ? 'var(--accent)' : 'var(--surface-2)',
            color: resolved ? '#fff' : 'var(--text-2)',
          }}
        >
          {resolved ? <Check className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
          {resolved ? 'Çözüldü (işareti kaldırmak için tıkla)' : 'Çözüldü olarak işaretle'}
        </button>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={remove}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors hover:bg-[var(--danger,#b4232a)]/20"
            style={{ color: 'var(--danger, #e5484d)' }}
          >
            <Trash2 className="h-4 w-4" /> Sil
          </button>
          <div className="flex gap-2">
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
              onClick={save}
              disabled={text.trim().length === 0}
              className="rounded-md px-4 py-1.5 font-semibold text-white transition-colors disabled:opacity-40"
              style={{ background: 'var(--accent)' }}
            >
              Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
