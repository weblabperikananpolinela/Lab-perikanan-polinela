import type { MetadataRoute } from 'next';
import { APP_RELEASE_DATE } from '@/lib/version';
import { PUBLIC_ROUTES, canonicalUrl } from '@/lib/site-seo';

/**
 * sitemap.xml dari route handler: daftar rute publik absolut ke Polinela.
 *
 * Murah dan tanpa DB: lastModified dari tanggal rilis (bukan query), tanpa
 * cookie, supaya tetap tersaji cepat walau crawler kena tantangan WAF.
 *
 * Tidak termasuk: /admin, /dosen, /administrasi, /maintenance, /api, dan
 * /sop/[slug] (viewer PDF lama yang tidak lagi ditautkan dari navbar).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(`${APP_RELEASE_DATE}T00:00:00+07:00`);
  return PUBLIC_ROUTES.map((route) => ({
    url: canonicalUrl(route.path),
    lastModified,
    changeFrequency: 'weekly',
    priority: route.priority,
  }));
}
