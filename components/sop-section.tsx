'use client';

import { useEffect, useState } from 'react';
import {
  FlaskConical,
  Anchor,
  CheckCircle2,
  Activity,
  Loader2,
  Mail,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

// Fungsi Format Rupiah
const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka || 0);
};

// Data Master Lab Polinela
const BASE_LABS = [
  { id: 1, name: 'Lab. Kesehatan Ikan', type: 'perikanan', status: 'LAB' },
  { id: 2, name: 'Lab. Kualitas Air', type: 'perikanan', status: 'LAB' },
  { id: 3, name: 'Lab. Pengolahan', type: 'perikanan', status: 'LAB' },
  { id: 4, name: 'Bangsal Pakan Alami', type: 'perikanan', status: 'LAB' },
  { id: 5, name: 'Lab. Perikanan (SFS)', type: 'perikanan', status: 'LAB' },
  { id: 6, name: 'Lab. Pembenihan', type: 'perikanan', status: 'LAB' },
  { id: 7, name: 'Lab. Ikan Hias', type: 'perikanan', status: 'LAB' },
  { id: 8, name: 'Lab. Nutrisi', type: 'perikanan', status: 'LAB' },
  { id: 9, name: 'Polyfeed', type: 'perikanan', status: 'TEFA' },
  {
    id: 10,
    name: 'Politeknik Ornamental Fish Farm (POFA)',
    type: 'perikanan',
    status: 'TEFA',
  },
  { id: 11, name: 'Galangan Kapal', type: 'perikanan', status: 'TEFA' },
  { id: 12, name: 'Alat Tangkap Ikan', type: 'perikanan', status: 'TEFA' },
  { id: 13, name: 'KJA', type: 'perikanan', status: 'TEFA' },
  { id: 14, name: 'FISHTECH', type: 'perikanan', status: 'TEFA' },
  { id: 15, name: 'FISH MARKET', type: 'perikanan', status: 'TEFA' },
  { id: 16, name: 'Polyfish', type: 'perikanan', status: 'TEFA' },
  { id: 17, name: 'Lab Simulator', type: 'tangkap', status: 'TEFA' },
  { id: 18, name: 'Lab Radar', type: 'tangkap', status: 'TEFA' },
];

export function SopSection() {
  const [isMounted, setIsMounted] = useState(false);
  const [facilitiesData, setFacilitiesData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Memberitahu React bahwa komponen sudah di-mount di Client (Mencegah Hydration Error)
    setIsMounted(true);

    const fetchLayanan = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('layanan_lab')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data) {
        // Gabungkan data layanan ke Lab masing-masing
        const grouped = BASE_LABS.map((lab) => {
          const services = data.filter((d) => d.lab_id === lab.id);
          return { ...lab, services };
        }).filter((lab) => lab.services.length > 0); // FILTER: Hanya tampilkan Lab yang PUNYA layanan

        setFacilitiesData(grouped);
      }
      setIsLoading(false);
    };

    fetchLayanan();
  }, []);

  // HYDRATION FIX: Cegah render isi sebelum client siap
  if (!isMounted) {
    return (
      <section
        id='layanan-uji'
        className='w-full bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 py-20 lg:py-28 relative overflow-hidden min-h-[600px]'>
        {/* Render shell kosong agar server dan client 100% cocok */}
      </section>
    );
  }

  // Membelah data menjadi dua kolom yang independen
  const midPoint = Math.ceil(facilitiesData.length / 2);
  const leftColumnData = facilitiesData.slice(0, midPoint);
  const rightColumnData = facilitiesData.slice(midPoint);

  // Fungsi helper untuk merender item accordion
  const renderAccordionItems = (data: typeof facilitiesData) => {
    return data.map((facility) => (
      <AccordionItem
        key={`lab-${facility.id}`}
        value={`lab-${facility.id}`}
        className='bg-white/10 border border-white/10 rounded-2xl px-5 transition-all duration-300 hover:bg-white/[0.15] data-[state=open]:bg-white/[0.15] data-[state=open]:border-blue-400/50 backdrop-blur-sm shadow-xl shadow-black/10'>
        <AccordionTrigger className='text-white hover:no-underline py-5 text-left'>
          <div className='flex items-center gap-4 flex-1 pr-4'>
            <div
              className={`size-10 shrink-0 rounded-lg flex items-center justify-center ${facility.type === 'tangkap' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-blue-500/20 text-blue-300'}`}>
              {facility.type === 'tangkap' ? (
                <Anchor className='size-5' />
              ) : (
                <FlaskConical className='size-5' />
              )}
            </div>
            <div className='flex flex-col md:flex-row md:items-center gap-1 md:gap-3 flex-1'>
              <span className='font-bold text-base md:text-lg leading-tight'>
                {facility.name}
              </span>
              <span
                className={`inline-flex w-fit items-center text-[9px] px-2 py-0.5 rounded-full font-bold tracking-widest uppercase border ${
                  facility.status === 'TEFA'
                    ? 'bg-purple-500/20 text-purple-200 border-purple-400/30'
                    : 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30'
                }`}>
                {facility.status}
              </span>
            </div>
          </div>
        </AccordionTrigger>

        <AccordionContent className='pb-5 pt-1'>
          <div className='pl-2 md:pl-14'>
            <ul className='space-y-4'>
              {facility.services.map((service: any) => (
                <li
                  key={service.id}
                  className='flex flex-col gap-2.5 p-4 bg-black/20 rounded-xl border border-white/5 shadow-inner'>
                  <div className='flex items-start gap-3'>
                    <CheckCircle2 className='size-5 text-cyan-400 shrink-0 mt-0.5' />
                    <span className='text-blue-50/90 text-sm md:text-base leading-relaxed font-semibold'>
                      {service.nama_layanan}
                    </span>
                  </div>

                </li>
              ))}
            </ul>
          </div>
        </AccordionContent>
      </AccordionItem>
    ));
  };

  return (
    <section
      id='layanan-uji'
      className='w-full bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 py-20 lg:py-28 relative overflow-hidden'>
      {/* Efek Cahaya Dekoratif di Background */}
      <div className='absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none'>
        <div className='absolute -top-[30%] -right-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/20 blur-[120px]' />
        <div className='absolute bottom-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-cyan-500/10 blur-[100px]' />
      </div>

      <div className='container mx-auto max-w-7xl px-4 lg:px-8 relative z-10'>
        {/* Header Section */}
        <div className='flex flex-col items-center text-center mb-16'>
          <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-blue-100 text-sm font-semibold mb-6'>
            <Activity className='size-4 text-cyan-400' />
            <span>Kapasitas dan Layanan</span>
          </div>
          <h2 className='text-3xl md:text-5xl font-extrabold text-white tracking-tight text-balance'>
            Layanan Pengujian & Praktikum
          </h2>
          <p className='mt-4 max-w-2xl text-blue-100/80 md:text-lg leading-relaxed'>
            Eksplorasi berbagai jenis pengujian, layanan analisis, dan fasilitas
            praktikum mutakhir yang tersedia di masing-masing Laboratorium serta
            Teaching Factory kami.
          </p>
        </div>

        {/* State Loading atau Data Kosong */}
        {isLoading ? (
          <div className='flex flex-col items-center justify-center py-20 text-blue-200'>
            <Loader2 className='size-10 animate-spin mb-4' />
            <p className='font-medium animate-pulse'>Memuat layanan lab...</p>
          </div>
        ) : facilitiesData.length === 0 ? (
          <div className='text-center py-20'>
            <p className='text-blue-200/60 text-lg italic'>
              Belum ada data layanan pengujian yang diinputkan oleh Admin Lab.
            </p>
          </div>
        ) : (
          /* Grid 2 Kolom yang Independen */
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 w-full items-start'>
            {/* Kolom Kiri */}
            <Accordion type='multiple' className='flex flex-col gap-4 w-full'>
              {renderAccordionItems(leftColumnData)}
            </Accordion>

            {/* Kolom Kanan */}
            <Accordion type='multiple' className='flex flex-col gap-4 w-full'>
              {renderAccordionItems(rightColumnData)}
            </Accordion>
          </div>
        )}

        {/* Seksi Hubungi Admin (Bagian Bawah) */}
        <div className='mt-20 text-center bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl max-w-2xl mx-auto'>
          <h3 className='text-xl md:text-2xl font-bold text-white mb-3'>
            Layanan yang dicari belum ada?
          </h3>
          <p className='text-blue-100/80 mb-8 leading-relaxed'>
            Hubungi admin laboratorium terkait untuk informasi ketersediaan
            layanan pengujian lainnya atau untuk pengajuan proposal / praktikum
            khusus.
          </p>
          <Button className='bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold px-8 py-6 rounded-full shadow-lg shadow-cyan-500/20 gap-2 transition-all hover:scale-105'>
            <Mail className='size-5' /> Hubungi Pusat Layanan
          </Button>
        </div>
      </div>
    </section>
  );
}
