'use client';

import { useEffect, useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import { svg2pdf } from 'svg2pdf.js';
import {
  AddEntity,
  BatchCommand,
  RemoveEntity,
  serializeModel,
  deserializeModel,
  sheetModelSize,
  type Entity,
  type EntityStore,
  type History,
  type Sheet,
} from '@zynpparti/document';
import type { ToolManager, ToolName } from '@zynpparti/tools';
import { importDxf, importDwg, exportDxf, exportSvg } from '@zynpparti/io';
import { Undo2, Redo2, Maximize, PanelLeft, PanelLeftClose } from 'lucide-react';
import { alertDialog, confirmDialog } from '@/lib/dialog';
import { toast } from '@/lib/toast';
import { projectFileBase, useProjectName, setProjectName } from '@/lib/project-name';
import { VesnaLogo } from './VesnaLogo';
import { TOOL_ICONS } from './toolbar-icons';

const TOOLS: { name: ToolName; label: string; hotkey: string }[] = [
  { name: 'select', label: 'Seç', hotkey: 'V' },
  { name: 'wall', label: 'Duvar', hotkey: 'L' },
  { name: 'door', label: 'Kapı', hotkey: 'D' },
  { name: 'window', label: 'Pencere', hotkey: 'P' },
  { name: 'dimension', label: 'Ölçü', hotkey: 'O' },
  { name: 'parcel', label: 'Parsel', hotkey: 'R' },
  { name: 'block', label: 'Blok', hotkey: 'B' },
  { name: 'annotation', label: 'Metin', hotkey: 'T' },
  { name: 'sheet', label: 'Pafta', hotkey: 'F' },
  { name: 'section', label: 'Kesit', hotkey: 'C' },
  { name: 'comment', label: 'Yorum', hotkey: 'M' },
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
  /** Üst araç çubuğundaki "Vesna" butonu AI panelini açar. */
  onOpenAssistant?: () => void;
  /** Zen modu: sol+sağ paneller gizli mi + aç/kapat. */
  chromeHidden?: boolean;
  onToggleChrome?: () => void;
}

/**
 * Bir paftanın DOLU olup olmadığı: o paftanın model dikdörtgeni içinde çizim içeriği (duvar/parsel/
 * ölçü/blok/metin…) var mı? Çok-sayfa PDF'de BOŞ paftalar atlanır (Moses: yalnız dolu olanları kaydet).
 * Türetilmiş mahal + boşluk (duvara bağlı) sayılmaz — duvar zaten içeriği temsil eder.
 */
function sheetHasContent(s: Sheet, ents: readonly Entity[]): boolean {
  const { w, h } = sheetModelSize(s);
  const x0 = s.position.x;
  const y0 = s.position.y;
  const x1 = x0 + w;
  const y1 = y0 + h;
  const inRect = (p: { x: number; y: number }): boolean => p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1;
  for (const e of ents) {
    let pts: { x: number; y: number }[] = [];
    if (e.type === 'wall') pts = [e.start, e.end, { x: (e.start.x + e.end.x) / 2, y: (e.start.y + e.end.y) / 2 }];
    else if (e.type === 'parcel') pts = [...e.boundary];
    else if (e.type === 'dimension' || e.type === 'section') pts = [e.a, e.b];
    else if (e.type === 'block' || e.type === 'annotation' || e.type === 'comment') pts = [e.position];
    // sheet/space/opening → atla (sheet kendisi, space türetilmiş, opening duvara bağlı)
    if (pts.some(inRect)) return true;
  }
  return false;
}

/** Araç çubuğu: araç seçimi, undo/redo, DXF içe/dışa aktarma, PNG dışa aktarma. */
export function Toolbar({
  manager,
  history,
  store,
  exportPng,
  zoomToFit,
  layers,
  onOpenAssistant,
  chromeHidden,
  onToggleChrome,
}: ToolbarProps) {
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
    const isDwg = file.name.toLowerCase().endsWith('.dwg');
    try {
      if (isDwg) toast('DWG çözülüyor… (ilk seferde WASM yüklenir, biraz sürebilir)', 'info', 4000);
      const { walls, annotations } = isDwg
        ? await importDwg(await file.arrayBuffer())
        : importDxf(await file.text());
      if (walls.length === 0 && annotations.length === 0) {
        toast('İçe aktarılabilir içerik bulunamadı (çizgi/yay/daire/metin/blok).', 'info');
        return;
      }
      const imported = [...walls, ...annotations];
      history.dispatch(new BatchCommand('CAD içe aktar', imported.map((ent) => new AddEntity(ent))));
      toast(`${imported.length} öğe içe aktarıldı (${walls.length} çizgi/duvar).`, 'success');
    } catch (err) {
      // Mimar-dostu mesaj; teknik ayrıntı konsola.
      console.error('CAD import hatası:', err);
      toast(
        isDwg
          ? 'DWG okunamadı — dosya bozuk olabilir; AutoCAD\'de "DXF" olarak kaydetmeyi de deneyebilirsin.'
          : 'DXF okunamadı — dosya bozuk ya da desteklenmeyen sürüm olabilir.',
        'error',
        5000,
      );
    }
  }

  const projectName = useProjectName(); // üstte düzenlenebilir proje adı (indirmeler bunu kullanır)

  function download(href: string, name: string): void {
    const a = document.createElement('a');
    a.href = href;
    a.download = name;
    a.click();
  }

  async function onExportPng(): Promise<void> {
    if (blockExportIfEmpty()) return;
    // PNG extract (GPU okuma) AĞIR olabilir → önce anında "hazırlanıyor" bilgisi (kullanıcı feedback alsın).
    toast('PNG hazırlanıyor…', 'info', 1500);
    try {
      const dataUrl = await exportPng();
      // Devasa base64 data-URL'i (data:image/png;base64,...) blob object-URL'e çevir: indirme HAFİF olur
      // ve başarı toast'ı güvenilir görünür. (DXF/SVG zaten blob URL kullanıyor → toast'ları çıkıyordu;
      // PNG dev data-URL + ağır extract sonrası toast render'ını yarıştırıp yutuyordu — denetim bulgusu.)
      const blob = await (await fetch(dataUrl)).blob();
      const url = URL.createObjectURL(blob);
      download(url, `${projectFileBase()}.png`);
      URL.revokeObjectURL(url);
      toast('PNG indirildi.', 'success');
    } catch (err) {
      console.error('PNG export başarısız:', err);
      toast('PNG dışa aktarılamadı.', 'error');
    }
  }

  /**
   * PDF dışa aktarma. **Pafta(lar) varsa: her pafta = bir SAYFA** (kendi kağıt boyutu/yönelimi,
   * o paftanın model bölgesi kırpılarak) → çok-sayfa PDF. Pafta yoksa: tek sayfa, tüm tuval (A4 yatay).
   * Vektör (svg2pdf, keskin baskı); pafta-yok yolunda hata olursa raster yedeğe düşer.
   */
  async function onExportPdf(): Promise<void> {
    if (blockExportIfEmpty()) return;
    const sheets = store
      .all()
      .filter((e): e is Sheet => e.type === 'sheet')
      .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);

    // ÇOK-SAYFA: her DOLU pafta kendi kağıdında ayrı sayfa (boş paftalar atlanır), model dikdörtgeni kırpılır.
    const ents = visibleEntities();
    const full = sheets.filter((s) => sheetHasContent(s, ents));
    if (full.length > 0) {
      const ori = (s: Sheet): 'l' | 'p' => (s.orientation === 'portrait' ? 'p' : 'l');
      const pdf = new jsPDF({ orientation: ori(full[0]!), unit: 'mm', format: full[0]!.size.toLowerCase() });
      for (let i = 0; i < full.length; i++) {
        const s = full[i]!;
        if (i > 0) pdf.addPage(s.size.toLowerCase(), ori(s));
        const pgW = pdf.internal.pageSize.getWidth();
        const pgH = pdf.internal.pageSize.getHeight();
        const { w: mw, h: mh } = sheetModelSize(s);
        try {
          const svgStr = exportSvg(ents, { minX: s.position.x, minY: s.position.y, w: mw, h: mh });
          const el = new DOMParser().parseFromString(svgStr, 'image/svg+xml')
            .documentElement as unknown as SVGSVGElement;
          el.style.position = 'absolute';
          el.style.left = '-99999px';
          document.body.appendChild(el);
          try {
            await svg2pdf(el, pdf, { x: 0, y: 0, width: pgW, height: pgH });
          } finally {
            el.remove();
          }
        } catch (err) {
          console.error(`Pafta sayfası ${i + 1} PDF'e çizilemedi:`, err);
        }
      }
      pdf.save(`${projectFileBase()}.pdf`);
      const skipped = sheets.length - full.length;
      toast(`PDF indirildi (${full.length} sayfa${skipped > 0 ? `, ${skipped} boş pafta atlandı` : ''}).`, 'success');
      return;
    }
    // Pafta(lar) var ama hepsi BOŞ → tek sayfa, tüm tuval (aşağı düş).
    if (sheets.length > 0) {
      toast('Paftalar boş — tüm çizim tek sayfaya alındı.', 'info', 4000);
    }

    // PAFTA YOK: tek sayfa, tüm tuval (A4 yatay, içeriğe sığdır).
    const pdf = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' });
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const availW = pw - 2 * margin;
    const availH = ph - 2 * margin;
    // En-boy oranını sayfa içine sığdır (kenar boşluklu, ortalı).
    const fit = (ar: number): { w: number; h: number } => {
      let w = availW;
      let h = w / ar;
      if (h > availH) {
        h = availH;
        w = h * ar;
      }
      return { w, h };
    };

    // 1) VEKTÖR (keskin baskı): SVG'yi doğrudan PDF'e çiz. Hata olursa raster'a düşer.
    try {
      const svgStr = exportSvg(visibleEntities());
      const el = new DOMParser().parseFromString(svgStr, 'image/svg+xml')
        .documentElement as unknown as SVGSVGElement;
      const vb = el.getAttribute('viewBox')?.trim().split(/\s+/).map(Number);
      const sw = vb && vb.length === 4 ? vb[2]! : Number(el.getAttribute('width'));
      const sh = vb && vb.length === 4 ? vb[3]! : Number(el.getAttribute('height'));
      if (!(sw > 0 && sh > 0)) throw new Error('SVG boyutu okunamadı');
      const { w, h } = fit(sw / sh);
      // svg2pdf bazı durumlarda canlı DOM ister → görünmez biçimde ekle, sonra kaldır.
      el.style.position = 'absolute';
      el.style.left = '-99999px';
      document.body.appendChild(el);
      try {
        await svg2pdf(el, pdf, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
      } finally {
        el.remove();
      }
      pdf.save(`${projectFileBase()}.pdf`);
      toast('PDF indirildi (vektör).', 'success');
      return;
    } catch (err) {
      console.error('Vektör PDF başarısız, raster yedeğe düşülüyor:', err);
    }

    // 2) RASTER yedeği: tuval görüntüsünü göm.
    const dataUrl = await exportPng();
    const img = new Image();
    img.src = dataUrl;
    try {
      await img.decode();
    } catch {
      await alertDialog('PDF için çizim alınamadı. Lütfen tekrar deneyin.');
      return;
    }
    const { w, h } = fit(img.width / img.height || 1);
    pdf.addImage(dataUrl, 'PNG', (pw - w) / 2, (ph - h) / 2, w, h);
    pdf.save(`${projectFileBase()}.pdf`);
    toast('PDF indirildi.', 'success');
  }

  /** Görünür katmanlardaki entity'ler (gizli katmanlar vektör export'tan düşülür). */
  function visibleEntities() {
    return store.all().filter((ent) => !layers?.isHidden(ent.layerId));
  }

  /** Dışa aktarılacak görünür ÇİZİM var mı? Sayfa/pafta çerçevesi ve yorum "çizim" sayılmaz. */
  function hasDrawableContent(): boolean {
    return visibleEntities().some((e) => e.type !== 'sheet' && e.type !== 'comment');
  }

  /** Çizim boşsa export'u engelle + açıklayıcı uyarı göster. Dönüş true = boş (çağıran return etmeli). */
  function blockExportIfEmpty(): boolean {
    if (hasDrawableContent()) return false;
    toast('Sayfa boş — dışa aktarmadan önce duvar, oda gibi bir şeyler çiz.', 'info', 4500);
    return true;
  }

  function onExportDxf(): void {
    if (blockExportIfEmpty()) return;
    const blob = new Blob([exportDxf(visibleEntities())], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    download(url, `${projectFileBase()}.dxf`);
    URL.revokeObjectURL(url);
    toast('DXF indirildi.', 'success');
  }

  async function onNewModel(): Promise<void> {
    const toRemove = store.all().filter((ent) => ent.type !== 'space');
    if (toRemove.length === 0) return;
    if (!(await confirmDialog('Tüm çizim temizlensin mi? (Geri al ile dönülebilir.)'))) return;
    history.dispatch(new BatchCommand('Yeni', toRemove.map((ent) => new RemoveEntity(ent.id))));
  }

  function onSaveJson(): void {
    const blob = new Blob([serializeModel(store.all())], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    download(url, `${projectFileBase()}.json`);
    URL.revokeObjectURL(url);
    toast('Model kaydedildi (.json).', 'success');
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
      setProjectName(file.name.replace(/\.json$/i, '') || 'Adsız Plan'); // proje adını dosyadan türet
      toast(`Model açıldı (${toAdd.length} öğe).`, 'success');
    } catch (err) {
      console.error('Model açma hatası:', err);
      toast('Model açılamadı — dosya bu uygulamanın .json kayıt biçiminde olmalı.', 'error', 5000);
    }
  }

  function onExportSvg(): void {
    if (blockExportIfEmpty()) return;
    const blob = new Blob([exportSvg(visibleEntities())], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    download(url, `${projectFileBase()}.svg`);
    URL.revokeObjectURL(url);
    toast('SVG indirildi.', 'success');
  }

  const btn =
    'shrink-0 rounded-md px-3 py-1.5 text-[var(--text-2)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text-1)]';

  return (
    <div className="z-30 flex w-full shrink-0 flex-nowrap items-center gap-1 overflow-x-auto border-b border-[var(--border-soft)] bg-[var(--surface-2)] p-1.5 text-[13px] text-[var(--text-1)]">
      <input
        aria-label="Proje adı"
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        placeholder="Proje adı"
        title="Proje adı — indirilen dosyalar (PNG/DXF/PDF…) bu adı kullanır"
        className="mr-0.5 w-28 shrink-0 rounded-md bg-[var(--surface-3)] px-2 py-1 text-[12px] font-medium text-[var(--text-1)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      />
      <span className="mx-1 h-5 w-px shrink-0 bg-[var(--border-soft)]" />
      {TOOLS.map((t) => {
        const Icon = TOOL_ICONS[t.name];
        return (
          <button
            key={t.name}
            type="button"
            onClick={() => manager.setTool(t.name)}
            title={`${t.label} (${t.hotkey})`}
            aria-pressed={active === t.name}
            className={`flex shrink-0 flex-col items-center gap-0.5 rounded-md px-2 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
              active === t.name
                ? 'bg-[var(--accent-bg)] font-semibold text-[var(--accent-text)] ring-1 ring-[var(--border-focus)]'
                : 'text-[var(--text-2)] hover:bg-[var(--surface-3)] hover:text-[var(--text-1)]'
            }`}
          >
            <Icon className="h-[18px] w-[18px]" />
            <span className="text-[10px] leading-none">{t.label}</span>
          </button>
        );
      })}
      <span className="mx-1 h-5 w-px shrink-0 bg-[var(--border-soft)]" />
      <button type="button" onClick={() => history.undo()} className={btn} title="Geri al (Ctrl+Z)" aria-label="Geri al">
        <Undo2 className="h-[18px] w-[18px]" />
      </button>
      <button type="button" onClick={() => history.redo()} className={btn} title="İleri al (Ctrl+Shift+Z)" aria-label="İleri al">
        <Redo2 className="h-[18px] w-[18px]" />
      </button>
      <span className="mx-1 h-5 w-px shrink-0 bg-[var(--border-soft)]" />
      <button type="button" onClick={zoomToFit} className={btn} title="İçeriğe sığdır (Home)" aria-label="İçeriğe sığdır">
        <Maximize className="h-[18px] w-[18px]" />
      </button>
      <span className="mx-1 h-5 w-px shrink-0 bg-[var(--border-soft)]" />
      <button type="button" onClick={() => void onNewModel()} className={btn} title="Yeni / temizle">
        Yeni
      </button>
      <button type="button" onClick={onSaveJson} className={btn} title="Modeli kaydet (.json) — Ctrl+S">
        Kaydet
      </button>
      <button type="button" onClick={() => jsonRef.current?.click()} className={btn} title="Model aç (.json) — Ctrl+O">
        Aç
      </button>
      <span className="mx-1 h-5 w-px shrink-0 bg-[var(--border-soft)]" />
      <button type="button" onClick={() => fileRef.current?.click()} className={btn}>
        CAD Yükle
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
      <button
        type="button"
        onClick={() => onToggleChrome?.()}
        title={chromeHidden ? 'Panelleri göster' : 'Panelleri gizle (sadece çalışma alanı)'}
        aria-label={chromeHidden ? 'Panelleri göster' : 'Panelleri gizle'}
        aria-pressed={chromeHidden}
        className={`ml-auto ${btn} ${chromeHidden ? 'bg-[var(--accent-bg)] text-[var(--accent-text)]' : ''}`}
      >
        {chromeHidden ? (
          <PanelLeft className="h-[18px] w-[18px]" />
        ) : (
          <PanelLeftClose className="h-[18px] w-[18px]" />
        )}
      </button>
      <span className="mx-1 h-5 w-px shrink-0 bg-[var(--border-soft)]" />
      <button
        type="button"
        onClick={() => onOpenAssistant?.()}
        title="Vesna — AI tasarım yardımcın (Sor / Çiz / Render)"
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--accent)] px-3 py-1.5 font-semibold text-white shadow-sm transition-colors hover:bg-[var(--accent-hover)]"
      >
        <VesnaLogo className="h-[18px] w-[18px]" />
        Vesna <span className="font-normal opacity-75">AI</span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".dxf,.dwg"
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
