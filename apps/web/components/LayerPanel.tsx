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
  comment: 'Yorumlar',
  site: 'Parsel',
  sheet: 'Paftalar',
  section: 'Kesit',
};

const ORDER_KEY = 'zynpparti.layerOrder';

/** Katman kimlik rengi (sol şerit) — hızlı görsel tanıma (Figma/AutoCAD deseni). */
const LAYER_COLORS: Record<string, string> = {
  default: '#94a3b8', // slate
  rooms: '#3b82f6', // mavi
  furniture: '#f59e0b', // amber
  annotation: '#a855f7', // mor
  comment: '#ffb454', // amber (yorum)
  site: '#22c55e', // yeşil
  sheet: '#9ca3af', // gri
  section: '#ff7a59', // turuncu (kesit düzlemi rengiyle aynı)
};

function layerName(id: string): string {
  return LAYER_NAMES[id] ?? id;
}

/** Kullanımdaki katmanları (entity sayısıyla) LayerState z-sırasına göre (ön→arka) döndürür. */
function collect(store: EntityStore, layers: LayerState): { id: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const e of store.all()) counts.set(e.layerId, (counts.get(e.layerId) ?? 0) + 1);
  const ordered = layers.sortLayers([...counts.keys()]);
  return ordered.map((id) => ({ id, count: counts.get(id) ?? 0 }));
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
function SoloIcon() {
  // hedef/nişangah — "yalnız bunu göster"
  return (
    <svg className={ICON} {...svgProps}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}
function GripIcon() {
  // sürükleme tutamacı (6 nokta) — "yukarı/aşağı sürükle"
  return (
    <svg className={ICON} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
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
  // Kullanıcı özel katman adları (çift-tık düzenle, localStorage). Yoksa kanonik ada düşer.
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  // Sürükle-sırala durumu: sürüklenen katman + üzerine gelinen hedef (görsel ipucu için).
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem('zynpparti.layerLabels');
      if (s) {
        // Bozuk/elle düzenlenmiş veriye karşı doğrula (order ile tutarlı): yalnız string değerli düz nesne
        // kabul; dizi/string/sayı-değer reddedilir (yoksa {...labels} string karakterlerini yayardı). L20.
        const obj: unknown = JSON.parse(s);
        if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
          const clean: Record<string, string> = {};
          for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
            if (typeof v === 'string') clean[k] = v;
          }
          setLabels(clean);
        }
      }
      const o = localStorage.getItem(ORDER_KEY);
      if (o) {
        const parsed: unknown = JSON.parse(o);
        // Bozuk/eski veriye karşı doğrula: yalnız string[] kabul (yabancı tipler sıralamayı bozmasın).
        if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string')) {
          layers.setOrder(parsed as string[]); // kaydedilmiş z-sırasını geri yükle
        }
      }
    } catch {
      /* yoksay */
    }
  }, [layers]);

  useEffect(() => {
    const u1 = store.subscribe(rerender);
    const u2 = layers.subscribe(rerender);
    return () => {
      u1();
      u2();
    };
  }, [store, layers]);

  const displayName = (id: string): string => labels[id] ?? layerName(id);
  const saveLabel = (id: string, value: string): void => {
    const v = value.trim();
    setLabels((prev) => {
      const next = { ...prev };
      if (!v || v === layerName(id)) delete next[id];
      else next[id] = v;
      try {
        localStorage.setItem('zynpparti.layerLabels', JSON.stringify(next));
      } catch {
        /* yoksay */
      }
      return next;
    });
    setEditingId(null);
  };

  const rows = collect(store, layers);
  if (rows.length === 0) return null;

  const allIds = rows.map((r) => r.id);

  /** `dragId`'yi `targetId`'nin önüne taşıyıp yeni z-sırasını uygular + kaydeder (ön→arka). */
  const reorder = (targetId: string): void => {
    if (!dragId || dragId === targetId) return;
    const next = allIds.filter((id) => id !== dragId);
    const at = next.indexOf(targetId);
    next.splice(at < 0 ? next.length : at, 0, dragId);
    layers.setOrder(next);
    try {
      localStorage.setItem(ORDER_KEY, JSON.stringify(next));
    } catch {
      /* yoksay */
    }
  };
  const hiddenCount = rows.filter((r) => layers.isHidden(r.id)).length;
  const badge = hiddenCount > 0 ? `${rows.length} · ${hiddenCount} gizli` : `${rows.length}`;

  const iconBtn =
    'grid h-6 w-6 place-items-center rounded transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400';

  return (
    <Panel title="Katmanlar" widthClass="w-full" badge={badge}>
      <div className="flex flex-col gap-0.5">
        {rows.map(({ id, count }) => {
          const hidden = layers.isHidden(id);
          const locked = layers.isLocked(id);
          const solo = layers.isSolo(id);
          const name = displayName(id);
          return (
            <div
              key={id}
              onDragOver={(e) => {
                e.preventDefault();
                if (overId !== id) setOverId(id);
              }}
              onDrop={(e) => {
                e.preventDefault();
                reorder(id);
                setDragId(null);
                setOverId(null);
              }}
              onDragEnd={() => {
                setDragId(null);
                setOverId(null);
              }}
              className={`flex items-center gap-1.5 rounded px-1 py-1 hover:bg-white/10 ${
                dragId === id ? 'opacity-40' : ''
              } ${overId === id && dragId !== id ? 'ring-1 ring-blue-400/70' : ''}`}
              title={locked ? `${name} kilitli — seçmek için kilidi aç` : name}
            >
              {/* Yalnız grip sürüklenebilir → rename input'u + buton tıklamaları bozulmaz. */}
              <span
                draggable
                onDragStart={(e) => {
                  setDragId(id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                className="grid h-5 w-3 shrink-0 cursor-grab place-items-center text-white/30 hover:text-white/60"
                aria-hidden
                title="Sürükle: katman z-sırasını değiştir (üst = önde)"
              >
                <GripIcon />
              </span>
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
                aria-label={locked ? `${name} katmanının kilidini aç` : `${name} katmanını kilitle`}
                aria-pressed={locked}
                title={locked ? 'Kilidi aç (seçilebilir yap)' : 'Kilitle'}
              >
                {locked ? <LockIcon /> : <UnlockIcon />}
              </button>
              <button
                type="button"
                onClick={() => layers.solo(id, allIds)}
                className={`${iconBtn} ${solo ? 'text-blue-400' : 'text-white/40'}`}
                aria-label={`${name} katmanı: ${solo ? 'soloyu çöz' : 'yalnız bunu göster'}`}
                aria-pressed={solo}
                title={solo ? 'Solo’yu çöz (hepsini göster)' : 'Yalnız bunu göster (solo)'}
              >
                <SoloIcon />
              </button>
              {editingId === id ? (
                <input
                  autoFocus
                  draggable={false}
                  defaultValue={name}
                  onBlur={(e) => saveLabel(id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveLabel(id, (e.target as HTMLInputElement).value);
                    else if (e.key === 'Escape') setEditingId(null);
                  }}
                  className="min-w-0 flex-1 rounded bg-white/10 px-1 text-sm outline-none focus:bg-white/20"
                />
              ) : (
                <span
                  onDoubleClick={() => setEditingId(id)}
                  title="Çift tık: yeniden adlandır"
                  className={`flex-1 truncate ${hidden ? 'text-white/35 line-through' : locked ? 'text-amber-200/90' : ''}`}
                >
                  {name}
                </span>
              )}
              <span className="tabular-nums text-xs opacity-50">{count}</span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
