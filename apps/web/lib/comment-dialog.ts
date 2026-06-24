'use client';

/**
 * Yorum (markup) düzenleme diyaloğu için modül-store (calibrate-dialog deseni → React dışından,
 * engine çift-tık handler'ından çağrılabilir). Bir yoruma çift tıklanınca açılır: metni düzenle,
 * "çözüldü" işaretini değiştir veya yorumu sil.
 */

/** Diyalog sonucu: kaydet (metin + çözüldü) | sil | iptal(null). */
export type CommentResult = { readonly delete: true } | { readonly text: string; readonly resolved: boolean } | null;

export interface CommentRequest {
  readonly text: string;
  readonly resolved: boolean;
  readonly resolve: (result: CommentResult) => void;
}

let current: CommentRequest | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const fn of listeners) fn();
}

export function getCommentRequest(): CommentRequest | null {
  return current;
}

export function subscribeCommentRequest(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Handler çağırır: mevcut yorum metni + çözüldü durumunu ver; kullanıcının kararı döner. */
export function requestCommentAction(text: string, resolved: boolean): Promise<CommentResult> {
  return new Promise((resolve) => {
    current = { text, resolved, resolve };
    emit();
  });
}

/** Diyalog kapanırken (Kaydet/Sil/İptal) çağrılır. */
export function resolveCommentAction(result: CommentResult): void {
  const c = current;
  current = null;
  emit();
  c?.resolve(result);
}
