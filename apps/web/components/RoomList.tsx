'use client';

import { useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { UpdateEntity, type EntityStore, type History, type Space } from '@zynpparti/document';
import { polygonArea } from '@zynpparti/geometry';

function getSpaces(store: EntityStore): Space[] {
  return store.all().filter((e): e is Space => e.type === 'space');
}

function areaM2(space: Space): number {
  return polygonArea(space.boundary) / 10000;
}

function fmt(m2: number): string {
  return m2.toFixed(1).replace('.', ',');
}

interface RoomListProps {
  store: EntityStore;
  history: History;
  /** Çift tıkla düzenlenmek istenen mahalin id'si (engine'den). */
  renameId?: string | null;
  onRenameConsumed?: () => void;
}

/** Mahal listesi paneli: otomatik bulunan odalar, düzenlenebilir ad + canlı m². */
export function RoomList({ store, history, renameId, onRenameConsumed }: RoomListProps) {
  const [spaces, setSpaces] = useState<Space[]>(() => getSpaces(store));
  const inputs = useRef(new Map<string, HTMLInputElement | null>());

  useEffect(() => store.subscribe(() => setSpaces(getSpaces(store))), [store]);

  // Çift tık isteği gelince ilgili mahalin input'una odaklan + metni seç.
  useEffect(() => {
    if (!renameId) return;
    const el = inputs.current.get(renameId);
    if (el) {
      el.focus();
      el.select();
    }
    onRenameConsumed?.();
  }, [renameId, spaces, onRenameConsumed]);

  if (spaces.length === 0) return null;

  const total = spaces.reduce((sum, s) => sum + areaM2(s), 0);

  function rename(space: Space, name: string): void {
    const trimmed = name.trim();
    if (trimmed && trimmed !== space.name) {
      history.dispatch(new UpdateEntity({ ...space, name: trimmed }));
    }
  }

  function exportExcel(): void {
    const rows: Record<string, string | number>[] = spaces.map((s) => ({
      Mahal: s.name,
      'Alan (m²)': Number(areaM2(s).toFixed(2)),
    }));
    rows.push({ Mahal: 'Toplam', 'Alan (m²)': Number(total.toFixed(2)) });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mahaller');
    XLSX.writeFile(wb, 'mahal-listesi.xlsx');
  }

  return (
    <div className="absolute right-4 top-16 w-60 rounded-lg bg-black/60 p-2 text-sm text-white backdrop-blur">
      <div className="mb-1 px-1 font-semibold opacity-80">Mahal Listesi ({spaces.length})</div>
      <div className="flex flex-col gap-1">
        {spaces.map((s) => (
          <div key={s.id} className="flex items-center gap-2">
            <input
              ref={(el) => {
                inputs.current.set(s.id, el);
              }}
              defaultValue={s.name}
              onBlur={(e) => rename(s, e.target.value)}
              className="min-w-0 flex-1 rounded bg-white/10 px-2 py-1 outline-none focus:bg-white/20"
            />
            <span className="tabular-nums opacity-80">{fmt(areaM2(s))} m²</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between border-t border-white/20 px-1 pt-1 opacity-80">
        <span>Toplam</span>
        <span className="tabular-nums">{fmt(total)} m²</span>
      </div>
      <button
        type="button"
        onClick={exportExcel}
        className="mt-2 w-full rounded bg-emerald-700 px-2 py-1 hover:bg-emerald-600"
      >
        Excel İndir
      </button>
    </div>
  );
}
