'use client';

import { useEffect, useState } from 'react';
import {
  UpdateEntity,
  WALL_MATERIALS,
  type Annotation,
  type Block,
  type Comment,
  type EntityStore,
  type History,
  type Opening,
  type SectionLine,
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
      <Panel title="Özellikler — Duvar" widthClass="w-full">
        <div className="flex flex-col gap-1">
          <label className={labelCls}>
            <span className="opacity-70">Kalınlık (cm)</span>
            <input
              type="number"
              min={1}
              defaultValue={Math.round(w.thickness)}
              onBlur={(ev) => {
                const t = Number(ev.target.value);
                if (Number.isFinite(t) && t > 0 && t !== w.thickness)
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
              onBlur={(ev) => {
                const hh = Number(ev.target.value);
                if (Number.isFinite(hh) && hh > 0 && hh !== (w.height ?? 280))
                  history.dispatch(new UpdateEntity({ ...w, height: hh }));
              }}
              className={numCls}
            />
          </label>
          <label className={labelCls}>
            <span className="opacity-70">Malzeme</span>
            <select
              value={w.material ?? ''}
              onChange={(ev) =>
                history.dispatch(new UpdateEntity({ ...w, material: ev.target.value || undefined }))
              }
              className="rounded bg-white/10 px-1 py-0.5 text-xs outline-none focus:bg-white/20"
            >
              <option value="" className="bg-neutral-800">
                —
              </option>
              {WALL_MATERIALS.map((m) => (
                <option key={m.id} value={m.id} className="bg-neutral-800">
                  {m.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Panel>
    );
  }

  if (e.type === 'opening') {
    const o = e as Opening;
    return (
      <Panel title={`Özellikler — ${o.kind === 'door' ? 'Kapı' : 'Pencere'}`} widthClass="w-full">
        <div className="flex flex-col gap-1">
          <label className={labelCls}>
            <span className="opacity-70">Genişlik (cm)</span>
            <input
              type="number"
              min={10}
              defaultValue={Math.round(o.width)}
              onBlur={(ev) => {
                const wd = Number(ev.target.value);
                if (Number.isFinite(wd) && wd > 0 && wd !== o.width)
                  history.dispatch(new UpdateEntity({ ...o, width: wd }));
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
      <Panel title="Özellikler — Metin" widthClass="w-full">
        <div className="flex flex-col gap-1">
          <input
            aria-label="Metin"
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
              onBlur={(ev) => {
                const hh = Number(ev.target.value);
                if (Number.isFinite(hh) && hh > 0 && hh !== a.height)
                  history.dispatch(new UpdateEntity({ ...a, height: hh }));
              }}
              className={numCls}
            />
          </label>
        </div>
      </Panel>
    );
  }

  if (e.type === 'comment') {
    const c = e as Comment;
    return (
      <Panel title="Özellikler — Yorum" widthClass="w-full">
        <div className="flex flex-col gap-1">
          <input
            aria-label="Yorum"
            defaultValue={c.text}
            onBlur={(ev) => {
              const txt = ev.target.value.trim();
              if (txt && txt !== c.text) history.dispatch(new UpdateEntity({ ...c, text: txt }));
            }}
            className="rounded bg-white/10 px-2 py-1 text-sm outline-none focus:bg-white/20"
          />
          <label className={labelCls}>
            <span className="opacity-70">Boyut (×)</span>
            <input
              type="number"
              min={0.3}
              max={5}
              step={0.25}
              defaultValue={c.size ?? 1}
              onBlur={(ev) => {
                // onBlur (her tuşta değil) → undo geçmişi her ara değerle kirlenmez. Değişmediyse atla.
                const sz = Number(ev.target.value);
                if (Number.isFinite(sz) && sz > 0 && sz !== (c.size ?? 1)) {
                  history.dispatch(new UpdateEntity({ ...c, size: sz }));
                }
              }}
              className={numCls}
            />
          </label>
        </div>
      </Panel>
    );
  }

  if (e.type === 'section') {
    const s = e as SectionLine;
    return (
      <Panel title="Özellikler — Kesit" widthClass="w-full">
        <label className={labelCls}>
          <span className="opacity-70">Etiket (A → A—A')</span>
          <input
            maxLength={3}
            defaultValue={s.label}
            onBlur={(ev) => {
              const v = ev.target.value.trim().toUpperCase();
              if (v && v !== s.label) history.dispatch(new UpdateEntity({ ...s, label: v }));
            }}
            className="w-20 rounded bg-white/10 px-1.5 py-0.5 text-center outline-none focus:bg-white/20"
          />
        </label>
      </Panel>
    );
  }

  if (e.type === 'block') {
    const b = e as Block;
    return (
      <Panel title="Özellikler — Blok" widthClass="w-full">
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
