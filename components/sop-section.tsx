'use client';

import { FlaskConical, Anchor, CheckCircle2, Activity } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

// ==============================================================================
// DATA LAYANAN / UJI LAB & TEFA
// ==============================================================================
const facilitiesData = [
  {
    id: 'lab-1',
    name: 'Lab. Kesehatan Ikan',
    type: 'perikanan',
    status: 'LAB',
    services: [
      'Uji deteksi dan identifikasi parasit ikan',
      'Uji mikrobiologi (Bakteri dan Jamur patogen)',
      'Pemeriksaan hematologi / kualitas darah ikan',
      'Nekropsi dan bedah anatomi ikan',
    ],
  },
  {
    id: 'lab-2',
    name: 'Lab. Kualitas Air',
    type: 'perikanan',
    status: 'LAB',
    services: [
      'Uji parameter fisik air (Suhu, Kekeruhan, TSS)',
      'Uji parameter kimia air (pH, DO, Salinitas, Amonia, Nitrat)',
      'Analisis kelimpahan plankton (Fitoplankton & Zooplankton)',
      'Pengukuran Total Organic Matter (TOM)',
    ],
  },
  {
    id: 'lab-3',
    name: 'Lab. Pengolahan',
    type: 'perikanan',
    status: 'LAB',
    services: [
      'Uji organoleptik dan sensori produk perikanan',
      'Pengembangan formulasi produk olahan ikan',
      'Analisis proksimat dasar (kadar air, abu, protein)',
      'Pengemasan dan uji umur simpan (Shelf-life)',
    ],
  },
  {
    id: 'lab-4',
    name: 'Bangsal Pakan Alami',
    type: 'perikanan',
    status: 'LAB',
    services: [
      'Kultur murni fitoplankton (Tetraselmis, Nannochloropsis)',
      'Kultur massal zooplankton (Artemia, Daphnia, Moina)',
      'Uji kepadatan dan laju pertumbuhan pakan alami',
      'Penyediaan starter pakan alami untuk pembenihan',
    ],
  },
  {
    id: 'lab-5',
    name: 'Lab. Perikanan (SFS)',
    type: 'perikanan',
    status: 'LAB',
    services: [
      'Simulasi Smart Farming System (SFS)',
      'Pengujian otomatisasi kualitas air berbasis IoT',
      'Manajemen data budidaya perikanan presisi',
      'Riset efisiensi energi pada sistem akuakultur',
    ],
  },
  {
    id: 'lab-6',
    name: 'Lab. Pembenihan',
    type: 'perikanan',
    status: 'LAB',
    services: [
      'Teknik induksi hormon pemijahan buatan',
      'Pengamatan perkembangan embrio dan larva',
      'Manajemen kualitas air sistem resirkulasi tertutup (RAS)',
      'Uji sintasan (Survival Rate) benih ikan',
    ],
  },
  {
    id: 'lab-7',
    name: 'Lab. Ikan Hias',
    type: 'perikanan',
    status: 'LAB',
    services: [
      'Teknik rekayasa warna dan genetik ikan hias',
      'Manajemen akuarium dan aquascape',
      'Pemeliharaan indukan dan benih ikan hias endemik',
      'Uji adaptasi stres lingkungan ikan hias',
    ],
  },
  {
    id: 'lab-8',
    name: 'Lab. Nutrisi',
    type: 'perikanan',
    status: 'LAB',
    services: [
      'Formulasi dan formulasi pakan buatan',
      'Uji daya apung dan kestabilan pakan dalam air (Water Stability)',
      'Analisis nilai cerna (Digestibility) pakan',
      'Uji efisiensi pakan (FCR dan SGR) pada ikan',
    ],
  },
  {
    id: 'tefa-1',
    name: 'Polyfeed',
    type: 'perikanan',
    status: 'TEFA',
    services: [
      'Produksi massal pakan ikan komersial',
      'Uji coba bahan baku lokal untuk pakan alternatif',
      'Pelatihan operasional mesin extruder dan pelletizer',
      'Layanan maklon pembuatan pakan skala menengah',
    ],
  },
  {
    id: 'tefa-2',
    name: 'Politeknik Ornamental Fish Farm (POFA)',
    type: 'perikanan',
    status: 'TEFA',
    services: [
      'Produksi dan komersialisasi ikan hias ekspor',
      'Pelatihan bisnis dan manajemen budidaya ikan hias',
      'Karantina dan sertifikasi kesehatan ikan hias',
      'Pengembangan galur murni ikan hias unggulan',
    ],
  },
  {
    id: 'tefa-3',
    name: 'Galangan Kapal',
    type: 'perikanan',
    status: 'TEFA',
    services: [
      'Desain dan pembuatan kapal perikanan (Fiberglass/Kayu)',
      'Reparasi dan pemeliharaan lambung kapal',
      'Uji kelayakan dan stabilitas kapal (Inclining Test)',
      'Pelatihan laminasi dan konstruksi perkapalan',
    ],
  },
  {
    id: 'tefa-4',
    name: 'Alat Tangkap Ikan',
    type: 'perikanan',
    status: 'TEFA',
    services: [
      'Rancang bangun jaring, bubu, dan pancing',
      'Uji kekuatan tarik benang dan material jaring (Breaking Strength)',
      'Simulasi pengoperasian alat tangkap pasif',
      'Perbaikan dan perakitan alat tangkap ramah lingkungan',
    ],
  },
  {
    id: 'tefa-5',
    name: 'KJA (Keramba Jaring Apung)',
    type: 'perikanan',
    status: 'TEFA',
    services: [
      'Praktik budidaya pembesaran ikan laut/tawar sistem KJA',
      'Manajemen pakan dan sampling ikan di perairan terbuka',
      'Perawatan jaring dan konstruksi keramba',
      'Uji daya dukung perairan untuk budidaya lepas pantai',
    ],
  },
  {
    id: 'tefa-6',
    name: 'FISHTECH',
    type: 'perikanan',
    status: 'TEFA',
    services: [
      'Inkubasi teknologi perikanan tepat guna',
      'Prototyping alat bantu budidaya dan tangkap',
      'Pengembangan aplikasi dan platform digital perikanan',
      'Layanan konsultasi engineering akuakultur',
    ],
  },
  {
    id: 'tefa-7',
    name: 'FISH MARKET',
    type: 'perikanan',
    status: 'TEFA',
    services: [
      'Manajemen rantai pasok dingin (Cold Chain) hasil perikanan',
      'Praktik pemasaran dan ritel produk perikanan segar',
      'Pelatihan display dan grading mutu ikan',
      'Layanan distribusi hasil tangkap dan panen budidaya',
    ],
  },
  {
    id: 'tefa-8',
    name: 'Polyfish',
    type: 'perikanan',
    status: 'TEFA',
    services: [
      'Produksi massal ikan konsumsi (Lele, Nila, Patin)',
      'Praktik manajemen panen dan pasca panen budidaya',
      'Layanan distribusi benih dan ikan ukuran konsumsi',
      'Pusat pelatihan teknis budidaya perikanan terpadu',
    ],
  },
  {
    id: 'tefa-9',
    name: 'Lab Simulator',
    type: 'tangkap',
    status: 'TEFA',
    services: [
      'Simulasi navigasi dan olah gerak kapal penangkap ikan',
      'Pelatihan komunikasi radio maritim (GMDSS)',
      'Simulasi penanganan keadaan darurat di laut',
      'Sertifikasi kompetensi pelaut kapal penangkap ikan',
    ],
  },
  {
    id: 'tefa-10',
    name: 'Lab Radar',
    type: 'tangkap',
    status: 'TEFA',
    services: [
      'Pelatihan pengoperasian RADAR dan ARPA',
      'Simulasi plotting target dan penghindaran tubrukan',
      'Interpretasi instrumen pendeteksi ikan (Fish Finder & Sonar)',
      'Pemetaan area penangkapan ikan elektronik',
    ],
  },
];

export function SopSection() {
  // Membelah data menjadi dua kolom yang independen
  const midPoint = Math.ceil(facilitiesData.length / 2);
  const leftColumnData = facilitiesData.slice(0, midPoint);
  const rightColumnData = facilitiesData.slice(midPoint);

  // Fungsi helper untuk merender item accordion
  const renderAccordionItems = (data: typeof facilitiesData) => {
    return data.map((facility) => (
      <AccordionItem
        key={facility.id}
        value={facility.id}
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
          <div className='pl-14'>
            <ul className='space-y-3'>
              {facility.services.map((service, index) => (
                <li
                  key={index}
                  className='flex items-start gap-3 text-blue-50/90 text-sm md:text-base leading-relaxed font-medium'>
                  <CheckCircle2 className='size-5 text-cyan-400 shrink-0 mt-0.5' />
                  {service}
                </li>
              ))}
              {facility.services.length === 0 && (
                <li className='text-slate-400 italic text-sm'>
                  Data layanan belum ditambahkan.
                </li>
              )}
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

        {/* Grid 2 Kolom yang Independen (Anti Ketarik) */}
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
      </div>
    </section>
  );
}
