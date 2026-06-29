import { describe, it, expect } from 'vitest';
import { snapSegmentsToGrid, type Seg4 } from './weld';

describe('snapSegmentsToGrid', () => {
  it('boş girdi → boş çıktı', () => {
    expect(snapSegmentsToGrid([], 50)).toEqual([]);
  });

  it('tol<=0 → değişmeden kopyalar', () => {
    const segs: Seg4[] = [[0, 0, 100, 3]];
    expect(snapSegmentsToGrid(segs, 0)).toEqual(segs);
  });

  it('iç duvarın alt ucu, yakın olduğu dış duvar çizgisine oturur (T-bağlantı kapanır)', () => {
    // Dış alt duvar y=300'de; iç düşey duvar y=270'te bitiyor (30 cm boşluk).
    const segs: Seg4[] = [
      [0, 300, 600, 300], // dış alt duvar
      [300, 0, 300, 270], // iç düşey duvar — alt ucu 30 cm yukarıda
    ];
    const out = snapSegmentsToGrid(segs, 50);
    // 270 ve 300 (×2) → ortalama 290'a kümelenir; iç duvar artık dış duvar çizgisine değer.
    expect(out[1]![3]).toBeCloseTo(out[0]![1]!, 6);
    expect(out[1]![3]).toBeCloseTo(290, 6);
  });

  it('köşede buluşan iki uç tek noktaya kaynar', () => {
    const segs: Seg4[] = [
      [0, 0, 500, 5], // yatay, sağ ucu y=5
      [495, 0, 495, 400], // düşey, x=495
    ];
    const out = snapSegmentsToGrid(segs, 20);
    // x: 495,495,500,0 → 495 ve 500 birleşir (≈497.5); y: 0,0,5,400 → 0 ve 5 birleşir (≈2.5)
    expect(out[0]![2]).toBeCloseTo(out[1]![0]!, 6); // ortak X
    expect(out[0]![1]).toBeCloseTo(out[1]![1]!, 6); // ortak Y (üst uç)
  });

  it('gerçekten uzak çizgileri birleştirmez (tol içi değil)', () => {
    const segs: Seg4[] = [
      [0, 0, 0, 300], // sol duvar x=0
      [400, 0, 400, 300], // sağ duvar x=400 (400 cm uzak)
    ];
    const out = snapSegmentsToGrid(segs, 50);
    expect(out[0]![0]).toBeCloseTo(0, 6);
    expect(out[1]![0]).toBeCloseTo(400, 6);
  });

  it('kümeleme zincirlemez — bir küme anchor’dan en çok `tol` genişler', () => {
    // X=0, 40, 80 (düşey duvarlar → her birinin tek X'i). 0↔80 = 80 (>50) → tek kümeye düşmemeli.
    const segs: Seg4[] = [
      [0, 0, 0, 10],
      [40, 0, 40, 10],
      [80, 0, 80, 10],
    ];
    const out = snapSegmentsToGrid(segs, 50);
    // anchor 0: 40 dahil (≤50), 80 hariç → küme {0,40} mean 20; 80 ayrı kalır.
    expect(out[0]![0]).toBeCloseTo(20, 6);
    expect(out[1]![0]).toBeCloseTo(20, 6);
    expect(out[2]![0]).toBeCloseTo(80, 6);
  });
});
