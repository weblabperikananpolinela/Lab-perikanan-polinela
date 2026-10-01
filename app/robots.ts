import type { MetadataRoute } from 'next';
import { SITE_ORIGIN } from '@/lib/site-seo';

/**
 * robots.txt dari route handler (bukan file statis `public/robots.txt`).
 *
 * Apache Plesk menyajikan `public/` sebelum mencapai app; route handler yang
 * memungkinkan cabang per-host: Vercel (`Disallow: /`) vs Polinela
 * (`Allow: /` + Disallow internal).
 */
export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL === '1') {
    return {
      rules: { userAgent: '*', disallow: '/' },
    };
  }
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/dosen', '/administrasi', '/maintenance', '/api'],
    },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN,
  };
}
