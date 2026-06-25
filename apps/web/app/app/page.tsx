import type { Metadata } from 'next';
import { AppGate } from '@/components/AppGate';
import { AppBodyLock } from '@/components/AppBodyLock';

export const metadata: Metadata = {
  title: 'Vesna — Çizim',
  description: 'Vesna tasarım uygulaması.',
};

/** Uygulama (çizim aracı). Tanıtım/landing sayfası kök `/`'tedir; araç buraya (`/app`) taşındı. */
export default function AppPage() {
  return (
    <main className="h-screen w-screen overflow-hidden">
      <AppBodyLock />
      <AppGate />
    </main>
  );
}
