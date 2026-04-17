'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Swal from 'sweetalert2';
import { createClient } from '@/lib/supabase/client';
import {
  Users,
  Menu,
  ChevronDown,
  BookOpen,
  FileText,
  Anchor,
  ClipboardEdit,
  SearchCheck,
  Building2,
  LogOut,
  Calendar,
  PackageSearch,
  FileUp, // <-- Icon untuk Upload Materi
  FolderKanban,
  LockKeyhole,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const navLinks = [
  { label: 'Administrasi', href: '#administrasi' },
  { label: 'Inventaris', href: '/inventaris' },
  { label: 'Jadwal', href: '/jadwal' },
];

// Peta nama Lab untuk ditampilkan di Dropdown
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

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<any>(null);

  // STATE BARU: Menyimpan role dan data admin
  const [userRole, setUserRole] = useState<'admin_lab' | 'dosen' | null>(null);
  const [adminProfiles, setAdminProfiles] = useState<any[]>([]);

  const supabase = createClient();

  useEffect(() => {
    const initSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      if (session) checkUserRole(session.user);
    };
    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkUserRole(session.user);
      } else {
        setUserRole(null);
        setAdminProfiles([]);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // LOGIKA LOGIN BARU: Memisahkan Admin Lab (Whitelist) dan Dosen Reguler (@polinela.ac.id)
  const checkUserRole = async (user: any) => {
    if (!user || !user.email) return;
    const email = user.email;

    // 1. Cek apakah email ada di Whitelist Admin
    const { data: adminData, error } = await supabase
      .from('whitelist_admin')
      .select('*')
      .eq('email', email);

    if (!error && adminData && adminData.length > 0) {
      setUserRole('admin_lab');
      setAdminProfiles(adminData);
      return;
    }

    // 2. Jika bukan admin, cek apakah domain emailnya @polinela.ac.id
    // (Juga memasukkan email dev kamu agar mudah saat testing)
    if (
      email.endsWith('@polinela.ac.id') ||
      email === 'afnanimadurrosyad911@gmail.com'
    ) {
      setUserRole('dosen');
      setAdminProfiles([]); // Kosongkan admin profile karena dia cuma dosen
      return;
    }

    // 3. Jika bukan keduanya, KICK / LOGOUT otomatis
    await supabase.auth.signOut();
    Swal.fire({
      text: 'Akses Ditolak! Hanya dosen dengan email @polinela.ac.id atau admin terdaftar yang diizinkan masuk.',
      icon: 'error',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
    setUserRole(null);
    setAdminProfiles([]);
  };

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
  };

  const handleLogout = async () => {
    Swal.fire({
      title: 'Memutus Sesi...',
      text: 'Mengamankan data Anda.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    await supabase.auth.signOut();
    setSession(null);
    setUserRole(null);
    setAdminProfiles([]);

    Swal.fire({
      text: 'Logout Berhasil',
      icon: 'success',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
    }).then(() => {
      window.location.reload();
    });
  };

  // Helper untuk mendapatkan nama yang akan ditampilkan di tombol
  const getDisplayName = () => {
    if (
      userRole === 'admin_lab' &&
      adminProfiles.length > 0 &&
      adminProfiles[0].nama_dosen
    ) {
      return adminProfiles[0].nama_dosen;
    }
    return (
      session?.user?.user_metadata?.full_name ||
      session?.user?.email?.split('@')[0] ||
      'Dosen Polinela'
    );
  };

  return (
    <header className='fixed top-0 left-0 right-0 z-50 bg-white shadow-md'>
      <nav className='mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8'>
        {/* Logo */}
        <Link
          href='/'
          className='flex items-center gap-2 transition-colors hover:opacity-80'>
          <Image
            src='/logo_dolphin.png'
            alt='Logo Dolphin'
            width={160}
            height={160}
            className='h-12 w-auto object-contain'
            priority
          />
          <span className='text-lg font-bold text-slate-800 md:inline'>
            DOLPHIN
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className='hidden items-center gap-8 md:flex'>
          {/* Profil Dropdown */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger className='flex items-center gap-1 text-sm font-medium text-slate-800 transition-colors hover:text-blue-600 focus:outline-none'>
              Profil
              <ChevronDown className='size-4' />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align='start'
              sideOffset={16}
              className='w-[400px] p-4 flex flex-col gap-2'>
              <DropdownMenuItem
                asChild
                className='p-3 cursor-pointer rounded-md transition-all focus:bg-slate-50 hover:bg-slate-50'>
                <Link href='/organisasi' className='flex items-start gap-4'>
                  <div className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600'>
                    <Users className='size-5' />
                  </div>
                  <div>
                    <h4 className='text-sm font-semibold text-slate-900'>
                      Struktur Organisasi
                    </h4>
                    <p className='text-sm text-slate-500 mt-1'>
                      Personel pengelola fasilitas Laboratorium dan Teaching
                      Factory.
                    </p>
                  </div>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Administrasi Dropdown */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger className='flex items-center gap-1 text-sm font-medium text-slate-800 transition-colors hover:text-blue-600 focus:outline-none'>
              Administrasi
              <ChevronDown className='size-4' />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align='start'
              sideOffset={16}
              className='w-[400px] p-4 flex flex-col gap-2'>
              <DropdownMenuItem
                asChild
                className='p-3 cursor-pointer rounded-md transition-all focus:bg-slate-50 hover:bg-slate-50'>
                <Link
                  href='/administrasi/pengajuan'
                  className='flex items-start gap-4'>
                  <div className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600'>
                    <ClipboardEdit className='size-5' />
                  </div>
                  <div>
                    <h4 className='text-sm font-semibold text-slate-900'>
                      Formulir Pengajuan
                    </h4>
                    <p className='text-sm text-slate-500 mt-1'>
                      Isi formulir untuk meminjam ruangan lab dan alat.
                    </p>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                asChild
                className='p-3 cursor-pointer rounded-md transition-all focus:bg-slate-50 hover:bg-slate-50'>
                <Link
                  href='/administrasi/status'
                  className='flex items-start gap-4'>
                  <div className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600'>
                    <SearchCheck className='size-5' />
                  </div>
                  <div>
                    <h4 className='text-sm font-semibold text-slate-900'>
                      Cek Status & Riwayat
                    </h4>
                    <p className='text-sm text-slate-500 mt-1'>
                      Lacak status persetujuan dan riwayat peminjamanmu.
                    </p>
                  </div>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Dokumen Dropdown */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger className='flex items-center gap-1 text-sm font-medium text-slate-800 transition-colors hover:text-blue-600 focus:outline-none'>
              Dokumen
              <ChevronDown className='size-4' />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align='start'
              sideOffset={16}
              className='w-[400px] p-4 flex flex-col gap-2'>
              <DropdownMenuItem
                asChild
                className='p-3 cursor-pointer rounded-md transition-all focus:bg-slate-50 hover:bg-slate-50'>
                <Link
                  href='/dokumen/sop-perikanan'
                  className='flex items-start gap-4'>
                  <div className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600'>
                    <FileText className='size-5' />
                  </div>
                  <div>
                    <h4 className='text-sm font-semibold text-slate-900'>
                      SOP Lab. Perikanan
                    </h4>
                    <p className='text-sm text-slate-500 mt-1'>
                      Standar operasional, tata tertib, dan prosedur alat lab.
                    </p>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                asChild
                className='p-3 cursor-pointer rounded-md transition-all focus:bg-slate-50 hover:bg-slate-50'>
                <Link
                  href='/dokumen/sop-tangkap'
                  className='flex items-start gap-4'>
                  <div className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600'>
                    <Anchor className='size-5' />
                  </div>
                  <div>
                    <h4 className='text-sm font-semibold text-slate-900'>
                      SOP Lab. Perikanan Tangkap
                    </h4>
                    <p className='text-sm text-slate-500 mt-1'>
                      Prosedur ruangan radar, briefing, dan gudang.
                    </p>
                  </div>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {navLinks.slice(1).map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className='text-sm font-medium text-slate-800 transition-colors hover:text-blue-600'>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA & Login/Logout Logic */}
        <div className='hidden md:block'>
          {session && userRole ? (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button className='bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg flex items-center gap-2 max-w-[200px]'>
                  <span className='truncate'>
                    Halo, {getDisplayName().split(' ')[0]}
                  </span>
                  <ChevronDown className='size-4 shrink-0' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-64 p-2'>
                <div className='px-2 py-3 bg-slate-50 rounded-lg mb-2'>
                  <p className='text-sm font-bold text-slate-800 truncate'>
                    {getDisplayName()}
                  </p>
                  <p className='text-xs text-slate-500 font-medium truncate'>
                    {session.user?.email}
                  </p>
                </div>

                <div className='mb-1 px-2 mt-2'>
                  <p className='text-[10px] font-bold text-slate-400 uppercase tracking-wider'>
                    Ruang Kerja Anda
                  </p>
                </div>

                {/* Dashboard Lab (Khusus Admin Lab) */}
                {userRole === 'admin_lab' &&
                  adminProfiles.map((profile) => (
                    <DropdownMenuItem
                      key={profile.lab_id}
                      asChild
                      className='cursor-pointer py-2.5 rounded-md'>
                      <Link href={`/admin/dashboard?lab_id=${profile.lab_id}`}>
                        <Building2 className='size-4 mr-2 text-slate-400' />
                        <span className='truncate'>
                          Dashboard{' '}
                          {labMap[profile.lab_id] || `Lab ${profile.lab_id}`}
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  ))}

                {/* Upload Materi (Untuk SEMUA Dosen & Admin) */}

                {userRole === 'dosen' && (
                  <DropdownMenuItem
                    asChild
                    className='cursor-pointer py-2.5 rounded-md font-semibold text-blue-700 focus:text-blue-800 focus:bg-blue-50'>
                    <Link href={`/dosen/materi`}>
                      <LockKeyhole className='size-4 mr-2' /> Akses Materi
                      Kuliah
                    </Link>
                  </DropdownMenuItem>
                )}

                <div className='border-t mt-2 pt-2'>
                  <DropdownMenuItem
                    className='cursor-pointer py-2.5 text-red-600 focus:text-red-700 focus:bg-red-50 rounded-md font-medium'
                    onClick={handleLogout}>
                    <LogOut className='size-4 mr-2' /> Keluar Sistem
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={handleLogin}
              className='bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'>
              Masuk Sebagai Dosen
            </Button>
          )}
        </div>

        {/* Mobile Menu */}
        <div className='flex md:hidden'>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant='ghost' size='icon' className='text-slate-800'>
                <Menu className='size-6' />
              </Button>
            </SheetTrigger>
            <SheetContent
              side='right'
              className='w-[85vw] sm:w-96 flex flex-col p-0'>
              <div className='p-6 pb-2 border-b border-slate-100'>
                <SheetTitle className='text-left text-xl font-bold text-slate-800'>
                  Menu Navigasi
                </SheetTitle>
              </div>

              {/* Bagian Navigasi Utama (Scrollable) */}
              <div className='flex-1 overflow-y-auto p-4'>
                <div className='flex flex-col gap-1'>
                  <Accordion type='single' collapsible className='w-full'>
                    <AccordionItem value='profil' className='border-b-0'>
                      <AccordionTrigger className='py-4 px-3 rounded-xl text-base font-bold text-slate-800 hover:no-underline hover:bg-slate-50 transition-colors'>
                        Profil
                      </AccordionTrigger>
                      <AccordionContent className='flex flex-col gap-1 pb-4 pt-1 pl-4'>
                        <Link
                          href='/organisasi'
                          onClick={() => setIsOpen(false)}
                          className='flex items-center gap-3 py-3 px-4 rounded-xl text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-all font-medium'>
                          <Users className='size-5 text-blue-500' />
                          Struktur Organisasi
                        </Link>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value='administrasi' className='border-b-0'>
                      <AccordionTrigger className='py-4 px-3 rounded-xl text-base font-bold text-slate-800 hover:no-underline hover:bg-slate-50 transition-colors'>
                        Administrasi
                      </AccordionTrigger>
                      <AccordionContent className='flex flex-col gap-1 pb-4 pt-1 pl-4'>
                        <Link
                          href='/administrasi/pengajuan'
                          onClick={() => setIsOpen(false)}
                          className='flex items-center gap-3 py-3 px-4 rounded-xl text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-all font-medium'>
                          <ClipboardEdit className='size-5 text-blue-500' />
                          Formulir Pengajuan
                        </Link>
                        <Link
                          href='/administrasi/status'
                          onClick={() => setIsOpen(false)}
                          className='flex items-center gap-3 py-3 px-4 rounded-xl text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-all font-medium'>
                          <SearchCheck className='size-5 text-blue-500' />
                          Cek Status & Riwayat
                        </Link>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value='dokumen' className='border-b-0'>
                      <AccordionTrigger className='py-4 px-3 rounded-xl text-base font-bold text-slate-800 hover:no-underline hover:bg-slate-50 transition-colors'>
                        Dokumen
                      </AccordionTrigger>
                      <AccordionContent className='flex flex-col gap-1 pb-4 pt-1 pl-4'>
                        <Link
                          href='/dokumen/sop-perikanan'
                          onClick={() => setIsOpen(false)}
                          className='flex items-center gap-3 py-3 px-4 rounded-xl text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-all font-medium'>
                          <FileText className='size-5 text-blue-500' />
                          SOP Lab. Perikanan
                        </Link>
                        <Link
                          href='/dokumen/sop-tangkap'
                          onClick={() => setIsOpen(false)}
                          className='flex items-center gap-3 py-3 px-4 rounded-xl text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-all font-medium'>
                          <Anchor className='size-5 text-blue-500' />
                          SOP Lab. Tangkap
                        </Link>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  <Link
                    href='/inventaris'
                    onClick={() => setIsOpen(false)}
                    className='block py-4 px-3 rounded-xl text-base font-bold text-slate-800 hover:text-blue-700 hover:bg-slate-50 transition-colors'>
                    Inventaris
                  </Link>
                  <Link
                    href='/jadwal'
                    onClick={() => setIsOpen(false)}
                    className='block py-4 px-3 rounded-xl text-base font-bold text-slate-800 hover:text-blue-700 hover:bg-slate-50 transition-colors'>
                    Jadwal Tersedia
                  </Link>
                </div>
              </div>

              {/* AREA USER BERLATAR AKSEN BIRU */}
              <div className='p-4 bg-slate-50 border-t border-slate-200 mt-auto'>
                {session && userRole ? (
                  <div className='bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-5 shadow-lg shadow-blue-900/20'>
                    {/* Info Profil */}
                    <div className='flex items-center gap-3 mb-5 pb-5 border-b border-blue-400/30'>
                      <div className='size-12 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0'>
                        {getDisplayName().charAt(0).toUpperCase()}
                      </div>
                      <div className='overflow-hidden'>
                        <p className='text-base font-bold text-white truncate'>
                          {getDisplayName()}
                        </p>
                        <p className='text-xs text-blue-200 font-medium truncate'>
                          {session.user?.email}
                        </p>
                      </div>
                    </div>

                    <div className='space-y-2.5'>
                      <p className='text-[10px] font-bold text-blue-300 uppercase tracking-wider'>
                        Ruang Kerja Anda
                      </p>

                      {/* Menu Dashboard (Khusus Admin Lab) */}
                      {userRole === 'admin_lab' &&
                        adminProfiles.map((profile) => (
                          <Button
                            key={profile.lab_id}
                            asChild
                            variant='secondary'
                            className='w-full justify-start text-left h-auto py-3 bg-white hover:bg-blue-50 text-blue-700 font-semibold border-none shadow-sm'>
                            <Link
                              href={`/admin/dashboard?lab_id=${profile.lab_id}`}
                              onClick={() => setIsOpen(false)}>
                              <Building2 className='size-4 mr-2 text-blue-500' />
                              <span className='truncate'>
                                Dashboard{' '}
                                {labMap[profile.lab_id]?.split(' ')[1] ||
                                  `Lab ${profile.lab_id}`}
                              </span>
                            </Link>
                          </Button>
                        ))}

                      {/* Menu Upload Materi (Semua Dosen & Admin) */}

                      {userRole === 'dosen' && (
                        <Button
                          asChild
                          variant='secondary'
                          className='w-full justify-start text-left h-auto py-3 bg-white hover:bg-blue-50 text-blue-700 font-semibold border-none shadow-sm'>
                          <Link
                            href={`/dosen/materi`}
                            onClick={() => setIsOpen(false)}>
                            <LockKeyhole className='size-4 mr-2 text-blue-500' />
                            Akses Materi Kuliah
                          </Link>
                        </Button>
                      )}
                    </div>

                    {/* Tombol Keluar */}
                    <Button
                      variant='ghost'
                      className='w-full justify-center gap-2 text-red-100 hover:text-white hover:bg-red-500/80 bg-red-500/20 mt-6 transition-colors'
                      onClick={() => {
                        handleLogout();
                        setIsOpen(false);
                      }}>
                      <LogOut className='size-4' />
                      Keluar dari Sistem
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleLogin}
                    className='w-full bg-blue-600 text-white hover:bg-blue-700 py-6 font-bold rounded-xl shadow-md'>
                    Masuk Sebagai Dosen
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
