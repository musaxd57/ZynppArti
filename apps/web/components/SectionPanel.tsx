'use client';

import { useEffect, useState } from 'react';
import {
  computeSection,
  solidBands,
  RemoveEntity,
  DEFAULT_WALL_HEIGHT_CM,
  type EntityStore,
  type History,
  type Opening,
  type SectionLine,
  type Wall,
} from '@zynpparti/document';
import { exportSectionSvg } from '@zynpparti/io';
import { Panel } from './Panel';

interface SectionPanelProps {
  store: EntityStore;
  history: History;
  /** Seçili entity id'leri — bir kesit seçiliyse panel onu gösterir (yoksa en son çizilen). */
  selectedIds: string[];
}

function walls(store: EntityStore): Wall[] {
  return store.all().filter((e): e is Wall => e.type === 'wall');
}

function openings(store: EntityStore): Opening[] {
  return store.all().filter((e): e is Opening => e.type === 'opening');
}

function sections(store: EntityStore): SectionLine[] {
  return store.all().filter((e): e is SectionLine => e.type === 'section');
}

/**
 * Hangi kesit gösterilecek? Seçili bir kesit varsa o; yoksa en son eklenen kesit (store sırası).
 */
function activeSection(store: EntityStore, selectedIds: string[]): SectionLine | null {
  const all = sections(store);
  if (all.length === 0) return null;
  for (const id of selectedIds) {
    const sel = all.find((s) => s.id === id);
    if (sel) return sel;
  }
  return all[all.length - 1] ?? null;
}

/**
 * Şematik kesit görünümü (ADR-0016/0039): planda "Kesit" (C) aracıyla çizilen kesit çizgisi artık
 * kalıcı bir `section` entity'sidir (kaydet/aç'a girer, undo'lanır). Bu panel seçili/son kesiti
 * okuyup, o çizgiyi kesen duvarları kat tabanından yüksekliğine kadar SVG'de canlı gösterir.
 * Hafif şematik; tam 3B kesit Faz 5.
 */
export function SectionPanel({ store, history, selectedIds }: SectionPanelProps) {
  const [, bump] = useState(0);
  useEffect(() => store.subscribe(() => bump((v) => v + 1)), [store]);

  const W = 240; // SVG genişliği (px)
  const H = 120; // SVG yüksekliği (px)
  const pad = 8;

  const section = activeSection(store, selectedIds);

  let body: React.ReactNode;
  if (!section) {
    body = (
      <div className="px-1 py-2 text-xs opacity-50">Araç çubuğundan “Kesit” (C) ile planda bir çizgi çiz.</div>
    );
  } else {
    const remove = (): void => {
      history.dispatch(new RemoveEntity(section.id));
    };
    // computeSection render sırasında çağrılır → bir geometri hatası fırlatırsa TÜM panel çökerdi.
    // Guard'la: hata olursa güvenli hata gövdesi göster (+ Sil), app sürer. (Denetim bulgusu.)
    let s: ReturnType<typeof computeSection> | null = null;
    try {
      s = computeSection(section.a, section.b, walls(store), openings(store));
    } catch (e) {
      console.error('computeSection başarısız:', e);
    }
    if (!s) {
      body = (
        <div className="flex flex-col gap-1">
          <div className="px-1 py-2 text-xs text-red-300">Kesit hesaplanamadı (geometri hatası).</div>
          <button
            type="button"
            onClick={remove}
            className="rounded bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
          >
            Sil
          </button>
        </div>
      );
    } else if (s.cuts.length === 0) {
      body = (
        <div className="flex flex-col gap-1">
          <div className="px-1 py-2 text-xs opacity-50">
            Kesit {section.label}—{section.label}' hiçbir duvarı kesmiyor.
          </div>
          <button
            type="button"
            onClick={remove}
            className="rounded bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
          >
            Sil
          </button>
        </div>
      );
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
            {s.cuts.flatMap((c, i) => {
              const cx = pad + (c.offsetCm / len) * innerW;
              const w = Math.max(2, (c.widthCm / len) * innerW);
              // Dolu bantlar (boşluk varsa açıklık çıkarılır); her bant ayrı dikdörtgen.
              return solidBands(c).map((band, j) => {
                const y0 = floorY - (band.to / maxH) * innerH;
                const y1 = floorY - (band.from / maxH) * innerH;
                return (
                  <rect
                    key={`${i}-${j}`}
                    x={cx - w / 2}
                    y={y0}
                    width={w}
                    height={Math.max(0, y1 - y0)}
                    fill="#cfcfd6"
                    stroke="#1a1a1a"
                    strokeWidth={0.5}
                  />
                );
              });
            })}
          </svg>
          <div className="px-1 text-[10px] opacity-60">
            {section.label}—{section.label}' · {s.cuts.length} duvar
            {(() => {
              const doors = s.cuts.filter((c) => c.opening?.kind === 'door').length;
              const wins = s.cuts.filter((c) => c.opening?.kind === 'window').length;
              const parts = [doors ? `${doors} kapı` : '', wins ? `${wins} pencere` : '']
                .filter(Boolean)
                .join(', ');
              return parts ? ` (${parts} boşluğu)` : '';
            })()}{' '}
            · uzunluk {(s.lengthCm / 100).toFixed(2).replace('.', ',')} m · maks. yükseklik{' '}
            {Math.round(s.maxHeightCm)} cm
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => {
                const blob = new Blob([exportSectionSvg(s)], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `zynpparti-kesit-${section.label}.svg`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex-1 rounded bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
            >
              Kesit SVG indir
            </button>
            <button
              type="button"
              onClick={remove}
              title="Bu kesit çizgisini sil (geri alınabilir)"
              className="rounded bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
            >
              Sil
            </button>
          </div>
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
