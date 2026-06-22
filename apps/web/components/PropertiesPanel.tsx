'use client';

import { useEffect, useState } from 'react';
import {
  UpdateEntity,
  type Annotation,
  type Block,
  type EntityStore,
  type History,
  type Opening,
  type Wall,
} from '@zynpparti/document';
import { Panel } from './Panel';

interface PropertiesPanelProps {
  store: EntityStore;
  history: History;
  /** SelectTool'dan yayınlanan seçili id'ler. */
  selectedIds: string[];
}

const labelCls = 'flex items-center justify-between gap-2 text-xs';
const numCls =
  'w-20 rounded bg-white/10 px-1.5 py-0.5 text-right tabular-nums outline-none focus:bg-white/20';

/**
 * Özellikler paneli: tam olarak BİR entity seçiliyken onun düzenlenebilir alanlarını gösterir
 * (duvar kalınlığı, kapı/pencere genişliği+türü, metin içerik+yüksekliği, blok dönüşü). Her değişiklik
 * undo'lanabilir UpdateEntity ile uygulanır. Pafta'nın kendi paneli var; mahaller Mahal Listesi'nde.
 */
export function PropertiesPanel({ store, history, selectedIds }: PropertiesPanelProps) {
  const [, bump] = useState(0);
  useEffect(() => store.subscribe(() => bump((v) => v + 1)), [store]);

  if (selectedIds.length !== 1) return null;
  const e = store.get(selectedIds[0]!);
  if (!e) return null;

  if (e.type === 'wall') {
    const w = e as Wall;
    return (
      <Panel title="Özellikler — Duvar" widthClass="w-56">
        <div className="flex flex-col gap-1">
          <label className={labelCls}>
            <span className="opacity-70">Kalınlık (cm)</span>
            <input
              type="number"
              min={1}
              defaultValue={Math.round(w.thickness)}
              onChange={(ev) => {
                const t = Number(ev.target.value);
                if (Number.isFinite(t) && t > 0)
                  history.dispatch(new UpdateEntity({ ...w, thickness: t }));
              }}
              className={numCls}
            />
          </label>
          <label className={labelCls}>
            <span className="opacity-70">Yükseklik (cm)</span>
            <input
              type="number"
              min={1}
              defaultValue={Math.round(w.height ?? 280)}
              onChange={(ev) => {
                const hh = Number(ev.target.value);
                if (Number.isFinite(hh) && hh > 0)
                  history.dispatch(new UpdateEntity({ ...w, height: hh }));
              }}
              className={numCls}
            />
          </label>
        </div>
      </Panel>
    );
  }

  if (e.type === 'opening') {
    const o = e as Opening;
    return (
      <Panel title={`Özellikler — ${o.kind === 'door' ? 'Kapı' : 'Pencere'}`} widthClass="w-56">
        <div className="flex flex-col gap-1">
          <label className={labelCls}>
            <span className="opacity-70">Genişlik (cm)</span>
            <input
              type="number"
              min={10}
              defaultValue={Math.round(o.width)}
              onChange={(ev) => {
                const wd = Number(ev.target.value);
                if (Number.isFinite(wd) && wd > 0) history.dispatch(new UpdateEntity({ ...o, width: wd }));
              }}
              className={numCls}
            />
          </label>
          <label className={labelCls}>
            <span className="opacity-70">Tür</span>
            <select
              value={o.kind}
              onChange={(ev) =>
                history.dispatch(new UpdateEntity({ ...o, kind: ev.target.value as Opening['kind'] }))
              }
              className="rounded bg-white/10 px-1 py-0.5 text-xs outline-none focus:bg-white/20"
            >
              <option value="door" className="bg-neutral-800">
                Kapı
              </option>
              <option value="window" className="bg-neutral-800">
                Pencere
              </option>
            </select>
          </label>
        </div>
      </Panel>
    );
  }

  if (e.type === 'annotation') {
    const a = e as Annotation;
    return (
      <Panel title="Özellikler — Metin" widthClass="w-56">
        <div className="flex flex-col gap-1">
          <input
            defaultValue={a.text}
            onBlur={(ev) => {
              const txt = ev.target.value.trim();
              if (txt && txt !== a.text) history.dispatch(new UpdateEntity({ ...a, text: txt }));
            }}
            className="rounded bg-white/10 px-2 py-1 text-sm outline-none focus:bg-white/20"
          />
          <label className={labelCls}>
            <span className="opacity-70">Yükseklik (cm)</span>
            <input
              type="number"
              min={1}
              defaultValue={Math.round(a.height)}
              onChange={(ev) => {
                const hh = Number(ev.target.value);
                if (Number.isFinite(hh) && hh > 0) history.dispatch(new UpdateEntity({ ...a, height: hh }));
              }}
              className={numCls}
            />
          </label>
        </div>
      </Panel>
    );
  }

  if (e.type === 'block') {
    const b = e as Block;
    return (
      <Panel title="Özellikler — Blok" widthClass="w-56">
        <button
          type="button"
          onClick={() =>
            history.dispatch(
              new UpdateEntity({ ...b, rotation: (b.rotation + Math.PI / 2) % (Math.PI * 2) }),
            )
          }
          className="w-full rounded bg-white/10 px-2 py-1 text-sm hover:bg-white/20"
        >
          90° Döndür (x)
        </button>
      </Panel>
    );
  }

  return null;
}
