'use client';

import { Button } from '@/components/ui/button';
import { Calendar, ClipboardList } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link'; // <-- Tambahkan import ini
import { useEffect, useState } from 'react';

const heroImages = [
  '/hero-lab-1.jpg',
  '/hero-lab-2.jpg',
  '/hero-lab-3.jpg',
  '/hero-lab-4.jpg',
];

export function HeroSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className='relative flex min-h-screen items-center justify-center overflow-hidden'>
      {/* Background Image Carousel */}
      {heroImages.map((src, index) => (
        <div
          key={src}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}>
          <Image
            src={src}
            alt={`Laboratory background ${index + 1}`}
            fill
            className='object-cover'
            priority={index === 0}
            loading='eager'
          />
        </div>
      ))}

      {/* Dark Semi-Transparent Overlay */}
      <div className='absolute inset-0 bg-black/60' />

      {/* Static Content */}
      <div className='relative z-10 mx-auto max-w-4xl px-4 text-center'>
        <h1 className='text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl'>
          Digital Operational Laboratory for Harmonized Integrated Navigation
        </h1>
        <p className='mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-white/90 sm:text-xl'>
          Fasilitas pendidikan dan penelitian terdepan di bidang perikanan.
          Mendukung pengembangan ilmu pengetahuan dan teknologi akuakultur untuk
          masa depan yang berkelanjutan.
        </p>

        <div className='mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row'>
          {/* Tombol Ajukan Peminjaman yang sudah diubah menjadi Link */}
          <Button
            asChild
            size='lg'
            className='w-full gap-2 bg-blue-600 text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl sm:w-auto'>
            <Link href='/administrasi/pengajuan'>
              <ClipboardList className='size-5' />
              Ajukan Peminjaman Alat & Ruangan
            </Link>
          </Button>

          <Button
          asChild
            size='lg'
            variant='outline'
            className='w-full gap-2 border-white bg-transparent text-white transition-all hover:bg-white hover:text-slate-800 sm:w-auto'>
            <Link href='/jadwal'>
              <Calendar className='size-5' />
              Lihat Jadwal Tersedia
            </Link>
          </Button>
        </div>

        {/* Carousel Indicators */}
        <div className='mt-12 flex justify-center gap-2'>
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`size-2.5 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-8 bg-white'
                  : 'bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
