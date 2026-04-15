import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { LayoutWrapper } from '@/components/layout-wrapper'; // <-- Import wrapper yang baru dibuat
import './globals.css';

const _geist = Geist({ subsets: ['latin'] });
const _geistMono = Geist_Mono({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Laboratorium Perikanan Polinela',
  description:
    'Laboratorium Perikanan Politeknik Negeri Lampung - Fasilitas pendidikan dan penelitian di bidang perikanan',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='id'>
      <body className='font-sans antialiased bg-white'>
        
        {/* Bungkus seluruh aplikasi dengan LayoutWrapper */}
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
        
        {/* Vercel Trackers */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}