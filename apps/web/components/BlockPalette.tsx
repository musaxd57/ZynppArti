'use client';

import { useEffect, useState } from 'react';
import { BLOCK_DEFS, type BlockKind } from '@zynpparti/document';
import type { ToolManager, ToolName } from '@zynpparti/tools';
import { Panel } from './Panel';

const KINDS = Object.keys(BLOCK_DEFS) as BlockKind[];

interface BlockPaletteProps {
  manager: ToolManager;
}

/**
 * Blok/mobilya paleti: kütüphaneden bir sembol seç → blok aracına geçer, imleçle yerleştirilir.
 * Aktif araç 'block' değilse seçim vurgusu sıfırlanır. ('x' ile yerleştirmeden önce döndürülür.)
 */
export function BlockPalette({ manager }: BlockPaletteProps) {
  const [active, setActive] = useState<ToolName>(manager.activeTool);
  const [selected, setSelected] = useState<BlockKind | null>(null);

  useEffect(() => manager.subscribe(setActive), [manager]);

  const isBlock = active === 'block';

  return (
    <Panel title="Bloklar" widthClass="w-full" defaultOpen={false}>
      <div className="grid grid-cols-2 gap-1">
        {KINDS.map((k) => {
          const on = isBlock && selected === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => {
                setSelected(k);
                manager.setBlockKind(k);
              }}
              className={`rounded px-2 py-1 text-left text-xs ${
                on ? 'bg-amber-600/70' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {BLOCK_DEFS[k].label}
            </button>
          );
        })}
      </div>
      <div className="mt-2 px-1 text-[10px] leading-tight opacity-40">
        Yerleştirirken &quot;x&quot; ile 90° döndür.
      </div>
    </Panel>
  );
}
