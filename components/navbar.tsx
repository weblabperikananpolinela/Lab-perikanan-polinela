'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import {
  Menu,
  ChevronDown,
  BookOpen,
  FileText,
  Anchor,
  ClipboardEdit,
  SearchCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
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
  { label: 'Jadwal', href: '#jadwal' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [adminProfile, setAdminProfile] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    const initSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      if (session) checkWhitelist(session.user?.email);
    };
    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkWhitelist(session.user?.email);
      } else {
        setAdminProfile(null);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkWhitelist = async (email: string | undefined) => {
    if (!email) return;
    const { data: adminData, error } = await supabase
      .from('whitelist_admin')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !adminData) {
      await supabase.auth.signOut();
      alert('Akses Ditolak! Email Anda tidak terdaftar sebagai pengelola Lab.');
      setAdminProfile(null);
    } else {
      setAdminProfile(adminData);
    }
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
    await supabase.auth.signOut();
    setSession(null);
    setAdminProfile(null);
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
                  href='#sop-lab-perikanan'
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
                  href='#sop-lab-perikanan-tangkap'
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

        {/* Desktop CTA */}
        <div className='hidden md:block'>
          {session && adminProfile ? (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button className='bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg flex items-center gap-2'>
                  Halo, {adminProfile.nama_dosen || session.user?.email}
                  <ChevronDown className='size-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-56'>
                <div className='px-2 py-2 border-b mb-1'>
                  <p className='text-sm font-semibold text-slate-800'>
                    {adminProfile.nama_dosen}
                  </p>
                  <p className='text-xs text-slate-500'>
                    {adminProfile.role || 'Admin'}
                  </p>
                </div>
                <DropdownMenuItem asChild className='cursor-pointer py-2'>
                  <Link href='/admin/dashboard'>Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className='cursor-pointer py-2 text-red-600 focus:text-red-700 focus:bg-red-50'
                  onClick={handleLogout}>
                  Keluar
                </DropdownMenuItem>
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
                <span className='sr-only'>Buka menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side='right' className='w-80'>
              <SheetHeader>
                <SheetTitle className='text-left text-slate-800'>
                  Lab Perikanan Polinela
                </SheetTitle>
                <SheetDescription className='sr-only'>
                  Menu navigasi untuk Laboratorium Perikanan Polinela
                </SheetDescription>
              </SheetHeader>
              <div className='mt-6 flex flex-col px-4 text-left'>
                <Accordion type='single' collapsible className='w-full'>
                  <AccordionItem value='administrasi' className='border-b-0'>
                    <AccordionTrigger className='py-3 text-base font-medium text-slate-800 hover:no-underline hover:text-blue-600'>
                      Administrasi
                    </AccordionTrigger>
                    <AccordionContent className='flex flex-col gap-4 pb-4 pt-1 pl-4'>
                      <Link
                        href='/administrasi/pengajuan'
                        onClick={() => setIsOpen(false)}
                        className='text-sm font-medium text-slate-600 transition-colors hover:text-blue-600'>
                        Formulir Pengajuan
                      </Link>
                      <Link
                        href='/administrasi/status'
                        onClick={() => setIsOpen(false)}
                        className='text-sm font-medium text-slate-600 transition-colors hover:text-blue-600'>
                        Cek Status & Riwayat
                      </Link>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value='dokumen' className='border-b-0'>
                    <AccordionTrigger className='py-3 text-base font-medium text-slate-800 hover:no-underline hover:text-blue-600'>
                      Dokumen
                    </AccordionTrigger>
                    <AccordionContent className='flex flex-col gap-4 pb-4 pt-1 pl-4'>
                      <Link
                        href='#materi'
                        onClick={() => setIsOpen(false)}
                        className='text-sm font-medium text-slate-600 transition-colors hover:text-blue-600'>
                        Materi
                      </Link>
                      <div className='flex flex-col gap-3'>
                        <span className='text-sm font-medium text-slate-800'>
                          Prosedur dan SOP
                        </span>
                        <Link
                          href='#sop-lab-perikanan'
                          onClick={() => setIsOpen(false)}
                          className='text-sm text-slate-500 transition-colors hover:text-blue-600 pl-4'>
                          - Lab. Perikanan
                        </Link>
                        <Link
                          href='#sop-lab-perikanan-tangkap'
                          onClick={() => setIsOpen(false)}
                          className='text-sm text-slate-500 transition-colors hover:text-blue-600 pl-4'>
                          - Lab. Perikanan Tangkap
                        </Link>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <div className='flex flex-col gap-6 py-4'>
                  <Link
                    href='/inventaris'
                    onClick={() => setIsOpen(false)}
                    className='text-base font-medium text-slate-800 transition-colors hover:text-blue-600'>
                    Inventaris
                  </Link>
                  <Link
                    href='#jadwal'
                    onClick={() => setIsOpen(false)}
                    className='text-base font-medium text-slate-800 transition-colors hover:text-blue-600'>
                    Jadwal
                  </Link>
                </div>

                {session && adminProfile ? (
                  <div className='mt-8 flex flex-col gap-2'>
                    <div className='px-4 py-3 bg-slate-50 rounded-lg border border-slate-100'>
                      <p className='text-sm font-semibold text-slate-800'>
                        {adminProfile.nama_dosen || session.user?.email}
                      </p>
                      <p className='text-xs text-slate-500'>
                        {adminProfile.role || 'Admin'}
                      </p>
                    </div>
                    <Button
                      asChild
                      variant='outline'
                      className='w-full justify-start mt-2'>
                      <Link
                        href='/admin/dashboard'
                        onClick={() => setIsOpen(false)}>
                        Buka Dashboard
                      </Link>
                    </Button>
                    <Button
                      variant='ghost'
                      className='w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50'
                      onClick={() => {
                        handleLogout();
                        setIsOpen(false);
                      }}>
                      Keluar
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleLogin}
                    className='mt-8 w-full bg-blue-600 text-white hover:bg-blue-700'>
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
