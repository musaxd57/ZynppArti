'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createCanvasApp, createSnapIndicator, type CanvasHandle } from '@zynpparti/engine';
import { EntityStore, History, RoomManager, UpdateEntity } from '@zynpparti/document';
import { ToolManager, createSnapper } from '@zynpparti/tools';
import { seedDemo } from '@/lib/demo-seed';
import { Toolbar } from './Toolbar';
import { RoomList } from './RoomList';
import { CopilotPanel } from './CopilotPanel';
import { TakeoffPanel } from './TakeoffPanel';
import { SheetPanel } from './SheetPanel';
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
      h.setAnnotationActivateHandler((id) => {
        const ent = store.get(id);
        if (ent?.type !== 'annotation') return;
        const next = window.prompt('Metin:', ent.text);
        if (next == null) return;
        const trimmed = next.trim();
        if (!trimmed || trimmed === ent.text) return;
        history.dispatch(new UpdateEntity({ ...ent, text: trimmed }));
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
    <>
      <div ref={containerRef} className="h-full w-full" />
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
      {ui && (
        <>
          <Toolbar
            manager={ui.manager}
            history={ui.history}
            store={ui.store}
            exportPng={ui.exportPng}
            zoomToFit={ui.zoomToFit}
            layers={ui.layers}
          />
          {/* Sol kolon: katmanlar + copilot. Kaydırma, ETKİLEŞİMLİ iç sarmalayıcıda olmalı
              (dış kolon pointer-events-none → tekerlek/çubuk oraya ulaşmaz). */}
          <div className="pointer-events-none absolute bottom-4 left-4 top-28 flex flex-col items-start">
            <div className="pointer-events-auto flex max-h-full flex-col gap-3 overflow-y-auto pr-1">
              <LayerPanel store={ui.store} layers={ui.layers} />
              <BlockPalette manager={ui.manager} />
              <CopilotPanel store={ui.store} />
            </div>
          </div>
          {/* Sağ kolon: mahal listesi/metrik + metraj + pafta. top-28 → araç çubuğunun ALTINDA
              başlar (yoksa geniş toolbar paneli örtüp kapatma düğmesini erişilmez kılıyor). */}
          <div className="pointer-events-none absolute bottom-4 right-4 top-28 flex flex-col items-end">
            <div className="pointer-events-auto flex max-h-full flex-col items-end gap-3 overflow-y-auto pl-1">
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
              <SheetPanel store={ui.store} history={ui.history} />
            </div>
          </div>
          <StatusBar manager={ui.manager} registerHover={ui.setHoverHandler} />
          <ShortcutsHelp />
        </>
      )}
    </>
  );
}
