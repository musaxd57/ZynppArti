'use client';

import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { toast } from '@/lib/toast';
import { projectFileBase } from '@/lib/project-name';
import {
  computeTakeoff,
  estimateCost,
  formatTRY,
  DEFAULT_STOREY_HEIGHT_CM,
  DEFAULT_UNIT_PRICES,
  type Block,
  type EntityStore,
  type Opening,
  type Space,
  type Takeoff,
  type UnitPrices,
  type Wall,
} from '@zynpparti/document';
import { Panel } from './Panel';

const PRICES_KEY = 'vesna-unit-prices';
/** Düzenlenebilir birim fiyat satırları (etiket + UnitPrices anahtarı + birim). */
const PRICE_FIELDS: ReadonlyArray<{ key: keyof UnitPrices; label: string; unit: string }> = [
  { key: 'wallMasonryM2', label: 'Duvar örgü', unit: '₺/m²' },
  { key: 'plasterM2', label: 'İç sıva', unit: '₺/m²' },
  { key: 'facadePlasterM2', label: 'Dış cephe sıvası', unit: '₺/m²' },
  { key: 'electricalM2', label: 'Elektrik', unit: '₺/m²' },
  { key: 'plumbingM2', label: 'Sıhhi', unit: '₺/m²' },
  { key: 'paintM2', label: 'Boya', unit: '₺/m²' },
  { key: 'floorM2', label: 'Döşeme', unit: '₺/m²' },
  { key: 'skirtingM', label: 'Süpürgelik', unit: '₺/m' },
  { key: 'door', label: 'Kapı', unit: '₺/ad' },
  { key: 'window', label: 'Pencere', unit: '₺/ad' },
];

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
  const [prices, setPrices] = useState<UnitPrices>(DEFAULT_UNIT_PRICES);
  const [editPrices, setEditPrices] = useState(false);

  useEffect(() => store.subscribe(() => setVersion((v) => v + 1)), [store]);

  // Birim fiyatlar localStorage'da kalıcı (kullanıcı kendi rayicini girer); bozuk kayıt → varsayılan.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PRICES_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Record<string, unknown>;
        // Yalnız sonlu, negatif-olmayan sayısal alanları al — bozuk kayıt NaN maliyet üretmesin (H5).
        const clean: Record<string, number> = {};
        for (const k of Object.keys(DEFAULT_UNIT_PRICES)) {
          const v = saved[k];
          if (typeof v === 'number' && Number.isFinite(v) && v >= 0) clean[k] = v;
        }
        setPrices((p) => ({ ...p, ...(clean as Partial<UnitPrices>) }));
      }
    } catch {
      /* yoksay */
    }
  }, []);

  function setPrice(key: keyof UnitPrices, value: number): void {
    setPrices((p) => {
      const next = { ...p, [key]: Number.isFinite(value) && value >= 0 ? value : 0 };
      try {
        localStorage.setItem(PRICES_KEY, JSON.stringify(next));
      } catch {
        /* yoksay */
      }
      return next;
    });
  }
  function resetPrices(): void {
    setPrices(DEFAULT_UNIT_PRICES);
    try {
      localStorage.removeItem(PRICES_KEY);
    } catch {
      /* yoksay */
    }
  }

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

  const cost = useMemo(() => estimateCost(t, prices), [t, prices]);

  const isEmpty = t.wallLengthM === 0 && t.floorAreaM2 === 0 && t.blockSchedule.length === 0;
  if (isEmpty) return null;

  function exportExcel(): void {
    const rows: Record<string, string | number>[] = [
      { Kalem: 'Duvar uzunluğu (m)', Miktar: Number(t.wallLengthM.toFixed(2)) },
      { Kalem: `Duvar örgü (m²) [h=${storeyHeightCm} cm]`, Miktar: Number(t.wallElevationM2.toFixed(2)) },
      { Kalem: 'İç sıva (m²)', Miktar: Number(t.plasterAreaM2.toFixed(2)) },
      { Kalem: 'Dış cephe sıvası (m²)', Miktar: Number(t.facadePlasterAreaM2.toFixed(2)) },
      { Kalem: 'Boya — iç duvar+tavan (m²)', Miktar: Number(t.paintAreaM2.toFixed(2)) },
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
    const costRows: Record<string, string | number>[] = cost.lines.map((l) => ({
      Kategori: l.category,
      Kalem: l.label,
      Miktar: Number(l.quantity.toFixed(2)),
      Birim: l.unit,
      'Birim Fiyat (TL)': l.unitPrice,
      'Tutar (TL)': Math.round(l.total),
    }));
    if (costRows.length) {
      const blank = { Kategori: '', Kalem: '', Miktar: '', Birim: '', 'Birim Fiyat (TL)': '' };
      costRows.push({ ...blank, Kalem: 'Ara toplam (imalat)', 'Tutar (TL)': Math.round(cost.subtotal) });
      costRows.push({ ...blank, Kalem: `Genel gider + kâr (%${Math.round(cost.overheadRate * 100)})`, 'Tutar (TL)': Math.round(cost.overhead) });
      costRows.push({ ...blank, Kalem: 'TOPLAM', 'Tutar (TL)': Math.round(cost.total) });
      if (cost.perM2 > 0) costRows.push({ ...blank, Kalem: 'm² başına (TL/m²)', 'Tutar (TL)': Math.round(cost.perM2) });
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Metraj');
    if (sched.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sched), 'Çizelge');
    if (furn.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(furn), 'Mobilya');
    if (costRows.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(costRows), 'Maliyet');
    try {
      XLSX.writeFile(wb, `${projectFileBase()}-metraj.xlsx`);
      toast('Metraj indirildi.', 'success');
    } catch (err) {
      console.error('Excel export başarısız:', err);
      toast('Excel dışa aktarılamadı.', 'error');
    }
  }

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between">
      <span className="opacity-70">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );

  return (
    <>
    <Panel title="Metraj" widthClass="w-full" defaultOpen={false}>
      <div className="flex flex-col gap-0.5 px-1">
        <Row label="Duvar uzunluğu" value={`${num(t.wallLengthM)} m`} />
        <Row label="Duvar örgü" value={`${num(t.wallElevationM2)} m²`} />
        <Row label="İç sıva" value={`${num(t.plasterAreaM2)} m²`} />
        <Row label="Dış cephe sıvası" value={`${num(t.facadePlasterAreaM2)} m²`} />
        <Row label="Boya (iç duvar+tavan)" value={`${num(t.paintAreaM2)} m²`} />
        <Row label="Döşeme/şap" value={`${num(t.floorAreaM2)} m²`} />
        <Row label="Süpürgelik" value={`${num(t.skirtingM)} m`} />
        <Row label="Kapı / Pencere" value={`${t.doorCount} / ${t.windowCount}`} />
      </div>

      {t.wallByMaterial.length > 1 && (
        <div className="mt-2 flex flex-col gap-0.5 px-1">
          <div className="text-[10px] uppercase tracking-wide opacity-40">Duvar (malzeme)</div>
          {t.wallByMaterial.map((r) => (
            <Row key={r.label} label={r.label} value={`${num(r.lengthM)} m`} />
          ))}
        </div>
      )}

      {t.blockSchedule.length > 0 && (
        <div className="mt-2 flex flex-col gap-0.5 px-1">
          <div className="text-[10px] uppercase tracking-wide opacity-40">Mobilya</div>
          {t.blockSchedule.map((r) => (
            <Row key={r.kind} label={r.label} value={`${r.count} adet`} />
          ))}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between gap-2 px-1 text-xs opacity-70">
        <span>Kat yüksekliği (cm)</span>
        <div className="flex items-center overflow-hidden rounded-md bg-white/10">
          <button
            type="button"
            onClick={() => setStoreyHeightCm((h) => Math.max(200, h - 10))}
            className="grid h-6 w-6 place-items-center text-sm text-white/70 hover:bg-white/15 hover:text-white"
            title="10 cm azalt"
          >
            −
          </button>
          <input
            type="number"
            value={storeyHeightCm}
            min={200}
            max={600}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (Number.isFinite(v) && v > 0) setStoreyHeightCm(Math.min(600, Math.max(200, Math.round(v))));
            }}
            className="w-12 [appearance:textfield] bg-transparent py-0.5 text-center tabular-nums outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <button
            type="button"
            onClick={() => setStoreyHeightCm((h) => Math.min(600, h + 10))}
            className="grid h-6 w-6 place-items-center text-sm text-white/70 hover:bg-white/15 hover:text-white"
            title="10 cm artır"
          >
            +
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={exportExcel}
        className="mt-2 w-full rounded bg-emerald-700 px-2 py-1 hover:bg-emerald-600"
      >
        Excel İndir
      </button>

      <div className="mt-1 px-1 text-[10px] leading-tight opacity-40">
        Kat/boşluk yükseklikleri ve birim fiyatlar kaba varsayımdır; resmî metraj/keşifte doğrulayın.
      </div>
    </Panel>

    {cost.lines.length > 0 && (
      <Panel
        title="Yaklaşık Maliyet"
        widthClass="w-full"
        defaultOpen={false}
        badge={formatTRY(cost.total)}
      >
        <div className="flex flex-col gap-0.5 px-1">
          {(['Kaba yapı', 'Tesisat', 'İnce yapı'] as const).map((cat) => {
            const group = cost.lines.filter((l) => l.category === cat);
            if (group.length === 0) return null;
            return (
              <div key={cat} className="mb-0.5">
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide opacity-45">{cat}</div>
                {group.map((l) => (
                  <Row key={l.label} label={`${l.label} (${num(l.quantity)} ${l.unit})`} value={formatTRY(l.total)} />
                ))}
              </div>
            );
          })}
          <div className="mt-1 flex justify-between border-t border-white/10 pt-1">
            <span className="opacity-70">Ara toplam (imalat)</span>
            <span className="tabular-nums opacity-70">{formatTRY(cost.subtotal)}</span>
          </div>
          <Row
            label={`Genel gider + kâr (%${Math.round(cost.overheadRate * 100)})`}
            value={formatTRY(cost.overhead)}
          />
          <div className="mt-1 flex justify-between border-t border-white/10 pt-1 font-semibold">
            <span>Toplam</span>
            <span className="tabular-nums">{formatTRY(cost.total)}</span>
          </div>
          {cost.perM2 > 0 && (
            <div className="flex justify-between text-[11px] opacity-60">
              <span>≈ m² başına</span>
              <span className="tabular-nums">{formatTRY(cost.perM2)}/m²</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setEditPrices((v) => !v)}
            className="mt-1.5 self-start text-[11px] text-[var(--accent-text)] hover:underline"
          >
            {editPrices ? '▾ Birim fiyatları gizle' : '▸ Birim fiyatları düzenle'}
          </button>
          {editPrices && (
            <div className="mt-1 rounded-md border border-white/10 bg-black/20 p-2">
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                {PRICE_FIELDS.map((f) => (
                  <label key={f.key} className="flex items-center justify-between gap-1 text-[11px]">
                    <span className="truncate opacity-70">{f.label}</span>
                    <span className="flex items-center gap-0.5">
                      <input
                        type="number"
                        min={0}
                        value={prices[f.key]}
                        onChange={(e) => setPrice(f.key, e.target.valueAsNumber)}
                        className="w-[58px] rounded border border-white/10 bg-white/5 px-1 py-0.5 text-right tabular-nums outline-none focus:border-[var(--accent)]"
                      />
                      <span className="text-[9px] opacity-40">{f.unit}</span>
                    </span>
                  </label>
                ))}
                <label className="flex items-center justify-between gap-1 text-[11px]">
                  <span className="truncate opacity-70">Genel gider+kâr</span>
                  <span className="flex items-center gap-0.5">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={Math.round(prices.overheadRate * 100)}
                      onChange={(e) => setPrice('overheadRate', (e.target.valueAsNumber || 0) / 100)}
                      className="w-[58px] rounded border border-white/10 bg-white/5 px-1 py-0.5 text-right tabular-nums outline-none focus:border-[var(--accent)]"
                    />
                    <span className="text-[9px] opacity-40">%</span>
                  </span>
                </label>
              </div>
              <button
                type="button"
                onClick={resetPrices}
                className="mt-1.5 text-[10px] opacity-50 hover:opacity-80 hover:underline"
              >
                Varsayılana sıfırla
              </button>
            </div>
          )}
          <div className="mt-1 text-[10px] leading-tight opacity-40">
            Kaba 2026 birim fiyat tahminidir; bölge/malzeme/işçilikle değişir. Fiyatları kendin düzenleyebilirsin (kaydedilir).
          </div>
        </div>
      </Panel>
    )}
    </>
  );
}
