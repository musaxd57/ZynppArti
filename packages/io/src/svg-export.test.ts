import { describe, it, expect } from 'vitest';
import { computeSection, type Annotation, type Space, type Wall } from '@zynpparti/document';
import { exportSvg, exportSectionSvg } from './svg-export';

const wall: Wall = {
  id: 'w',
  type: 'wall',
  layerId: 'default',
  start: { x: 0, y: 0 },
  end: { x: 200, y: 0 },
  thickness: 20,
};

describe('exportSvg', () => {
  it('boş girdi → geçerli ama içerik-dışı SVG', () => {
    const svg = exportSvg([]);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('duvarı kalınlık = stroke-width olan bir line olarak yazar', () => {
    const svg = exportSvg([wall]);
    expect(svg).toContain('<line');
    expect(svg).toContain('stroke-width="20"');
  });

  it('viewBox tüm entity sınırlarını çevreler (margin dahil)', () => {
    const svg = exportSvg([wall]);
    const m = svg.match(/viewBox="([^"]+)"/);
    expect(m).not.toBeNull();
    const [minX, minY, w, h] = (m?.[1] ?? '').split(' ').map(Number);
    // margin 50 + yarı kalınlık 10 → minX ≤ -50, genişlik 200 + 2*50 + kalınlık payı
    expect(minX).toBeLessThanOrEqual(-50);
    expect(minY).toBeLessThanOrEqual(-50);
    expect(w).toBeGreaterThanOrEqual(300);
    expect(h).toBeGreaterThan(0);
  });

  it('mahalı dolgulu polygon + ad metni olarak yazar', () => {
    const space: Space = {
      id: 's',
      type: 'space',
      layerId: 'rooms',
      name: 'Salon',
      roomType: 'living',
      boundary: [
        { x: 0, y: 0 },
        { x: 300, y: 0 },
        { x: 300, y: 200 },
        { x: 0, y: 200 },
      ],
    };
    const svg = exportSvg([space]);
    expect(svg).toContain('<polygon');
    expect(svg).toContain('Salon');
  });

  it('metni XML-escape eder', () => {
    const ann: Annotation = {
      id: 'a',
      type: 'annotation',
      layerId: 'annotation',
      position: { x: 0, y: 0 },
      text: 'A & B <ölçü>',
      height: 30,
    };
    const svg = exportSvg([ann]);
    expect(svg).toContain('A &amp; B &lt;ölçü&gt;');
    expect(svg).not.toContain('A & B <ölçü>');
  });

  it('exportSectionSvg: kesilen duvarları rect + zemin çizgisi olarak yazar', () => {
    const walls: Wall[] = [
      { id: 'a', type: 'wall', layerId: 'default', start: { x: 100, y: -50 }, end: { x: 100, y: 50 }, thickness: 20, height: 300 },
    ];
    const section = computeSection({ x: 0, y: 0 }, { x: 400, y: 0 }, walls);
    const svg = exportSectionSvg(section);
    expect(svg).toContain('<svg');
    expect(svg).toContain('<rect'); // duvar gövdesi
    expect(svg).toContain('<line'); // zemin
  });

  it('exportSectionSvg: boş kesit → geçerli ama içerik-dışı SVG', () => {
    const section = computeSection({ x: 0, y: 0 }, { x: 100, y: 0 }, []);
    expect(exportSectionSvg(section)).toContain('<svg');
  });
});
