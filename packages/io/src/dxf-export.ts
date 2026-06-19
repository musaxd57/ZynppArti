import type { Wall } from '@zynpparti/document';

/**
 * Duvarları minimal (R12 tarzı) DXF metnine LINE entity'leri olarak dışa aktarır.
 * Katman adı korunur; koordinatlar cm cinsindendir (iç birim, ADR-0008).
 */
export function exportDxf(walls: readonly Wall[]): string {
  const out: string[] = ['0', 'SECTION', '2', 'ENTITIES'];
  for (const w of walls) {
    out.push(
      '0', 'LINE',
      '8', w.layerId,
      '10', fmt(w.start.x), '20', fmt(w.start.y), '30', '0',
      '11', fmt(w.end.x), '21', fmt(w.end.y), '31', '0',
    );
  }
  out.push('0', 'ENDSEC', '0', 'EOF');
  return out.join('\n') + '\n';
}

function fmt(n: number): string {
  return n.toFixed(4);
}
