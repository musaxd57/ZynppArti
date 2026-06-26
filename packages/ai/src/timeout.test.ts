import { describe, it, expect, vi } from 'vitest';
import { withTimeout, withIdleTimeout, tierTimeoutMs, TimeoutError, DESIGN_TIMEOUT_MS, RENDER_TIMEOUT_MS } from './timeout';

describe('tierTimeoutMs', () => {
  it('karmaşık kademe en uzun süre', () => {
    expect(tierTimeoutMs('complex')).toBeGreaterThan(tierTimeoutMs('simple'));
    expect(tierTimeoutMs('simple')).toBe(tierTimeoutMs('medium'));
  });
  it('render > design > sohbet sürelerinin makul sıralaması', () => {
    expect(RENDER_TIMEOUT_MS).toBeGreaterThanOrEqual(DESIGN_TIMEOUT_MS);
    expect(DESIGN_TIMEOUT_MS).toBeGreaterThanOrEqual(tierTimeoutMs('complex'));
  });
});

describe('withTimeout', () => {
  it('süre dolunca signal TimeoutError ile iptal olur', () => {
    vi.useFakeTimers();
    const { signal, dispose } = withTimeout(1000);
    expect(signal.aborted).toBe(false);
    vi.advanceTimersByTime(1000);
    expect(signal.aborted).toBe(true);
    expect(signal.reason).toBeInstanceOf(TimeoutError);
    dispose();
    vi.useRealTimers();
  });

  it('parent iptal olursa signal de iptal (parent.reason korunur)', () => {
    const parent = new AbortController();
    const { signal, dispose } = withTimeout(60_000, parent.signal);
    expect(signal.aborted).toBe(false);
    const reason = new Error('istemci koptu');
    parent.abort(reason);
    expect(signal.aborted).toBe(true);
    expect(signal.reason).toBe(reason);
    dispose();
  });

  it('parent zaten iptalse signal anında iptal', () => {
    const parent = new AbortController();
    parent.abort(new Error('önceden iptal'));
    const { signal, dispose } = withTimeout(60_000, parent.signal);
    expect(signal.aborted).toBe(true);
    dispose();
  });

  it('dispose sonrası zamanlayıcı tetiklenmez (sızıntı/yanlış-iptal yok)', () => {
    vi.useFakeTimers();
    const { signal, dispose } = withTimeout(1000);
    dispose();
    vi.advanceTimersByTime(5000);
    expect(signal.aborted).toBe(false);
    vi.useRealTimers();
  });
});

describe('withIdleTimeout', () => {
  it('bump() penceresi sıfırlar → akan stream kesilmez; etkinlik durunca iptal', () => {
    vi.useFakeTimers();
    const { signal, bump, dispose } = withIdleTimeout(1000);
    // 0.8sn sonra bir token → bump; 0.8sn daha → bump; toplam 1.6sn > 1sn ama hiç kesilmedi.
    vi.advanceTimersByTime(800);
    bump();
    expect(signal.aborted).toBe(false);
    vi.advanceTimersByTime(800);
    bump();
    expect(signal.aborted).toBe(false);
    // Şimdi etkinlik dur → 1sn sonra iptal.
    vi.advanceTimersByTime(1000);
    expect(signal.aborted).toBe(true);
    expect(signal.reason).toBeInstanceOf(TimeoutError);
    dispose();
    vi.useRealTimers();
  });

  it('parent iptali idle timeout-u da iptal eder', () => {
    const parent = new AbortController();
    const { signal, dispose } = withIdleTimeout(60_000, parent.signal);
    parent.abort(new Error('istemci koptu'));
    expect(signal.aborted).toBe(true);
    dispose();
  });
});
