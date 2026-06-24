import type { MetadataRoute } from 'next';

/** Sitemap — herkese açık pazarlama + yasal sayfalar. (/app uygulamadır, indekslenmez.) */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://vesna.design';
  return [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/fiyatlandirma`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/gizlilik`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/kosullar`, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
