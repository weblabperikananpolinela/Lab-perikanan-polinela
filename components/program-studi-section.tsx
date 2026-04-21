'use client';

import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const programs = [
  {
    id: 1,
    title: 'D3 Budidaya Perikanan',
    description:
      'Program ini memanfaatkan laboratorium budidaya dan teaching factory sebagai sarana utama dalam pembelajaran berbasis praktik. Mahasiswa dibekali kompetensi mengelola ekosistem air secara menyeluruh, mulai dari pemahaman kimia air hingga manajemen nutrisi pakan. Mereka ditempa dengan ketelitian tinggi dalam monitoring, ketahanan fisik di lapangan, serta manajemen waktu yang presisi sesuai siklus hidup biota. Lulusan dipersiapkan mengisi posisi strategis seperti Supervisor Tambak dan Manajer Operasional Produksi, atau tampil mandiri sebagai pengusaha budidaya yang sukses.',
    quote:
      "Dunia butuh lebih banyak 'koki ekosistem' yang mampu memberi makan ribuan orang dari satu pengelolaan kolam yang sempurna. Ayo!!! Jadi juragan muda yang visioner.",
    logo: '/placeholder-logo.png', // Ganti dengan path logo prodi asli
    image: '/gallery-3.jpg',
    kaprodi: {
      name: 'Kaprodi D3 Budidaya Perikanan',
      image: '/placeholder-kaprodi.jpg', // Ganti dengan foto asli kaprodi
    },
  },
  {
    id: 2,
    title: 'S1 Tr. Teknologi Pembenihan Ikan',
    description:
      'Program studi ini mengoptimalkan laboratorium pembenihan dan teaching factory hatchery sebagai pusat kegiatan pembelajaran dan riset. Fokus utamanya mencakup penguasaan teknologi reproduksi melalui induksi hormon, rekayasa genetika ikan, bioteknologi larva, hingga kultur pakan alami. Mahasiswa mengasah pola pikir analitis yang tajam, kesabaran dalam riset, serta standar ketelitian laboratorium yang ketat. Output program ini adalah para Breeding Specialist, Manajer Unit Pembenihan (Hatchery), serta peneliti inovatif yang mampu menciptakan varietas ikan unggul.',
    quote:
      'Masa depan perikanan dimulai dari mikroskop kami. Jika kamu mencintai sains dan ingin merancang kehidupan yang lebih baik sejak dari fase larva, laboratorium pembenihan kami adalah rumahmu!',
    logo: '/placeholder-logo.png',
    image: '/gallery-2.jpg',
    kaprodi: {
      name: 'Rio Yusufi Subhan, S.Pi., M.Si.',
      image: '/placeholder-kaprodi.jpg',
    },
  },
  {
    id: 3,
    title: 'D3 Perikanan Tangkap',
    description:
      'Kegiatan pembelajaran didukung oleh laboratorium navigasi, simulasi penangkapan, serta teaching factory berbasis operasional perikanan tangkap. Mahasiswa dibekali keahlian teknis navigasi elektronik (Radar, Sonar, GPS), hukum laut internasional, teknik pengoperasian alat tangkap selektif, dan manajemen stabilitas kapal. Program ini juga menempa jiwa kepemimpinan di bawah tekanan dan kemampuan mengambil keputusan cepat dalam situasi darurat di laut.',
    quote:
      'Samudera memanggil para pemimpin! Jadilah nahkoda masa depan yang menaklukkan ombak dengan kecerdasan navigasi, bukan sekadar keberuntungan. Siap untuk berlayar lebih jauh?',
    logo: '/placeholder-logo.png',
    image: '/gallery-4.jpg',
    kaprodi: {
      name: 'Fauzi Syahputra, S.Pi., M.Si.',
      image: '/placeholder-kaprodi.jpg',
    },
  },
  {
    id: 4,
    title: 'S1 Tr. Teknologi Akuakultur',
    description:
      'Program ini mengintegrasikan laboratorium sistem budidaya modern dan teaching factory berbasis teknologi seperti RAS dan bioflok dalam proses pembelajaran. Kompetensi utama difokuskan pada perancangan sistem budidaya Recirculating Aquaculture System (RAS), instalasi otomatisasi tambak, dan Analisis Dampak Lingkungan (AMDAL). Mahasiswa dilatih memiliki kemampuan pemecahan masalah kreatif, kecakapan manajerial proyek besar, serta visi keberlanjutan lingkungan yang kuat.',
    quote:
      'Jangan cuma budidaya biasa, mari kita bangun industri yang canggih! Jadilah arsitek akuakultur modern yang mampu membuktikan bahwa industri dan alam bisa hidup berdampingan.',
    logo: '/placeholder-logo.png',
    image: '/gallery-6.jpg',
    kaprodi: {
      name: 'Dr. Nur Indaryanti, S.P., M.Si.',
      image: '/placeholder-kaprodi.jpg',
    },
  },
  {
    id: 5,
    title: 'S1 Tr. Teknologi Cerdas Penangkapan Ikan',
    description:
      'Laboratorium teknologi digital kelautan dan teaching factory berbasis smart fishing menjadi pusat pembelajaran dalam program ini. Mahasiswa mendalami implementasi Internet of Things (IoT) untuk sensor bawah air, pengolahan data citra satelit untuk deteksi lokasi ikan, hingga pemanfaatan Artificial Intelligence (AI) dalam sistem perikanan. Lulusannya siap mengisi peran sebagai Smart Fishing Engineer dan Analis Data Kelautan yang bekerja berbasis data untuk meningkatkan efisiensi hasil laut Indonesia.',
    quote:
      "Bawa teknologi ke tengah laut! Ubah kodingmu menjadi jaring digital dan mari kita hack masa depan perikanan dunia dengan sensor dan data pintarmu. Let's make waves!",
    logo: '/placeholder-logo.png',
    image: '/gallery-1.jpg',
    kaprodi: {
      name: 'Denta Tirtana, S.P., M.Si.',
      image: '/placeholder-kaprodi.jpg',
    },
  },
  {
    id: 6,
    title: 'S1 Tr. Agribisnis Perikanan',
    description:
      'Program studi ini memanfaatkan laboratorium agribisnis dan teaching factory sebagai sarana simulasi dan praktik rantai nilai usaha perikanan. Mahasiswa menguasai strategi pemasaran internasional, manajemen rantai pasok dingin (cold chain management), sertifikasi ekspor, hingga analisis keuangan bisnis perikanan. Mereka diasah untuk memiliki kemampuan negosiasi tajam, komunikasi persuasif, dan entrepreneurial mindset untuk menjadi CEO Startup Perikanan yang siap mendunia.',
    quote:
      'Ikan adalah emas biru. Jika kamu memiliki jiwa bisnis dan ingin menguasai pasar dunia, mari bergabung dan jadilah arsitek ekonomi biru yang sukses. Join the hustle!',
    logo: '/placeholder-logo.png',
    image: '/gallery-5.jpg',
    kaprodi: {
      name: 'Kaprodi S1 Tr. Agribisnis Perikanan',
      image: '/placeholder-kaprodi.jpg',
    },
  },
];

const AUTO_ROTATE_INTERVAL = 8000;

export function ProgramStudiSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % programs.length);
        setIsTransitioning(false);
      }, 300);
    }, AUTO_ROTATE_INTERVAL);
  }, []);

  const handleSelectProgram = useCallback(
    (index: number) => {
      if (index === activeIndex) return;
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveIndex(index);
        setIsTransitioning(false);
      }, 300);
      startTimer();
    },
    [startTimer, activeIndex],
  );

  const handlePrev = useCallback(() => {
    const newIndex = activeIndex === 0 ? programs.length - 1 : activeIndex - 1;
    handleSelectProgram(newIndex);
  }, [activeIndex, handleSelectProgram]);

  const handleNext = useCallback(() => {
    const newIndex = (activeIndex + 1) % programs.length;
    handleSelectProgram(newIndex);
  }, [activeIndex, handleSelectProgram]);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [startTimer]);

  const activeProgram = programs[activeIndex];
  const otherPrograms = programs.filter((_, i) => i !== activeIndex);

  return (
    <section className='bg-secondary py-20 lg:py-28'>
      <div className='mx-auto max-w-6xl px-4 lg:px-8'>
        <div className='text-center mb-12'>
          <h2 className='text-3xl font-extrabold text-slate-900 sm:text-4xl tracking-tight'>
            Program Studi Terkait
          </h2>
          <div className='mt-3 w-24 h-1.5 bg-blue-600 mx-auto rounded-full' />
          <p className='mx-auto mt-4 max-w-2xl text-center text-slate-600 text-lg'>
            Program studi unggulan yang didukung secara penuh oleh fasilitas
            laboratorium perikanan.
          </p>
        </div>

        {/* Mobile Swiper Layout */}
        <div className='relative mt-12 lg:hidden'>
          <Button
            variant='outline'
            size='icon'
            onClick={handlePrev}
            className='absolute -left-2 top-[30%] z-10 size-10 -translate-y-1/2 rounded-full border-slate-300 bg-white/90 shadow-md backdrop-blur-sm hover:bg-white sm:-left-4'>
            <ChevronLeft className='size-5 text-slate-700' />
          </Button>

          <div className='overflow-hidden px-4'>
            <Card
              className={cn(
                'overflow-hidden border-slate-200 shadow-lg transition-opacity duration-300',
                isTransitioning ? 'opacity-0' : 'opacity-100',
              )}>
              <div className='relative h-56 w-full sm:h-64'>
                <Image
                  src={activeProgram.image}
                  alt={activeProgram.title}
                  fill
                  className='object-cover'
                />
                <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent' />
                <div className='absolute bottom-4 left-4 right-4 flex items-center gap-3'>
                  <div className='relative flex size-12 shrink-0 items-center justify-center rounded-xl bg-white p-2 shadow-lg'>
                    <Image
                      src={activeProgram.logo}
                      alt='Logo Prodi'
                      fill
                      className='object-contain p-1'
                    />
                  </div>
                  <h3 className='text-lg font-bold text-white leading-tight sm:text-xl drop-shadow-md'>
                    {activeProgram.title}
                  </h3>
                </div>
              </div>
              <CardContent className='p-5 sm:p-6 flex flex-col gap-5'>
                <p className='text-sm leading-relaxed text-slate-600 text-justify'>
                  {activeProgram.description}
                </p>

                {/* Quote Box */}
                <div className='bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg'>
                  <Quote className='size-5 text-blue-400 mb-2 opacity-50' />
                  <p className='text-sm italic font-medium text-slate-700'>
                    "{activeProgram.quote}"
                  </p>
                </div>

                {/* Kaprodi Section */}
                <div className='mt-2 flex items-center gap-4 border-t border-slate-100 pt-5'>
                  <div className='relative size-12 overflow-hidden rounded-full border-2 border-blue-200 shadow-sm shrink-0'>
                    <Image
                      src={activeProgram.kaprodi.image}
                      alt={activeProgram.kaprodi.name}
                      fill
                      className='object-cover'
                    />
                  </div>
                  <div>
                    <p className='text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-0.5'>
                      Ketua Program Studi
                    </p>
                    <p className='text-sm font-bold text-slate-800 leading-tight'>
                      {activeProgram.kaprodi.name}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Button
            variant='outline'
            size='icon'
            onClick={handleNext}
            className='absolute -right-2 top-[30%] z-10 size-10 -translate-y-1/2 rounded-full border-slate-300 bg-white/90 shadow-md backdrop-blur-sm hover:bg-white sm:-right-4'>
            <ChevronRight className='size-5 text-slate-700' />
          </Button>

          {/* Dot indicators for mobile */}
          <div className='mt-6 flex justify-center gap-2'>
            {programs.map((_, index) => (
              <button
                key={index}
                onClick={() => handleSelectProgram(index)}
                className={cn(
                  'size-2.5 rounded-full transition-all duration-300 shadow-sm',
                  index === activeIndex
                    ? 'w-8 bg-blue-600'
                    : 'bg-slate-300 hover:bg-slate-400',
                )}
                aria-label={`Go to program ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Desktop Grid Layout - 1 Large + 5 Small */}
        <div className='mt-12 hidden gap-6 lg:grid lg:grid-cols-12'>
          {/* Large Active Card - Left Column */}
          <Card
            className={cn(
              'flex flex-col overflow-hidden border-0 shadow-xl transition-opacity duration-300 lg:col-span-7 bg-white',
              isTransitioning ? 'opacity-0' : 'opacity-100',
            )}>
            <div className='relative h-72 w-full shrink-0'>
              <Image
                src={activeProgram.image}
                alt={activeProgram.title}
                fill
                className='object-cover'
              />
              <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent' />
              <div className='absolute bottom-6 left-6 right-6 flex items-center gap-4'>
                <div className='relative flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white shadow-xl'>
                  <Image
                    src={activeProgram.logo}
                    alt='Logo Prodi'
                    fill
                    className='object-contain p-2'
                  />
                </div>
                <h3 className='text-2xl md:text-3xl font-extrabold text-white drop-shadow-md leading-tight'>
                  {activeProgram.title}
                </h3>
              </div>
            </div>

            <CardContent className='p-8 flex flex-col h-full justify-between gap-6'>
              <div className='space-y-6'>
                <p className='text-base leading-relaxed text-slate-600 text-justify'>
                  {activeProgram.description}
                </p>

                {/* Quote Box */}
                <div className='bg-slate-50 border-l-4 border-blue-600 p-5 rounded-r-xl relative'>
                  <Quote className='absolute top-4 right-4 size-10 text-blue-100' />
                  <p className='text-base italic font-semibold text-slate-700 relative z-10 pr-6'>
                    "{activeProgram.quote}"
                  </p>
                </div>
              </div>

              {/* Kaprodi Section */}
              <div className='mt-4 flex items-center gap-4 border-t border-slate-100 pt-6'>
                <div className='relative size-14 overflow-hidden rounded-full border-2 border-blue-200 shadow-sm shrink-0'>
                  <Image
                    src={activeProgram.kaprodi.image}
                    alt={activeProgram.kaprodi.name}
                    fill
                    className='object-cover'
                  />
                </div>
                <div>
                  <p className='text-xs font-bold text-blue-600 uppercase tracking-wider mb-1'>
                    Ketua Program Studi
                  </p>
                  <p className='text-lg font-bold text-slate-800 leading-none'>
                    {activeProgram.kaprodi.name}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Column - 5 Small Cards */}
          <div className='flex flex-col gap-3.5 lg:col-span-5 h-full'>
            {otherPrograms.map((program) => {
              const originalIndex = programs.findIndex(
                (p) => p.id === program.id,
              );

              return (
                <Card
                  key={program.id}
                  onClick={() => handleSelectProgram(originalIndex)}
                  className='group cursor-pointer overflow-hidden border-slate-200 transition-all duration-300 hover:-translate-y-1 hover:border-blue-400 hover:shadow-lg bg-white/60 hover:bg-white'>
                  <div className='flex items-center gap-4 p-3 md:p-4'>
                    <div className='relative h-16 w-20 shrink-0 overflow-hidden rounded-xl shadow-sm'>
                      <Image
                        src={program.image}
                        alt={program.title}
                        fill
                        className='object-cover transition-transform duration-500 group-hover:scale-110'
                      />
                    </div>
                    <div className='min-w-0 flex-1'>
                      <div className='mb-1 flex items-center gap-3'>
                        <div className='relative flex size-8 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-100 shadow-sm'>
                          <Image
                            src={program.logo}
                            alt='Logo'
                            fill
                            className='object-contain p-1'
                          />
                        </div>
                        <h4 className='truncate text-sm font-bold text-slate-800 transition-colors group-hover:text-blue-700'>
                          {program.title}
                        </h4>
                      </div>
                      <p className='line-clamp-2 text-xs text-slate-500 font-medium leading-relaxed pl-11'>
                        {program.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
