import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Çalışma alanı (workspace) paketleri kaynak TS olarak tüketilir.
  transpilePackages: [
    '@zynpparti/engine',
    '@zynpparti/geometry',
    '@zynpparti/document',
    '@zynpparti/tools',
  ],
  // Monorepo kökünü açıkça belirt (home'daki başıboş lockfile'ın yanlış seçilmesini önler).
  outputFileTracingRoot: path.join(import.meta.dirname, '../..'),
};

export default nextConfig;
