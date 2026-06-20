'use client';

import { useEffect, useState } from 'react';
import type { EntityStore } from '@zynpparti/document';
import type { LayerState } from '@zynpparti/engine';
import { Panel } from './Panel';

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
    <Panel title="Katmanlar" widthClass="w-52">
      <div className="flex flex-col gap-0.5">
        {rows.map(({ id, count }) => {
          const hidden = layers.isHidden(id);
          const locked = layers.isLocked(id);
          return (
            <div key={id} className="flex items-center gap-1 rounded px-1 py-1 hover:bg-white/10">
              <button
                type="button"
                onClick={() => layers.toggle(id)}
                className="w-5 text-center opacity-80 hover:opacity-100"
                title={hidden ? 'Göster' : 'Gizle'}
              >
                {hidden ? '🚫' : '👁'}
              </button>
              <button
                type="button"
                onClick={() => layers.toggleLock(id)}
                className="w-5 text-center opacity-80 hover:opacity-100"
                title={locked ? 'Kilidi aç' : 'Kilitle'}
              >
                {locked ? '🔒' : '🔓'}
              </button>
              <span className={`flex-1 ${hidden ? 'opacity-40 line-through' : ''}`}>
                {layerName(id)}
              </span>
              <span className="tabular-nums opacity-50">{count}</span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
