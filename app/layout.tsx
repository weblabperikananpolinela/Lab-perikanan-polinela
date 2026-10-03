import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { LayoutWrapper } from '@/components/layout-wrapper';
import { JsonLd } from '@/components/json-ld';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  GSC_VERIFICATION,
  OG_IMAGE,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_ORIGIN,
} from '@/lib/site-seo';
import './globals.css';

const _geist = Geist({ subsets: ['latin'] });
const _geistMono = Geist_Mono({ subsets: ['latin'] });

// Di-build di Vercel → deployment demo harus tak terindeks (keputusan PM:
// Vercel tetap hidup sebagai demo, canonical selalu ke Polinela).
export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  applicationName: SITE_NAME,
  title: {
    default: DEFAULT_TITLE,
    template: '%s | Lab Perikanan Polinela',
  },
  description: DEFAULT_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  authors: [{ name: 'Jurusan Perikanan dan Kelautan Polinela' }],
  creator: SITE_NAME,
  publisher: 'Politeknik Negeri Lampung',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: SITE_ORIGIN,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
  robots:
    process.env.VERCEL === '1'
      ? { index: false, follow: false }
      : { index: true, follow: true },
  verification: GSC_VERIFICATION
    ? { google: GSC_VERIFICATION }
    : undefined,
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48' },
      { url: '/icon-512x512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='id'>
      <body className='font-sans antialiased bg-white'>
        {/* Entitas Organization + WebSite untuk mesin pencari & ringkasan AI. */}
        <JsonLd />
        {/* Bungkus seluruh aplikasi dengan LayoutWrapper */}
        <LayoutWrapper>{children}</LayoutWrapper>

        {/* Vercel trackers are only useful on Vercel and should not make a
            self-hosted Plesk request depend on an external analytics script. */}
        {process.env.VERCEL === '1' && <Analytics />}
        {process.env.VERCEL === '1' && <SpeedInsights />}
      </body>
    </html>
  );
}