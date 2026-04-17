import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { LayoutWrapper } from '@/components/layout-wrapper'; // <-- Import wrapper yang baru dibuat
import './globals.css';

const _geist = Geist({ subsets: ['latin'] });
const _geistMono = Geist_Mono({ subsets: ['latin'] });

export const metadata: Metadata = {
  title:
    'DOLPHIN | Digital Operational Laboratory for Harmonized Integrated Navigation',
  description:
    'Digital Operational Laboratory for Harmonized Integrated Navigation',
  icons: {
    icon: '/logo_dolphin.png',
    apple: '/logo_dolphin.png',
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
        {/* Bungkus seluruh aplikasi dengan LayoutWrapper */}
        <LayoutWrapper>{children}</LayoutWrapper>

        {/* Vercel Trackers */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
