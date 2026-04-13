'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
// 1. Ikon digabung jadi satu baris agar tidak duplikat
import {
  ArrowLeft,
  PackageSearch,
  Info,
  Building2,
  ChevronDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// 2. Import Button ditambahkan di sini
import { Button } from '@/components/ui/button';

// Daftar 18 Lab/TEFA terbaru
const labData = [
  { id: 1, nama: 'Lab. Kesehatan Ikan', jenis: 'Laboratorium' },
  { id: 2, nama: 'Lab. Kualitas Air', jenis: 'Laboratorium' },
  { id: 3, nama: 'Lab. Pengolahan', jenis: 'Laboratorium' },
  { id: 4, nama: 'Bangsal Pakan Alami', jenis: 'Laboratorium' },
  { id: 5, nama: 'Lab. Perikanan (SFS)', jenis: 'Laboratorium' },
  { id: 6, nama: 'Lab. Pembenihan', jenis: 'Laboratorium' },
  { id: 7, nama: 'Lab. Ikan Hias', jenis: 'Laboratorium' },
  { id: 8, nama: 'Lab. Nutrisi', jenis: 'Laboratorium' },
  { id: 9, nama: 'Polyfeed', jenis: 'TEFA' },
  { id: 10, nama: 'Politeknik Ornamental Fish Farm (POFA)', jenis: 'TEFA' },
  { id: 11, nama: 'Galangan Kapal', jenis: 'TEFA' },
  { id: 12, nama: 'Alat Tangkap Ikan', jenis: 'TEFA' },
  { id: 13, nama: 'KJA', jenis: 'TEFA' },
  { id: 14, nama: 'FISHTECH', jenis: 'TEFA' },
  { id: 15, nama: 'FISH MARKET', jenis: 'TEFA' },
  { id: 16, nama: 'polyfish', jenis: 'TEFA' },
  { id: 17, nama: 'Lab Simulator', jenis: 'TEFA' },
  { id: 18, nama: 'Lab Radar', jenis: 'TEFA' },
];

export default function PublikInventarisPage() {
  const [inventaris, setInventaris] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Default menampilkan Lab ID 1 (Lab. Kesehatan Ikan)
  const [selectedLabId, setSelectedLabId] = useState<number>(1);

  useEffect(() => {
    const fetchInventaris = async () => {
      setLoading(true);
      const supabase = createClient();

      // Melakukan relasi dengan !inner agar bisa difilter berdasarkan lab_id
      const { data, error } = await supabase
        .from('inventaris')
        .select(
          `
          id, 
          jenis_alat, 
          spesifikasi, 
          jumlah_baik, 
          kategori_inventaris!inner ( lab_id, nama_kategori )
        `,
        )
        .eq('kategori_inventaris.lab_id', selectedLabId)
        .order('jenis_alat', { ascending: true });

      if (data) {
        // Filter hanya yang unitnya > 0
        const availableItems = data.filter((item: any) => item.jumlah_baik > 0);
        setInventaris(availableItems);
      } else {
        setInventaris([]);
      }
      setLoading(false);
    };

    fetchInventaris();
  }, [selectedLabId]); // Akan fetch ulang setiap kali lab dipilih

  return (
    <div className='min-h-screen bg-slate-50 pt-24 pb-12 px-4 md:px-8'>
      <div className='max-w-6xl mx-auto'>
        <div className='mb-8'>
          <Link
            href='/'
            className='inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 font-medium transition-colors'>
            <ArrowLeft size={18} /> Kembali ke Beranda
          </Link>
          <h1 className='text-3xl font-bold text-slate-900 flex items-center gap-3'>
            <PackageSearch className='text-blue-600' /> Katalog Inventaris
          </h1>
          <p className='text-slate-500 mt-2 flex items-center gap-2'>
            <Info size={16} className='text-blue-500' /> Menampilkan daftar alat
            dan bahan yang saat ini tersedia.
          </p>
        </div>

        {/* Filter Pemilihan Lab dengan Badge */}
        <div className='mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white p-4 md:px-6 rounded-xl border border-slate-200 shadow-sm'>
          <div className='flex items-center gap-2 text-slate-700 font-semibold'>
            <Building2 size={20} className='text-blue-600' />
            <span>Pilih Laboratorium / TEFA :</span>
          </div>

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant='outline'
                className='w-full sm:w-80 justify-between h-11 px-4 bg-slate-50 border-slate-300 font-medium'>
                {labData.find((l) => l.id === selectedLabId)?.nama ||
                  'Pilih Lab'}
                <ChevronDown className='ml-2 h-4 w-4 opacity-50' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className='w-80 max-h-80 overflow-y-auto'
              align='end'>
              {labData.map((lab) => (
                <DropdownMenuItem
                  key={lab.id}
                  onClick={() => setSelectedLabId(lab.id)}
                  className='flex items-center justify-between py-2.5 cursor-pointer'>
                  <span className='font-medium text-slate-700'>{lab.nama}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider shrink-0 ml-2 ${
                      lab.jenis === 'TEFA'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                    {lab.jenis === 'TEFA' ? 'TEFA' : 'LAB'}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tabel Data Inventaris */}
        <div className='bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-sm text-slate-600'>
              <thead className='bg-blue-50 text-blue-900 border-b border-blue-100'>
                <tr>
                  <th className='p-4 font-semibold'>Nama Alat / Bahan</th>
                  <th className='p-4 font-semibold'>Spesifikasi</th>
                  <th className='p-4 font-semibold'>Kategori Alat</th>
                  <th className='p-4 font-semibold text-center'>Tersedia</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-100'>
                {loading ? (
                  <tr>
                    <td colSpan={4} className='p-12 text-center'>
                      <div className='flex flex-col items-center justify-center gap-3 text-slate-500 animate-pulse'>
                        <PackageSearch size={32} className='text-slate-300' />
                        <p className='font-medium text-base'>
                          Mencari ketersediaan alat...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : inventaris.length === 0 ? (
                  <tr>
                    <td colSpan={4} className='p-12 text-center'>
                      <div className='flex flex-col items-center justify-center gap-3 text-slate-400'>
                        <Info size={32} className='text-slate-300' />
                        <p className='font-medium text-base'>
                          Saat ini tidak ada alat yang tersedia di lab ini.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  inventaris.map((item) => (
                    <tr
                      key={item.id}
                      className='hover:bg-slate-50 transition-colors'>
                      <td className='p-4 font-bold text-slate-900'>
                        {item.jenis_alat}
                      </td>
                      <td className='p-4'>{item.spesifikasi || '-'}</td>
                      <td className='p-4'>
                        <span className='bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-semibold border border-slate-200'>
                          {item.kategori_inventaris?.nama_kategori || 'Umum'}
                        </span>
                      </td>
                      <td className='p-4 text-center'>
                        <span className='inline-flex items-center justify-center bg-green-100 text-green-700 font-bold size-8 rounded-full border border-green-200 shadow-sm'>
                          {item.jumlah_baik}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
