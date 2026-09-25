'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Deteksi apakah URL saat ini berawalan '/admin/dashboard'
  const isAdminDashboard = pathname?.startsWith('/admin/dashboard');
  const isAdminSystem = pathname?.startsWith('/admin/system');
  const isMaintenance = pathname?.startsWith('/maintenance');
  const hideChrome = isMaintenance || isAdminDashboard || isAdminSystem;
  return (
    <>
      {/* Navbar disembunyikan di dashboard admin & maintenance (punya sidebar sendiri) */}
      {!hideChrome && <Navbar />}

      <main className='min-h-screen'>{children}</main>

      {/* Footer disembunyikan di dashboard admin & maintenance */}
      {!hideChrome && <Footer />}
    </>
  );
}
