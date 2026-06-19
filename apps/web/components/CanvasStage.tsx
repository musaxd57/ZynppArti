'use client';

import { useEffect, useRef } from 'react';
import { createCanvasApp, type CanvasHandle } from '@zynpparti/engine';
import { EntityStore } from '@zynpparti/document';
import { seedDemo } from '@/lib/demo-seed';

/**
 * Engine canvas motorunu DOM'a bağlayan ince React sarmalı.
 * PixiJS yalnızca istemcide çalışır → 'use client' + useEffect içinde mount edilir.
 */
export function CanvasStage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Doküman store'u + geçici demo duvarlar (1C'de araçlarla değişecek).
    const store = new EntityStore();
    seedDemo(store);

    let handle: CanvasHandle | undefined;
    let disposed = false;

    // Async init; React Strict Mode'un çift-mount'una karşı 'disposed' koruması.
    void createCanvasApp(el, store).then((h) => {
      if (disposed) {
        h.destroy();
      } else {
        handle = h;
      }
    });

    return () => {
      disposed = true;
      handle?.destroy();
      handle = undefined;
    };
  }, []);

  return <div ref={containerRef} className="h-full w-full" />;
}
