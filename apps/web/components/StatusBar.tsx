'use client';

import { useEffect, useState } from 'react';
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
  erase: 'Sil',
  calibrate: 'Ölçekle',
};

interface StatusBarProps {
  manager: ToolManager;
  /** İmleç hareket handler'ını kaydeder (engine). Kendi state'ini tutar → panelleri re-render etmez. */
  registerHover: (cb: (world: Pt | null) => void) => void;
}

/**
 * Alt durum çubuğu: imleç dünya koordinatı (m) + aktif araç. Kendi state'ini tuttuğu için
 * her fare hareketinde yalnız bu bileşen yeniden render olur (paneller etkilenmez).
 */
export function StatusBar({ manager, registerHover }: StatusBarProps) {
  const [world, setWorld] = useState<Pt | null>(null);
  const [tool, setTool] = useState<ToolName>(manager.activeTool);

  useEffect(() => {
    registerHover(setWorld);
    return manager.subscribe(setTool);
  }, [manager, registerHover]);

  const m = (cm: number): string => (cm / 100).toFixed(2).replace('.', ',');

  return (
    <div className="pointer-events-none absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-md bg-black/60 px-3 py-1 text-xs text-white/80 backdrop-blur">
      <span className="tabular-nums">
        {world ? `X ${m(world.x)} m   Y ${m(world.y)} m` : 'X —   Y —'}
      </span>
      <span className="opacity-40">·</span>
      <span>{TOOL_LABEL[tool]}</span>
    </div>
  );
}
