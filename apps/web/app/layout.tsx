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
  title: 'ZynppArti',
  description: 'İşbirlikçi mimari tasarım platformu',
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
