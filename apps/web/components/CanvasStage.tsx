'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createCanvasApp, createSnapIndicator, type CanvasHandle } from '@zynpparti/engine';
import { EntityStore, History, RoomManager, UpdateEntity } from '@zynpparti/document';
import { ToolManager, createSnapper } from '@zynpparti/tools';
import { seedDemo } from '@/lib/demo-seed';
import { Toolbar } from './Toolbar';
import { RoomList } from './RoomList';
import { CopilotPanel } from './CopilotPanel';
import { CopilotChat } from './CopilotChat';
import { TakeoffPanel } from './TakeoffPanel';
import { SheetPanel } from './SheetPanel';
import { SectionPanel } from './SectionPanel';
import { ContextMenu, type ContextMenuItem } from './ContextMenu';
import { CommandPalette } from './CommandPalette';
import { promptDialog } from '@/lib/dialog';
import { PropertiesPanel } from './PropertiesPanel';
import { LayerPanel } from './LayerPanel';
import { BlockPalette } from './BlockPalette';
import { StatusBar } from './StatusBar';
import { ShortcutsHelp } from './ShortcutsHelp';

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
    setHoverHandler: CanvasHandle['setHoverHandler'];
    zoomToFit: () => void;
  } | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const clearRename = useCallback(() => setRenameId(null), []);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [initError, setInitError] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [rightW, setRightW] = useState(288);
  const [leftW, setLeftW] = useState(224);

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

  // Dock kenarlarından sürükleyerek genişlik ayarı.
  const startRightResize = useCallback((e: React.PointerEvent): void => {
    e.preventDefault();
    const onMove = (ev: PointerEvent): void =>
      setRightW(Math.min(560, Math.max(200, window.innerWidth - ev.clientX)));
    const onUp = (): void => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, []);
  const startLeftResize = useCallback((e: React.PointerEvent): void => {
    e.preventDefault();
    const onMove = (ev: PointerEvent): void => setLeftW(Math.min(480, Math.max(180, ev.clientX)));
    const onUp = (): void => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const store = new EntityStore();
    seedDemo(store); // geçici demo duvarlar (kendi history'siyle "bakılı")

    let handle: CanvasHandle | undefined;
    let manager: ToolManager | undefined;
    let rooms: RoomManager | undefined;
    let disposed = false;

    void createCanvasApp(el, store).then((h) => {
      if (disposed) {
        h.destroy();
        return;
      }
      handle = h;
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
        snap: createSnapper(store, h.index, h.pixelSize, (hint) =>
          snapIndicator.show(hint, h.pixelSize()),
        ),
        isLayerHidden: (id) => h.layers.isHidden(id),
        isLayerLocked: (id) => h.layers.isLocked(id),
        setCursor: (c) => h.setCursor(c),
        onSelectionChange: (ids) => setSelectedIds(ids),
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
        void promptDialog('Metin:', ent.text).then((next) => {
          if (next == null) return;
          const trimmed = next.trim();
          if (!trimmed || trimmed === ent.text) return;
          history.dispatch(new UpdateEntity({ ...ent, text: trimmed }));
        });
      });
      setUi({
        manager,
        history,
        store,
        layers: h.layers,
        exportPng: h.exportPng,
        setHoverHandler: h.setHoverHandler,
        zoomToFit: h.zoomToFit,
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
        />
      )}
      <div className="relative flex min-h-0 flex-1">
        {/* Sol dock: katmanlar + bloklar + copilot (kendi içinde kaydırılır). */}
        {ui && (
          <div
            style={{ width: leftW }}
            className="z-10 flex shrink-0 flex-col gap-3 overflow-y-auto overflow-x-hidden p-2"
          >
            <LayerPanel store={ui.store} layers={ui.layers} />
            <BlockPalette manager={ui.manager} />
            <CopilotPanel store={ui.store} />
            <CopilotChat store={ui.store} selectedIds={selectedIds} />
          </div>
        )}
        {ui && (
          <div
            onPointerDown={startLeftResize}
            className="z-20 w-1.5 shrink-0 cursor-col-resize bg-white/5 transition-colors hover:bg-blue-400/40"
            title="Sürükleyerek sol paneli genişlet/daralt"
          />
        )}

        {/* Canvas (orta, esnek) — Pixi bu div'e resizeTo ile bağlı. Sağ-tık engine'de bağlı. */}
        <div ref={containerRef} className="relative min-w-0 flex-1" />

        {/* Sağ dock genişlik tutamacı. */}
        {ui && (
          <div
            onPointerDown={startRightResize}
            className="z-20 w-1.5 shrink-0 cursor-col-resize bg-white/5 transition-colors hover:bg-blue-400/40"
            title="Sürükleyerek paneli genişlet/daralt"
          />
        )}
        {/* Sağ dock: özellikler + mahal/metrik + metraj + pafta. */}
        {ui && (
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
            registerHover={ui.setHoverHandler}
            store={ui.store}
            selectedIds={selectedIds}
          />
          <ShortcutsHelp />
          <CommandPalette manager={ui.manager} history={ui.history} zoomToFit={ui.zoomToFit} />
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
