'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createCanvasApp,
  createSnapIndicator,
  createPresenceLayer,
  entityBounds,
  type CanvasHandle,
} from '@zynpparti/engine';
import type { CollabHandle } from '@zynpparti/collab';
import {
  EntityStore,
  History,
  RoomManager,
  AddEntity,
  RemoveEntity,
  UpdateEntity,
  deserializeModel,
  makeSheet,
  createEntityId,
  nextSheetPosition,
  sheetModelSize,
  type Sheet,
} from '@zynpparti/document';
import { ToolManager, createSnapper } from '@zynpparti/tools';
import { seedDemo } from '@/lib/demo-seed';
import { Toolbar } from './Toolbar';
import { RoomList } from './RoomList';
import { CopilotPanel } from './CopilotPanel';
import { Assistant } from './Assistant';
import { CollabControl } from './CollabControl';
import { View3D } from './View3D';
import { EmptyCanvasHint } from './EmptyCanvasHint';
import { toast } from '@/lib/toast';
import { TakeoffPanel } from './TakeoffPanel';
import { SheetPanel } from './SheetPanel';
import { SectionPanel } from './SectionPanel';
import { ContextMenu, type ContextMenuItem } from './ContextMenu';
import { CommandPalette } from './CommandPalette';
import { promptDialog } from '@/lib/dialog';
import { requestCommentAction } from '@/lib/comment-dialog';
import { requestCalibration } from '@/lib/calibrate-dialog';
import { PropertiesPanel } from './PropertiesPanel';
import { LayerPanel } from './LayerPanel';
import { BlockPalette } from './BlockPalette';
import { StatusBar } from './StatusBar';
import { ShortcutsHelp } from './ShortcutsHelp';
import { PerfHud, isPerfEnabled } from './PerfHud';
import { loadProjectName } from '@/lib/project-name';
import { isStartEmpty, consumePendingOpen } from '@/lib/app-start';

/** Presence imleç renkleri (kullanıcı clientID'sine göre döner) — accent/semantik tonlar. */
const PRESENCE_COLORS = [0x5b5bd6, 0xffb454, 0x71d083, 0xff9592, 0x4fd1e0, 0xe05bd6, 0xf5d90a];

/**
 * Engine canvas + araç yöneticisini DOM'a bağlayan React sarmalı.
 * PixiJS yalnızca istemcide çalışır → 'use client' + useEffect içinde mount edilir.
 */
export function CanvasStage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ui, setUi] = useState<{
    manager: ToolManager;
    history: History;
    store: EntityStore;
    layers: CanvasHandle['layers'];
    exportPng: () => Promise<string>;
    overlay: CanvasHandle['overlay'];
    pixelSize: CanvasHandle['pixelSize'];
    zoomToFit: () => void;
    zoomToBounds: CanvasHandle['zoomToBounds'];
    viewportBounds: CanvasHandle['viewportBounds'];
  } | null>(null);
  const [collab, setCollab] = useState<CollabHandle | null>(null);
  const [pageCount, setPageCount] = useState(1); // boş sayfa (grid karesi) sayısı — kullanıcı çoğaltır
  // Hover olaylarını çoğa dağıt (StatusBar + presence). Tek motor handler'ı → çok dinleyici.
  const hoverListenersRef = useRef(new Set<(w: { x: number; y: number } | null) => void>());
  const registerHover = useCallback((cb: (w: { x: number; y: number } | null) => void) => {
    hoverListenersRef.current.add(cb);
    return () => hoverListenersRef.current.delete(cb);
  }, []);
  const [renameId, setRenameId] = useState<string | null>(null);
  const clearRename = useCallback(() => setRenameId(null), []);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [initError, setInitError] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [rightW, setRightW] = useState(288);
  const [leftW, setLeftW] = useState(224);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [initialCiz, setInitialCiz] = useState<string | undefined>(undefined);
  const [chromeHidden, setChromeHidden] = useState(false); // zen: sol+sağ panelleri gizle

  // Landing'den `/app?ciz=<program>` ile gelindiyse: Vesna AI'ı Çiz modunda, istem YAPIŞTIRILMIŞ aç.
  // (window.location → useSearchParams Suspense gereksinimi yok; app zaten tam istemci.)
  useEffect(() => {
    try {
      const ciz = new URLSearchParams(window.location.search).get('ciz');
      if (ciz && ciz.trim()) {
        setInitialCiz(ciz.trim().slice(0, 300));
        setAssistantOpen(true);
      }
    } catch {
      /* yoksay */
    }
  }, []);

  // Kalıcı proje adını yükle (indirme dosya adları bundan türer). Bir kez, mount'ta.
  useEffect(() => {
    loadProjectName();
  }, []);

  // Sayfa sayacı = dokümandaki SADE sayfa (plain sheet) sayısı. Store değişince güncellenir
  // (ekle/çıkar/aç/undo hepsi yansır). Sayfalar gerçek entity → kaydolur + PDF'e girer.
  // PERF: tüm store'u her değişimde (her duvar sürüklemede) O(n) taramak yerine, plain-sheet
  // id'lerini bir Set'te tutup yalnız bir SHEET değiştiğinde güncelle (O(değişen)). (YARIN C.)
  useEffect(() => {
    if (!ui) return;
    const plainIds = new Set<string>();
    const isPlain = (id: string): boolean => {
      const e = ui.store.get(id);
      return e?.type === 'sheet' && (e as Sheet).plain === true;
    };
    // İlk tam tarama (yalnız bir kez): Set'i doldur.
    for (const e of ui.store.all()) {
      if (e.type === 'sheet' && (e as Sheet).plain === true) plainIds.add(e.id);
    }
    setPageCount(plainIds.size);
    return ui.store.subscribe((change) => {
      let changed = false;
      for (const id of [...change.added, ...change.updated]) {
        const plain = isPlain(id);
        if (plain && !plainIds.has(id)) {
          plainIds.add(id);
          changed = true;
        } else if (!plain && plainIds.has(id)) {
          plainIds.delete(id);
          changed = true;
        }
      }
      for (const id of change.removed) {
        if (plainIds.delete(id)) changed = true;
      }
      if (changed) setPageCount(plainIds.size);
    });
  }, [ui]);

  // Dock genişliklerini hatırla (localStorage).
  useEffect(() => {
    try {
      const r = Number(localStorage.getItem('zynpparti.rightDockW'));
      if (r >= 200 && r <= 560) setRightW(r);
      const l = Number(localStorage.getItem('zynpparti.leftDockW'));
      if (l >= 180 && l <= 480) setLeftW(l);
    } catch {
      /* yoksay */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem('zynpparti.rightDockW', String(rightW));
    } catch {
      /* yoksay */
    }
  }, [rightW]);
  useEffect(() => {
    try {
      localStorage.setItem('zynpparti.leftDockW', String(leftW));
    } catch {
      /* yoksay */
    }
  }, [leftW]);

  // Dock kenarlarından sürükleyerek genişlik ayarı. Aktif sürüklemenin temizleyicisi ref'te tutulur;
  // bileşen sürükleme ortasında unmount olursa window dinleyicileri yetim kalmasın + unmount sonrası
  // setState çağrılmasın diye unmount effect'inde temizlenir. (Denetim bulgusu.)
  const dragCleanup = useRef<(() => void) | null>(null);
  useEffect(() => () => dragCleanup.current?.(), []);
  const startRightResize = useCallback((e: React.PointerEvent): void => {
    e.preventDefault();
    const onMove = (ev: PointerEvent): void =>
      setRightW(Math.min(560, Math.max(200, window.innerWidth - ev.clientX)));
    const cleanup = (): void => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      dragCleanup.current = null;
    };
    const onUp = (): void => cleanup();
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    dragCleanup.current = cleanup;
  }, []);
  const startLeftResize = useCallback((e: React.PointerEvent): void => {
    e.preventDefault();
    const onMove = (ev: PointerEvent): void => setLeftW(Math.min(480, Math.max(180, ev.clientX)));
    const cleanup = (): void => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      dragCleanup.current = null;
    };
    const onUp = (): void => cleanup();
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    dragCleanup.current = cleanup;
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const store = new EntityStore();
    // Başlangıç içeriği: karşılama ekranından "Aç" geldiyse o modeli yükle; "Yeni proje" ise BOŞ başla;
    // (collab/?ciz baypası veya doğrudan açılış) ise eski davranış: demo tohum.
    const pendingOpen = consumePendingOpen();
    const startEmpty = isStartEmpty();
    if (pendingOpen) {
      try {
        for (const e of deserializeModel(pendingOpen)) {
          if (e.type !== 'space') store.put(e); // mahaller RoomManager'ca yeniden türetilir
        }
      } catch (err) {
        console.error('Başlangıç model açma başarısız:', err);
      }
    } else if (!startEmpty) {
      seedDemo(store); // geçici demo duvarlar (yalnız demo/baypas modunda)
    } else {
      // Yeni boş proje: 1 SADE SAYFA (plain sheet) ile başla — kullanıcının çoğaltacağı boş sayfa.
      // Origin'de ortalı. Pafta arayüzü yok (plain); kaydolur + PDF'e girer. "− N sayfa +" çoğaltır.
      const probe = { ...makeSheet({ x: 0, y: 0 }, { plain: true }), id: 'tmp' } as Sheet;
      const { w, h } = sheetModelSize(probe);
      store.put({ ...makeSheet({ x: -w / 2, y: -h / 2 }, { plain: true, sheetNo: '1' }), id: createEntityId() });
    }

    let handle: CanvasHandle | undefined;
    let manager: ToolManager | undefined;
    let rooms: RoomManager | undefined;
    let disposed = false;
    let lastLockToast = 0; // kilitli-katman toast'ı için throttle damgası

    void createCanvasApp(el, store).then((h) => {
      if (disposed) {
        h.destroy();
        return;
      }
      handle = h;
      if (startEmpty) h.zoomToFit(); // yeni proje: açılıştaki boş sayfayı ekrana sığdır
      const history = new History(store);
      // Mahalleri otomatik bul (engine entity katmanı abone olduktan sonra).
      rooms = new RoomManager(store);
      const snapIndicator = createSnapIndicator(h.overlay);
      manager = new ToolManager({
        store,
        history,
        index: h.index,
        overlay: h.overlay,
        pixelSize: h.pixelSize,
        snap: createSnapper(
          store,
          h.index,
          h.pixelSize,
          (hint) => snapIndicator.show(hint, h.pixelSize()),
          h.viewportBounds, // hizalama yalnız görünür geometriye (büyük modelde perf)
        ),
        isLayerHidden: (id) => h.layers.isHidden(id),
        isLayerLocked: (id) => h.layers.isLocked(id),
        setCursor: (c) => h.setCursor(c),
        onSelectionChange: (ids) => setSelectedIds(ids),
        onLayerLocked: () => {
          // Kilitli öğeye tıklayınca bilgilendir; arka arkaya tıklamada spam yapma (1.5 sn).
          const now = Date.now();
          if (now - lastLockToast > 1500) {
            lastLockToast = now;
            toast('Bu öğe kilitli bir katmanda — düzenlemek için katman kilidini aç.', 'info');
          }
        },
        requestCalibration, // ölçek için temalı diyalog (window.prompt yerine)
        requestText: (message, initial) => promptDialog(message, initial ?? ''), // metin/yorum için temalı diyalog
      });
      h.setActiveTool(manager);
      // Mahal içine çift tık → Seç moduna geç + o mahalin adını düzenlemeye odaklan.
      h.setSpaceActivateHandler((id) => {
        manager?.setTool('select');
        setRenameId(id);
      });
      // Açıklama metnine çift tık → mevcut metinle düzenle (basit prompt; AnnotationTool ile tutarlı).
      // Sağ-tık → bağlam menüsü (engine doğrudan canvas'a bağlar; Pixi olayı yutsa bile çalışır).
      h.setContextMenuHandler((x, y) => setMenu({ x, y }));
      h.setAnnotationActivateHandler((id) => {
        const ent = store.get(id);
        if (ent?.type !== 'annotation') return;
        promptDialog('Metin:', ent.text)
          .then((next) => {
            if (next == null) return;
            const trimmed = next.trim();
            if (!trimmed || trimmed === ent.text) return;
            history.dispatch(new UpdateEntity({ ...ent, text: trimmed }));
          })
          .catch((err) => {
            console.error('Açıklama düzenleme diyaloğu hatası:', err);
            toast('Diyalog açılamadı.', 'error');
          });
      });
      // Yoruma çift tık → temalı diyalog: metin düzenle / çözüldü işaretle / sil.
      h.setCommentActivateHandler((id) => {
        const ent = store.get(id);
        if (ent?.type !== 'comment') return;
        requestCommentAction(ent.text, ent.resolved ?? false)
          .then((res) => {
            if (!res) return;
            if ('delete' in res) {
              history.dispatch(new RemoveEntity(id));
              return;
            }
            const changed = res.text !== ent.text || res.resolved !== (ent.resolved ?? false);
            if (changed) history.dispatch(new UpdateEntity({ ...ent, text: res.text, resolved: res.resolved }));
          })
          .catch((err) => {
            console.error('Yorum diyaloğu hatası:', err);
            toast('Diyalog açılamadı.', 'error');
          });
      });
      // Tek motor hover handler'ı → kayıtlı tüm dinleyicilere dağıt (StatusBar + presence).
      h.setHoverHandler((w) => {
        for (const fn of hoverListenersRef.current) fn(w);
      });
      setUi({
        manager,
        history,
        store,
        layers: h.layers,
        exportPng: h.exportPng,
        overlay: h.overlay,
        pixelSize: h.pixelSize,
        zoomToFit: h.zoomToFit,
        zoomToBounds: h.zoomToBounds,
        viewportBounds: h.viewportBounds,
      });
    }).catch((err) => {
      // PixiJS init başarısız (WebGL yok/bellek) → sonsuz "yükleniyor" yerine hata göster.
      console.error('Tuval başlatılamadı:', err);
      setInitError(err instanceof Error ? err.message : String(err));
    });

    return () => {
      disposed = true;
      rooms?.destroy();
      manager?.destroy();
      handle?.destroy();
      setUi(null);
    };
  }, []);

  // Presence (Faz 3): collab bağlıyken kendi imlecini paylaş + uzak imleçleri overlay'de göster.
  useEffect(() => {
    if (!collab || !ui) return;
    let cleanup = (): void => {};
    try {
      const aw = collab.awareness as unknown as {
        clientID: number;
        setLocalStateField: (k: string, v: unknown) => void;
        getStates: () => Map<number, Record<string, unknown>>;
        on: (e: string, cb: () => void) => void;
        off: (e: string, cb: () => void) => void;
      };
      const color = PRESENCE_COLORS[aw.clientID % PRESENCE_COLORS.length]!;
      aw.setLocalStateField('user', { color });
      const layer = createPresenceLayer(ui.overlay);
      const unreg = registerHover((w) => aw.setLocalStateField('cursor', w ? { x: w.x, y: w.y } : null));
      const render = (): void => {
        const cursors: { id: string; x: number; y: number; color: number }[] = [];
        const selections: { minX: number; minY: number; maxX: number; maxY: number; color: number }[] = [];
        aw.getStates().forEach((st, id) => {
          if (id === aw.clientID) return;
          const u = st.user as { color?: number } | undefined;
          const color = u?.color ?? 0xffffff;
          const c = st.cursor as { x: number; y: number } | null | undefined;
          if (c) cursors.push({ id: String(id), x: c.x, y: c.y, color });
          const sel = st.selection as string[] | undefined;
          if (Array.isArray(sel)) {
            for (const eid of sel) {
              const e = ui.store.get(eid);
              if (!e) continue;
              try {
                const b = entityBounds(e);
                selections.push({ minX: b.minX, minY: b.minY, maxX: b.maxX, maxY: b.maxY, color });
              } catch {
                /* sınır hesaplanamadı → atla */
              }
            }
          }
        });
        layer.update(cursors, selections, ui.pixelSize());
      };
      aw.on('change', render);
      render();
      cleanup = (): void => {
        aw.off('change', render);
        unreg();
        aw.setLocalStateField('cursor', null);
        aw.setLocalStateField('selection', null); // kopuşta seçim kutusu peer'larda asılı kalmasın
        layer.destroy();
      };
    } catch (e) {
      console.error('Presence kurulamadı:', e);
    }
    return () => cleanup();
  }, [collab, ui, registerHover]);

  // Presence: kendi seçimini paylaş (uzaktakiler renkli kutuyla görür).
  useEffect(() => {
    if (!collab) return;
    try {
      (collab.awareness as unknown as { setLocalStateField: (k: string, v: unknown) => void }).setLocalStateField(
        'selection',
        selectedIds,
      );
    } catch {
      /* awareness yoksa atla */
    }
  }, [collab, selectedIds]);

  return (
    // DOCK LAYOUT (Rayon/Figma deseni): üstte toolbar · sol dock | canvas | sağ dock · altta durum.
    // Paneller canvas'ın YANINDA (üstünde değil) → asla örtüşmez, kapatma düğmeleri hep erişilir,
    // ve panellere tıklamak canvas seçimini bozmaz (ayrı bölgeler).
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {ui && (
        <Toolbar
          manager={ui.manager}
          history={ui.history}
          store={ui.store}
          exportPng={ui.exportPng}
          zoomToFit={ui.zoomToFit}
          layers={ui.layers}
          onOpenAssistant={() => setAssistantOpen(true)}
          chromeHidden={chromeHidden}
          onToggleChrome={() => setChromeHidden((v) => !v)}
        />
      )}
      <div className="relative flex min-h-0 flex-1">
        {/* Sol dock: katmanlar + bloklar + copilot (kendi içinde kaydırılır). Zen modda gizlenir. */}
        {ui && !chromeHidden && (
          <div
            style={{ width: leftW }}
            className="z-10 flex shrink-0 flex-col gap-3 overflow-y-auto overflow-x-hidden p-2"
          >
            <LayerPanel store={ui.store} layers={ui.layers} />
            <BlockPalette manager={ui.manager} />
            <CopilotPanel store={ui.store} />
          </div>
        )}
        {ui && !chromeHidden && (
          <div
            onPointerDown={startLeftResize}
            className="z-20 w-1.5 shrink-0 cursor-col-resize bg-[var(--border-hair)] transition-colors hover:bg-[var(--accent)]"
            title="Sürükleyerek sol paneli genişlet/daralt"
          />
        )}

        {/* Canvas (orta, esnek). Pixi içteki mutlak div'e bağlı; yüzen butonlar bu sarmala göre
            konumlanır → sağ/sol dock panellerinin ÜSTÜNE binmez (eski 'fixed' butonlar biniyordu). */}
        <div className="relative min-w-0 flex-1">
          <div ref={containerRef} className="absolute inset-0" />
          {ui && <EmptyCanvasHint store={ui.store} />}
          {/* Sağ-üst yüzen küme: Canlı Paylaş + 3B (canvas'a göre konumlu, dock'larla çakışmaz). */}
          {ui && (
            <div className="absolute right-3 top-3 z-40 flex items-center gap-2">
              <CollabControl store={ui.store} onHandle={setCollab} />
              <View3D store={ui.store} />
            </div>
          )}
          {/* Perf ölçüm paneli — yalnız ?perf ile (dev). Canlıda görünmez. */}
          {ui && isPerfEnabled() && (
            <div className="absolute bottom-3 left-3 z-40">
              <PerfHud store={ui.store} history={ui.history} />
            </div>
          )}
          {/* Boş sayfa sayısı: GERÇEK sade-sayfa (plain sheet) ekler/çıkarır (Command → kaydolur + PDF'e
              girer + undo). Yan yana dizilir; PDF'e yalnız DOLU (içinde çizim olan) sayfalar gider. */}
          {ui && (
            <div className="absolute bottom-3 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full border border-[var(--border-soft)] bg-[var(--surface-2)]/90 px-2 py-1 text-[13px] text-[var(--text-1)] shadow-lg backdrop-blur">
              <button
                type="button"
                onClick={() => {
                  const plains = ui.store
                    .all()
                    .filter((e): e is Sheet => e.type === 'sheet' && e.plain === true)
                    .sort((a, b) => a.position.x - b.position.x);
                  const last = plains[plains.length - 1];
                  if (last && plains.length > 1) ui.history.dispatch(new RemoveEntity(last.id));
                }}
                disabled={pageCount <= 1}
                className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-[var(--surface-3)] disabled:opacity-40"
                title="Sayfa çıkar"
                aria-label="Sayfa çıkar"
              >
                −
              </button>
              <span className="min-w-[64px] text-center tabular-nums">{pageCount} sayfa</span>
              <button
                type="button"
                onClick={() => {
                  const plains = ui.store.all().filter((e): e is Sheet => e.type === 'sheet' && e.plain === true);
                  const pos = nextSheetPosition(plains);
                  ui.history.dispatch(
                    new AddEntity({ ...makeSheet(pos, { plain: true, sheetNo: String(plains.length + 1) }), id: createEntityId() }),
                  );
                  ui.zoomToFit(); // yeni eklenen sayfa görünür olsun
                }}
                className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-[var(--surface-3)]"
                title="Sayfa ekle"
                aria-label="Sayfa ekle"
              >
                +
              </button>
            </div>
          )}
        </div>

        {/* Sağ dock genişlik tutamacı. Zen modda gizlenir. */}
        {ui && !chromeHidden && (
          <div
            onPointerDown={startRightResize}
            className="z-20 w-1.5 shrink-0 cursor-col-resize bg-[var(--border-hair)] transition-colors hover:bg-[var(--accent)]"
            title="Sürükleyerek paneli genişlet/daralt"
          />
        )}
        {/* Sağ dock: özellikler + mahal/metrik + metraj + pafta. Zen modda gizlenir. */}
        {ui && !chromeHidden && (
          <div
            style={{ width: rightW }}
            className="z-10 flex shrink-0 flex-col gap-3 overflow-y-auto overflow-x-hidden p-2"
          >
            {/* key = seçili id → seçim değişince input'lar remount olur (defaultValue tazelenir). */}
            <PropertiesPanel
              key={selectedIds.length === 1 ? selectedIds[0] : 'none'}
              store={ui.store}
              history={ui.history}
              selectedIds={selectedIds}
            />
            <RoomList
              store={ui.store}
              history={ui.history}
              renameId={renameId}
              onRenameConsumed={clearRename}
            />
            <TakeoffPanel store={ui.store} />
            <SectionPanel store={ui.store} history={ui.history} selectedIds={selectedIds} />
            <SheetPanel store={ui.store} history={ui.history} />
          </div>
        )}

        {initError && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-neutral-900 p-6 text-center text-white">
            <div className="text-lg font-semibold">Tuval başlatılamadı</div>
            <div className="max-w-md text-sm text-white/70">{initError}</div>
            <button
              type="button"
              onClick={() => location.reload()}
              className="rounded bg-blue-600 px-4 py-2 hover:bg-blue-700"
            >
              Sayfayı yenile
            </button>
          </div>
        )}
      </div>

      {ui && (
        <>
          <StatusBar
            manager={ui.manager}
            registerHover={registerHover}
            store={ui.store}
            selectedIds={selectedIds}
          />
          <ShortcutsHelp />
          <CommandPalette manager={ui.manager} history={ui.history} zoomToFit={ui.zoomToFit} />
          <Assistant
            store={ui.store}
            history={ui.history}
            selectedIds={selectedIds}
            open={assistantOpen}
            onClose={() => setAssistantOpen(false)}
            zoomToFit={ui.zoomToFit}
            placePoint={() => {
              const b = ui.viewportBounds();
              return { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 };
            }}
            zoomToBounds={ui.zoomToBounds}
            initialCiz={initialCiz}
          />
        </>
      )}

      {menu && ui && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
          items={buildMenuItems(ui, selectedIds)}
        />
      )}
    </div>
  );
}

/** Sağ-tık menü öğeleri — mevcut kısayol mantığına sentetik klavye olaylarıyla bağlanır. */
function buildMenuItems(
  ui: { manager: ToolManager; history: History; zoomToFit: () => void },
  selectedIds: string[],
): ContextMenuItem[] {
  const sendKey = (key: string, ctrl = false): void =>
    ui.manager.onKeyDown(new KeyboardEvent('keydown', { key, ctrlKey: ctrl }));
  const hasSel = selectedIds.length > 0;
  const items: ContextMenuItem[] = [];
  if (hasSel) {
    items.push({ label: 'Kopyala', onClick: () => sendKey('c', true) });
    items.push({ label: 'Çoğalt', onClick: () => sendKey('d', true) });
    items.push({ label: 'Sil', onClick: () => sendKey('Delete') });
  }
  items.push({ label: 'Yapıştır', onClick: () => sendKey('v', true) });
  items.push({ label: 'Tümünü seç', onClick: () => sendKey('a', true) });
  items.push({ label: 'Geri al', onClick: () => ui.history.undo() });
  items.push({ label: 'İleri al', onClick: () => ui.history.redo() });
  items.push({ label: 'İçeriğe sığdır', onClick: () => ui.zoomToFit() });
  return items;
}
