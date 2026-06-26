import type { Tier } from './types';

/**
 * Maliyet koruması (ADR-0019 / Moses kararı): hiçbir AI çağrısı SONSUZA kadar açık kalmamalı.
 * Askıda bir upstream isteği token/para harcamaya devam eder ve istemci kopsa bile sürebilir.
 * Bu yüzden her çağrıya bir SON-TARİH (deadline) bağlanır — süre dolunca AbortSignal tetiklenir.
 *
 * Saf, bağımlılıksız (sunucu+test). `AbortSignal.timeout`/`AbortSignal.any` her runtime'da olmayabilir
 * → elle AbortController + setTimeout + parent dinleme (geniş uyumluluk).
 */

/** Sohbet (Sor) çağrısı zaman aşımı — kademeye göre (karmaşık yanıt daha uzun sürebilir). */
export function tierTimeoutMs(tier: Tier): number {
  return tier === 'complex' ? 60_000 : 30_000;
}

/** Tasarım (Çiz) çağrısı zaman aşımı — JSON üretimi sohbetten biraz uzun olabilir. */
export const DESIGN_TIMEOUT_MS = 60_000;

/** Render (görsel) çağrısı zaman aşımı — difüzyon/görsel üretimi en yavaşı. */
export const RENDER_TIMEOUT_MS = 120_000;

/** Zaman aşımında atılan hata (iptalden ayırt edilebilir; loglarda anlamlı). */
export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`AI çağrısı ${ms} ms içinde yanıt vermedi (zaman aşımı).`);
    this.name = 'TimeoutError';
  }
}

/**
 * `ms` sonra (veya `parent` iptal olursa) tetiklenen bir AbortSignal üretir. `dispose()` zamanlayıcıyı
 * ve dinleyiciyi temizler — başarı/başarısızlık fark etmez HER ZAMAN çağrılmalı (sızıntı/yanlış-iptal
 * önlemi). Süre kaynaklı iptalin reason'ı `TimeoutError` olur (parent iptalinde parent.reason korunur).
 */
export function withTimeout(
  ms: number,
  parent?: AbortSignal,
): { signal: AbortSignal; dispose: () => void } {
  const ctrl = new AbortController();
  const onParentAbort = (): void => ctrl.abort((parent as AbortSignal).reason);

  if (parent) {
    if (parent.aborted) ctrl.abort(parent.reason);
    else parent.addEventListener('abort', onParentAbort, { once: true });
  }

  const timer = setTimeout(() => ctrl.abort(new TimeoutError(ms)), ms);
  // Node: testte/işlemde süreç bitişini bloklamasın.
  (timer as { unref?: () => void }).unref?.();

  const dispose = (): void => {
    clearTimeout(timer);
    parent?.removeEventListener('abort', onParentAbort);
  };
  return { signal: ctrl.signal, dispose };
}

/**
 * AKIŞ için boşta-kalma (idle) zaman aşımı: `ms` boyunca HİÇBİR etkinlik (`bump()`) olmazsa iptal.
 * Mutlak deadline'ın aksine, token akmaya devam ettikçe (her delta `bump()`) sağlıklı ama uzun bir
 * yanıt KESİLMEZ; yalnız ASKIDA (etkinliksiz) upstream iptal olur → maliyet yine korunur. Düşünme fazı
 * metin yaymaz; `ms` penceresi (kademe süresi) bunu kapsayacak kadar geniş. (Denetim bulgusu.)
 */
export function withIdleTimeout(
  ms: number,
  parent?: AbortSignal,
): { signal: AbortSignal; bump: () => void; dispose: () => void } {
  const ctrl = new AbortController();
  const onParentAbort = (): void => ctrl.abort((parent as AbortSignal).reason);
  if (parent) {
    if (parent.aborted) ctrl.abort(parent.reason);
    else parent.addEventListener('abort', onParentAbort, { once: true });
  }
  let timer: ReturnType<typeof setTimeout>;
  const arm = (): void => {
    timer = setTimeout(() => ctrl.abort(new TimeoutError(ms)), ms);
    (timer as { unref?: () => void }).unref?.();
  };
  const bump = (): void => {
    clearTimeout(timer);
    arm();
  };
  arm();
  const dispose = (): void => {
    clearTimeout(timer);
    parent?.removeEventListener('abort', onParentAbort);
  };
  return { signal: ctrl.signal, bump, dispose };
}
