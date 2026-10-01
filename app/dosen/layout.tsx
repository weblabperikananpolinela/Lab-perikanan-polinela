import type { Metadata } from 'next';

/** Halaman dosen — tidak boleh diindeks. */
export const metadata: Metadata = {
  title: 'Materi Dosen | Lab Perikanan Polinela',
  robots: { index: false, follow: false },
};

export default function DosenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
