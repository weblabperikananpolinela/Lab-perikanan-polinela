'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Clock,
  CheckSquare,
  FileText,
  PackageSearch,
  XCircle,
  CheckCheck,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const applyLabFilter = (supabaseQuery: any, lab_id: number) => {
  if ([8, 9, 10].includes(lab_id)) {
    return supabaseQuery.in('lab_id', [8, 9, 10]);
  }
  return supabaseQuery.eq('lab_id', lab_id);
};

// Palet status — selaras makna warna dashboard (amber=menunggu,
// blue=diterima, red=ditolak, emerald=selesai).
const STATUS_COLORS = {
  menunggu: '#f59e0b',
  disetujui: '#3b82f6',
  ditolak: '#ef4444',
  selesai: '#10b981',
} as const;

const GRID_COLOR = '#e2e8f0';

interface KpiItem {
  key: string;
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
  targetTab: string;
}

function StatusKpiCard({
  item,
  onClick,
}: {
  item: KpiItem;
  onClick?: () => void;
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };
  return (
    <Card
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role='button'
      tabIndex={0}
      aria-label={`${item.label}: ${item.value}`}
      className='border-l-4 shadow-sm relative overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none'
      style={{ borderLeftColor: item.color }}
    >
      <CardHeader className='pb-2'>
        <CardTitle className='text-sm font-medium text-slate-500 uppercase tracking-wider'>
          {item.label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='text-3xl font-bold text-slate-900'>{item.value}</div>
        <div
          className='absolute right-4 bottom-4 size-10 shrink-0'
          style={{ color: `${item.color}33` }}
          aria-hidden='true'
        >
          {item.icon}
        </div>
      </CardContent>
    </Card>
  );
}

function ChartSkeleton() {
  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6'>
      {[0, 1].map((i) => (
        <Card key={i} className='shadow-sm'>
          <CardContent className='p-6'>
            <div className='h-5 w-40 bg-slate-100 rounded animate-pulse mb-6' />
            <div className='h-[240px] w-full bg-slate-100 rounded animate-pulse' />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function OverviewTab({
  adminProfile,
  supabase,
  setActiveTab,
}: {
  adminProfile: any;
  supabase: any;
  setActiveTab?: (tab: string) => void;
}) {
  const [stats, setStats] = useState({
    menunggu: 0,
    disetujui: 0,
    ditolak: 0,
    selesai: 0,
    total: 0,
    alatJenis: 0,
    alatTotal: 0,
  });
  const [trenRaw, setTrenRaw] = useState<{ tanggal: string; status: string }[]>([]);
  const [rentangHari, setRentangHari] = useState<7 | 30 | 90 | 365>(7);

  const RENTANG_OPTIONS = [
    { value: 7, label: '7 hari' },
    { value: 30, label: '30 hari' },
    { value: 90, label: '90 hari' },
    { value: 365, label: '1 tahun' },
  ] as const;

  const rentangLabel =
    RENTANG_OPTIONS.find((o) => o.value === rentangHari)?.label ??
    `${rentangHari} hari`;
  const [loadingTren, setLoadingTren] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Satu sumber data untuk SEMUA indikator rentang: tanggal + status
  // pengajuan lab ini dalam rentang aktif. Kartu inventaris dikecualikan
  // (stok saat ini, bukan data rentang) dan diambil terpisah sekali saja.
  useEffect(() => {
    const fetchInventaris = async () => {
      let q = supabase
        .from('inventaris')
        .select('jumlah_baik, kategori_inventaris!inner(lab_id)');
      if ([8, 9, 10].includes(adminProfile.lab_id)) {
        q = q.in('kategori_inventaris.lab_id', [8, 9, 10]);
      } else {
        q = q.eq('kategori_inventaris.lab_id', adminProfile.lab_id);
      }
      const { data } = await q;
      setStats((prev) => ({
        ...prev,
        alatJenis: data?.length ?? 0,
        alatTotal: (data || []).reduce(
          (acc: number, curr: any) => acc + (curr.jumlah_baik || 0),
          0,
        ),
      }));
    };

    fetchInventaris();
  }, [adminProfile, supabase]);

  useEffect(() => {
    const fetchRentang = async () => {
      setLoadingTren(true);
      try {
        const today = new Date();
        const awal = new Date(today);
        awal.setDate(today.getDate() - (rentangHari - 1));
        const pad = (n: number) => String(n).padStart(2, '0');
        const fmt = (d: Date) =>
          `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        const { data } = await applyLabFilter(
          supabase
            .from('peminjaman')
            .select('tanggal, status')
            .gte('tanggal', fmt(awal)),
          adminProfile.lab_id,
        );
        const rows = (data || []) as { tanggal: string; status: string }[];
        setTrenRaw(rows);
        // Kartu KPI status dihitung dari data rentang yang sama.
        let menunggu = 0;
        let disetujui = 0;
        let ditolak = 0;
        let selesai = 0;
        for (const row of rows) {
          if (row.status === 'Menunggu validasi') menunggu += 1;
          else if (row.status === 'Disetujui') disetujui += 1;
          else if (row.status === 'Ditolak') ditolak += 1;
          else if (row.status === 'Selesai') selesai += 1;
        }
        setStats((prev) => ({
          ...prev,
          menunggu,
          disetujui,
          ditolak,
          selesai,
          total: rows.length,
        }));
      } catch {
        setTrenRaw([]);
      } finally {
        setLoadingTren(false);
        setLoading(false);
      }
    };

    fetchRentang();
  }, [adminProfile, supabase, rentangHari]);

  // Derived (bukan effect): distribusi status untuk donut.
  // Derived: distribusi status DALAM rentang aktif — dihitung dari data
  // tren yang sama (tanggal+status), tanpa query tambahan.
  const distribusiData = useMemo(() => {
    let menunggu = 0;
    let disetujui = 0;
    let ditolak = 0;
    let selesai = 0;
    for (const row of trenRaw) {
      if (row.status === 'Menunggu validasi') menunggu += 1;
      else if (row.status === 'Disetujui') disetujui += 1;
      else if (row.status === 'Ditolak') ditolak += 1;
      else if (row.status === 'Selesai') selesai += 1;
    }
    return [
      { name: 'Menunggu Validasi', value: menunggu, fill: STATUS_COLORS.menunggu },
      { name: 'Diterima', value: disetujui, fill: STATUS_COLORS.disetujui },
      { name: 'Ditolak', value: ditolak, fill: STATUS_COLORS.ditolak },
      { name: 'Selesai', value: selesai, fill: STATUS_COLORS.selesai },
    ];
  }, [trenRaw]);

  // Derived: agregasi tren per bucket. 7 hari → per hari (label nama hari),
  // 30/90 hari → per minggu (label tanggal mulai minggu) agar bar tidak
  // berdesakan dan tick tetap terbaca di layar kecil.
  const trenData = useMemo(() => {
    const buckets: { key: string; label: string; jumlah: number }[] = [];
    const today = new Date();
    const pad2 = (n: number) => String(n).padStart(2, '0');
    const keyOf = (d: Date) =>
      `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    if (rentangHari === 7) {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        buckets.push({
          key: keyOf(d),
          label: d.toLocaleDateString('id-ID', { weekday: 'short' }),
          jumlah: 0,
        });
      }
    } else if (rentangHari === 365) {
      // 1 tahun → per bulan (12 bucket, label nama bulan).
      for (let i = 11; i >= 0; i--) {
        const ref = new Date(today.getFullYear(), today.getMonth() - i, 1);
        buckets.push({
          key: `m-${ref.getFullYear()}-${pad2(ref.getMonth() + 1)}`,
          label: ref.toLocaleDateString('id-ID', { month: 'short' }),
          jumlah: 0,
        });
      }
    } else {
      const awal = new Date(today);
      awal.setDate(today.getDate() - (rentangHari - 1));
      const cursor = new Date(awal);
      while (cursor <= today) {
        const label = cursor.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
        });
        buckets.push({ key: `w-${keyOf(cursor)}`, label, jumlah: 0 });
        cursor.setDate(cursor.getDate() + 7);
      }
    }
    if (rentangHari === 7) {
      const indexByTanggal = new Map(buckets.map((b, i) => [b.key, i]));
      for (const row of trenRaw) {
        const key =
          typeof row.tanggal === 'string' ? row.tanggal.slice(0, 10) : '';
        const idx = indexByTanggal.get(key);
        if (idx !== undefined) buckets[idx].jumlah += 1;
      }
    } else if (rentangHari === 365) {
      const indexByBulan = new Map(buckets.map((b, i) => [b.key, i]));
      for (const row of trenRaw) {
        if (typeof row.tanggal !== 'string') continue;
        const bulan = row.tanggal.slice(0, 7); // YYYY-MM
        const [y, m] = bulan.split('-');
        const idx = indexByBulan.get(`m-${y}-${m}`);
        if (idx !== undefined) buckets[idx].jumlah += 1;
      }
    } else {
      const awal = new Date(today);
      awal.setDate(today.getDate() - (rentangHari - 1));
      const awalMs = awal.getTime();
      for (const row of trenRaw) {
        if (typeof row.tanggal !== 'string') continue;
        const t = new Date(row.tanggal.slice(0, 10) + 'T00:00:00').getTime();
        if (Number.isNaN(t) || t < awalMs) continue;
        const weekIdx = Math.floor((t - awalMs) / (7 * 86400000));
        if (weekIdx >= 0 && weekIdx < buckets.length)
          buckets[weekIdx].jumlah += 1;
      }
    }
    return buckets;
  }, [trenRaw, rentangHari]);

  const kpiItems: KpiItem[] = [
    {
      key: 'menunggu',
      label: 'Menunggu Validasi',
      value: stats.menunggu,
      color: STATUS_COLORS.menunggu,
      icon: <Clock className='size-10' />,
      targetTab: 'pengajuan',
    },
    {
      key: 'disetujui',
      label: 'Pengajuan Diterima',
      value: stats.disetujui,
      color: STATUS_COLORS.disetujui,
      icon: <CheckSquare className='size-10' />,
      targetTab: 'riwayat',
    },
    {
      key: 'selesai',
      label: 'Pengujian Selesai',
      value: stats.selesai,
      color: STATUS_COLORS.selesai,
      icon: <CheckCheck className='size-10' />,
      targetTab: 'riwayat',
    },
    {
      key: 'ditolak',
      label: 'Ditolak',
      value: stats.ditolak,
      color: STATUS_COLORS.ditolak,
      icon: <XCircle className='size-10' />,
      targetTab: 'riwayat',
    },
    {
      key: 'total',
      label: 'Total Pengajuan',
      value: stats.total,
      color: '#0f172a',
      icon: <FileText className='size-10' />,
      targetTab: 'pengajuan',
    },
  ];

  const handleKpiClick = (item: KpiItem) => {
    if (setActiveTab && item.targetTab) setActiveTab(item.targetTab);
  };

  const handleInventarisKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActiveTab && setActiveTab('inventaris');
    }
  };

  if (loading) {
    return (
      <div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className='shadow-sm'>
              <CardContent className='p-6'>
                <div className='h-4 w-28 bg-slate-100 rounded animate-pulse mb-4' />
                <div className='h-8 w-16 bg-slate-100 rounded animate-pulse' />
              </CardContent>
            </Card>
          ))}
        </div>
        <ChartSkeleton />
      </div>
    );
  }

  const totalDistribusi = distribusiData.reduce((a, b) => a + b.value, 0);

  return (
    <div>
      {/* Rentang global: berlaku untuk KPI status, donut, dan tren */}
      <div className='flex flex-wrap items-center justify-between gap-3 mb-6'>
        <p className='text-sm font-medium text-slate-500'>
          Menampilkan data {rentangLabel} terakhir
        </p>
        <label className='flex items-center gap-2 text-sm font-medium text-slate-600'>
          Rentang
          <select
            value={rentangHari}
            onChange={(e) =>
              setRentangHari(Number(e.target.value) as 7 | 30 | 90 | 365)
            }
            aria-label='Pilih rentang dashboard'
            className='h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none'
          >
            {RENTANG_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {/* Baris KPI — klik kartu untuk lompat ke tab terkait */}
      <div
        role='group'
        aria-label='Ringkasan pengajuan'
        className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
      >
        {kpiItems.map((item) => (
          <StatusKpiCard
            key={item.key}
            item={item}
            onClick={() => handleKpiClick(item)}
          />
        ))}
        <Card
          onClick={() => setActiveTab && setActiveTab('inventaris')}
          onKeyDown={handleInventarisKeyDown}
          role='button'
          tabIndex={0}
          aria-label={`Info Inventaris: ${stats.alatTotal} unit tersedia dari ${stats.alatJenis} jenis alat`}
          className='border-l-4 border-l-purple-500 shadow-sm relative overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none'
        >
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

      {/* Baris diagram — dua komponen terpisah, satu rentang global */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6'>
        {/* Donut distribusi status dalam rentang aktif */}
        <Card className='shadow-sm'>
          <CardHeader className='pb-0'>
            <CardTitle className='text-base font-bold text-slate-800'>
              Distribusi Status ({rentangLabel})
            </CardTitle>
          </CardHeader>
          <CardContent className='p-4 sm:p-6'>
            {loadingTren ? (
              <div className='h-[240px] w-full bg-slate-100 rounded animate-pulse' />
            ) : trenRaw.length === 0 ? (
              <div className='h-[240px] flex flex-col items-center justify-center text-center text-slate-500'>
                <Clock className='size-10 text-slate-200 mb-3' />
                <p className='font-medium'>
                  Belum ada pengajuan {rentangLabel} terakhir
                </p>
                <p className='text-sm text-slate-400 mt-1'>
                  Diagram akan muncul setelah ada pengajuan masuk.
                </p>
              </div>
            ) : totalDistribusi === 0 ? (
              <div className='h-[240px] flex flex-col items-center justify-center text-center text-slate-500'>
                <FileText className='size-10 text-slate-200 mb-3' />
                <p className='font-medium'>Belum ada data pengajuan</p>
              </div>
            ) : (
              <div
                tabIndex={0}
                role='img'
                aria-label={`Distribusi status ${rentangLabel}: ${distribusiData
                  .map((d) => `${d.name} ${d.value}`)
                  .join(', ')}`}
                className='h-[240px] w-full focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none rounded-lg'
              >
                <ResponsiveContainer width='100%' height='100%'>
                  <PieChart>
                    <Pie
                      data={distribusiData}
                      dataKey='value'
                      nameKey='name'
                      innerRadius='55%'
                      outerRadius='80%'
                      paddingAngle={2}
                      isAnimationActive={!reduceMotion}
                      label={({ value }: any) =>
                        value > 0 ? String(value) : undefined
                      }
                    >
                      {distribusiData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: `1px solid ${GRID_COLOR}`,
                        fontSize: 14,
                      }}
                    />
                    <Legend iconType='circle' wrapperStyle={{ fontSize: 13 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bar tren dalam rentang aktif */}
        <Card className='shadow-sm'>
          <CardHeader className='pb-0'>
            <CardTitle className='text-base font-bold text-slate-800'>
              Tren Pengajuan ({rentangLabel})
            </CardTitle>
          </CardHeader>
          <CardContent className='p-4 sm:p-6'>
            {loadingTren ? (
              <div className='h-[240px] w-full bg-slate-100 rounded animate-pulse' />
            ) : trenRaw.length === 0 ? (
              <div className='h-[240px] flex flex-col items-center justify-center text-center text-slate-500'>
                <Clock className='size-10 text-slate-200 mb-3' />
                <p className='font-medium'>
                  Belum ada pengajuan {rentangLabel} terakhir
                </p>
                <p className='text-sm text-slate-400 mt-1'>
                  Tren pengajuan akan tampil di sini.
                </p>
              </div>
            ) : (
              <div
                  tabIndex={0}
                  role='img'
                  aria-label={`Tren ${rentangLabel}: ${trenData
                    .map((d) => `${d.label} ${d.jumlah}`)
                    .join(', ')}`}
                  className='h-[240px] w-full focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none rounded-lg'
                >
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart data={trenData}>
                      <CartesianGrid stroke={GRID_COLOR} vertical={false} />
                      <XAxis
                        dataKey='label'
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        axisLine={{ stroke: GRID_COLOR }}
                        tickLine={false}
                        interval={rentangHari === 365 ? 0 : 'preserveStartEnd'}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                        width={32}
                      />
                      <Tooltip
                        cursor={{ fill: '#f1f5f9' }}
                        contentStyle={{
                          borderRadius: 12,
                          border: `1px solid ${GRID_COLOR}`,
                          fontSize: 14,
                        }}
                        formatter={(value) => [`${value} pengajuan`, 'Total']}
                      />
                      <Bar
                        dataKey='jumlah'
                        fill={STATUS_COLORS.disetujui}
                        radius={[6, 6, 0, 0]}
                        maxBarSize={48}
                        isAnimationActive={!reduceMotion}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
