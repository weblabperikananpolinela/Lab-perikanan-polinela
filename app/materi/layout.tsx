import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-seo';

export const metadata: Metadata = pageMetadata({
  title: 'Materi Kuliah Lab Perikanan Polinela',
  description:
    'Akses materi kuliah dan bahan ajar Jurusan Perikanan dan Kelautan Politeknik Negeri Lampung dengan kode PIN kelas.',
  path: '/materi',
});

export default function MateriLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
