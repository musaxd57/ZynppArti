import { describe, it, expect, vi } from 'vitest';
import { LayerState } from './layer-state';

describe('LayerState', () => {
  it('görünürlük varsayılan açık; setHidden/isHidden çalışır', () => {
    const s = new LayerState();
    expect(s.isHidden('a')).toBe(false);
    s.setHidden('a', true);
    expect(s.isHidden('a')).toBe(true);
    s.setHidden('a', false);
    expect(s.isHidden('a')).toBe(false);
  });

  it('toggle görünürlüğü tersine çevirir', () => {
    const s = new LayerState();
    s.toggle('x');
    expect(s.isHidden('x')).toBe(true);
    s.toggle('x');
    expect(s.isHidden('x')).toBe(false);
  });

  it('kilit görünürlükten bağımsızdır', () => {
    const s = new LayerState();
    s.setLocked('a', true);
    expect(s.isLocked('a')).toBe(true);
    expect(s.isHidden('a')).toBe(false); // kilit ≠ gizli
    s.toggleLock('a');
    expect(s.isLocked('a')).toBe(false);
  });

  it('değişimde aboneleri bildirir; abonelik iptal edilebilir', () => {
    const s = new LayerState();
    const fn = vi.fn();
    const off = s.subscribe(fn);
    s.setHidden('a', true);
    s.toggleLock('a');
    expect(fn).toHaveBeenCalledTimes(2);
    off();
    s.setHidden('a', false);
    expect(fn).toHaveBeenCalledTimes(2); // iptalden sonra çağrılmaz
  });
});
