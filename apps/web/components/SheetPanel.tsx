'use client';

import { useEffect, useState } from 'react';
import {
  AddEntity,
  BatchCommand,
  RemoveEntity,
  SHEET_SCALES,
  SHEET_SIZES,
  UpdateEntity,
  createEntityId,
  makeSheet,
  nextSheetPosition,
  nextSheetNo,
  type EntityStore,
  type History,
  type Sheet,
  type SheetOrientation,
  type SheetSize,
} from '@zynpparti/document';
import { Panel } from './Panel';

function getSheets(store: EntityStore): Sheet[] {
  // Satır-büyük sıra (önce y, sonra x) — pafta listesi/numaraları okunur sırada kalsın.
  return store
    .all()
    .filter((e): e is Sheet => e.type === 'sheet')
    .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);
}

interface SheetPanelProps {
  store: EntityStore;
  history: History;
  /** Bir paftaya kamerayı odakla ("Git"). CanvasStage zoomToBounds ile sağlar. */
  onZoomTo?: (sheet: Sheet) => void;
}

/**
 * Pafta paneli: yerleştirilen paftaların boyut/yönelim/ölçek/antet alanlarını düzenler (canlı).
 * Her değişiklik undo'lanabilir UpdateEntity ile uygulanır. Pafta yoksa panel görünmez.
 */
export function SheetPanel({ store, history, onZoomTo }: SheetPanelProps) {
  const [sheets, setSheets] = useState<Sheet[]>(() => getSheets(store));
  useEffect(() => store.subscribe(() => setSheets(getSheets(store))), [store]);

  const update = (s: Sheet, patch: Partial<Sheet>): void => {
    history.dispatch(new UpdateEntity({ ...s, ...patch }));
  };

  // "+ Pafta ekle": son paftanın boyut/yönelim/ölçeğini miras al, üst üste binmeyecek yere koy,
  // otomatik sıra numarası ver (tıklama gerekmez — AutoCAD layout ekleme gibi).
  const addSheet = (): void => {
    const last = sheets[sheets.length - 1];
    const pos = nextSheetPosition(sheets);
    const opts = {
      sheetNo: nextSheetNo(sheets.length),
      ...(last ? { size: last.size, orientation: last.orientation, scale: last.scale } : {}),
    };
    history.dispatch(new AddEntity({ ...makeSheet(pos, opts), id: createEntityId() }));
  };

  // "1/N yenile": tüm paftaları sıralı (görünüm sırası) "i/N" olarak yeniden numaralandır (tek undo).
  const renumber = (): void => {
    if (sheets.length === 0) return;
    const total = sheets.length;
    const cmds = sheets.map((s, i) => new UpdateEntity({ ...s, sheetNo: `${i + 1}/${total}` }));
    history.dispatch(new BatchCommand('Pafta numaralandır', cmds));
  };

  const sel = 'rounded bg-white/10 px-1 py-0.5 text-xs outline-none focus:bg-white/20';

  return (
    <Panel title="Paftalar (sayfalar)" badge={sheets.length} widthClass="w-full" defaultOpen={true}>
      <div className="mb-2 flex items-center gap-1">
        <button
          type="button"
          onClick={addSheet}
          className="flex-1 rounded bg-[var(--accent)] px-2 py-1 text-xs font-semibold text-white hover:bg-[var(--accent-hover)]"
        >
          + Pafta ekle
        </button>
        {sheets.length > 1 && (
          <button
            type="button"
            onClick={renumber}
            title="Tüm paftaları 1/N, 2/N… olarak yeniden numaralandır"
            className="rounded bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
          >
            1/N yenile
          </button>
        )}
      </div>
      {sheets.length === 0 ? (
        <div className="px-1 pb-1 text-xs opacity-50">Henüz pafta yok. “+ Pafta ekle” ile başla.</div>
      ) : (
        <div className="flex flex-col gap-2">
        {sheets.map((s) => (
          <div key={s.id} className="flex flex-col gap-1 rounded bg-white/5 p-1.5">
            <div className="flex items-center gap-1">
              <input
                key={s.title}
                defaultValue={s.title}
                onBlur={(e) => update(s, { title: e.target.value.trim() || 'Pafta' })}
                placeholder="Pafta adı"
                className="min-w-0 flex-1 rounded bg-white/10 px-2 py-1 text-sm outline-none focus:bg-white/20"
              />
              {onZoomTo && (
                <button
                  type="button"
                  onClick={() => onZoomTo(s)}
                  className="rounded px-2 py-1 text-xs opacity-70 hover:bg-white/10 hover:opacity-100"
                  title="Bu paftaya git (yakınlaş)"
                >
                  Git
                </button>
              )}
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
              key={s.project ?? ''}
              defaultValue={s.project ?? ''}
              onBlur={(e) => update(s, { project: e.target.value.trim() || undefined })}
              placeholder="Proje (opsiyonel)"
              className="rounded bg-white/10 px-2 py-1 text-xs outline-none focus:bg-white/20"
            />
            <div className="flex items-center gap-1">
              <input
                key={s.date ?? ''}
                defaultValue={s.date ?? ''}
                onBlur={(e) => update(s, { date: e.target.value.trim() || undefined })}
                placeholder="Tarih"
                className="min-w-0 flex-1 rounded bg-white/10 px-2 py-1 text-xs outline-none focus:bg-white/20"
              />
              <input
                key={s.sheetNo ?? ''}
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
      )}
    </Panel>
  );
}
