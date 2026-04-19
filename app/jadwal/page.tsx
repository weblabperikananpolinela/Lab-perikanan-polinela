'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { CalendarDays, ArrowLeft, Maximize2, CalendarX2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// DAFTAR LAB BARU (Sesuai List)
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
  10: 'Politeknik Ornamental Fish Farm (POFA)',
  11: 'Galangan Kapal',
  12: 'Alat Tangkap Ikan',
  13: 'KJA',
  14: 'FISHTECH',
  15: 'FISH MARKET',
  16: 'Polyfish',
  17: 'Lab Simulator',
  18: 'Lab Radar',
};

export default function JadwalPage() {
  const [jadwalData, setJadwalData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSemuaJadwal = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from('jadwal_lab').select('*');
      if (!error && data) {
        setJadwalData(data);
      } else {
        setJadwalData([]);
      }
      setLoading(false);
    };

    fetchSemuaJadwal();
  }, []);

  return (
    <div className='min-h-screen bg-slate-50 pt-24 pb-20 px-4 md:px-8'>
      <div className='mx-auto max-w-7xl'>
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
        <div className='max-w-3xl mx-auto mb-10 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 shadow-sm'>
          <div className='size-5 text-blue-600 shrink-0 mt-0.5'>💡</div>
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

        {/* Render Jadwal Grid */}
        {loading ? (
          <div className='flex flex-col items-center justify-center p-20 gap-4'>
            <div className='size-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin' />
            <p className='text-slate-500 font-medium animate-pulse'>
              Memuat data jadwal laboratorium...
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {Object.entries(labMap).map(([idStr, namaLab]) => {
              const labId = parseInt(idStr);
              const jadwalObj = jadwalData.find((j) => j.lab_id === labId);
              const hasJadwal = jadwalObj && jadwalObj.file_url;

              return (
                <Card
                  key={labId}
                  className='border-t-4 border-t-blue-500 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1'>
                  <CardContent className='p-6 flex flex-col h-full bg-white'>
                    <div className='flex-1 flex flex-col items-center justify-center text-center space-y-4'>
                      <h3 className='text-lg font-bold text-slate-800 min-h-[56px] flex items-center justify-center'>
                        {namaLab}
                      </h3>

                      {hasJadwal ? (
                        <div className='w-full flex-1 flex flex-col items-center justify-center space-y-4'>
                          <div className='bg-blue-50 text-blue-700 font-bold p-4 rounded-full'>
                            <CalendarDays className='size-10' />
                          </div>
                          <Button
                            asChild
                            className='w-full bg-blue-600 hover:bg-blue-700 shadow-md h-12'>
                            <a
                              href={jadwalObj.file_url}
                              target='_blank'
                              rel='noopener noreferrer'>
                              <Maximize2 className='size-5 mr-2' /> Lihat Jadwal
                            </a>
                          </Button>
                        </div>
                      ) : (
                        <div className='w-full flex-1 flex flex-col items-center justify-center space-y-4 py-2'>
                          <div className='bg-slate-50 text-slate-300 font-bold p-4 rounded-full border border-slate-100'>
                            <CalendarX2 className='size-10' />
                          </div>
                          <p className='text-sm text-slate-500 font-medium leading-relaxed'>
                            Jadwal belum tersedia.
                            <br />
                            Silakan hubungi Admin.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
