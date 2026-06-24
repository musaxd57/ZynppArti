import type { MetadataRoute } from 'next';

/** robots.txt — /app (uygulama, indekslenmez) hariç tüm pazarlama/yasal sayfalar taranabilir. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/app', '/api/'],
    },
    sitemap: 'https://vesna.design/sitemap.xml',
    host: 'https://vesna.design',
  };
}
