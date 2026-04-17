'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  LogOut,
  Building2,
  ArrowRight,
  Landmark,
  CalendarDays,
  FolderKanban,
} from 'lucide-react';

import OverviewTab from './_components/OverviewTab';
import InventarisTab from './_components/InventarisTab';
import RiwayatTab from './_components/RiwayatTab';
import PengajuanTab from './_components/PengajuanTab';
import SettingRekening from './_components/SettingRekening';
import KelolaJadwal from './_components/KelolaJadwal';
import MateriTab from './_components/MateriTab';
import NotifButton from '@/app/_components/NotifButton';

// --- CONFIG & HELPERS (UPDATED 18 LABS) ---
const labMap: Record<number, string> = {
  1: 'Lab. Kesehatan Ikan',
  2: 'Lab. Kualitas Air',
  3: 'Lab. Pengolahan',
  4: 'Bangsal Pakan Alami',
  5: 'Lab. Perikanan (SFS)',
  6: 'Lab. Pembenihan',
  7: 'Lab. Ikan Hias',
  8: 'Lab. Nutrisi',
  9: 'Polyfeed',
  10: 'POFA',
  11: 'Galangan Kapal',
  12: 'Alat Tangkap Ikan',
  13: 'KJA',
  14: 'FISHTECH',
  15: 'FISH MARKET',
  16: 'polyfish',
  17: 'Lab Simulator',
  18: 'Lab Radar',
};

const getDashboardTitle = (lab_id: number) => {
  return `Dashboard Pengelola: ${labMap[lab_id] || 'Laboratorium'}`;
};

// --- INNER COMPONENT DENGAN LOGIKA MULTI-LAB ---
function DashboardContent() {
  const [initLoading, setInitLoading] = useState(true);
  const [adminProfiles, setAdminProfiles] = useState<any[]>([]);
  const [activeProfile, setActiveProfile] = useState<any>(null);

  // States untuk UI
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false); // <-- STATE BARU UNTUK MOBILE

  const router = useRouter();
  const searchParams = useSearchParams();
  const labIdParam = searchParams.get('lab_id');
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

      // Tarik SEMUA data lab yang dimiliki oleh email dosen ini
      const { data: adminData } = await supabase
        .from('whitelist_admin')
        .select('*')
        .eq('email', session.user.email);

      if (!adminData || adminData.length === 0) {
        router.push('/');
        return;
      }

      setAdminProfiles(adminData);

      // Logika Penentuan Lab Aktif
      if (adminData.length === 1) {
        setActiveProfile(adminData[0]);
      } else if (adminData.length > 1) {
        if (labIdParam) {
          const selected = adminData.find(
            (p) => p.lab_id.toString() === labIdParam,
          );
          if (selected) setActiveProfile(selected);
        } else {
          setActiveProfile(null);
        }
      }

      setInitLoading(false);
    };

    initApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labIdParam]);

  if (initLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-slate-50'>
        <p className='text-slate-500 font-medium md:text-lg animate-pulse'>
          Memuat Keamanan Multi-Tenant...
        </p>
      </div>
    );
  }

  // --- LAYAR PEMILIHAN LAB ---
  if (!activeProfile && adminProfiles.length > 1) {
    return (
      <div className='min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4'>
        <div className='max-w-4xl w-full'>
          <div className='text-center mb-10'>
            <h1 className='text-3xl md:text-4xl font-bold text-slate-900 mb-3'>
              Pilih Ruang Kerja Anda
            </h1>
            <p className='text-slate-500 text-lg'>
              Sistem mendeteksi Anda memiliki hak akses untuk mengelola lebih
              dari satu fasilitas.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {adminProfiles.map((profile) => (
              <button
                key={profile.lab_id}
                onClick={() =>
                  router.push(`/admin/dashboard?lab_id=${profile.lab_id}`)
                }
                className='bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left group flex flex-col h-full'>
                <div className='size-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors'>
                  <Building2 size={24} />
                </div>
                <h3 className='text-xl font-bold text-slate-800 mb-2'>
                  {labMap[profile.lab_id]}
                </h3>
                <p className='text-sm text-slate-500 mt-auto flex items-center gap-2 group-hover:text-blue-600 font-medium transition-colors'>
                  Buka Dashboard <ArrowRight size={16} />
                </p>
              </button>
            ))}
          </div>

          <div className='mt-12 text-center'>
            <Link
              href='/'
              className='text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-2'>
              <ChevronLeft size={18} /> Kembali ke Beranda Utama
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Fungsi helper untuk mengganti tab & menutup menu mobile
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setIsMobileOpen(false); // Tutup sidebar mobile setelah menu dipilih
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab
            adminProfile={activeProfile}
            supabase={supabase}
            setActiveTab={setActiveTab}
          />
        );
      case 'pengajuan':
        return (
          <PengajuanTab adminProfile={activeProfile} supabase={supabase} />
        );
      case 'riwayat':
        return <RiwayatTab adminProfile={activeProfile} supabase={supabase} />;
      case 'inventaris':
        return (
          <InventarisTab adminProfile={activeProfile} supabase={supabase} />
        );
      case 'pengaturan':
        return (
          <SettingRekening adminProfile={activeProfile} supabase={supabase} />
        );
      case 'jadwal':
        return <KelolaJadwal labId={activeProfile.lab_id} userEmail={activeProfile.email} />;
      case 'materi':
        return <MateriTab adminProfile={activeProfile} supabase={supabase} />;
      default:
        return <p>Modul dalam pengembangan.</p>;
    }
  };

  return (
    <div className='min-h-screen flex bg-slate-50 relative'>
      {/* Overlay Gelap untuk Mode Mobile */}
      {isMobileOpen && (
        <div
          className='fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity'
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar - Desktop & Mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 transform flex flex-col bg-slate-900 border-r border-slate-800 shadow-xl transition-all duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0 ${isSidebarCollapsed ? 'w-24' : 'w-72'}`}>
        {/* Toggle Button (Hanya tampil di Desktop) */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className='hidden md:flex absolute -right-3.5 top-14 bg-slate-800 border border-slate-700 text-white p-1 rounded-full hover:bg-blue-600 transition-colors z-30 shadow-md items-center justify-center'>
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
                DOLPHIN<span className='text-blue-400'>Admin</span>
              </h2>
              <p className='text-slate-400 mt-2 font-medium text-sm leading-snug shrink-0'>
                Sistem Administrasi Terpusat
              </p>
              <div className='mt-4 py-2 px-3 bg-slate-800 rounded-lg flex items-center gap-3 border border-slate-700 shrink-0'>
                <div className='size-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold uppercase text-sm shrink-0'>
                  {activeProfile.nama_dosen?.charAt(0) || 'A'}
                </div>
                <div className='overflow-hidden'>
                  <p className='text-sm font-semibold text-slate-200 truncate'>
                    {activeProfile.nama_dosen}
                  </p>
                  <p className='text-xs text-amber-500 font-medium truncate'>
                    {labMap[activeProfile.lab_id]}
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
                title={activeProfile.nama_dosen}>
                {activeProfile.nama_dosen?.charAt(0) || 'A'}
              </div>
            </div>
          )}
        </div>

        <nav
          className={`flex-1 px-4 space-y-3 mt-2 text-base font-medium ${isSidebarCollapsed ? 'px-3' : ''}`}>
          <button
            onClick={() => handleTabChange('overview')}
            title='Dashboard Utama'
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-4 px-4'} py-3.5 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
            <LayoutDashboard className='size-5 flex-shrink-0' />
            {!isSidebarCollapsed && <span>Dashboard Utama</span>}
          </button>
          <button
            onClick={() => handleTabChange('pengajuan')}
            title='Lihat Pengajuan'
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-4 px-4'} py-3.5 rounded-xl transition-all ${activeTab === 'pengajuan' ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
            <FileStack className='size-5 flex-shrink-0' />
            {!isSidebarCollapsed && <span>Lihat Pengajuan</span>}
          </button>
          
          <button
            onClick={() => handleTabChange('materi')}
            title='Materi & Kelas'
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-4 px-4'} py-3.5 rounded-xl transition-all ${activeTab === 'materi' ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
            <FolderKanban className='size-5 flex-shrink-0' />
            {!isSidebarCollapsed && <span>Manajemen Materi</span>}
          </button>

          <button
            onClick={() => handleTabChange('riwayat')}
            title='Riwayat Pemakaian Lab'
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-4 px-4'} py-3.5 rounded-xl transition-all ${activeTab === 'riwayat' ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
            <FolderOutput className='size-5 flex-shrink-0' />
            {!isSidebarCollapsed && <span>Riwayat Pemakaian Lab</span>}
          </button>
          <button
            onClick={() => handleTabChange('inventaris')}
            title='Inventaris Lab'
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-4 px-4'} py-3.5 rounded-xl transition-all ${activeTab === 'inventaris' ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
            <PackageSearch className='size-5 flex-shrink-0' />
            {!isSidebarCollapsed && <span>Inventaris Lab</span>}
          </button>
          <button
            onClick={() => handleTabChange('pengaturan')}
            title='Pengaturan Rekening'
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-4 px-4'} py-3.5 rounded-xl transition-all ${activeTab === 'pengaturan' ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
            <Landmark className='size-5 flex-shrink-0' />
            {!isSidebarCollapsed && <span>Pengaturan Rekening</span>}
          </button>
          <button
            onClick={() => handleTabChange('jadwal')}
            title='Kelola Jadwal Lab'
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-4 px-4'} py-3.5 rounded-xl transition-all ${activeTab === 'jadwal' ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
            <CalendarDays className='size-5 flex-shrink-0' />
            {!isSidebarCollapsed && <span>Jadwal Lab</span>}
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
      <main className='flex-1 flex flex-col min-h-screen overflow-hidden relative w-full'>
        {/* Header Mobile (Sekarang tombolnya aktif!) */}
        {/* Header Mobile (Diperbarui: Hamburger pindah ke Kiri) */}
        <header className='md:hidden flex items-center gap-4 p-5 bg-slate-900 border-b border-slate-800 shadow-sm z-20'>
          <button
            onClick={() => setIsMobileOpen(true)}
            className='p-2 bg-slate-800 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors'>
            <Menu className='size-6' />
          </button>
          <h2 className='text-xl font-bold text-white tracking-tight'>
            DHOLPIN
          </h2>
        </header>

        <div className='flex-1 overflow-y-auto p-6 md:p-8 lg:p-10 pb-20'>
          <div className='max-w-6xl mx-auto space-y-8 w-full'>
            <div className='pb-4 border-b border-slate-200 flex flex-col items-start'>
              <div className='flex items-center justify-between w-full mb-3'>
                <div className='inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 tracking-wide border border-emerald-200'>
                  <Circle className='size-2.5 fill-emerald-500 text-emerald-500 animate-pulse' />
                  Status Sistem: Online
                </div>
                <NotifButton 
                  userEmail={activeProfile?.email} 
                  role="admin" 
                  labId={activeProfile?.lab_id} 
                />
              </div>
              <h1 className='text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight'>
                {getDashboardTitle(activeProfile.lab_id)}
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

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen flex items-center justify-center bg-slate-50'>
          <p className='text-slate-500 font-medium md:text-lg animate-pulse'>
            Memuat Sistem Dashboard...
          </p>
        </div>
      }>
      <DashboardContent />
    </Suspense>
  );
}
