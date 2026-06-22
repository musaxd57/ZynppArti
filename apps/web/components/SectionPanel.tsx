'use client';

import { useEffect, useState } from 'react';
import { computeSection, DEFAULT_WALL_HEIGHT_CM, type EntityStore, type Wall } from '@zynpparti/document';
import type { Vec2 } from '@zynpparti/geometry';
import { exportSectionSvg } from '@zynpparti/io';
import { Panel } from './Panel';

interface SectionPanelProps {
  store: EntityStore;
  /** Planda çizilen kesit çizgisi (a→b, dünya cm); yoksa boş durum. */
  line: [Vec2, Vec2] | null;
}

function walls(store: EntityStore): Wall[] {
  return store.all().filter((e): e is Wall => e.type === 'wall');
}

/**
 * Şematik kesit görünümü (ADR-0016): planda "Kesit" aracıyla çizgi çizilince, o çizgiyi kesen
 * duvarları kat tabanından yüksekliğine kadar dikdörtgenler olarak SVG'de gösterir. Canlı (duvar
 * değişince güncellenir). Hafif şematik; tam 3B kesit Faz 5.
 */
export function SectionPanel({ store, line }: SectionPanelProps) {
  const [, bump] = useState(0);
  useEffect(() => store.subscribe(() => bump((v) => v + 1)), [store]);

  const W = 240; // SVG genişliği (px)
  const H = 120; // SVG yüksekliği (px)
  const pad = 8;

  let body: React.ReactNode;
  if (!line) {
    body = <div className="px-1 py-2 text-xs opacity-50">Araç çubuğundan “Kesit” (C) ile planda bir çizgi çiz.</div>;
  } else {
    const s = computeSection(line[0], line[1], walls(store));
    if (s.cuts.length === 0) {
      body = <div className="px-1 py-2 text-xs opacity-50">Bu çizgi hiçbir duvarı kesmiyor.</div>;
    } else {
      const innerW = W - 2 * pad;
      const innerH = H - 2 * pad;
      const len = s.lengthCm || 1;
      const maxH = s.maxHeightCm || DEFAULT_WALL_HEIGHT_CM;
      const floorY = H - pad;
      body = (
        <div className="flex flex-col gap-1">
          <svg width={W} height={H} className="rounded bg-white/5">
            {/* zemin çizgisi */}
            <line x1={pad} y1={floorY} x2={W - pad} y2={floorY} stroke="#9aa0a8" strokeWidth={1} />
            {s.cuts.map((c, i) => {
              const cx = pad + (c.offsetCm / len) * innerW;
              const w = Math.max(2, (c.widthCm / len) * innerW);
              const h = (c.heightCm / maxH) * innerH;
              return (
                <rect
                  key={i}
                  x={cx - w / 2}
                  y={floorY - h}
                  width={w}
                  height={h}
                  fill="#cfcfd6"
                  stroke="#1a1a1a"
                  strokeWidth={0.5}
                />
              );
            })}
          </svg>
          <div className="px-1 text-[10px] opacity-60">
            {s.cuts.length} duvar · uzunluk {(s.lengthCm / 100).toFixed(2).replace('.', ',')} m · maks.
            yükseklik {Math.round(s.maxHeightCm)} cm
          </div>
          <button
            type="button"
            onClick={() => {
              const blob = new Blob([exportSectionSvg(s)], { type: 'image/svg+xml' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'zynpparti-kesit.svg';
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="rounded bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
          >
            Kesit SVG indir
          </button>
        </div>
      );
    }
  }

  return (
    <Panel title="Kesit (şematik)" widthClass="w-full" defaultOpen={false}>
      {body}
    </Panel>
  );
}
