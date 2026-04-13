'use client';

import Link from 'next/link';
import { ArrowLeft, FileText, Download, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

const sopList = [
  {
    id: 1,
    title: 'SOP Manajemen Laboratorium',
    size: '324 KB',
    href: '/dokumen/SOP MANAJEMEN LABORATORIUM.pdf',
  },
  {
    id: 2,
    title: 'SOP Pengelolaan Limbah',
    size: '325 KB',
    href: '/dokumen/SOP PENGELOLAAN LIMBAH.pdf',
  },
  {
    id: 3,
    title: 'SOP Penggunaan Lab untuk Praktikum',
    size: '337 KB',
    href: '/dokumen/SOP PENGGUNAAN LAB UNTUK PRAKTIKUM.pdf',
  },
  {
    id: 4,
    title: 'SOP Penggunaan Lab untuk Penelitian',
    size: '338 KB',
    href: '/dokumen/SOP PENGGUNAAN LAB UNTUK PENELITIAN.pdf',
  },
  {
    id: 5,
    title: 'SOP Pengusulan Pengadaan Alat & Bahan',
    size: '297 KB',
    href: '/dokumen/SOP PENGUSULAN PENGADAAN ALAT DAN BAHAN LABORATORIUM.pdf',
  },
  {
    id: 6,
    title: 'SOP Pemeliharaan, Perbaikan & Kalibrasi Alat',
    size: '280 KB',
    href: '/dokumen/SOP PEMELIHARAAN, PERBAIKAN, DAN KALIBRASI ALAT.pdf',
  },
  {
    id: 7,
    title: 'SOP Evaluasi Kepuasan Pengguna',
    size: '323 KB',
    href: '/dokumen/SOP EVALUASI KEPUASAN PENGGUNA.pdf',
  },
  {
    id: 8,
    title: 'SOP Jadwal Pemeliharaan dan Perawatan',
    size: '314 KB',
    href: '/dokumen/SOP JADWAL PEMELIHARAAN DAN PERAWATAN.pdf',
  },
  {
    id: 9,
    title: 'SOP Peminjaman dan Pengembalian Alat',
    size: '310 KB',
    href: '/dokumen/SOP Peminjaman dan Pengembalian alat.pdf',
  },
];

export default function SOPTangkapPage() {
  return (
    <div className='min-h-screen bg-slate-50 pt-24 pb-12 px-4 md:px-8'>
      <div className='max-w-5xl mx-auto'>
        <div className='mb-8'>
          <Link
            href='/'
            className='inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 font-medium transition-colors'>
            <ArrowLeft size={18} /> Kembali ke Beranda
          </Link>

          <div className='flex items-center gap-3 mb-2'>
            <div className='p-3 bg-blue-100 text-blue-700 rounded-xl'>
              <ShieldCheck className='size-8' />
            </div>
            <h1 className='text-3xl md:text-4xl font-bold text-slate-900'>
              SOP Lab. Perikanan Tangkap
            </h1>
          </div>
          <p className='text-slate-600 md:text-lg max-w-3xl mt-4'>
            Kumpulan dokumen Standar Operasional Prosedur (SOP) untuk memastikan
            keamanan, ketertiban, dan kelancaran kegiatan di lingkungan
            Laboratorium Perikanan Tangkap.
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mt-8'>
          {sopList.map((sop) => (
            <div
              key={sop.id}
              className='bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex items-start gap-4 group'>
              <div className='p-3 bg-red-50 text-red-500 rounded-lg shrink-0 group-hover:bg-red-100 transition-colors'>
                <FileText className='size-6' />
              </div>
              <div className='flex-1'>
                <h3 className='font-bold text-slate-800 leading-tight mb-1 group-hover:text-blue-700 transition-colors'>
                  {sop.title}
                </h3>
                <p className='text-xs font-medium text-slate-400 mb-4'>
                  PDF Document • {sop.size}
                </p>
                <div className='flex gap-2'>
                  <Button
                    asChild
                    variant='outline'
                    size='sm'
                    className='h-8 text-xs font-semibold hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'>
                    <Link
                      href={sop.href}
                      target='_blank'
                      rel='noopener noreferrer'>
                      Buka Dokumen
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant='ghost'
                    size='sm'
                    className='h-8 w-8 p-0 text-slate-400 hover:text-blue-600'>
                    {/* Atribut download akan memaksa browser mengunduh file */}
                    <a href={sop.href} download>
                      <Download className='size-4' />
                      <span className='sr-only'>Download</span>
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
