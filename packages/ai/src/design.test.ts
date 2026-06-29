import { describe, it, expect } from 'vitest';
import { parseLayout, parseLayouts } from './design';

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

  it('JSON öncesi süs parantezli prozayı atlayıp gerçek planı bulur', () => {
    // Eski kod ilk "{ana mekan}" bloğunda parse hatasında null dönüp geçerli planı atıyordu.
    const out = parseLayout('Salon {ana mekan} için: {"summary":"x","walls":[[0,0,100,0]],"rooms":[]}');
    expect(out).not.toBeNull();
    expect(out!.walls).toHaveLength(1);
  });

  it('aşırı duvar sayısını reddeder (UI donma koruması)', () => {
    const many = Array.from({ length: 700 }, (_, i) => [0, i, 100, i]);
    expect(parseLayout(JSON.stringify({ walls: many, rooms: [] }))).toBeNull();
  });

  it('saçma büyüklükte koordinatı eler', () => {
    const out = parseLayout('{"walls":[[0,0,9999999999,0],[0,0,100,0]],"rooms":[]}');
    expect(out!.walls).toEqual([[0, 0, 100, 0]]); // devasa koordinatlı duvar atıldı
  });

  it('kapı/pencere ayrıştırır; geçersiz kind elenir, eksik genişlik varsayılır', () => {
    const out = parseLayout(
      '{"walls":[[0,0,400,0]],"rooms":[],"openings":[{"kind":"door","cx":200,"cy":0,"width":90},{"kind":"x","cx":1,"cy":1},{"kind":"window","cx":50,"cy":0}]}',
    );
    expect(out!.openings).toHaveLength(2);
    expect(out!.openings[0]).toEqual({ kind: 'door', cx: 200, cy: 0, width: 90 });
    expect(out!.openings[1]!.width).toBe(120); // pencere varsayılan genişlik
  });

  it('openings yoksa boş dizi', () => {
    expect(parseLayout('{"walls":[[0,0,100,0]],"rooms":[]}')!.openings).toEqual([]);
  });

  it('cx/cy eksik odayı atlar, summary varsayılanı koyar', () => {
    const out = parseLayout('{"walls":[[0,0,100,0]],"rooms":[{"name":"Yarım"}]}');
    expect(out!.rooms).toHaveLength(0);
    expect(out!.summary).toBe('Taslak plan üretildi.');
  });

  // KÜME 3 — LLM çıktısı sertleştirme (boş-ad / aşırı oda / devasa summary)
  it('boş/yalnız-boşluk adlı odayı reddeder, adı kırpar', () => {
    const out = parseLayout(
      '{"walls":[[0,0,100,0]],"rooms":[{"name":"   ","cx":1,"cy":1},{"name":"Salon","cx":2,"cy":2}]}',
    );
    expect(out!.rooms).toHaveLength(1);
    expect(out!.rooms[0]!.name).toBe('Salon');
  });

  it('aşırı oda sayısını sınırlar (≤300, UI donma koruması)', () => {
    const rooms = Array.from({ length: 500 }, (_, i) => ({ name: `O${i}`, cx: i, cy: 0 }));
    const out = parseLayout(JSON.stringify({ walls: [[0, 0, 100, 0]], rooms }));
    expect(out!.rooms.length).toBeLessThanOrEqual(300);
  });

  it('devasa summary kırpılır (≤280)', () => {
    const out = parseLayout(
      JSON.stringify({ summary: 'x'.repeat(5000), walls: [[0, 0, 100, 0]], rooms: [] }),
    );
    expect(out!.summary.length).toBeLessThanOrEqual(280);
  });
});

describe('parseLayouts (varyantlar)', () => {
  it('variants sarmalını ayrıştırır', () => {
    const out = parseLayouts(
      '{"variants":[{"walls":[[0,0,100,0]],"rooms":[],"openings":[]},{"walls":[[0,0,200,0]],"rooms":[],"openings":[]}]}',
    );
    expect(out).toHaveLength(2);
    expect(out[1]!.walls[0]![2]).toBe(200);
  });

  it('tek plan → tek elemanlı dizi', () => {
    expect(parseLayouts('{"walls":[[0,0,100,0]],"rooms":[]}')).toHaveLength(1);
  });

  it('geçersiz varyantları eler', () => {
    expect(parseLayouts('{"variants":[{"walls":[]},{"walls":[[0,0,100,0]]}]}')).toHaveLength(1);
  });

  it('öndeki GEÇERLİ-ama-layout-olmayan JSON objesini atlayıp gerçek planı bulur', () => {
    // Model planı önce {"note":...} gibi geçerli JSON yazınca eski kod ilk blokta durup [] dönerdi.
    const out = parseLayouts('{"note":"işte planınız"}\n{"walls":[[0,0,300,0]],"rooms":[],"openings":[]}');
    expect(out).toHaveLength(1);
    expect(out[0]!.walls[0]![2]).toBe(300);
    // parseLayout (tekil) de aynı şekilde atlamalı.
    expect(parseLayout('{"meta":1}{"walls":[[0,0,150,0]],"rooms":[]}')!.walls[0]![2]).toBe(150);
  });
});
