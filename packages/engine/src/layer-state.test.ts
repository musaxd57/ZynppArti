import { describe, it, expect, vi } from 'vitest';
import { LayerState, DEFAULT_LAYER_ORDER } from './layer-state';

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

  it('solo: yalnız verilen katmanı gösterir, tekrar çağırınca çözer', () => {
    const s = new LayerState();
    const all = ['a', 'b', 'c'];
    s.solo('b', all);
    expect(s.isHidden('a')).toBe(true);
    expect(s.isHidden('b')).toBe(false);
    expect(s.isHidden('c')).toBe(true);
    expect(s.isSolo('b')).toBe(true);
    // aynı katmana tekrar solo → çöz (hepsi görünür)
    s.solo('b', all);
    expect(s.isHidden('a')).toBe(false);
    expect(s.isHidden('c')).toBe(false);
    expect(s.isSolo('b')).toBe(false);
  });

  it('elle görünürlük değişimi solo durumunu bozar', () => {
    const s = new LayerState();
    s.solo('a', ['a', 'b']);
    expect(s.isSolo('a')).toBe(true);
    s.toggle('b');
    expect(s.isSolo('a')).toBe(false);
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

  it('sortLayers: açık sıra yoksa DEFAULT_LAYER_ORDER, o da yoksa alfabetik son', () => {
    const s = new LayerState();
    // default sıra: annotation < section < default < furniture < rooms < site < sheet
    expect(s.sortLayers(['site', 'default', 'section'])).toEqual(['section', 'default', 'site']);
    // bilinmeyen katmanlar (rank 2000) alfabetik olarak en sona
    expect(s.sortLayers(['zeta', 'default', 'alpha'])).toEqual(['default', 'alpha', 'zeta']);
  });

  it('setOrder/getOrder: açık z-sırası DEFAULT_LAYER_ORDER yerine geçer + abone bildirilir', () => {
    const s = new LayerState();
    const fn = vi.fn();
    s.subscribe(fn);
    s.setOrder(['site', 'default', 'section']);
    expect(s.getOrder()).toEqual(['site', 'default', 'section']);
    expect(s.sortLayers(['section', 'site', 'default'])).toEqual(['site', 'default', 'section']);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('DEFAULT_LAYER_ORDER oda dolgu/etiket bandı dışındaki katmanları kapsar', () => {
    expect(DEFAULT_LAYER_ORDER).toContain('default');
    expect(DEFAULT_LAYER_ORDER).toContain('section');
  });
});
