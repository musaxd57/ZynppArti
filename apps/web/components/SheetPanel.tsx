'use client';

import { useEffect, useState } from 'react';
import {
  RemoveEntity,
  SHEET_SCALES,
  SHEET_SIZES,
  UpdateEntity,
  type EntityStore,
  type History,
  type Sheet,
  type SheetOrientation,
  type SheetSize,
} from '@zynpparti/document';
import { Panel } from './Panel';

function getSheets(store: EntityStore): Sheet[] {
  return store.all().filter((e): e is Sheet => e.type === 'sheet');
}

interface SheetPanelProps {
  store: EntityStore;
  history: History;
}

/**
 * Pafta paneli: yerleştirilen paftaların boyut/yönelim/ölçek/antet alanlarını düzenler (canlı).
 * Her değişiklik undo'lanabilir UpdateEntity ile uygulanır. Pafta yoksa panel görünmez.
 */
export function SheetPanel({ store, history }: SheetPanelProps) {
  const [sheets, setSheets] = useState<Sheet[]>(() => getSheets(store));
  useEffect(() => store.subscribe(() => setSheets(getSheets(store))), [store]);

  if (sheets.length === 0) return null;

  const update = (s: Sheet, patch: Partial<Sheet>): void => {
    history.dispatch(new UpdateEntity({ ...s, ...patch }));
  };

  const sel = 'rounded bg-white/10 px-1 py-0.5 text-xs outline-none focus:bg-white/20';

  return (
    <Panel title="Paftalar" badge={sheets.length} widthClass="w-full">
      <div className="flex flex-col gap-2">
        {sheets.map((s) => (
          <div key={s.id} className="flex flex-col gap-1 rounded bg-white/5 p-1.5">
            <div className="flex items-center gap-1">
              <input
                defaultValue={s.title}
                onBlur={(e) => update(s, { title: e.target.value.trim() || 'Pafta' })}
                placeholder="Pafta adı"
                className="min-w-0 flex-1 rounded bg-white/10 px-2 py-1 text-sm outline-none focus:bg-white/20"
              />
              <button
                type="button"
                onClick={() => history.dispatch(new RemoveEntity(s.id))}
                className="rounded px-2 py-1 text-xs opacity-70 hover:bg-white/10 hover:opacity-100"
                title="Paftayı sil"
              >
                ✕
              </button>
            </div>
            <input
              defaultValue={s.project ?? ''}
              onBlur={(e) => update(s, { project: e.target.value.trim() || undefined })}
              placeholder="Proje (opsiyonel)"
              className="rounded bg-white/10 px-2 py-1 text-xs outline-none focus:bg-white/20"
            />
            <div className="flex items-center gap-1">
              <input
                defaultValue={s.date ?? ''}
                onBlur={(e) => update(s, { date: e.target.value.trim() || undefined })}
                placeholder="Tarih"
                className="min-w-0 flex-1 rounded bg-white/10 px-2 py-1 text-xs outline-none focus:bg-white/20"
              />
              <input
                defaultValue={s.sheetNo ?? ''}
                onBlur={(e) => update(s, { sheetNo: e.target.value.trim() || undefined })}
                placeholder="Pafta no (1/5)"
                className="min-w-0 flex-1 rounded bg-white/10 px-2 py-1 text-xs outline-none focus:bg-white/20"
              />
            </div>
            <div className="flex items-center gap-1">
              <select
                value={s.size}
                onChange={(e) => update(s, { size: e.target.value as SheetSize })}
                className={sel}
                title="Kağıt boyutu"
              >
                {SHEET_SIZES.map((z) => (
                  <option key={z} value={z} className="bg-neutral-800">
                    {z}
                  </option>
                ))}
              </select>
              <select
                value={s.orientation}
                onChange={(e) => update(s, { orientation: e.target.value as SheetOrientation })}
                className={sel}
                title="Yönelim"
              >
                <option value="landscape" className="bg-neutral-800">
                  Yatay
                </option>
                <option value="portrait" className="bg-neutral-800">
                  Düşey
                </option>
              </select>
              <select
                value={s.scale}
                onChange={(e) => update(s, { scale: Number(e.target.value) })}
                className={sel}
                title="Ölçek"
              >
                {SHEET_SCALES.map((sc) => (
                  <option key={sc} value={sc} className="bg-neutral-800">
                    1:{sc}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
