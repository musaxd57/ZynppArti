import { describe, it, expect } from 'vitest';
import { commentSize, COMMENT_PIN } from './comment';
import { serializeModel, deserializeModel } from './serialize';
import { isClonable, offsetEntity } from './clone';
import type { Comment } from './entities';

function comment(x: number, y: number, text: string): Comment {
  return { id: 'c1', type: 'comment', layerId: 'comment', position: { x, y }, text };
}

describe('commentSize', () => {
  it('en az iğne boyutu kadar yükseklik + metinle artan genişlik döndürür', () => {
    const small = commentSize(comment(0, 0, 'a'));
    expect(small.h).toBeGreaterThanOrEqual(COMMENT_PIN);
    expect(small.w).toBeGreaterThan(COMMENT_PIN);
    // Daha uzun metin → daha geniş kutu.
    const wide = commentSize(comment(0, 0, 'çok daha uzun bir yorum metni'));
    expect(wide.w).toBeGreaterThan(small.w);
  });

  it('çok satırlı metinde yükseklik satır sayısıyla artar', () => {
    const one = commentSize(comment(0, 0, 'tek satır'));
    const three = commentSize(comment(0, 0, 'bir\niki\nüç'));
    expect(three.h).toBeGreaterThan(one.h);
  });
});

describe('comment serialize/clone', () => {
  it('serialize → deserialize round-trip korunur', () => {
    const c = comment(120, -40, 'duvar burada ince kalmış');
    const restored = deserializeModel(serializeModel([c]));
    expect(restored).toHaveLength(1);
    expect(restored[0]).toEqual(c);
  });

  it('kopyalanabilir ve (dx,dy) kadar kayar (tip/metin korunur)', () => {
    const c = comment(100, 200, 'not');
    expect(isClonable(c)).toBe(true);
    const moved = offsetEntity(c, 10, -5) as Comment;
    expect(moved.type).toBe('comment');
    expect(moved.text).toBe('not');
    expect(moved.position).toEqual({ x: 110, y: 195 });
  });
});
