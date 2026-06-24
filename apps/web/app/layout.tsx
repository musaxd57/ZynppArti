import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

// Premium UI tipografisi (redesign spec §2): Inter (değişken ağırlık → gövde 510).
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GlobalErrorHandlers } from '@/components/GlobalErrorHandlers';
import { DialogHost } from '@/components/DialogHost';
import { Toaster } from '@/components/Toaster';
import { CalibrateDialog } from '@/components/CalibrateDialog';
import { CommentDialog } from '@/components/CommentDialog';
import { ThemeScript } from '@/components/ThemeScript';

export const metadata: Metadata = {
  metadataBase: new URL('https://vesna.design'),
  title: {
    default: 'Vesna — Mimari tasarım, m² otomasyonu ve yapay zekâ',
    template: '%s · Vesna',
  },
  description:
    'Tarayıcıda çalışan işbirlikçi mimari tasarım: DWG/DXF aç, mahal/m² ve metraj otomatik çıkar, Türkçe yönetmeliğe danış, tariften AI ile plan üret. Kurulum yok.',
  applicationName: 'Vesna',
  keywords: [
    'mimari tasarım', 'kat planı', 'mahal listesi', 'm² hesabı', 'metraj', 'DWG', 'DXF',
    'AI plan', 'yapay zeka mimari', 'Türkçe yönetmelik', 'TBDY', 'TS 9111', 'iç mimari', 'tarayıcıda CAD',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'Vesna',
    locale: 'tr_TR',
    url: 'https://vesna.design',
    title: 'Vesna — Mimari tasarımı çiz, hesapla ve yapay zekâ ile üret',
    description:
      'Tarayıcıda çizim · otomatik mahal & m² · Türkçe yönetmelik asistanı · plandan AI render.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vesna — Tarayıcıda mimari tasarım + yapay zekâ',
    description: 'Çiz, hesapla, yönetmeliğe danış, AI ile plan üret. Kurulum yok.',
  },
};

// Clerk anahtarı yoksa (yerel/CI build) ClerkProvider sarmalanmaz → build kırılmaz, anonim akış çalışır.
const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function RootLayout({ children }: { children: ReactNode }) {
  const tree = (
    <html lang="tr" className={inter.variable} data-theme="dark" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
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
  // ClerkProvider yalnız anahtar varken → giriş aktif. Yoksa düz ağaç (auth'suz, ama uygulama tam çalışır).
  return clerkEnabled ? <ClerkProvider>{tree}</ClerkProvider> : tree;
}
