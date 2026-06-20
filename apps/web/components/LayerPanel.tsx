'use client';

import { useEffect, useState } from 'react';
import type { EntityStore } from '@zynpparti/document';
import type { LayerState } from '@zynpparti/engine';

/** layerId → Türkçe görünen ad. Bilinmeyen id'ler olduğu gibi gösterilir. */
const LAYER_NAMES: Record<string, string> = {
  default: 'Mimari',
  rooms: 'Mahaller',
  site: 'Parsel',
};
/** Sabit gösterim sırası (bilinenler önce). */
const ORDER = ['default', 'rooms', 'site'];

function layerName(id: string): string {
  return LAYER_NAMES[id] ?? id;
}

function collect(store: EntityStore): { id: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const e of store.all()) counts.set(e.layerId, (counts.get(e.layerId) ?? 0) + 1);
  return [...counts.entries()]
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => {
      const ia = ORDER.indexOf(a.id);
      const ib = ORDER.indexOf(b.id);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.id.localeCompare(b.id);
    });
}

interface LayerPanelProps {
  store: EntityStore;
  layers: LayerState;
}

/**
 * Katman paneli: kullanımdaki katmanları listeler + görünürlük aç/kapa (göz). Gizli katman çizilmez
 * ve seçilemez (hit-test atlar). Görünürlük view-state'tir (LayerState; undo dışı).
 */
export function LayerPanel({ store, layers }: LayerPanelProps) {
  const [, bump] = useState(0);
  const rerender = () => bump((v) => v + 1);

  useEffect(() => {
    const u1 = store.subscribe(rerender);
    const u2 = layers.subscribe(rerender);
    return () => {
      u1();
      u2();
    };
  }, [store, layers]);

  const rows = collect(store);
  if (rows.length === 0) return null;

  return (
    <div className="absolute left-4 top-28 w-48 rounded-lg bg-black/60 p-2 text-sm text-white backdrop-blur">
      <div className="mb-1 px-1 font-semibold opacity-80">Katmanlar</div>
      <div className="flex flex-col gap-0.5">
        {rows.map(({ id, count }) => {
          const hidden = layers.isHidden(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => layers.toggle(id)}
              className="flex items-center gap-2 rounded px-1 py-1 text-left hover:bg-white/10"
              title={hidden ? 'Göster' : 'Gizle'}
            >
              <span className="w-4 text-center opacity-80">{hidden ? '🚫' : '👁'}</span>
              <span className={`flex-1 ${hidden ? 'opacity-40 line-through' : ''}`}>
                {layerName(id)}
              </span>
              <span className="tabular-nums opacity-50">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
