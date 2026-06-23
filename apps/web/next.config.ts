import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Çalışma alanı (workspace) paketleri kaynak TS olarak tüketilir.
  transpilePackages: [
    '@zynpparti/engine',
    '@zynpparti/geometry',
    '@zynpparti/document',
    '@zynpparti/tools',
    '@zynpparti/io',
    '@zynpparti/ai',
    '@zynpparti/collab',
  ],
  // Monorepo kökünü açıkça belirt (home'daki başıboş lockfile'ın yanlış seçilmesini önler).
  outputFileTracingRoot: path.join(import.meta.dirname, '../..'),
  experimental: {
    // KALICI DÜZELTME: Next 15.5 devtools "Segment Explorer", uzun HMR oturumunda
    // "Could not find the module ...segment-explorer-node ... React Client Manifest" hatası verip
    // sayfayı 500/boş bırakıyordu. Bu paneli kapatınca o hata sınıfı tamamen ortadan kalkıyor.
    devtoolSegmentExplorer: false,
  },
};

export default nextConfig;
