'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, PackageSearch, Info } from 'lucide-react';

const labMap: Record<number, string> = {
  1: 'Lab SFS budidaya perikanan',
  2: 'Lab A (lab pembenihan ikan)',
  3: 'Lab pengolahan perikanan',
  4: 'Lab perikanan bawah',
  5: 'Tefa polifishfarm',
  6: 'Tefa POFF',
  7: 'Tefa polifeed',
  8: 'Lab Simulator',
  9: 'Lab Tangkap',
  10: 'Lab Radar',
};

export default function PublikInventarisPage() {
  const [inventaris, setInventaris] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInventaris = async () => {
      const supabase = createClient();
      // Melakukan relasi untuk mendapatkan lab_id dan nama_kategori
      const { data, error } = await supabase
        .from('inventaris')
        .select(`
          id, 
          jenis_alat, 
          spesifikasi, 
          jumlah_baik, 
          kategori_inventaris ( lab_id, nama_kategori )
        `)
        .order('jenis_alat', { ascending: true });

      if (data) {
        // Filter hanya yang unitnya tersedia (jumlah_baik > 0)
        const availableItems = data.filter((item) => item.jumlah_baik > 0);
        setInventaris(availableItems);
      }
      setLoading(false);
    };
    fetchInventaris();
  }, []);

  return (
    <div className='min-h-screen bg-slate-50 pt-24 pb-12 px-4 md:px-8'>
      <div className='max-w-6xl mx-auto'>
        <div className='mb-8'>
          <Link href='/' className='inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 font-medium'>
            <ArrowLeft size={18} /> Kembali ke Beranda
          </Link>
          <h1 className='text-3xl font-bold text-slate-900 flex items-center gap-3'>
            <PackageSearch className="text-blue-600" /> Katalog Inventaris
          </h1>
          <p className='text-slate-500 mt-2 flex items-center gap-2'>
            <Info size={16} /> Menampilkan daftar alat dan bahan yang saat ini berstatus <strong className="text-slate-700">Tersedia (Kondisi Baik)</strong>.
          </p>
        </div>

        <div className='bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-sm text-slate-600'>
              <thead className='bg-blue-50 text-blue-900 border-b border-blue-100'>
                <tr>
                  <th className='p-4 font-semibold'>Nama Alat / Bahan</th>
                  <th className='p-4 font-semibold'>Spesifikasi</th>
                  <th className='p-4 font-semibold'>Kategori</th>
                  <th className='p-4 font-semibold'>Lokasi Lab</th>
                  <th className='p-4 font-semibold text-center'>Tersedia</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-100'>
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500 animate-pulse">Memuat data inventaris...</td></tr>
                ) : inventaris.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500">Saat ini tidak ada alat yang tersedia.</td></tr>
                ) : (
                  inventaris.map((item) => (
                    <tr key={item.id} className='hover:bg-slate-50 transition-colors'>
                      <td className='p-4 font-bold text-slate-900'>{item.jenis_alat}</td>
                      <td className='p-4'>{item.spesifikasi || '-'}</td>
                      <td className='p-4'>
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium border border-slate-200">
                          {item.kategori_inventaris?.nama_kategori || 'Umum'}
                        </span>
                      </td>
                      <td className='p-4 font-medium text-slate-700'>{labMap[item.kategori_inventaris?.lab_id] || 'Unknown Lab'}</td>
                      <td className='p-4 text-center'>
                        <span className='inline-flex items-center justify-center bg-green-100 text-green-700 font-bold size-8 rounded-full border border-green-200'>
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