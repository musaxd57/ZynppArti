'use client';

import { useEffect, useState } from 'react';
import type { Entity, EntityStore, EntityType } from '@zynpparti/document';
import type { ToolManager, ToolName } from '@zynpparti/tools';

type Pt = { x: number; y: number };

const TOOL_LABEL: Record<ToolName, string> = {
  select: 'Seç',
  wall: 'Duvar',
  door: 'Kapı',
  window: 'Pencere',
  dimension: 'Ölçü',
  parcel: 'Parsel',
  block: 'Blok',
  annotation: 'Metin',
  sheet: 'Pafta',
  section: 'Kesit',
  erase: 'Sil',
  calibrate: 'Ölçekle',
};

/** Entity tipi → kısa TR ad (seçim özeti için). */
const TYPE_LABEL: Record<EntityType, string> = {
  wall: 'Duvar',
  opening: 'Boşluk',
  space: 'Mahal',
  dimension: 'Ölçü',
  parcel: 'Parsel',
  block: 'Blok',
  annotation: 'Metin',
  sheet: 'Pafta',
  section: 'Kesit',
};

/** Seçili entity'lerin "Duvar×3 + Ölçü×1" özeti + toplam duvar uzunluğu (m). */
function selectionSummary(store: EntityStore, ids: string[]): string {
  const counts = new Map<EntityType, number>();
  let wallCm = 0;
  for (const id of ids) {
    const e: Entity | undefined = store.get(id);
    if (!e) continue;
    counts.set(e.type, (counts.get(e.type) ?? 0) + 1);
    if (e.type === 'wall') wallCm += Math.hypot(e.end.x - e.start.x, e.end.y - e.start.y);
  }
  const parts = [...counts.entries()].map(([t, n]) => `${TYPE_LABEL[t]}×${n}`);
  if (parts.length === 0) return '';
  const len = wallCm > 0 ? ` · ${(wallCm / 100).toFixed(2).replace('.', ',')} m` : '';
  return `Seçim: ${parts.join(' + ')}${len}`;
}

interface StatusBarProps {
  manager: ToolManager;
  /** İmleç hareket handler'ını kaydeder (engine). Kendi state'ini tutar → panelleri re-render etmez. */
  registerHover: (cb: (world: Pt | null) => void) => void;
  /** Doğruluk kaynağı + seçili id'ler — seçim özeti için. */
  store: EntityStore;
  selectedIds: string[];
}

/**
 * Alt durum çubuğu: imleç dünya koordinatı (m) + aktif araç. Kendi state'ini tuttuğu için
 * her fare hareketinde yalnız bu bileşen yeniden render olur (paneller etkilenmez).
 */
export function StatusBar({ manager, registerHover, store, selectedIds }: StatusBarProps) {
  const [world, setWorld] = useState<Pt | null>(null);
  const [tool, setTool] = useState<ToolName>(manager.activeTool);

  useEffect(() => {
    registerHover(setWorld);
    return manager.subscribe(setTool);
  }, [manager, registerHover]);

  const m = (cm: number): string => (cm / 100).toFixed(2).replace('.', ',');
  const summary = selectedIds.length > 0 ? selectionSummary(store, selectedIds) : '';

  return (
    <div className="pointer-events-none absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-md bg-black/60 px-3 py-1 text-xs text-white/90 backdrop-blur">
      <span className="tabular-nums">
        {world ? `X ${m(world.x)} m   Y ${m(world.y)} m` : 'X —   Y —'}
      </span>
      <span className="opacity-40">·</span>
      <span>{TOOL_LABEL[tool]}</span>
      {summary && (
        <>
          <span className="opacity-40">·</span>
          <span className="text-blue-300">{summary}</span>
        </>
      )}
    </div>
  );
}
