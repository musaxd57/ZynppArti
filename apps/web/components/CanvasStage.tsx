'use client';

import { useEffect, useRef } from 'react';
import { createCanvasApp, type CanvasHandle } from '@zynpparti/engine';

/**
 * Engine canvas motorunu DOM'a bağlayan ince React sarmalı.
 * PixiJS yalnızca istemcide çalışır → 'use client' + useEffect içinde mount edilir.
 */
export function CanvasStage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let handle: CanvasHandle | undefined;
    let disposed = false;

    // Async init; React Strict Mode'un çift-mount'una karşı 'disposed' koruması.
    void createCanvasApp(el).then((h) => {
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
