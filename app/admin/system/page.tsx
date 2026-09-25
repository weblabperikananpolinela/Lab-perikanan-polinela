'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  Circle,
  Users,
  Building2,
  LogOut,
  ShieldCheck,
  LayoutDashboard,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { APP_VERSION_LABEL } from '@/lib/version';

import KelolaUserTab from './_components/KelolaUserTab';

interface LabRow {
  id: number;
  nama_lab: string;
  jenis: string | null;
}

function SystemAdminContent() {
  const [labs, setLabs] = useState<LabRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'akun' | 'labs'>('akun');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }

      const { data: adminRow } = await supabase
        .from('whitelist_admin')
        .select('role')
        .eq('email', session.user.email)
        .eq('role', 'system_admin')
        .maybeSingle();
      if (!adminRow) {
        router.push('/');
        return;
      }

      const { data: labData } = await supabase
        .from('laboratorium')
        .select('id, nama_lab, jenis')
        .order('id');
      setLabs(labData || []);
      setLoading(false);
    };
    init();
  }, [supabase, router]);

  const handleTabChange = (tab: 'akun' | 'labs') => {
    setActiveTab(tab);
    setIsMobileOpen(false);
  };

  const openLab = (labId: number) => {
    router.push(`/admin/dashboard?lab_id=${labId}`);
  };

  const sidebarBtn = (
    tab: 'akun' | 'labs',
    label: string,
    icon: React.ReactNode,
  ) => {
    const active = activeTab === tab;
    return (
      <button
        onClick={() => handleTabChange(tab)}
        title={label}
        className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-4 px-4'} py-3.5 rounded-xl transition-all ${
          active
            ? 'bg-purple-600 text-white shadow-md shadow-purple-900/20'
            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}>
        {icon}
        {!isSidebarCollapsed && <span>{label}</span>}
      </button>
    );
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-slate-50'>
        <p className='text-slate-500 font-medium md:text-lg animate-pulse'>
          Memuat Dashboard System Admin...
        </p>
      </div>
    );
  }

  const headerInfo =
    activeTab === 'akun'
      ? {
          title: 'Manajemen Akun',
          desc: 'Atur email pengelola lab. Satu email bisa memegang banyak lab; satu lab bisa dipegang lebih dari satu email.',
        }
      : {
          title: 'Semua Laboratorium',
          desc: 'Pilih laboratorium untuk membuka dashboard lab dengan hak penuh System Admin.',
        };

  return (
    <div className='min-h-screen flex bg-slate-50 relative'>
      {isMobileOpen && (
        <div
          className='fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity'
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 transform flex flex-col bg-slate-900 border-r border-slate-800 shadow-xl transition-all duration-300 ease-in-out ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 ${isSidebarCollapsed ? 'w-24' : 'w-72'}`}>
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className='hidden md:flex absolute -right-3.5 top-14 bg-slate-800 border border-slate-700 text-white p-1 rounded-full hover:bg-purple-600 transition-colors z-30 shadow-md items-center justify-center'>
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
                DOLPHIN<span className='text-purple-400'>Admin</span>
              </h2>
              <p className='text-slate-400 mt-2 font-medium text-sm leading-snug shrink-0'>
                System Admin — kontrol terpusat
              </p>
              <div className='mt-4 py-2 px-3 bg-slate-800 rounded-lg flex items-center gap-3 border border-slate-700 shrink-0'>
                <div className='size-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0'>
                  <ShieldCheck className='size-4' />
                </div>
                <div className='overflow-hidden'>
                  <p className='text-sm font-semibold text-slate-200 truncate'>
                    System Admin
                  </p>
                  <p className='text-xs text-purple-400 font-medium truncate'>
                    Full control semua lab
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className='flex flex-col items-center mt-2 space-y-6'>
              <div className='size-10 bg-purple-600/20 border border-purple-500/30 rounded-xl flex items-center justify-center text-purple-400 shadow-inner'>
                <ShieldCheck className='size-5' />
              </div>
            </div>
          )}
        </div>

        <nav
          className={`flex-1 overflow-y-auto px-4 space-y-2 mt-2 text-base font-medium ${isSidebarCollapsed ? 'px-3' : ''} custom-scrollbar`}>
          {sidebarBtn(
            'akun',
            'Manajemen Akun',
            <Users className='size-5 flex-shrink-0' />,
          )}
          {sidebarBtn(
            'labs',
            'Semua Lab',
            <Building2 className='size-5 flex-shrink-0' />,
          )}
        </nav>

        <div
          className={`p-6 border-t border-slate-800/80 ${isSidebarCollapsed ? 'flex flex-col items-center gap-2 px-4' : ''}`}>
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
          <p
            className={`text-[11px] text-slate-500 font-medium ${isSidebarCollapsed ? 'hidden' : 'text-center'}`}>
            {APP_VERSION_LABEL}
          </p>
        </div>
      </aside>

      <main className='flex-1 flex flex-col min-h-screen overflow-hidden relative w-full'>
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
            <div
              className={`pb-4 md:pb-5 border-b border-slate-200 flex flex-col items-start ${activeTab === 'akun' ? 'mb-6 md:mb-8' : 'mb-5 md:mb-6'}`}>
              <div className='inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs md:text-sm font-semibold text-purple-700 tracking-wide border border-purple-200 shadow-sm mb-3'>
                <Circle className='size-2.5 fill-purple-500 text-purple-500' />
                System Admin
              </div>
              <h1 className='font-extrabold text-slate-900 tracking-tight leading-tight text-2xl md:text-3xl lg:text-4xl'>
                {headerInfo.title}
              </h1>
              <p className='mt-2.5 text-slate-500 text-sm md:text-base lg:text-lg max-w-3xl leading-relaxed'>
                {headerInfo.desc}
              </p>
            </div>

            {activeTab === 'akun' ? (
              <KelolaUserTab supabase={supabase} />
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {labs.map((lab) => (
                  <button
                    key={lab.id}
                    onClick={() => openLab(lab.id)}
                    className='bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left group flex flex-col h-full'>
                    <div className='size-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors'>
                      <LayoutDashboard size={24} />
                    </div>
                    <h3 className='text-xl font-bold text-slate-800 mb-1'>
                      {lab.nama_lab}
                    </h3>
                    <p className='text-sm text-slate-500 mb-4'>
                      {lab.jenis || 'Laboratorium'}
                    </p>
                    <p className='text-sm text-slate-500 mt-auto flex items-center gap-2 group-hover:text-purple-600 font-medium transition-colors'>
                      Buka Dashboard
                      <ChevronRight size={16} />
                    </p>
                  </button>
                ))}
                {labs.length === 0 && (
                  <p className='col-span-full text-center py-16 text-slate-500'>
                    Belum ada data laboratorium.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SystemAdminPage() {
  return <SystemAdminContent />;
}
