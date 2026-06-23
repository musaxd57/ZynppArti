import { describe, it, expect } from 'vitest';
import { parseLayout } from './design';

describe('parseLayout', () => {
  it('düz JSON ayrıştırır', () => {
    const out = parseLayout(
      '{"summary":"test","walls":[[0,0,400,0],[400,0,400,300]],"rooms":[{"name":"Salon","type":"living","cx":200,"cy":150}]}',
    );
    expect(out).not.toBeNull();
    expect(out!.walls).toHaveLength(2);
    expect(out!.rooms[0]!.name).toBe('Salon');
  });

  it('```json bloğu / önek metin içinden çıkarır', () => {
    const out = parseLayout('İşte plan:\n```json\n{"summary":"x","walls":[[0,0,500,0]],"rooms":[]}\n```\nUmarım uygundur.');
    expect(out).not.toBeNull();
    expect(out!.walls).toHaveLength(1);
  });

  it('dejenere (sıfır uzunluk) ve geçersiz duvarları eler', () => {
    const out = parseLayout('{"walls":[[0,0,0,0],[0,0,100,0],["a",0,1,2]],"rooms":[]}');
    expect(out).not.toBeNull();
    expect(out!.walls).toEqual([[0, 0, 100, 0]]);
  });

  it('hiç geçerli duvar yoksa null', () => {
    expect(parseLayout('{"walls":[],"rooms":[]}')).toBeNull();
    expect(parseLayout('JSON yok burada')).toBeNull();
  });

  it('cx/cy eksik odayı atlar, summary varsayılanı koyar', () => {
    const out = parseLayout('{"walls":[[0,0,100,0]],"rooms":[{"name":"Yarım"}]}');
    expect(out!.rooms).toHaveLength(0);
    expect(out!.summary).toBe('Taslak plan üretildi.');
  });
});
