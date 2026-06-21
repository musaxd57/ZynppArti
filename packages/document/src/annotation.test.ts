import { describe, it, expect } from 'vitest';
import { annotationSize, pointInAnnotation, DEFAULT_ANNOTATION_HEIGHT } from './annotation';
import type { Annotation } from './entities';

const make = (over: Partial<Annotation> = {}): Annotation => ({
  id: 'a1',
  type: 'annotation',
  layerId: 'annotation',
  position: { x: 0, y: 0 },
  text: 'Salon',
  height: 20,
  ...over,
});

describe('annotationSize', () => {
  it('genişlik en uzun satıra, yükseklik satır sayısına göre büyür', () => {
    const one = annotationSize(make({ text: 'AB' }));
    const two = annotationSize(make({ text: 'AB\nCD' }));
    expect(two.h).toBeCloseTo(one.h * 2, 6);
    expect(two.w).toBeCloseTo(one.w, 6); // aynı en uzun satır
  });

  it('en uzun satır genişliği belirler', () => {
    const s = annotationSize(make({ text: 'A\nABCDE' }));
    const ref = annotationSize(make({ text: 'ABCDE' }));
    expect(s.w).toBeCloseTo(ref.w, 6);
  });

  it('boş metin dejenere olmaz (en az 1 satır/sütun)', () => {
    const s = annotationSize(make({ text: '' }));
    expect(s.w).toBeGreaterThan(0);
    expect(s.h).toBeGreaterThan(0);
  });
});

describe('pointInAnnotation', () => {
  it('kutu içi true, dışı false (sol-üst köşeden +genişlik/+yükseklik)', () => {
    const a = make({ position: { x: 100, y: 50 }, text: 'AB', height: 20 });
    const { w, h } = annotationSize(a);
    expect(pointInAnnotation(a, { x: 100 + w / 2, y: 50 + h / 2 })).toBe(true);
    expect(pointInAnnotation(a, { x: 99, y: 50 })).toBe(false); // köşenin solu
    expect(pointInAnnotation(a, { x: 100 + w + 1, y: 50 })).toBe(false);
  });
});

describe('DEFAULT_ANNOTATION_HEIGHT', () => {
  it('makul varsayılan (cm)', () => {
    expect(DEFAULT_ANNOTATION_HEIGHT).toBeGreaterThan(0);
  });
});
