'use client';

import Link from 'next/link';
import { ArrowLeft, FileText, Download, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Daftar SOP berdasarkan gambar
// Pastikan href sesuai dengan nama file di dalam folder public/dokumen/ kamu
const sopList = [
  {
    id: 1,
    title: 'SOP Pemeliharaan dan Perbaikan Alat-Alat Laboratorium Perikanan',
    size: 'PDF Document',
    href: '/dokumen/SOP Pemeliharaan dan Perbaikan Alat-Alat Laboratorium Perikanan.pdf',
  },
  {
    id: 2,
    title: 'SOP Peminjaman Alat dan Penggunaan Bahan untuk Penelitian',
    size: 'PDF Document',
    href: '/dokumen/SOP Pemeliharaan dan Perbaikan Alat-Alat Laboratorium Perikanan.pdf',
  },
  {
    id: 3,
    title: 'SOP Penanganan Limbah Laboratorium Perikanan',
    size: 'PDF Document',
    href: '/dokumen/SOP Penanganan Limbah Laboratorium Perikanan .pdf',
  },
  {
    id: 4,
    title: 'STANDAR OPERASIONAL PROSEDUR (Umum)',
    size: 'PDF Document',
    href: '/dokumen/STANDAR OPERASIONAL PROSEDUR OK.pdf',
  },
];

export default function SOPPerikananPage() {
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
            <div className='p-3 bg-cyan-100 text-cyan-700 rounded-xl'>
              <Droplets className='size-8' />
            </div>
            <h1 className='text-3xl md:text-4xl font-bold text-slate-900'>
              SOP Lab. Perikanan
            </h1>
          </div>
          <p className='text-slate-600 md:text-lg max-w-3xl mt-4'>
            Kumpulan dokumen Standar Operasional Prosedur (SOP) yang mengatur
            tata tertib, pemeliharaan alat, penanganan limbah, dan penggunaan
            fasilitas di Laboratorium Perikanan.
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mt-8'>
          {sopList.map((sop) => (
            <div
              key={sop.id}
              className='bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-cyan-300 transition-all flex items-start gap-4 group'>
              <div className='p-3 bg-red-50 text-red-500 rounded-lg shrink-0 group-hover:bg-red-100 transition-colors'>
                <FileText className='size-6' />
              </div>
              <div className='flex-1'>
                <h3 className='font-bold text-slate-800 leading-tight mb-2 group-hover:text-cyan-700 transition-colors'>
                  {sop.title}
                </h3>
                <p className='text-xs font-medium text-slate-400 mb-4'>
                  {sop.size}
                </p>
                <div className='flex gap-2'>
                  <Button
                    asChild
                    variant='outline'
                    size='sm'
                    className='h-8 text-xs font-semibold hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-200'>
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
                    className='h-8 w-8 p-0 text-slate-400 hover:text-cyan-600'>
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
