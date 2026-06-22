'use client';

import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  computeTakeoff,
  DEFAULT_STOREY_HEIGHT_CM,
  type Block,
  type EntityStore,
  type Opening,
  type Space,
  type Takeoff,
  type Wall,
} from '@zynpparti/document';
import { Panel } from './Panel';

function getWalls(store: EntityStore): Wall[] {
  return store.all().filter((e): e is Wall => e.type === 'wall');
}
function getSpaces(store: EntityStore): Space[] {
  return store.all().filter((e): e is Space => e.type === 'space');
}
function getOpenings(store: EntityStore): Opening[] {
  return store.all().filter((e): e is Opening => e.type === 'opening');
}
function getBlocks(store: EntityStore): Block[] {
  return store.all().filter((e): e is Block => e.type === 'block');
}

function num(n: number): string {
  return n.toFixed(1).replace('.', ',');
}

interface TakeoffPanelProps {
  store: EntityStore;
}

/**
 * Metraj paneli (PRO-FEATURES §1): duvar/mahal/kapıdan otomatik miktar — canlı.
 * Kat yüksekliği düzenlenebilir (sıva alanı varsayımı). Çizelge motorunun ilk örneği (ADR yok,
 * mahal listesi gibi türetilmiş canlı tablo). Excel'e aktarılır.
 */
export function TakeoffPanel({ store }: TakeoffPanelProps) {
  const [version, setVersion] = useState(0);
  const [storeyHeightCm, setStoreyHeightCm] = useState(DEFAULT_STOREY_HEIGHT_CM);

  useEffect(() => store.subscribe(() => setVersion((v) => v + 1)), [store]);

  const t: Takeoff = useMemo(() => {
    try {
      return computeTakeoff(getWalls(store), getSpaces(store), getOpenings(store), getBlocks(store), {
        storeyHeightCm,
      });
    } catch (err) {
      console.error('Metraj hesabı başarısız:', err);
      return computeTakeoff([], [], [], [], { storeyHeightCm }); // güvenli boş metraj
    }
    // version: store değişince yeniden hesapla
  }, [store, storeyHeightCm, version]);

  const isEmpty = t.wallLengthM === 0 && t.floorAreaM2 === 0 && t.blockSchedule.length === 0;
  if (isEmpty) return null;

  function exportExcel(): void {
    const rows: Record<string, string | number>[] = [
      { Kalem: 'Duvar uzunluğu (m)', Miktar: Number(t.wallLengthM.toFixed(2)) },
      { Kalem: `Sıva/boya (m²) [h=${storeyHeightCm} cm]`, Miktar: Number(t.plasterAreaM2.toFixed(2)) },
      { Kalem: 'Döşeme/şap (m²)', Miktar: Number(t.floorAreaM2.toFixed(2)) },
      { Kalem: 'Süpürgelik (m)', Miktar: Number(t.skirtingM.toFixed(2)) },
      { Kalem: 'Kapı (adet)', Miktar: t.doorCount },
      { Kalem: 'Pencere (adet)', Miktar: t.windowCount },
    ];
    const ws = XLSX.utils.json_to_sheet(rows);

    const sched: Record<string, string | number>[] = [
      ...t.doorSchedule.map((r) => ({ Tip: 'Kapı', 'Genişlik (cm)': r.width, Adet: r.count })),
      ...t.windowSchedule.map((r) => ({ Tip: 'Pencere', 'Genişlik (cm)': r.width, Adet: r.count })),
    ];
    const furn: Record<string, string | number>[] = t.blockSchedule.map((r) => ({
      Mobilya: r.label,
      Adet: r.count,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Metraj');
    if (sched.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sched), 'Çizelge');
    if (furn.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(furn), 'Mobilya');
    XLSX.writeFile(wb, 'metraj.xlsx');
  }

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between">
      <span className="opacity-70">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );

  return (
    <Panel title="Metraj">
      <div className="flex flex-col gap-0.5 px-1">
        <Row label="Duvar uzunluğu" value={`${num(t.wallLengthM)} m`} />
        <Row label="Sıva/boya" value={`${num(t.plasterAreaM2)} m²`} />
        <Row label="Döşeme/şap" value={`${num(t.floorAreaM2)} m²`} />
        <Row label="Süpürgelik" value={`${num(t.skirtingM)} m`} />
        <Row label="Kapı / Pencere" value={`${t.doorCount} / ${t.windowCount}`} />
      </div>

      {t.blockSchedule.length > 0 && (
        <div className="mt-2 flex flex-col gap-0.5 px-1">
          <div className="text-[10px] uppercase tracking-wide opacity-40">Mobilya</div>
          {t.blockSchedule.map((r) => (
            <Row key={r.kind} label={r.label} value={`${r.count} adet`} />
          ))}
        </div>
      )}

      <label className="mt-2 flex items-center justify-between gap-2 px-1 text-xs opacity-70">
        <span>Kat yüksekliği (cm)</span>
        <input
          type="number"
          value={storeyHeightCm}
          min={200}
          max={600}
          onChange={(e) => setStoreyHeightCm(Number(e.target.value) || DEFAULT_STOREY_HEIGHT_CM)}
          className="w-16 rounded bg-white/10 px-1 py-0.5 text-right tabular-nums outline-none focus:bg-white/20"
        />
      </label>

      <button
        type="button"
        onClick={exportExcel}
        className="mt-2 w-full rounded bg-emerald-700 px-2 py-1 hover:bg-emerald-600"
      >
        Excel İndir
      </button>

      <div className="mt-1 px-1 text-[10px] leading-tight opacity-40">
        Kat/boşluk yükseklikleri varsayımdır; resmî metrajda doğrulayın.
      </div>
    </Panel>
  );
}
