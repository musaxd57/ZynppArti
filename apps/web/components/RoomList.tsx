'use client';

import { useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { toast } from '@/lib/toast';
import { projectFileBase } from '@/lib/project-name';
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
  return store.byType('space');
}

function getWalls(store: EntityStore): Wall[] {
  return store.byType('wall');
}

function fmt(m2: number): string {
  if (!Number.isFinite(m2)) return '0,0'; // bozuk geometri → "NaN m²" gösterme (metrics.ts ile aynı disiplin)
  return m2.toFixed(1).replace('.', ',');
}

/** Mahal alanı (m²) — NaN/Infinity'ye karşı korumalı (bozuk boundary → 0; UI + Excel aynı). */
function safeAreaM2(s: Space): number {
  const a = centerlineAreaM2(s);
  return Number.isFinite(a) ? a : 0;
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

  useEffect(() => {
    // Sürükleme sırasında store HER KARE emit eder; bu re-render başına computeMetrics
    // (O(mahal×kenar×duvar)) yeniden hesaplar → büyük planda jank. Trailing debounce ile son
    // değişiklikten ~100 ms sonra bir kez güncelle (gözle "canlı m²" hissi korunur, kare-başına yük gider).
    let timer: ReturnType<typeof setTimeout> | null = null;
    const refresh = (): void => {
      setSpaces(getSpaces(store));
      setWalls(getWalls(store));
    };
    const unsub = store.subscribe(() => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(refresh, 100);
    });
    return () => {
      if (timer) clearTimeout(timer);
      unsub();
    };
  }, [store]);

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

  if (spaces.length === 0) {
    // Hiç duvar yoksa paneli gizle; duvar VAR ama mahal yoksa kullanıcıya nedenini açıkla
    // (en sık karışıklık: duvar uçları birleşmediği için kapalı alan oluşmaz).
    if (walls.length === 0) return null;
    return (
      <Panel title="Mahal Listesi" widthClass="w-full">
        <div className="px-1 py-1 text-xs leading-relaxed opacity-75">
          Duvar var ama kapalı bir mahal bulunamadı. Mahal otomatik oluşması için duvarların{' '}
          <span className="font-semibold opacity-95">uçları birbirine değmeli</span> (kapalı döngü).
          Uçları üst üste getir (snap yardımcı olur) ya da aradaki boşlukları kapat.
        </div>
      </Panel>
    );
  }

  let metrics: ReturnType<typeof computeMetrics>;
  try {
    metrics = computeMetrics(spaces, walls);
  } catch (err) {
    console.error('Metrik hesabı başarısız:', err);
    metrics = computeMetrics([], []); // güvenli sıfır metrik (panel çökmesin)
  }

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
      'Alan (m²)': Number(safeAreaM2(s).toFixed(2)),
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
    try {
      XLSX.writeFile(wb, `${projectFileBase()}-mahal-listesi.xlsx`);
      toast('Mahal listesi indirildi.', 'success');
    } catch (err) {
      console.error('Excel export başarısız:', err);
      toast('Excel dışa aktarılamadı.', 'error');
    }
  }

  return (
    <Panel title="Mahal Listesi" badge={spaces.length} widthClass="w-full">
      <div className="flex max-h-[40vh] flex-col gap-1 overflow-y-auto">
        {spaces.map((s) => (
          <div
            key={s.id}
            className="flex flex-col gap-1 rounded-md px-1 py-1 transition-colors hover:bg-[var(--surface-3)]"
          >
            {/* Satır 1: tip rengi + ad + alan */}
            <div className="flex items-center gap-1">
              <span
                className="h-3 w-3 shrink-0 rounded-sm"
                style={{ backgroundColor: toHexColor(roomTypeColor(roomTypeOf(s))) }}
                title="Tip rengi (tuvaldeki mahal ile aynı)"
              />
              <input
                key={s.name}
                ref={(el) => {
                  inputs.current.set(s.id, el);
                }}
                defaultValue={s.name}
                onBlur={(e) => rename(s, e.target.value)}
                aria-label="Mahal adı"
                className="min-w-0 flex-1 rounded bg-white/10 px-2 py-1 outline-none focus:bg-white/20"
              />
              <span className="w-16 shrink-0 text-right tabular-nums opacity-80">
                {fmt(safeAreaM2(s))} m²
              </span>
            </div>
            {/* Satır 2: tip + malzeme (eşit paylaşımlı, taşmaz) */}
            <div className="flex items-center gap-1 pl-4">
              <select
                value={roomTypeOf(s)}
                onChange={(e) => setType(s, e.target.value as RoomType)}
                className="min-w-0 flex-1 rounded bg-white/10 px-1 py-1 text-xs outline-none focus:bg-white/20"
                title="Mahal tipi"
                aria-label="Mahal tipi"
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
                className="min-w-0 flex-1 rounded bg-white/10 px-1 py-1 text-xs outline-none focus:bg-white/20"
                title="Zemin malzemesi (tarama deseni)"
                aria-label="Zemin malzemesi"
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
            </div>
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
