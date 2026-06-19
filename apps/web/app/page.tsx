import { CanvasStage } from '@/components/CanvasStage';

export default function Home() {
  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <CanvasStage />
      <div className="pointer-events-none absolute left-4 top-4 select-none rounded-md bg-black/50 px-3 py-2 text-sm text-white">
        ZynppArti — Faz 1 / 1C · <span className="opacity-80">L=duvar · V=seç · E=sil · Ctrl+Z geri al · Space+sürükle: pan · tekerlek: zoom</span>
      </div>
    </main>
  );
}
