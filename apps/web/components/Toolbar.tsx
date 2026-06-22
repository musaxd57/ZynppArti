'use client';

import { useEffect, useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  AddEntity,
  BatchCommand,
  RemoveEntity,
  serializeModel,
  deserializeModel,
  type EntityStore,
  type History,
  type Sheet,
} from '@zynpparti/document';
import type { ToolManager, ToolName } from '@zynpparti/tools';
import { importDxf, exportDxf, exportSvg } from '@zynpparti/io';

const TOOLS: { name: ToolName; label: string; hotkey: string }[] = [
  { name: 'select', label: 'Seç', hotkey: 'V' },
  { name: 'wall', label: 'Duvar', hotkey: 'L' },
  { name: 'door', label: 'Kapı', hotkey: 'D' },
  { name: 'window', label: 'Pencere', hotkey: 'P' },
  { name: 'dimension', label: 'Ölçü', hotkey: 'O' },
  { name: 'parcel', label: 'Parsel', hotkey: 'R' },
  { name: 'annotation', label: 'Metin', hotkey: 'T' },
  { name: 'sheet', label: 'Pafta', hotkey: 'F' },
  { name: 'erase', label: 'Sil', hotkey: 'E' },
  { name: 'calibrate', label: 'Ölçekle', hotkey: 'K' },
];

interface ToolbarProps {
  manager: ToolManager;
  history: History;
  store: EntityStore;
  exportPng: () => Promise<string>;
  zoomToFit: () => void;
  /** Katman görünürlüğü — gizli katmanlar vektör export'larda (DXF/SVG) atlanır. */
  layers?: { isHidden(id: string): boolean };
}

/** Araç çubuğu: araç seçimi, undo/redo, DXF içe/dışa aktarma, PNG dışa aktarma. */
export function Toolbar({ manager, history, store, exportPng, zoomToFit, layers }: ToolbarProps) {
  const [active, setActive] = useState<ToolName>(manager.activeTool);
  const fileRef = useRef<HTMLInputElement>(null);
  const jsonRef = useRef<HTMLInputElement>(null);

  useEffect(() => manager.subscribe(setActive), [manager]);

  // Dosya kısayolları: Ctrl+S (kaydet) / Ctrl+O (aç). Tarayıcının kendi diyaloglarını bastır.
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === 's') {
        e.preventDefault();
        onSaveJson();
      } else if (k === 'o') {
        e.preventDefault();
        jsonRef.current?.click();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // Bir kez bağlanır; onSaveJson sabit `store`/`history` prop'larını kapatır (CanvasStage'de tek sefer kurulur).
  }, []);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const { walls, annotations } = importDxf(await file.text());
      if (walls.length === 0 && annotations.length === 0) {
        alert('DXF içinde içe aktarılabilir içerik (LINE/POLYLINE/CIRCLE/ARC/TEXT) bulunamadı.');
        return;
      }
      const imported = [...walls, ...annotations];
      history.dispatch(new BatchCommand('DXF içe aktar', imported.map((ent) => new AddEntity(ent))));
    } catch (err) {
      alert('DXF okunamadı: ' + (err instanceof Error ? err.message : String(err)));
    }
  }

  function download(href: string, name: string): void {
    const a = document.createElement('a');
    a.href = href;
    a.download = name;
    a.click();
  }

  async function onExportPng(): Promise<void> {
    download(await exportPng(), 'zynpparti.png');
  }

  /**
   * Mevcut tuval görüntüsünü PDF'e gömer. Sayfa boyutu/yönelimi varsa ilk paftadan (A4–A0),
   * yoksa A4 yatay. Görsel sayfaya orantı korunarak, kenar boşluğuyla sığdırılır.
   */
  async function onExportPdf(): Promise<void> {
    const dataUrl = await exportPng();
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const sheet = store.all().find((e): e is Sheet => e.type === 'sheet');
    const format = sheet ? sheet.size.toLowerCase() : 'a4';
    const orientation: 'l' | 'p' = sheet && sheet.orientation === 'portrait' ? 'p' : 'l';
    const pdf = new jsPDF({ orientation, unit: 'mm', format });
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const availW = pw - 2 * margin;
    const availH = ph - 2 * margin;
    const ar = img.width / img.height || 1;
    let w = availW;
    let h = w / ar;
    if (h > availH) {
      h = availH;
      w = h * ar;
    }
    pdf.addImage(dataUrl, 'PNG', (pw - w) / 2, (ph - h) / 2, w, h);
    pdf.save('zynpparti.pdf');
  }

  /** Görünür katmanlardaki entity'ler (gizli katmanlar vektör export'tan düşülür). */
  function visibleEntities() {
    return store.all().filter((ent) => !layers?.isHidden(ent.layerId));
  }

  function onExportDxf(): void {
    const blob = new Blob([exportDxf(visibleEntities())], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    download(url, 'zynpparti.dxf');
    URL.revokeObjectURL(url);
  }

  function onSaveJson(): void {
    const blob = new Blob([serializeModel(store.all())], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    download(url, 'zynpparti.json');
    URL.revokeObjectURL(url);
  }

  async function onOpenJson(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const loaded = deserializeModel(await file.text());
      // Mahaller (space) duvarlardan RoomManager ile türetilir → yüklemede atlanır, yeniden hesaplanır.
      const toAdd = loaded.filter((ent) => ent.type !== 'space');
      // "Aç" = değiştir: mevcut (türetilmemiş) entity'leri kaldır, yüklenenleri ekle (tek undo).
      const toRemove = store.all().filter((ent) => ent.type !== 'space');
      history.dispatch(
        new BatchCommand('Model aç', [
          ...toRemove.map((ent) => new RemoveEntity(ent.id)),
          ...toAdd.map((ent) => new AddEntity(ent)),
        ]),
      );
    } catch (err) {
      alert('Model açılamadı: ' + (err instanceof Error ? err.message : String(err)));
    }
  }

  function onExportSvg(): void {
    const blob = new Blob([exportSvg(visibleEntities())], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    download(url, 'zynpparti.svg');
    URL.revokeObjectURL(url);
  }

  const btn = 'shrink-0 rounded px-3 py-1.5 transition-colors hover:bg-white/10';

  return (
    <div className="absolute left-4 top-16 flex max-w-[calc(100vw-20rem)] flex-nowrap items-center gap-1 overflow-x-auto rounded-lg bg-black/60 p-1 text-sm text-white backdrop-blur">
      {TOOLS.map((t) => (
        <button
          key={t.name}
          type="button"
          onClick={() => manager.setTool(t.name)}
          title={`${t.label} (${t.hotkey})`}
          className={`shrink-0 rounded px-2.5 py-1.5 transition-colors ${
            active === t.name ? 'bg-blue-600' : 'hover:bg-white/10'
          }`}
        >
          {t.label}
        </button>
      ))}
      <span className="mx-1 h-5 w-px shrink-0 bg-white/20" />
      <button type="button" onClick={() => history.undo()} className={btn} title="Geri al (Ctrl+Z)">
        ↶
      </button>
      <button type="button" onClick={() => history.redo()} className={btn} title="İleri al (Ctrl+Shift+Z)">
        ↷
      </button>
      <span className="mx-1 h-5 w-px shrink-0 bg-white/20" />
      <button type="button" onClick={zoomToFit} className={btn} title="İçeriğe sığdır (Home)">
        ⊡ Sığdır
      </button>
      <span className="mx-1 h-5 w-px shrink-0 bg-white/20" />
      <button type="button" onClick={onSaveJson} className={btn} title="Modeli kaydet (.json) — Ctrl+S">
        Kaydet
      </button>
      <button type="button" onClick={() => jsonRef.current?.click()} className={btn} title="Model aç (.json) — Ctrl+O">
        Aç
      </button>
      <span className="mx-1 h-5 w-px shrink-0 bg-white/20" />
      <button type="button" onClick={() => fileRef.current?.click()} className={btn}>
        DXF Yükle
      </button>
      <button type="button" onClick={onExportDxf} className={btn}>
        DXF İndir
      </button>
      <button type="button" onClick={onExportSvg} className={btn}>
        SVG İndir
      </button>
      <button type="button" onClick={() => void onExportPng()} className={btn}>
        PNG İndir
      </button>
      <button type="button" onClick={() => void onExportPdf()} className={btn}>
        PDF İndir
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".dxf"
        className="hidden"
        onChange={(e) => void onFile(e)}
      />
      <input
        ref={jsonRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={(e) => void onOpenJson(e)}
      />
    </div>
  );
}
