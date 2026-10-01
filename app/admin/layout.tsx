import type { Metadata } from 'next';

/** Panel internal — tidak boleh diindeks. */
export const metadata: Metadata = {
  title: 'Dashboard Admin Lab Perikanan Polinela',
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
