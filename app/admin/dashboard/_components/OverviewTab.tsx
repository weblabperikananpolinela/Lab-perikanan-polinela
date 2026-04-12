'use client';

import { useEffect, useState } from 'react';
import { Clock, CheckSquare, FileText, PackageSearch } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const applyLabFilter = (supabaseQuery: any, lab_id: number) => {
  if ([8, 9, 10].includes(lab_id)) {
    return supabaseQuery.in('lab_id', [8, 9, 10]);
  }
  return supabaseQuery.eq('lab_id', lab_id);
};

export default function OverviewTab({
  adminProfile,
  supabase,
  setActiveTab, // Tambahan prop untuk navigasi
}: {
  adminProfile: any;
  supabase: any;
  setActiveTab?: (tab: string) => void;
}) {
  const [stats, setStats] = useState({
    menunggu: 0,
    total: 0,
    disetujui: 0,
    alatJenis: 0,
    alatTotal: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const q1 = applyLabFilter(
        supabase
          .from('peminjaman')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Menunggu validasi'),
        adminProfile.lab_id,
      );
      const res1 = await q1;

      const q2 = applyLabFilter(
        supabase.from('peminjaman').select('*', { count: 'exact', head: true }),
        adminProfile.lab_id,
      );
      const res2 = await q2;

      const q3 = applyLabFilter(
        supabase
          .from('peminjaman')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Disetujui'),
        adminProfile.lab_id,
      );
      const res3 = await q3;

      // ... query q1, q2, q3 di atas biarkan saja ...

      // GANTI BAGIAN q4 MENJADI INI:
      let q4 = supabase
        .from('inventaris')
        .select('jumlah_baik, kategori_inventaris!inner(lab_id)');

      // Filter khusus untuk tabel relasi (kategori_inventaris)
      if ([8, 9, 10].includes(adminProfile.lab_id)) {
        q4 = q4.in('kategori_inventaris.lab_id', [8, 9, 10]);
      } else {
        q4 = q4.eq('kategori_inventaris.lab_id', adminProfile.lab_id);
      }
      
      const res4 = await q4;

      if (res4.error) {
        console.error("Error mengambil data inventaris:", res4.error);
      }

      let jenisCount = 0;
      let totalUnitTersedia = 0;
      if (res4.data) {
        jenisCount = res4.data.length;
        // HANYA menghitung alat yang kondisinya "Baik" sebagai alat yang tersedia
        totalUnitTersedia = res4.data.reduce(
          (acc: number, curr: any) => acc + (curr.jumlah_baik || 0),
          0,
        );
      }
      
      // ... sisa kode setStats di bawahnya biarkan ...

      setStats({
        menunggu: res1.count || 0,
        total: res2.count || 0,
        disetujui: res3.count || 0,
        alatJenis: jenisCount,
        alatTotal: totalUnitTersedia,
      });
      setLoading(false);
    };

    fetchStats();
  }, [adminProfile, supabase]);

  if (loading)
    return (
      <div className='animate-pulse text-lg text-slate-500 font-medium'>
        Memuat data ringkasan...
      </div>
    );

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
      <Card
        onClick={() => setActiveTab && setActiveTab('pengajuan')}
        className='border-l-4 border-l-amber-500 shadow-sm relative overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-200'>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium text-slate-500 uppercase tracking-wider'>
            Menunggu Validasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-3xl font-bold text-slate-900'>
            {stats.menunggu}
          </div>
          <Clock className='absolute right-4 bottom-4 size-10 text-amber-100' />
        </CardContent>
      </Card>

      <Card
        onClick={() => setActiveTab && setActiveTab('riwayat')} // Arahkan ke riwayat lab / pengajuan disetujui
        className='border-l-4 border-l-green-500 shadow-sm relative overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-200'>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium text-slate-500 uppercase tracking-wider'>
            Pengajuan Diterima
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-3xl font-bold text-slate-900'>
            {stats.disetujui}
          </div>
          <CheckSquare className='absolute right-4 bottom-4 size-10 text-green-100' />
        </CardContent>
      </Card>

      <Card
        onClick={() => setActiveTab && setActiveTab('pengajuan')}
        className='border-l-4 border-l-blue-500 shadow-sm relative overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-200'>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium text-slate-500 uppercase tracking-wider'>
            Total Pengajuan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-3xl font-bold text-slate-900'>{stats.total}</div>
          <FileText className='absolute right-4 bottom-4 size-10 text-blue-100' />
        </CardContent>
      </Card>

      <Card
        onClick={() => setActiveTab && setActiveTab('inventaris')}
        className='border-l-4 border-l-purple-500 shadow-sm relative overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-200'>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium text-slate-500 uppercase tracking-wider'>
            Info Inventaris
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-3xl font-bold text-slate-900'>
            {stats.alatTotal}{' '}
            <span className='text-base font-normal text-slate-500'>
              Unit Tersedia
            </span>
          </div>
          <p className='mt-1 text-sm font-medium text-slate-600'>
            Dari {stats.alatJenis} jenis alat
          </p>
          <PackageSearch className='absolute right-4 bottom-4 size-10 text-purple-100' />
        </CardContent>
      </Card>
    </div>
  );
}
