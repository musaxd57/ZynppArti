'use client';

import { useEffect, useRef, useState } from 'react';
import { createCanvasApp, type CanvasHandle } from '@zynpparti/engine';
import { EntityStore, History, RoomManager } from '@zynpparti/document';
import { ToolManager, createSnapper } from '@zynpparti/tools';
import { seedDemo } from '@/lib/demo-seed';
import { Toolbar } from './Toolbar';
import { RoomList } from './RoomList';

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
    exportPng: () => Promise<string>;
  } | null>(null);

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
      manager = new ToolManager({
        store,
        history,
        index: h.index,
        overlay: h.overlay,
        pixelSize: h.pixelSize,
        snap: createSnapper(store, h.index, h.pixelSize),
      });
      h.setActiveTool(manager);
      setUi({ manager, history, store, exportPng: h.exportPng });
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
      {ui && (
        <>
          <Toolbar
            manager={ui.manager}
            history={ui.history}
            store={ui.store}
            exportPng={ui.exportPng}
          />
          <RoomList store={ui.store} history={ui.history} />
        </>
      )}
    </>
  );
}
