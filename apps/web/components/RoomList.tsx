'use client';

import { useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  MATERIALS,
  ROOM_TYPES,
  UpdateEntity,
  centerlineAreaM2,
  computeMetrics,
  roomTypeColor,
  roomTypeOf,
  roomTypeLabel,
  toHexColor,
  type EntityStore,
  type History,
  type RoomType,
  type Space,
  type Wall,
} from '@zynpparti/document';
import { Panel } from './Panel';

function getSpaces(store: EntityStore): Space[] {
  return store.all().filter((e): e is Space => e.type === 'space');
}

function getWalls(store: EntityStore): Wall[] {
  return store.all().filter((e): e is Wall => e.type === 'wall');
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

/**
 * Canlı metrik paneli (Faz 2A): otomatik bulunan mahaller — düzenlenebilir ad + tip seçimi +
 * canlı m²; altta toplam/net/brüt + tipe göre dağılım. Çizim değişince canlı güncellenir.
 */
export function RoomList({ store, history, renameId, onRenameConsumed }: RoomListProps) {
  const [spaces, setSpaces] = useState<Space[]>(() => getSpaces(store));
  const [walls, setWalls] = useState<Wall[]>(() => getWalls(store));
  const inputs = useRef(new Map<string, HTMLInputElement | null>());

  useEffect(
    () =>
      store.subscribe(() => {
        setSpaces(getSpaces(store));
        setWalls(getWalls(store));
      }),
    [store],
  );

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

  const metrics = computeMetrics(spaces, walls);

  function rename(space: Space, name: string): void {
    const trimmed = name.trim();
    if (trimmed && trimmed !== space.name) {
      history.dispatch(new UpdateEntity({ ...space, name: trimmed }));
    }
  }

  function setType(space: Space, roomType: RoomType): void {
    if (roomType !== roomTypeOf(space)) {
      history.dispatch(new UpdateEntity({ ...space, roomType }));
    }
  }

  function setMaterial(space: Space, material: string): void {
    const next = material || undefined; // boş seçim = malzeme yok
    if (next !== space.material) {
      history.dispatch(new UpdateEntity({ ...space, material: next }));
    }
  }

  function exportExcel(): void {
    const rows: Record<string, string | number>[] = spaces.map((s) => ({
      Mahal: s.name,
      Tip: roomTypeLabel(roomTypeOf(s)),
      'Alan (m²)': Number(centerlineAreaM2(s).toFixed(2)),
    }));
    rows.push({ Mahal: 'Toplam', Tip: '', 'Alan (m²)': Number(metrics.totalM2.toFixed(2)) });
    const ws = XLSX.utils.json_to_sheet(rows);

    // İkinci sayfa: özet metrikler + tipe göre dağılım.
    const summary: Record<string, string | number>[] = [
      { Metrik: 'Mahal sayısı', Değer: metrics.roomCount },
      { Metrik: 'Toplam (m²)', Değer: Number(metrics.totalM2.toFixed(2)) },
      { Metrik: 'Net (m²)', Değer: Number(metrics.netM2.toFixed(2)) },
      { Metrik: 'Brüt (m²)', Değer: Number(metrics.grossM2.toFixed(2)) },
      ...metrics.byType.map((b) => ({
        Metrik: `${b.label} (${b.count})`,
        Değer: Number(b.areaM2.toFixed(2)),
      })),
    ];
    const summaryWs = XLSX.utils.json_to_sheet(summary);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mahaller');
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Özet');
    XLSX.writeFile(wb, 'mahal-listesi.xlsx');
  }

  return (
    <Panel title="Mahal Listesi" badge={spaces.length} widthClass="w-72">
      <div className="flex max-h-[40vh] flex-col gap-1 overflow-y-auto">
        {spaces.map((s) => (
          <div key={s.id} className="flex items-center gap-1">
            <span
              className="h-3 w-3 shrink-0 rounded-sm"
              style={{ backgroundColor: toHexColor(roomTypeColor(roomTypeOf(s))) }}
              title="Tip rengi (tuvaldeki mahal ile aynı)"
            />
            <input
              ref={(el) => {
                inputs.current.set(s.id, el);
              }}
              defaultValue={s.name}
              onBlur={(e) => rename(s, e.target.value)}
              className="min-w-0 flex-1 rounded bg-white/10 px-2 py-1 outline-none focus:bg-white/20"
            />
            <select
              value={roomTypeOf(s)}
              onChange={(e) => setType(s, e.target.value as RoomType)}
              className="rounded bg-white/10 px-1 py-1 text-xs outline-none focus:bg-white/20"
              title="Mahal tipi"
            >
              {ROOM_TYPES.map((t) => (
                <option key={t.key} value={t.key} className="bg-neutral-800">
                  {t.label}
                </option>
              ))}
            </select>
            <select
              value={s.material ?? ''}
              onChange={(e) => setMaterial(s, e.target.value)}
              className="rounded bg-white/10 px-1 py-1 text-xs outline-none focus:bg-white/20"
              title="Zemin malzemesi (tarama deseni)"
            >
              <option value="" className="bg-neutral-800">
                Malzeme —
              </option>
              {MATERIALS.map((m) => (
                <option key={m.id} value={m.id} className="bg-neutral-800">
                  {m.label}
                </option>
              ))}
            </select>
            <span className="w-16 shrink-0 text-right tabular-nums opacity-80">
              {fmt(centerlineAreaM2(s))} m²
            </span>
          </div>
        ))}
      </div>

      {/* Canlı metrik özeti (FAZ2-NOTES §2b) */}
      <div className="mt-2 flex flex-col gap-0.5 border-t border-white/20 px-1 pt-1">
        <div className="flex justify-between font-semibold">
          <span>Toplam</span>
          <span className="tabular-nums">{fmt(metrics.totalM2)} m²</span>
        </div>
        <div className="flex justify-between opacity-70">
          <span>Net (iç)</span>
          <span className="tabular-nums">{fmt(metrics.netM2)} m²</span>
        </div>
        <div className="flex justify-between opacity-70">
          <span>Brüt</span>
          <span className="tabular-nums">{fmt(metrics.grossM2)} m²</span>
        </div>
      </div>

      {/* Tipe göre dağılım */}
      {metrics.byType.length > 0 && (
        <div className="mt-1 flex flex-col gap-0.5 border-t border-white/20 px-1 pt-1">
          <div className="opacity-50">Tipe göre</div>
          {metrics.byType.map((b) => (
            <div key={b.type} className="flex justify-between opacity-70">
              <span>
                {b.label} <span className="opacity-50">×{b.count}</span>
              </span>
              <span className="tabular-nums">{fmt(b.areaM2)} m²</span>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={exportExcel}
        className="mt-2 w-full rounded bg-emerald-700 px-2 py-1 hover:bg-emerald-600"
      >
        Excel İndir
      </button>
    </Panel>
  );
}
