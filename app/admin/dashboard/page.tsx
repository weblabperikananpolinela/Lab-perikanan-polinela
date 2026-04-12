'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  PackageSearch,
  FolderOutput,
  FileStack,
  Menu,
  ChevronLeft,
  ChevronRight,
  Circle,
  Upload,
  LogOut,
} from 'lucide-react';

import OverviewTab from './_components/OverviewTab';
import MateriTab from './_components/MateriTab';
import InventarisTab from './_components/InventarisTab';
import RiwayatTab from './_components/RiwayatTab';
import PengajuanTab from './_components/PengajuanTab';

// --- CONFIG & HELPERS ---
const labMap: Record<number, string> = {
  1: 'Lab SFS budidaya perikanan',
  2: 'Lab A (lab pembenihan ikan)',
  3: 'Lab pengolahan perikanan',
  4: 'Lab perikanan bawah',
  5: 'Tefa polifishfarm',
  6: 'Tefa POFF',
  7: 'Tefa polifeed',
  8: 'Lab Simulator',
  9: 'Lab Tangkap',
  10: 'Lab Radar',
};

const getDashboardTitle = (lab_id: number) => {
  if ([8, 9, 10].includes(lab_id)) {
    return 'Dashboard Pengelola: Lab Perikanan Tangkap';
  }
  return `Dashboard Pengelola: ${labMap[lab_id] || 'Laboratorium'}`;
};

// --- MAIN WRAPPER COMPONENT ---
export default function AdminDashboardPage() {
  const [initLoading, setInitLoading] = useState(true);
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const initApp = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        router.push('/');
        return;
      }

      const { data: adminData } = await supabase
        .from('whitelist_admin')
        .select('*')
        .eq('email', session.user.email)
        .single();

      if (!adminData) {
        router.push('/');
      } else {
        setAdminProfile(adminData);
        setInitLoading(false);
      }
    };

    initApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (initLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-slate-50'>
        <p className='text-slate-500 font-medium md:text-lg animate-pulse'>
          Memuat Keamanan Multi-Tenant...
        </p>
      </div>
    );
  }

  // Fallback rendering
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab
            adminProfile={adminProfile}
            supabase={supabase}
            setActiveTab={setActiveTab}
          />
        );
      case 'pengajuan':
        return <PengajuanTab adminProfile={adminProfile} supabase={supabase} />;
      case 'riwayat':
        return <RiwayatTab adminProfile={adminProfile} supabase={supabase} />;
      case 'inventaris':
        return (
          <InventarisTab adminProfile={adminProfile} supabase={supabase} />
        );
      case 'materi':
        return <MateriTab />;
      default:
        return <p>Modul dalam pengembangan.</p>;
    }
  };

  return (
    <div className='min-h-screen flex bg-slate-50'>
      {/* Sidebar - Desktop */}
      <aside
        className={`hidden md:flex flex-col bg-slate-900 border-r border-slate-800 shadow-xl z-20 transition-all duration-300 ease-in-out relative ${isSidebarCollapsed ? 'w-24' : 'w-72'}`}>
        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className='absolute -right-3.5 top-14 bg-slate-800 border border-slate-700 text-white p-1 rounded-full hover:bg-blue-600 transition-colors z-30 shadow-md flex items-center justify-center'>
          {isSidebarCollapsed ? (
            <ChevronRight size={18} />
          ) : (
            <ChevronLeft size={18} />
          )}
        </button>

        <div
          className={`p-8 pb-6 flex flex-col ${isSidebarCollapsed ? 'items-center px-4' : ''}`}>
          {!isSidebarCollapsed ? (
            <>
              <h2 className='text-2xl font-bold text-white tracking-tight shrink-0'>
                Admin<span className='text-blue-400'>Panel</span>
              </h2>
              <p className='text-slate-400 mt-2 font-medium text-sm leading-snug shrink-0'>
                Sistem Administrasi Terpusat
              </p>
              <div className='mt-4 py-2 px-3 bg-slate-800 rounded-lg flex items-center gap-3 border border-slate-700 shrink-0'>
                <div className='size-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold uppercase text-sm shrink-0'>
                  {adminProfile.nama_dosen?.charAt(0) || 'A'}
                </div>
                <div className='overflow-hidden'>
                  <p className='text-sm font-semibold text-slate-200 truncate'>
                    {adminProfile.nama_dosen}
                  </p>
                  <p className='text-xs text-amber-500 font-medium truncate'>
                    Akses Tervalidasi
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className='flex flex-col items-center mt-2 space-y-6'>
              <div className='size-10 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center font-bold text-xl text-blue-400 uppercase shadow-inner'>
                A
              </div>
              <div
                className='size-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold uppercase text-base border border-slate-700 shrink-0'
                title={adminProfile.nama_dosen}>
                {adminProfile.nama_dosen?.charAt(0) || 'A'}
              </div>
            </div>
          )}
        </div>

        <nav
          className={`flex-1 px-4 space-y-3 mt-2 text-base font-medium ${isSidebarCollapsed ? 'px-3' : ''}`}>
          <button
            onClick={() => setActiveTab('overview')}
            title='Dashboard Utama'
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-4 px-4'} py-3.5 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
            <LayoutDashboard className='size-5 flex-shrink-0' />
            {!isSidebarCollapsed && <span>Dashboard Utama</span>}
          </button>
          <button
            onClick={() => setActiveTab('pengajuan')}
            title='Lihat Pengajuan'
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-4 px-4'} py-3.5 rounded-xl transition-all ${activeTab === 'pengajuan' ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
            <FileStack className='size-5 flex-shrink-0' />
            {!isSidebarCollapsed && <span>Lihat Pengajuan</span>}
          </button>
          <button
            onClick={() => setActiveTab('riwayat')}
            title='Riwayat Pemakaian Lab'
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-4 px-4'} py-3.5 rounded-xl transition-all ${activeTab === 'riwayat' ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
            <FolderOutput className='size-5 flex-shrink-0' />
            {!isSidebarCollapsed && <span>Riwayat Pemakaian Lab</span>}
          </button>
          <button
            onClick={() => setActiveTab('inventaris')}
            title='Inventaris Lab'
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-4 px-4'} py-3.5 rounded-xl transition-all ${activeTab === 'inventaris' ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
            <PackageSearch className='size-5 flex-shrink-0' />
            {!isSidebarCollapsed && <span>Inventaris Lab</span>}
          </button>
          <button
            onClick={() => setActiveTab('materi')}
            title='Unggah Materi'
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-4 px-4'} py-3.5 rounded-xl transition-all ${activeTab === 'materi' ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
            <Upload className='size-5 flex-shrink-0' />
            {!isSidebarCollapsed && <span>Unggah Materi</span>}
          </button>
        </nav>

        <div
          className={`p-6 border-t border-slate-800/80 ${isSidebarCollapsed ? 'flex justify-center px-4' : ''}`}>
          <Link
            href='/'
            title='Kembali ke Beranda'
            className={`flex items-center justify-center w-full py-3 text-base font-semibold text-slate-300 hover:text-white transition-colors bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-slate-700/50 ${isSidebarCollapsed ? 'px-0' : ''}`}>
            {isSidebarCollapsed ? (
              <LogOut className='size-5' />
            ) : (
              'Kembali ke Beranda'
            )}
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className='flex-1 flex flex-col min-h-screen overflow-hidden relative'>
        {/* Mobile Header Placeholder */}
        <header className='md:hidden flex items-center justify-between p-5 bg-slate-900 border-b shadow-sm z-20'>
          <h2 className='text-xl font-bold text-white'>AdminPanel</h2>
          <button className='p-2.5 bg-slate-800 rounded-lg text-slate-300'>
            <Menu className='size-6' />
          </button>
        </header>

        <div className='flex-1 overflow-y-auto p-6 md:p-8 lg:p-10 pb-20'>
          <div className='max-w-6xl mx-auto space-y-8 w-full'>
            {/* Header Konten Dinamis berdasarkan hak akses Lab */}
            <div className='pb-4 border-b border-slate-200 flex flex-col items-start'>
              <div className='mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 tracking-wide border border-emerald-200'>
                <Circle className='size-2.5 fill-emerald-500 text-emerald-500 animate-pulse' />
                Status Sistem: Online
              </div>
              <h1 className='text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight'>
                {getDashboardTitle(adminProfile.lab_id)}
              </h1>
              <p className='mt-3 text-slate-500 text-lg max-w-3xl leading-relaxed'>
                Platform terisolasi. Anda memegang kendali penuh pada validasi
                peminjaman dan pengelolaan inventaris yang masuk ke wilayah
                kewenangan Anda secara aman.
              </p>
            </div>

            {/* Injeksi Sub-Komponen */}
            {renderTabContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
