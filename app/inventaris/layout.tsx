import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-seo';

export const metadata: Metadata = pageMetadata({
  title: 'Inventaris Alat Lab Perikanan Polinela',
  description:
    'Daftar alat dan bahan laboratorium Jurusan Perikanan dan Kelautan Politeknik Negeri Lampung beserta status ketersediaannya.',
  path: '/inventaris',
});

export default function InventarisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
