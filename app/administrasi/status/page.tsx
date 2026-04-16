'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  Search,
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquareWarning,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

// Telah diperbarui menjadi 18 Lab/TEFA terbaru
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
  16: 'polyfish',
  17: 'Lab Simulator',
  18: 'Lab Radar',
};

export default function StatusRiwayatPage() {
  const [riwayat, setRiwayat] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // State untuk Modal Detail
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

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
    item.nama_lengkap?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const openDetail = (item: any) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Disetujui':
        return (
          <span className='flex items-center w-fit gap-1 text-green-700 bg-green-100 border border-green-200 px-2.5 py-1 rounded-full text-xs font-semibold'>
            <CheckCircle size={14} /> Disetujui
          </span>
        );
      case 'Ditolak':
        return (
          <span className='flex items-center w-fit gap-1 text-red-700 bg-red-100 border border-red-200 px-2.5 py-1 rounded-full text-xs font-semibold'>
            <XCircle size={14} /> Ditolak
          </span>
        );
      case 'Dibatalkan':
        return (
          <span className='flex items-center w-fit gap-1 text-slate-700 bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-full text-xs font-semibold'>
            <XCircle size={14} /> Dibatalkan
          </span>
        );
      default:
        return (
          <span className='flex items-center w-fit gap-1 text-amber-700 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-semibold'>
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
              className='inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 font-medium transition-colors'>
              <ArrowLeft size={18} /> Kembali ke Beranda
            </Link>
            <h1 className='text-3xl font-bold text-slate-900'>
              Status & Riwayat Peminjaman
            </h1>
            <p className='text-slate-500 mt-1'>
              Cari nama Anda untuk melihat status persetujuan atau alasan
              pembatalan dari Admin Lab.
            </p>
          </div>
          <div className='relative w-full md:w-80'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-5' />
            <Input
              placeholder='Cari nama peminjam...'
              className='pl-10 h-12 bg-white border-slate-300 focus:border-blue-500'
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
                  <th className='p-4 font-semibold text-center'>Aksi</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-100'>
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className='p-8 text-center text-slate-500 animate-pulse font-medium'>
                      Memuat data pengajuan...
                    </td>
                  </tr>
                ) : filteredRiwayat.length === 0 ? (
                  <tr>
                    <td colSpan={6} className='p-8 text-center text-slate-500'>
                      Tidak ada data ditemukan untuk pencarian tersebut.
                    </td>
                  </tr>
                ) : (
                  filteredRiwayat.map((item) => (
                    <tr
                      key={item.id}
                      className='hover:bg-slate-50/80 transition-colors'>
                      <td className='p-4 font-semibold text-slate-900'>
                        {item.nama_lengkap}
                      </td>
                      <td className='p-4'>
                        {labMap[item.lab_id] || 'Lab Tidak Diketahui'}
                      </td>
                      <td className='p-4'>
                        {item.tanggal
                          ? new Date(item.tanggal).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })
                          : '-'}
                      </td>
                      <td className='p-4 font-medium text-blue-600'>
                        {item.jam_mulai} - {item.jam_selesai}
                      </td>
                      <td className='p-4'>{getStatusBadge(item.status)}</td>
                      <td className='p-4 text-center'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => openDetail(item)}
                          className='hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'>
                          <Eye className='size-4 mr-1.5' /> Detail
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL DETAIL PENGAJUAN */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='text-xl'>Detail Peminjaman</DialogTitle>
            <DialogDescription>
              Informasi lengkap terkait status pengajuan Anda.
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className='space-y-4 pt-2'>
              <div className='grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100'>
                <div className='col-span-2'>
                  <p className='text-xs font-semibold text-slate-500 uppercase'>
                    Status Saat Ini
                  </p>
                  <div className='mt-1'>
                    {getStatusBadge(selectedItem.status)}
                  </div>
                </div>
                <div className='col-span-2'>
                  <p className='text-xs font-semibold text-slate-500 uppercase'>
                    Kegiatan
                  </p>
                  <p className='font-bold text-slate-900'>
                    {selectedItem.judul_kegiatan}
                  </p>
                </div>
                <div>
                  <p className='text-xs font-semibold text-slate-500 uppercase'>
                    Laboratorium
                  </p>
                  <p className='font-semibold text-slate-800'>
                    {labMap[selectedItem.lab_id]}
                  </p>
                </div>
                <div>
                  <p className='text-xs font-semibold text-slate-500 uppercase'>
                    Kategori
                  </p>
                  <p className='font-semibold text-slate-800'>
                    {selectedItem.kategori_pemohon}
                  </p>
                </div>
              </div>

              {/* TAMPILAN FEEDBACK (Jika ada) */}
              {selectedItem.pesan_feedback && (
                <div className='p-3 bg-blue-50 border border-blue-200 rounded-lg flex gap-3 items-start'>
                  <MessageSquareWarning className='size-5 text-blue-600 shrink-0 mt-0.5' />
                  <div>
                    <p className='text-xs font-bold text-blue-800 uppercase tracking-wider'>
                      Catatan Admin
                    </p>
                    <p className='text-sm text-blue-900 mt-1 leading-relaxed'>
                      {selectedItem.pesan_feedback}
                    </p>
                  </div>
                </div>
              )}

              {/* TAMPILAN ALASAN PEMBATALAN (Jika ada) */}
              {selectedItem.pesan_pembatalan && (
                <div className='p-3 bg-red-50 border border-red-200 rounded-lg flex gap-3 items-start'>
                  <XCircle className='size-5 text-red-600 shrink-0 mt-0.5' />
                  <div>
                    <p className='text-xs font-bold text-red-800 uppercase tracking-wider'>
                      Alasan Pembatalan
                    </p>
                    <p className='text-sm text-red-900 mt-1 leading-relaxed'>
                      {selectedItem.pesan_pembatalan}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
