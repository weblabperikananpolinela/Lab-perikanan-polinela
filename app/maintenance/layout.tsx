import type { Metadata } from 'next';

/** Halaman maintenance — tidak boleh diindeks. */
export const metadata: Metadata = {
  title: 'Pemeliharaan Sistem | Lab Perikanan Polinela',
  robots: { index: false, follow: false },
};

export default function MaintenanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
