'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const galleryImages = [
  {
    id: 1,
    src: '/dokumentasi/foto-1.jpg',
    kegiatan: 'Praktikum Budidaya Ikan',
    lab: 'Lab. Pembenihan',
    span: 'col-span-2 md:col-span-2 row-span-2',
  },
  {
    id: 2,
    src: '/dokumentasi/foto-2.jpg',
    kegiatan: 'Penelitian Kualitas Air',
    lab: 'Lab. Kualitas Air',
    span: 'col-span-2 md:col-span-2 row-span-1',
  },
  {
    id: 3,
    src: '/dokumentasi/foto-3.jpg',
    kegiatan: 'Pemijahan Buatan',
    lab: 'Lab. Ikan Hias',
    span: 'col-span-1 md:col-span-1 row-span-1',
  },
  {
    id: 4,
    src: '/dokumentasi/foto-4.jpg',
    kegiatan: 'Kunjungan Industri Mahasiswa',
    lab: 'FISHTECH',
    span: 'col-span-1 md:col-span-1 row-span-1',
  },
  {
    id: 5,
    src: '/dokumentasi/foto-5.jpg',
    kegiatan: 'Workshop Teknologi Perikanan',
    lab: 'Lab Simulator',
    span: 'col-span-2 md:col-span-2 row-span-1',
  },
  {
    id: 6,
    src: '/dokumentasi/foto-6.jpg',
    kegiatan: 'Panen Hasil Tambak',
    lab: 'KJA (Keramba Jaring Apung)',
    span: 'col-span-2 md:col-span-2 row-span-2',
  },
  {
    id: 7,
    src: '/dokumentasi/foto-7.jpg',
    kegiatan: 'Pengujian Mutu Pakan',
    lab: 'Lab. Nutrisi',
    span: 'col-span-2 md:col-span-2 row-span-1',
  },
];

export function DokumentasiSection() {
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});

  return (
    <section className='bg-slate-50 py-20 lg:py-28'>
      <div className='mx-auto max-w-6xl px-4 lg:px-8'>
        <h2 className='text-center text-3xl font-bold text-slate-800 sm:text-4xl'>
          Dokumentasi Kegiatan
        </h2>
        <p className='mx-auto mt-4 max-w-2xl text-center text-slate-600'>
          Berbagai kegiatan laboratorium, penelitian, dan praktikum yang telah
          dilaksanakan
        </p>

        <div className='mt-12 grid auto-rows-[180px] grid-cols-2 gap-4 sm:auto-rows-[200px] md:grid-cols-4'>
          {galleryImages.map((image) => (
            <div
              key={image.id}
              className={cn(
                'group relative overflow-hidden rounded-xl bg-slate-200',
                image.span,
              )}>
              <Image
                src={image.src}
                alt={image.kegiatan}
                fill
                className={cn(
                  'object-cover transition-all duration-700 group-hover:scale-110',
                  loadedImages[image.id] ? 'opacity-100' : 'opacity-0',
                )}
                onLoad={() =>
                  setLoadedImages((prev) => ({ ...prev, [image.id]: true }))
                }
              />
              {/* Fallback/Loading state */}
              <div
                className={cn(
                  'absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 transition-opacity duration-300',
                  loadedImages[image.id]
                    ? 'opacity-0 pointer-events-none'
                    : 'opacity-100',
                )}>
                <span className='text-sm text-blue-600 px-4 text-center font-medium'>
                  {image.kegiatan}
                </span>
              </div>

              {/* Hover overlay dengan info Kegiatan & Lab */}
              <div className='absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-end p-5 md:p-6'>
                <div className='translate-y-4 transition-transform duration-500 ease-out group-hover:translate-y-0'>
                  <h3 className='text-lg md:text-xl font-bold text-white drop-shadow-md leading-snug'>
                    {image.kegiatan}
                  </h3>
                  <div className='flex items-center gap-2 mt-2'>
                    <span className='inline-flex items-center justify-center rounded-full bg-blue-600/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm border border-blue-400/30'>
                      {image.lab}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
