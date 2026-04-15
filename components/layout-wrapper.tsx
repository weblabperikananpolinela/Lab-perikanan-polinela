'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Deteksi apakah URL saat ini berawalan '/admin/dashboard'
  const isAdminDashboard = pathname?.startsWith('/admin/dashboard');

  return (
    <>
      {/* Jika BUKAN halaman admin dashboard, tampilkan Navbar */}
      {!isAdminDashboard && <Navbar />}
      
      <main className="min-h-screen">
        {children}
      </main>

      {/* Jika BUKAN halaman admin dashboard, tampilkan Footer */}
      {!isAdminDashboard && <Footer />}
    </>
  );
}