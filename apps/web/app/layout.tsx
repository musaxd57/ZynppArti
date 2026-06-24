import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';

// Premium UI tipografisi (redesign spec §2): Inter (değişken ağırlık → gövde 510).
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GlobalErrorHandlers } from '@/components/GlobalErrorHandlers';
import { DialogHost } from '@/components/DialogHost';
import { Toaster } from '@/components/Toaster';
import { CalibrateDialog } from '@/components/CalibrateDialog';
import { CommentDialog } from '@/components/CommentDialog';

export const metadata: Metadata = {
  title: 'Vesna — Mimari tasarım, m² otomasyonu ve yapay zekâ',
  description: 'Tarayıcıda çalışan işbirlikçi mimari tasarım, mahal/m² otomasyonu ve yapay zekâ asistanı.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr" className={inter.variable}>
      <body>
        <GlobalErrorHandlers />
        <ErrorBoundary>{children}</ErrorBoundary>
        <DialogHost />
        <CalibrateDialog />
        <CommentDialog />
        <Toaster />
      </body>
    </html>
  );
}
