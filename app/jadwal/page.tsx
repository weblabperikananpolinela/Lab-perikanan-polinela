'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  CalendarDays,
  Download,
  Info,
  ArrowLeft,
  Maximize2,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle, // <-- Ditambahkan untuk mengatasi Error Console
} from '@/components/ui/dialog';

export default function JadwalPage() {
  return (
    <div className='min-h-screen bg-slate-50 pt-24 pb-20 px-4 md:px-8'>
      <div className='mx-auto max-w-6xl'>
        {/* Tombol Kembali & Header Section */}
        <div className='mb-12'>
          <Link
            href='/'
            className='inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 font-medium transition-colors'>
            <ArrowLeft size={18} /> Kembali ke Beranda
          </Link>

          <div className='text-center'>
            <h1 className='text-3xl font-extrabold text-slate-900 sm:text-4xl tracking-tight flex items-center justify-center gap-3'>
              <CalendarDays className='size-8 text-blue-600' />
              Jadwal Laboratorium
            </h1>
            <div className='mt-4 w-24 h-1.5 bg-blue-600 mx-auto rounded-full' />
            <p className='mx-auto mt-4 max-w-2xl text-slate-600 text-lg'>
              Jadwal rutin penggunaan ruang laboratorium untuk kegiatan
              praktikum perkuliahan semester aktif.
            </p>
          </div>
        </div>

        {/* Notifikasi / Helper Text */}
        <div className='max-w-3xl mx-auto mb-8 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 shadow-sm'>
          <Info className='size-5 text-blue-600 shrink-0 mt-0.5' />
          <p className='text-sm md:text-base text-blue-800 leading-relaxed'>
            <strong className='font-bold'>Perhatian:</strong> Jika Anda
            berencana meminjam alat atau ruangan untuk penelitian mandiri,
            pastikan waktu yang Anda pilih
            <span className='text-red-600 font-bold'>
              {' '}
              tidak berbenturan
            </span>{' '}
            dengan jadwal praktikum reguler di bawah ini.
          </p>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue='perikanan' className='w-full max-w-5xl mx-auto'>
          <TabsList className='h-auto w-full grid grid-cols-2 p-1.5 bg-slate-200/60 rounded-xl mb-6'>
            <TabsTrigger
              value='perikanan'
              className='rounded-lg text-sm md:text-base font-bold data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-md transition-all duration-300 py-3'>
              Lab. Perikanan
            </TabsTrigger>
            <TabsTrigger
              value='tangkap'
              className='rounded-lg text-sm md:text-base font-bold data-[state=active]:bg-white data-[state=active]:text-cyan-700 data-[state=active]:shadow-md transition-all duration-300 py-3'>
              Lab. Tangkap
            </TabsTrigger>
          </TabsList>

          {/* Konten Tab Lab Perikanan */}
          <TabsContent
            value='perikanan'
            className='mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500'>
            <Card className='border-0 shadow-xl shadow-slate-200 overflow-hidden bg-white'>
              <div className='p-4 border-b border-slate-100 flex items-center justify-between bg-white'>
                <h3 className='text-slate-800 font-bold text-base md:text-lg truncate mr-2'>
                  Jadwal Praktikum Lab. Perikanan
                </h3>

                {/* Tombol Aksi - Responsif HP = Ikon, PC = Ikon + Teks */}
                <div className='flex gap-2 shrink-0'>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant='outline'
                        size='sm'
                        className='text-slate-600 border-slate-200 hover:bg-slate-50 px-2.5 md:px-3'>
                        <Maximize2 className='size-4 md:mr-2' />
                        <span className='hidden md:inline'>Fullscreen</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[95vw] h-[90vh] p-0 border-none bg-transparent shadow-none [&>button]:bg-white [&>button]:text-red-600 [&>button]:opacity-100 [&>button]:p-2 [&>button]:rounded-full [&>button]:shadow-xl hover:[&>button]:bg-slate-100 [&>button]:right-4 [&>button]:top-4 md:[&>button]:right-6 md:[&>button]:top-6">
                      {/* Judul tersembunyi ini yang akan menghilangkan Error dari Radix UI */}
                      <DialogTitle className='sr-only'>
                        Tampilan Penuh Jadwal Lab Perikanan
                      </DialogTitle>

                      <div className='relative w-full h-full flex items-center justify-center bg-black/90 rounded-lg overflow-hidden'>
                        <Image
                          src='/jadwal/jadwal-perikanan.jpg'
                          alt='Fullscreen Jadwal Lab Perikanan'
                          fill
                          className='object-contain'
                        />
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant='outline'
                    size='sm'
                    asChild
                    className='text-blue-600 border-blue-200 hover:bg-blue-50 px-2.5 md:px-3'>
                    <a href='/jadwal/jadwal-perikanan.jpg' download>
                      <Download className='size-4 md:mr-2' />
                      <span className='hidden md:inline'>Unduh</span>
                    </a>
                  </Button>
                </div>
              </div>

              <CardContent className='p-0'>
                <div className='relative w-full aspect-[4/3] md:aspect-[16/9] bg-slate-100 flex items-center justify-center overflow-hidden'>
                  <Image
                    src='/jadwal/jadwal-perikanan.jpg'
                    alt='Jadwal Praktikum Lab Perikanan'
                    fill
                    className='object-contain p-2 md:p-4'
                    priority
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Konten Tab Lab Perikanan Tangkap */}
          <TabsContent
            value='tangkap'
            className='mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500'>
            <Card className='border-0 shadow-xl shadow-slate-200 overflow-hidden bg-white'>
              <div className='p-4 border-b border-slate-100 flex items-center justify-between bg-white'>
                <h3 className='text-slate-800 font-bold text-base md:text-lg truncate mr-2'>
                  Jadwal Praktikum Lab. Tangkap
                </h3>

                {/* Tombol Aksi - Responsif HP = Ikon, PC = Ikon + Teks */}
                <div className='flex gap-2 shrink-0'>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant='outline'
                        size='sm'
                        className='text-slate-600 border-slate-200 hover:bg-slate-50 px-2.5 md:px-3'>
                        <Maximize2 className='size-4 md:mr-2' />
                        <span className='hidden md:inline'>Fullscreen</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[95vw] h-[90vh] p-0 border-none bg-transparent shadow-none [&>button]:bg-white [&>button]:text-red-600 [&>button]:opacity-100 [&>button]:p-2 [&>button]:rounded-full [&>button]:shadow-xl hover:[&>button]:bg-slate-100 [&>button]:right-4 [&>button]:top-4 md:[&>button]:right-6 md:[&>button]:top-6">
                      {/* Judul tersembunyi ini yang akan menghilangkan Error dari Radix UI */}
                      <DialogTitle className='sr-only'>
                        Tampilan Penuh Jadwal Lab Tangkap
                      </DialogTitle>

                      <div className='relative w-full h-full flex items-center justify-center bg-black/90 rounded-lg overflow-hidden'>
                        <Image
                          src='/jadwal/jadwal-tangkap.jpg'
                          alt='Fullscreen Jadwal Lab Perikanan Tangkap'
                          fill
                          className='object-contain'
                        />
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant='outline'
                    size='sm'
                    asChild
                    className='text-cyan-600 border-cyan-200 hover:bg-cyan-50 px-2.5 md:px-3'>
                    <a href='/jadwal/jadwal-tangkap.jpg' download>
                      <Download className='size-4 md:mr-2' />
                      <span className='hidden md:inline'>Unduh</span>
                    </a>
                  </Button>
                </div>
              </div>
              <CardContent className='p-0'>
                <div className='relative w-full aspect-[4/3] md:aspect-[16/9] bg-slate-100 flex items-center justify-center overflow-hidden'>
                  <Image
                    src='/jadwal/jadwal-tangkap.jpg'
                    alt='Jadwal Praktikum Lab Perikanan Tangkap'
                    fill
                    className='object-contain p-2 md:p-4'
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
