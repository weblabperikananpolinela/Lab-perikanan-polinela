import type { Metadata } from 'next';

/** Alur administrasi (pengajuan & status) — tidak boleh diindeks. */
export const metadata: Metadata = {
  title: 'Administrasi Lab Perikanan Polinela',
  robots: { index: false, follow: false },
};

export default function AdministrasiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
