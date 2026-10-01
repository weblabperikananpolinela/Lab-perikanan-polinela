import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-seo';

export const metadata: Metadata = pageMetadata({
  title: 'Jadwal Laboratorium Perikanan Polinela',
  description:
    'Jadwal penggunaan laboratorium Jurusan Perikanan dan Kelautan Politeknik Negeri Lampung: praktikum, penelitian, dan kegiatan teaching factory.',
  path: '/jadwal',
});

export default function JadwalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
