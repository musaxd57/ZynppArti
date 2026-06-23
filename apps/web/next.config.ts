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
  webpack: (config, { isServer, webpack }) => {
    // libredwg-web (DWG WASM) Emscripten glue'su Node dalında `node:module/fs/path/url` import eder;
    // tarayıcı paketinde bunlar ölü-koddur ama webpack çözmeye çalışıp patlıyor → node: şemasını
    // çıplak ada çevir + tarayıcıda boş modüle düşür.
    if (!isServer) {
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource: { request: string }) => {
          resource.request = resource.request.replace(/^node:/, '');
        }),
      );
      config.resolve = config.resolve ?? {};
      config.resolve.fallback = {
        ...(config.resolve.fallback ?? {}),
        module: false,
        fs: false,
        path: false,
        url: false,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;
