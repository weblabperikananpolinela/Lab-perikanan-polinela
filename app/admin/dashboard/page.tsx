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
  Activity,
  ShieldCheck,
} from 'lucide-react';

import OverviewTab from './_components/OverviewTab';
import InventarisTab from './_components/InventarisTab';
import RiwayatTab from './_components/RiwayatTab';
import PengajuanTab from './_components/PengajuanTab';
import SettingRekening from './_components/SettingRekening';
import KelolaJadwal from './_components/KelolaJadwal';
import MateriTab from './_components/MateriTab';
import LayananTab from './_components/LayananTab'; // Import Tab Layanan
import NotifButton from '@/app/_components/NotifButton';
import { APP_VERSION_LABEL } from '@/lib/version';

// --- CONFIG & HELPERS ---
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
  16: 'Polyfish',
  17: 'Lab Simulator',
  18: 'Lab Radar',
};

// FITUR BARU: Header Dinamis dan Minimalis[cite: 3]
const getDynamicHeader = (tab: string, labId: number) => {
  const labName = labMap[labId] || 'Laboratorium';

  switch (tab) {
    case 'overview':
      return {
        title: `Dashboard Pengelola: ${labName}`,
        desc: 'Platform terisolasi. Anda memegang kendali penuh pada validasi peminjaman dan pengelolaan inventaris yang masuk ke wilayah kewenangan Anda secara aman.',
      };
    case 'pengajuan':
      return { title: `Pengajuan: ${labName}`, desc: null };
    case 'layanan':
      return { title: `Layanan Uji: ${labName}`, desc: null };
    case 'materi':
      return { title: `Materi & Kelas: ${labName}`, desc: null };
    case 'riwayat':
      return { title: `Riwayat Pemakaian: ${labName}`, desc: null };
    case 'inventaris':
      return { title: `Inventaris Lab: ${labName}`, desc: null };
    case 'pengaturan':
      return { title: `Pengaturan Rekening: ${labName}`, desc: null };
    case 'jadwal':
      return { title: `Jadwal Lab: ${labName}`, desc: null };
    default:
      return { title: labName, desc: null };
  }
};

function DashboardContent() {
  const [initLoading, setInitLoading] = useState(true);
  const [adminProfiles, setAdminProfiles] = useState<any[]>([]);
  const [activeProfile, setActiveProfile] = useState<any>(null);

  // States untuk UI
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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

      // Gate keamanan: getSession (baca cookie lokal). System admin
      // tidak boleh memakai dashboard lab — dia lewat /admin/system.
      const { data: adminData } = await supabase
        .from('whitelist_admin')
        .select('role, lab_id')
        .eq('email', session.user.email);

      if (!adminData || adminData.length === 0) {
        router.push('/');
        return;
      }

      const isSystemAdmin = adminData.some((r: any) => r.role === 'system_admin');
      const labRows = adminData.filter((r: any) => r.role !== 'system_admin');

      // System admin + lab_id valid → profil sintetis, full control via RLS bypass
      if (isSystemAdmin && labIdParam) {
        const labIdNum = Number(labIdParam);
        if (!Number.isInteger(labIdNum) || labIdNum <= 0) {
          router.push('/admin/system');
          return;
        }
        setAdminProfiles([]);
        setActiveProfile({
          role: 'system_admin',
          lab_id: labIdNum,
          email: session.user.email,
          nama_dosen: 'System Admin',
        });
        setInitLoading(false);
        return;
      }

      // Only system_admin, no lab_id → /admin/system
      if (isSystemAdmin && labRows.length === 0) {
        router.push('/admin/system');
        return;
      }

      // Gunakan labRows untuk pemilihan lab (system_admin + lab, atau admin biasa)
      setAdminProfiles(labRows);

      if (labRows.length === 1) {
        setActiveProfile(labRows[0]);
      } else if (labRows.length > 1) {
        if (labIdParam) {
          const selected = labRows.find(
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

  // --- LAYAR PEMILIHAN LAB MULTI-TENANT ---
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

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setIsMobileOpen(false);
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
      case 'layanan':
        return <LayananTab adminProfile={activeProfile} supabase={supabase} />;
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
        return (
          <KelolaJadwal
            labId={activeProfile.lab_id}
            userEmail={activeProfile.email}
          />
        );
      case 'materi':
        return <MateriTab adminProfile={activeProfile} supabase={supabase} />;
      default:
        return <p>Modul dalam pengembangan.</p>;
    }
  };

  const headerInfo = getDynamicHeader(activeTab, activeProfile.lab_id);

  return (
    <div className='min-h-screen flex bg-slate-50 relative'>
      {/* Overlay Gelap Mobile */}
      {isMobileOpen && (
        <div
          className='fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity'
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 transform flex flex-col bg-slate-900 border-r border-slate-800 shadow-xl transition-all duration-300 ease-in-out ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 ${isSidebarCollapsed ? 'w-24' : 'w-72'}`}>
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
          className={`flex-1 overflow-y-auto px-4 space-y-2 mt-2 text-base font-medium ${isSidebarCollapsed ? 'px-3' : ''} custom-scrollbar`}>
          <button
            onClick={() => handleTabChange('overview')}
            title='Dashboard Utama'
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-4 px-4'} py-3.5 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
            <LayoutDashboard className='size-5 flex-shrink-0' />{' '}
            {!isSidebarCollapsed && <span>Dashboard Utama</span>}
          </button>
          <button
            onClick={() => handleTabChange('pengajuan')}
            title='Lihat Pengajuan'
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-4 px-4'} py-3.5 rounded-xl transition-all ${activeTab === 'pengajuan' ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
            <FileStack className='size-5 flex-shrink-0' />{' '}
            {!isSidebarCollapsed && <span>Lihat Pengajuan</span>}
          </button>
          <button
            onClick={() => handleTabChange('layanan')}
            title='Layanan Uji Lab'
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-4 px-4'} py-3.5 rounded-xl transition-all ${activeTab === 'layanan' ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
            <Activity className='size-5 flex-shrink-0' />{' '}
            {!isSidebarCollapsed && <span>Layanan Uji Lab</span>}
          </button>
          <button
            onClick={() => handleTabChange('materi')}
            title='Materi & Kelas'
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-4 px-4'} py-3.5 rounded-xl transition-all ${activeTab === 'materi' ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
            <FolderKanban className='size-5 flex-shrink-0' />{' '}
            {!isSidebarCollapsed && <span>Manajemen Materi</span>}
          </button>
          <button
            onClick={() => handleTabChange('riwayat')}
            title='Riwayat Pemakaian Lab'
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-4 px-4'} py-3.5 rounded-xl transition-all ${activeTab === 'riwayat' ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
            <FolderOutput className='size-5 flex-shrink-0' />{' '}
            {!isSidebarCollapsed && <span>Riwayat Pemakaian Lab</span>}
          </button>
          <button
            onClick={() => handleTabChange('inventaris')}
            title='Inventaris Lab'
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-4 px-4'} py-3.5 rounded-xl transition-all ${activeTab === 'inventaris' ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
            <PackageSearch className='size-5 flex-shrink-0' />{' '}
            {!isSidebarCollapsed && <span>Inventaris Lab</span>}
          </button>
          <button
            onClick={() => handleTabChange('pengaturan')}
            title='Pengaturan Rekening'
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-4 px-4'} py-3.5 rounded-xl transition-all ${activeTab === 'pengaturan' ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
            <Landmark className='size-5 flex-shrink-0' />{' '}
            {!isSidebarCollapsed && <span>Pengaturan Rekening</span>}
          </button>
          <button
            onClick={() => handleTabChange('jadwal')}
            title='Kelola Jadwal Lab'
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-4 px-4'} py-3.5 rounded-xl transition-all ${activeTab === 'jadwal' ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
            <CalendarDays className='size-5 flex-shrink-0' />{' '}
            {!isSidebarCollapsed && <span>Jadwal Lab</span>}
          </button>
        </nav>

        <div
          className={`p-6 border-t border-slate-800/80 ${isSidebarCollapsed ? 'flex flex-col items-center gap-2 px-4' : ''}`}>
          {activeProfile?.role === 'system_admin' ? (
            <Link
              href='/admin/system'
              title='Kembali ke System Admin'
              className={`flex items-center justify-center w-full py-3 text-base font-semibold text-slate-300 hover:text-white transition-colors bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-slate-700/50 ${isSidebarCollapsed ? 'px-0' : ''}`}>
              {isSidebarCollapsed ? (
                <ShieldCheck className='size-5' />
              ) : (
                'Kembali ke System Admin'
              )}
            </Link>
          ) : (
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
          )}
          <p
            className={`text-[11px] text-slate-500 font-medium ${isSidebarCollapsed ? 'hidden' : 'text-center'}`}>
            {APP_VERSION_LABEL}
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className='flex-1 flex flex-col min-h-screen overflow-hidden relative w-full'>
        {/* Header Mobile Hamburger */}
        <header className='md:hidden flex items-center gap-4 p-5 bg-slate-900 border-b border-slate-800 shadow-sm z-20'>
          <button
            onClick={() => setIsMobileOpen(true)}
            className='p-2 bg-slate-800 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors'>
            <Menu className='size-6' />
          </button>
          <h2 className='text-xl font-bold text-white tracking-tight'>
            DOLPHIN
          </h2>
        </header>

        <div className='flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 pb-24 custom-scrollbar'>
          <div className='max-w-6xl mx-auto w-full'>
            {/* FITUR BARU: Dynamic Minimalist Header */}
            <div
              className={`pb-4 md:pb-5 border-b border-slate-200 flex flex-col items-start ${activeTab === 'overview' ? 'mb-6 md:mb-8' : 'mb-5 md:mb-6'}`}>
              {/* Notif dan Status HANYA muncul di Tab Overview */}
              {activeTab === 'overview' && (
                <div className='flex items-center justify-between w-full mb-3 md:mb-4 animate-in fade-in slide-in-from-top-2 duration-500'>
                  <div className='inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs md:text-sm font-semibold text-emerald-700 tracking-wide border border-emerald-200 shadow-sm'>
                    <Circle className='size-2.5 fill-emerald-500 text-emerald-500 animate-pulse' />{' '}
                    Status Sistem: Online
                  </div>
                  <NotifButton
                    userEmail={activeProfile?.email}
                    role='admin'
                    labId={activeProfile?.lab_id}
                  />
                </div>
              )}

              <h1
                className={`font-extrabold text-slate-900 tracking-tight leading-tight transition-all duration-300 ${activeTab === 'overview' ? 'text-2xl md:text-3xl lg:text-4xl' : 'text-xl md:text-2xl lg:text-3xl'}`}>
                {headerInfo.title}
              </h1>

              {/* Deskripsi HANYA muncul jika tab overview (di semua layar) */}
              {headerInfo.desc && (
                <p className='mt-2.5 text-slate-500 text-sm md:text-base lg:text-lg max-w-3xl leading-relaxed animate-in fade-in slide-in-from-top-2 duration-500'>
                  {headerInfo.desc}
                </p>
              )}
            </div>

            {/* Injeksi Sub-Komponen Berdasarkan Tab */}
            <div className='animate-in fade-in slide-in-from-bottom-2 duration-500'>
              {renderTabContent()}
            </div>
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
