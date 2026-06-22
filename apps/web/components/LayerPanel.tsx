'use client';

import { useEffect, useState } from 'react';
import type { EntityStore } from '@zynpparti/document';
import type { LayerState } from '@zynpparti/engine';
import { Panel } from './Panel';

/** layerId → Türkçe görünen ad. Bilinmeyen id'ler olduğu gibi gösterilir. */
const LAYER_NAMES: Record<string, string> = {
  default: 'Mimari',
  rooms: 'Mahaller',
  furniture: 'Mobilya',
  annotation: 'Notlar',
  site: 'Parsel',
  sheet: 'Paftalar',
};
/** Sabit gösterim sırası (bilinenler önce). */
const ORDER = ['default', 'rooms', 'furniture', 'annotation', 'site', 'sheet'];

/** Katman kimlik rengi (sol şerit) — hızlı görsel tanıma (Figma/AutoCAD deseni). */
const LAYER_COLORS: Record<string, string> = {
  default: '#94a3b8', // slate
  rooms: '#3b82f6', // mavi
  furniture: '#f59e0b', // amber
  annotation: '#a855f7', // mor
  site: '#22c55e', // yeşil
  sheet: '#9ca3af', // gri
};

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

/* Feather-tarzı 16px çizgi ikonlar (gömülü SVG — ek bağımlılık yok, emoji'den net). */
const ICON = 'h-4 w-4';
const svgProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function EyeIcon() {
  return (
    <svg className={ICON} {...svgProps}>
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg className={ICON} {...svgProps}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C5 20 1 12 1 12a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg className={ICON} {...svgProps}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function UnlockIcon() {
  return (
    <svg className={ICON} {...svgProps}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  );
}

interface LayerPanelProps {
  store: EntityStore;
  layers: LayerState;
}

/**
 * Katman paneli: kullanımdaki katmanları listeler + görünürlük (göz) ve kilit aç/kapa. Gizli katman
 * çizilmez ve seçilemez; **kilitli katman görünür kalır ama seçilemez/düzenlenemez** (hit-test atlar).
 * İkonlar net SVG; kilitli/gizli durum satırda görsel olarak da belirgindir.
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

  const hiddenCount = rows.filter((r) => layers.isHidden(r.id)).length;
  const badge = hiddenCount > 0 ? `${rows.length} · ${hiddenCount} gizli` : `${rows.length}`;

  const iconBtn =
    'grid h-6 w-6 place-items-center rounded transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400';

  return (
    <Panel title="Katmanlar" widthClass="w-56" badge={badge}>
      <div className="flex flex-col gap-0.5">
        {rows.map(({ id, count }) => {
          const hidden = layers.isHidden(id);
          const locked = layers.isLocked(id);
          const name = layerName(id);
          return (
            <div
              key={id}
              className="flex items-center gap-1.5 rounded px-1 py-1 hover:bg-white/10"
              title={locked ? `${name} kilitli — seçmek için kilidi aç` : name}
            >
              <span
                className="h-4 w-1 shrink-0 rounded-full"
                style={{ backgroundColor: LAYER_COLORS[id] ?? '#6b7280', opacity: hidden ? 0.3 : 1 }}
                aria-hidden
              />
              <button
                type="button"
                onClick={() => layers.toggle(id)}
                className={`${iconBtn} ${hidden ? 'text-white/35' : 'text-white/80'}`}
                aria-label={`${name} katmanını ${hidden ? 'göster' : 'gizle'}`}
                aria-pressed={!hidden}
                title={hidden ? 'Göster' : 'Gizle'}
              >
                {hidden ? <EyeOffIcon /> : <EyeIcon />}
              </button>
              <button
                type="button"
                onClick={() => layers.toggleLock(id)}
                className={`${iconBtn} ${locked ? 'text-amber-400' : 'text-white/60'}`}
                aria-label={`${name} katmanını ${locked ? 'kilidini aç' : 'kilitle'}`}
                aria-pressed={locked}
                title={locked ? 'Kilidi aç (seçilebilir yap)' : 'Kilitle'}
              >
                {locked ? <LockIcon /> : <UnlockIcon />}
              </button>
              <span
                className={`flex-1 truncate ${hidden ? 'text-white/35 line-through' : locked ? 'text-amber-200/90' : ''}`}
              >
                {name}
              </span>
              <span className="tabular-nums text-xs opacity-50">{count}</span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
