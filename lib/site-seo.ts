/**
 * Sumber tunggal sinyal SEO DOLPHIN.
 *
 * Origin kanonik di-hardcode dengan sengaja: kalau dibaca dari env, salah isi
 * di Plesk bisa membuat canonical/sitemap menunjuk localhost atau domain demo
 * Vercel — persis masalah yang sedang diperbaiki. Satu konstanta, tidak bisa
 * salah konfigurasi.
 */

export const SITE_ORIGIN = 'https://dolphinperikanan.polinela.ac.id';

export const SITE_NAME = 'DOLPHIN — Lab Perikanan Polinela';

export const SITE_SHORT_NAME = 'Lab Perikanan Polinela';

export const DEFAULT_TITLE =
  'Lab Perikanan Polinela | DOLPHIN — Sistem Informasi Laboratorium Jurusan Perikanan & Kelautan';

export const DEFAULT_DESCRIPTION =
  'Lab Perikanan Polinela — laboratorium Jurusan Perikanan dan Kelautan, Politeknik Negeri Lampung. Informasi jadwal, inventaris alat, SOP laboratorium, SK Lab, dan layanan peminjaman secara daring.';

export const SITE_KEYWORDS = [
  'lab perikanan polinela',
  'laboratorium perikanan polinela',
  'lab perikanan dan kelautan polinela',
  'SOP lab perikanan polinela',
  'laboratorium perikanan tangkap polinela',
  'DOLPHIN Polinela',
  'Politeknik Negeri Lampung perikanan',
];

export const OG_IMAGE = {
  url: '/og-image.png',
  width: 1200,
  height: 630,
  alt: 'Lab Perikanan Polinela — DOLPHIN',
} as const;

/**
 * Rute publik yang boleh diindeks. Sumber tunggal untuk sitemap.
 *
 * Tidak termasuk: /admin, /dosen, /administrasi, /maintenance, /api, dan
 * /sop/[slug] (viewer PDF lama yang tidak lagi ditautkan dari navbar).
 */
export const PUBLIC_ROUTES: { path: string; priority: number }[] = [
  { path: '/', priority: 1.0 },
  { path: '/organisasi', priority: 0.8 },
  { path: '/jadwal', priority: 0.6 },
  { path: '/inventaris', priority: 0.6 },
  { path: '/dokumen/sop-perikanan', priority: 0.8 },
  { path: '/dokumen/sop-tangkap', priority: 0.8 },
  { path: '/dokumen/sk-lab', priority: 0.8 },
  { path: '/materi', priority: 0.6 },
];

/** Berkas SEO yang tidak boleh terkena gerbang maintenance. */
export const SEO_FILE_PATHS = new Set(['/robots.txt', '/sitemap.xml']);

/** URL absolut dari sebuah path (tanpa slash ganda). */
export function canonicalUrl(path: string): string {
  if (!path || path === '/') return `${SITE_ORIGIN}/`;
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_ORIGIN}${clean.replace(/\/+$/, '')}`;
}

/** True bila Host berasal dari deployment demo Vercel. */
export function isVercelHost(host: string | null | undefined): boolean {
  if (!host) return false;
  return host.split(':')[0].endsWith('.vercel.app');
}

/** Judul halaman dengan kata kunci di belakangnya. */
export function pageTitle(page: string): string {
  return `${page} | Lab Perikanan Polinela`;
}

/**
 * Metadata dasar halaman publik: canonical + Open Graph + Twitter.
 * Dipakai oleh `generateMetadata`/`metadata` per halaman agar tidak berulang.
 */
export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  /** true untuk halaman internal (admin/dosen/administrasi/maintenance). */
  noindex?: boolean;
}) {
  const url = canonicalUrl(opts.path);
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: opts.path },
    ...(opts.noindex
      ? { robots: { index: false, follow: false } }
      : {
          openGraph: {
            type: 'website' as const,
            locale: 'id_ID',
            url,
            siteName: SITE_NAME,
            title: opts.title,
            description: opts.description,
            images: [OG_IMAGE],
          },
          twitter: {
            card: 'summary_large_image' as const,
            title: opts.title,
            description: opts.description,
            images: [OG_IMAGE.url],
          },
        }),
  };
}
