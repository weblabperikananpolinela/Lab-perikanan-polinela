'use client';

import { useEffect, useState } from 'react';
import { Database, HardDrive, Users, ShieldCheck, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { APP_VERSION_LABEL } from '@/lib/version';

type HealthData = {
  db: { healthy: boolean; sizePercent: number | null };
  storage: { healthy: boolean; usedPercent: number } | null;
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
        setData({
          db: {
            healthy: Boolean(json.db?.healthy),
            sizePercent:
              typeof json.db?.sizePercent === 'number'
                ? json.db.sizePercent
                : null,
          },
          storage: json.storage
            ? {
                healthy: Boolean(json.storage.healthy),
                usedPercent: Number(json.storage.usedPercent ?? 0),
              }
            : null,
          pengajuanMenunggu: json.pengajuanMenunggu ?? 0,
          adminCount: json.adminCount ?? 0,
          maintenanceMode: json.maintenanceMode ?? false,
          generatedAt: json.generatedAt,
        });
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

  const fmtPercent = (value: number) =>
    `${value.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%`;

  return (
    <div className='space-y-4'>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        <Card
          className={`border ${db.healthy ? 'border-emerald-200' : 'border-rose-200'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className='text-sm font-medium'>Database</CardTitle>
            <Database
              className={`h-4 w-4 ${
                db.healthy ? 'text-emerald-600' : 'text-rose-600'
              }`} />
          </CardHeader>
          <CardContent>
            <p className='text-lg font-bold'>
              {db.sizePercent != null ? fmtPercent(db.sizePercent) : '—'}
            </p>
            <p className='text-xs text-slate-500'>
              {db.sizePercent != null
                ? 'Pemakaian dari kapasitas tersedia'
                : db.healthy
                  ? 'Layanan data berjalan normal'
                  : 'Perlu perhatian'}
            </p>
            {db.sizePercent != null && (
              <div className='mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100'>
                <div
                  className={`h-full rounded-full ${
                    db.healthy ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  style={{
                    width: `${Math.min(100, Math.max(0, db.sizePercent))}%`,
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card
          className={`border ${
            storage ? (storage.healthy ? 'border-purple-200' : 'border-rose-200') : 'border-slate-200'
          }`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className='text-sm font-medium'>Penyimpanan</CardTitle>
            <HardDrive
              className={`h-4 w-4 ${
                storage
                  ? storage.healthy
                    ? 'text-purple-600'
                    : 'text-rose-600'
                  : 'text-slate-400'
              }`} />
          </CardHeader>
          <CardContent>
            <p className='text-lg font-bold'>
              {storage ? fmtPercent(storage.usedPercent) : '—'}
            </p>
            <p className='text-xs text-slate-500'>
              {storage ? 'Pemakaian dari kapasitas tersedia' : 'Tidak tersedia'}
            </p>
            {storage && (
              <div className='mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100'>
                <div
                  className={`h-full rounded-full ${
                    storage.healthy ? 'bg-purple-500' : 'bg-rose-500'
                  }`}
                  style={{
                    width: `${Math.min(100, Math.max(0, storage.usedPercent))}%`,
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className='text-sm font-medium'>Pengajuan</CardTitle>
            <Users className='h-4 w-4 text-amber-600' />
          </CardHeader>
          <CardContent>
            <p className='text-lg font-bold'>{pengajuanMenunggu}</p>
            <p className='text-xs text-slate-500'>Menunggu validasi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className='text-sm font-medium'>Admin Lab</CardTitle>
            <ShieldCheck className='h-4 w-4 text-sky-600' />
          </CardHeader>
          <CardContent>
            <p className='text-lg font-bold'>{adminCount}</p>
            <p className='text-xs text-slate-500'>Pengguna akses</p>
          </CardContent>
        </Card>

        <Card
          className={`border ${maintenanceMode ? 'border-red-200' : 'border-green-200'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className='text-sm font-medium'>Maintenance</CardTitle>
            {maintenanceMode ? (
              <Calendar className='h-4 w-4 text-red-600' />
            ) : (
              <Calendar className='h-4 w-4 text-green-600' />
            )}
          </CardHeader>
          <CardContent>
            <p className='text-lg font-bold'>
              {maintenanceMode ? 'Aktif' : 'Tidak aktif'}
            </p>
            <p className='text-xs text-slate-500'>Pengunjung beranda</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className='text-sm font-medium'>Status Website</CardTitle>
            <Calendar className='h-4 w-4 text-slate-600' />
          </CardHeader>
          <CardContent>
            <p className='text-lg font-bold text-emerald-600'>Aktif</p>
            <p className='text-xs text-slate-500'>
              {APP_VERSION_LABEL} • {fmtDate(data.generatedAt)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}