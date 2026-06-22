import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GlobalErrorHandlers } from '@/components/GlobalErrorHandlers';
import { DialogHost } from '@/components/DialogHost';

export const metadata: Metadata = {
  title: 'ZynppArti',
  description: 'İşbirlikçi mimari tasarım platformu',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <GlobalErrorHandlers />
        <ErrorBoundary>{children}</ErrorBoundary>
        <DialogHost />
      </body>
    </html>
  );
}
