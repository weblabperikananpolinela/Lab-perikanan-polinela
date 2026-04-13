'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Search, ArrowLeft, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Navbar } from '@/components/navbar';

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

export default function StatusRiwayatPage() {
  const [riwayat, setRiwayat] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRiwayat = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('peminjaman')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setRiwayat(data);
      setLoading(false);
    };
    fetchRiwayat();
  }, []);

  const filteredRiwayat = riwayat.filter((item) =>
    item.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Disetujui':
        return (
          <span className='flex items-center gap-1 text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs font-semibold'>
            <CheckCircle size={14} /> Disetujui
          </span>
        );
      case 'Ditolak':
        return (
          <span className='flex items-center gap-1 text-red-600 bg-red-100 px-2 py-1 rounded-full text-xs font-semibold'>
            <XCircle size={14} /> Ditolak
          </span>
        );
      default:
        return (
          <span className='flex items-center gap-1 text-amber-600 bg-amber-100 px-2 py-1 rounded-full text-xs font-semibold'>
            <Clock size={14} /> Menunggu
          </span>
        );
    }
  };

  return (
    <div className='min-h-screen bg-slate-50 pt-24 pb-12 px-4 md:px-8'>
      <div className='max-w-6xl mx-auto'>
        <div className='mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4'>
          <div>
            <Link
              href='/'
              className='inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 font-medium'>
              <ArrowLeft size={18} /> Kembali ke Beranda
            </Link>
            <h1 className='text-3xl font-bold text-slate-900'>
              Status & Riwayat Peminjaman
            </h1>
            <p className='text-slate-500 mt-1'>
              Cari nama Anda untuk melihat status persetujuan dari Admin Lab.
            </p>
          </div>
          <div className='relative w-full md:w-80'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-5' />
            <Input
              placeholder='Cari nama peminjam...'
              className='pl-10 h-12 bg-white'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className='bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-sm text-slate-600'>
              <thead className='bg-slate-50 text-slate-800 border-b border-slate-200'>
                <tr>
                  <th className='p-4 font-semibold'>Nama Peminjam</th>
                  <th className='p-4 font-semibold'>Lab Tujuan</th>
                  <th className='p-4 font-semibold'>Tanggal</th>
                  <th className='p-4 font-semibold'>Waktu</th>
                  <th className='p-4 font-semibold'>Status</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-100'>
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className='p-8 text-center text-slate-500 animate-pulse'>
                      Memuat data...
                    </td>
                  </tr>
                ) : filteredRiwayat.length === 0 ? (
                  <tr>
                    <td colSpan={5} className='p-8 text-center text-slate-500'>
                      Tidak ada data ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredRiwayat.map((item) => (
                    <tr
                      key={item.id}
                      className='hover:bg-slate-50 transition-colors'>
                      <td className='p-4 font-medium text-slate-900'>
                        {item.nama_lengkap}
                      </td>
                      <td className='p-4'>
                        {labMap[item.lab_id] || 'Lab Tidak Diketahui'}
                      </td>
                      <td className='p-4'>{item.tanggal}</td>
                      <td className='p-4'>
                        {item.jam_mulai} - {item.jam_selesai}
                      </td>
                      <td className='p-4'>{getStatusBadge(item.status)}</td>
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
