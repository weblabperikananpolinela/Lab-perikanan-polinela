'use client';

import { useEffect, useState } from 'react';
import { Loader2, Database, HardDrive, Users, Calendar, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type HealthData = {
  ok: boolean;
  db: { latencyMs: number; counts: Record<string, number | null> };
  storage: {
    usedBytes: number;
    resources: number;
    creditsUsed: number;
    creditsLimit: number;
    usedPercent: number;
    plan: string;
  } | null;
  pengajuanMenunggu: number;
  adminCount: number;
  maintenanceMode: boolean;
  generatedAt: string;
};

export default function OverviewTab() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHealth = async () => {
      try {
        const res = await fetch('/api/admin/health', { cache: 'no-store' });
        const json = await res.json();
        setData(json);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    loadHealth();
    const interval = setInterval(loadHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const fmtBytes = (b: number) => {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
    return `${(b / 1024 / 1024 / 1024).toFixed(1)} GB`;
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

  if (loading) {
    return (
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className='p-6'>
              <div className='space-y-2'>
                <div className='h-4 w-3/4 rounded bg-slate-200/50 animate-pulse' />
                <div className='h-8 w-1/2 rounded bg-slate-200/50 animate-pulse' />
                <div className='h-3 w-full rounded bg-slate-200/30 animate-pulse' />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className='pt-6 text-center text-slate-500'>
          Gagal memuat data kesehatan sistem.
        </CardContent>
      </Card>
    );
  }

  const { db, storage, pengajuanMenunggu, adminCount, maintenanceMode } = data;

  return (
    <div className='space-y-4'>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        <Card className='border-emerald-200 shadow-emerald-50/25'>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className='text-sm font-medium'>Database</CardTitle>
            <Database className='h-4 w-4 text-emerald-600' />
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold'>{db.counts.peminjaman ?? '-'} peminjaman</p>
            <p className='text-xs text-slate-500'>
              Latency: {db.latencyMs}ms | Last update: {fmtDate(data.generatedAt)}
            </p>
          </CardContent>
        </Card>

        <Card className='border-purple-200 shadow-purple-50/25'>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className='text-sm font-medium'>Cloudinary Storage</CardTitle>
            <HardDrive className='h-4 w-4 text-purple-600' />
          </CardHeader>
          <CardContent>
            {storage ? (
              <>
                <p className='text-2xl font-bold'>{fmtBytes(storage.usedBytes)}</p>
                <p className='text-xs text-slate-500'>
                  {storage.resources} assets ({storage.usedPercent.toFixed(1)}% kredit
                  {storage.plan !== 'unknown' && ` • Plan: ${storage.plan}`})
                </p>
              </>
            ) : (
              <p className='text-sm text-slate-500'>Tidak tersedia</p>
            )}
          </CardContent>
        </Card>

        <Card className='border-amber-200 shadow-amber-50/25'>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className='text-sm font-medium'>Pengajuan Menunggu</CardTitle>
            <Users className='h-4 w-4 text-amber-600' />
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold'>{pengajuanMenunggu ?? 0}</p>
            <p className='text-xs text-slate-500'>Perlakukan lebih cepat!</p>
          </CardContent>
        </Card>

        <Card className='border-sky-200 shadow-sky-50/25'>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className='text-sm font-medium'>Admin Lab</CardTitle>
            <Activity className='h-4 w-4 text-sky-600' />
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold'>{adminCount ?? 0}</p>
            <p className='text-xs text-slate-500'>Pengguna dengan akses lab</p>
          </CardContent>
        </Card>

        <Card
          className={`border Transition-colors ${
            maintenanceMode ? 'border-red-200' : 'border-green-200'
          }`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className='text-sm font-medium'>Maintenance Mode</CardTitle>
            {maintenanceMode ? (
              <Activity className='h-4 w-4 text-red-600' />
            ) : (
              <Calendar className='h-4 w-4 text-green-600' />
            )}
          </CardHeader>
          <CardContent>
            <p className='text-lg font-bold'>
              {maintenanceMode ? 'Aktif' : 'Tidak aktif'}
            </p>
            <p className='text-xs text-slate-500'>
              Pengunjung akan mengalami halaman perawatan
            </p>
          </CardContent>
        </Card>

        <Card className='border-slate-200 shadow-slate-50/25'>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className='text-sm font-medium'>System Stats</CardTitle>
            <Calendar className='h-4 w-4 text-slate-600' />
          </CardHeader>
          <CardContent>
            <p className='text-sm text-slate-500'>Versi v5.3.0</p>
            <p className='text-xs text-slate-400'>
              Diperbarui: {new Date(data.generatedAt).toLocaleDateString('id-ID')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}