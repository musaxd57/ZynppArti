import { CanvasStage } from '@/components/CanvasStage';

export default function Home() {
  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <CanvasStage />
      <div className="pointer-events-none absolute left-4 top-4 select-none rounded-md bg-black/50 px-3 py-2 text-sm text-white">
        ZynppArti — Faz 1 / 1E · <span className="opacity-80">L=duvar · V=seç · E=sil · K=ölçekle · mahaller otomatik (m²) · DXF · Ctrl+Z · Space+sürükle: pan</span>
      </div>
    </main>
  );
}
