'use client';

import { useEffect, useState } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  Image as ImageIcon,
  CheckCircle2,
  Calendar,
  Inbox,
  Clock,
  UserCircle,
  FlaskConical,
  CreditCard,
  X,
  FileStack,
} from 'lucide-react';
import Swal from 'sweetalert2';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  16: 'Polyfish',
  17: 'Lab Simulator',
  18: 'Lab Radar',
};

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka || 0);
};

const formatDateStr = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export default function PengajuanTab({
  adminProfile,
  supabase,
}: {
  adminProfile: any;
  supabase: any;
}) {
  const [dataMenunggu, setDataMenunggu] = useState<any[]>([]);
  const [dataRiwayat, setDataRiwayat] = useState<any[]>([]);

  const [loadingMenunggu, setLoadingMenunggu] = useState(true);
  const [loadingRiwayat, setLoadingRiwayat] = useState(true);

  // State untuk Progress Loading 0-100%
  const [progressM, setProgressM] = useState(0);
  const [progressR, setProgressR] = useState(0);

  // Pagination State for Server-Side Riwayat
  const [page, setPage] = useState(1);
  const [totalRiwayatCount, setTotalRiwayatCount] = useState(0);
  const rowsPerPage = 10;

  const [selectedPengajuan, setSelectedPengajuan] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [pesanFeedback, setPesanFeedback] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. Fetching khusus "Menunggu Validasi" dengan Simulated Progress
  const fetchMenungguValidasi = async () => {
    setLoadingMenunggu(true);
    setProgressM(0);

    // Simulasi loading berjalan
    let currentM = 0;
    const interval = setInterval(() => {
      currentM += Math.floor(Math.random() * 15) + 10;
      if (currentM > 85) currentM = 85;
      setProgressM(currentM);
    }, 150);

    const { data: res1 } = await supabase
      .from('peminjaman')
      .select('*')
      .eq('status', 'Menunggu validasi')
      .eq('lab_id', adminProfile.lab_id)
      .order('created_at', { ascending: false });

    clearInterval(interval);
    setProgressM(100);

    setTimeout(() => {
      if (res1) setDataMenunggu(res1);
      setLoadingMenunggu(false);
    }, 250); // Beri jeda agar user sempat melihat angka 100%
  };

  // 2. Fetching SERVER-SIDE PAGINATION Riwayat dengan Simulated Progress
  const fetchRiwayatTerpaginasi = async (pageNumber: number) => {
    setLoadingRiwayat(true);
    setProgressR(0);

    let currentR = 0;
    const interval = setInterval(() => {
      currentR += Math.floor(Math.random() * 15) + 10;
      if (currentR > 85) currentR = 85;
      setProgressR(currentR);
    }, 150);

    const from = (pageNumber - 1) * rowsPerPage;
    const to = from + rowsPerPage - 1;

    const { data: res2, count } = await supabase
      .from('peminjaman')
      .select('*', { count: 'exact' })
      .eq('lab_id', adminProfile.lab_id)
      .neq('status', 'Menunggu validasi')
      .order('created_at', { ascending: false })
      .range(from, to);

    clearInterval(interval);
    setProgressR(100);

    setTimeout(() => {
      if (res2) setDataRiwayat(res2);
      if (count !== null) setTotalRiwayatCount(count);
      setLoadingRiwayat(false);
    }, 250);
  };

  useEffect(() => {
    fetchMenungguValidasi();
  }, []);

  useEffect(() => {
    fetchRiwayatTerpaginasi(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const openDetailModal = async (pengajuan: any) => {
    setSelectedPengajuan(pengajuan);
    setPesanFeedback(pengajuan.pesan_feedback || '');
    const { data: items } = await supabase
      .from('peminjaman_item')
      .select('*')
      .eq('peminjaman_id', pengajuan.id);
    setSelectedItems(items || []);
    setIsDialogOpen(true);
  };

  const handleVerifikasi = async (newStatus: string) => {
    if (!selectedPengajuan) return;
    setIsProcessing(true);
    const { error } = await supabase
      .from('peminjaman')
      .update({
        status: newStatus,
        pesan_feedback: pesanFeedback,
        admin_checker: adminProfile.email,
      })
      .eq('id', selectedPengajuan.id);
    setIsProcessing(false);

    if (error) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Gagal memproses validasi: ' + error.message,
        confirmButtonColor: '#ef4444',
      });
    } else {
      try {
        if (selectedPengajuan.email_pemohon) {
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'STATUS_UPDATE',
              to: selectedPengajuan.email_pemohon,
              data: {
                status_baru: newStatus,
                judul_kegiatan: selectedPengajuan.judul_kegiatan,
              },
            }),
          });
        }
        const pushIdentifier =
          selectedPengajuan.device_id || selectedPengajuan.email_pemohon;
        if (pushIdentifier) {
          await fetch('/api/send-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              identifier: pushIdentifier,
              title: 'Update Pengajuan',
              message: `Status pengajuan "${selectedPengajuan.judul_kegiatan}" telah diperbarui menjadi: ${newStatus}.`,
              url: '/administrasi/status',
            }),
          });
        }
      } catch (err) {
        console.error('Gagal mengirim notifikasi', err);
      }
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Status berhasil diubah.',
        confirmButtonColor: '#10b981',
      });
      setIsDialogOpen(false);

      // Refresh data
      fetchMenungguValidasi();
      fetchRiwayatTerpaginasi(page);
    }
  };

  const totalPages = Math.ceil(totalRiwayatCount / rowsPerPage) || 1;

  return (
    <div className='space-y-6 md:space-y-8'>
      <Tabs defaultValue='tindakan' className='w-full'>
        <TabsList className='h-auto w-full mb-6 grid grid-cols-2 p-1.5 bg-slate-200/70 rounded-xl md:w-[450px] shadow-inner'>
          <TabsTrigger
            value='tindakan'
            className='rounded-lg text-sm md:text-base font-bold data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-md transition-all py-3 px-2'>
            Perlu Tindakan
            {dataMenunggu.length > 0 && !loadingMenunggu && (
              <span className='ml-2 bg-red-500 text-white text-[10px] md:text-xs px-2 py-0.5 rounded-full'>
                {dataMenunggu.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value='riwayat'
            className='rounded-lg text-sm md:text-base font-bold data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-md transition-all py-3 px-2'>
            Riwayat
          </TabsTrigger>
        </TabsList>

        <div className='relative w-full min-h-[400px]'>
          {/* =========================================================
              TAB: PERLU TINDAKAN
             ========================================================= */}
          <TabsContent
            value='tindakan'
            className='mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500'>
            <div className='bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden'>
              <div className='p-5 md:p-6 border-b border-slate-100 bg-amber-50/30'>
                <h3 className='text-lg md:text-xl font-bold flex items-center gap-2 text-slate-800'>
                  <AlertCircle className='size-5 text-amber-500' /> Antrean
                  Persetujuan
                </h3>
                <p className='text-sm md:text-base text-slate-500 mt-1 md:ml-7'>
                  Menunggu validasi dan pengecekan Anda.
                </p>
              </div>

              {loadingMenunggu ? (
                <div className='flex flex-col items-center justify-center py-20 text-blue-500 bg-slate-50/50'>
                  <FileStack className='size-12 mb-4 text-blue-400' />
                  <span className='text-3xl font-black'>{progressM}%</span>
                  <p className='text-sm font-medium text-slate-500 mt-2'>
                    Memuat data antrean...
                  </p>
                </div>
              ) : dataMenunggu.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-16 px-4 text-center'>
                  <div className='size-16 bg-slate-50 rounded-full flex items-center justify-center mb-4'>
                    <CheckCircle2 className='size-8 text-slate-300' />
                  </div>
                  <p className='text-lg font-bold text-slate-700'>
                    Semua Beres!
                  </p>
                  <p className='text-slate-500 text-sm mt-1'>
                    Tidak ada antrean validasi pengajuan saat ini.
                  </p>
                </div>
              ) : (
                <>
                  {/* VIEW MOBILE */}
                  <div className='md:hidden flex flex-col gap-3 p-4 bg-slate-50/50'>
                    {dataMenunggu.map((item) => (
                      <div
                        key={item.id}
                        className='bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden transition-all active:scale-[0.98]'>
                        <div className='absolute top-0 left-0 w-1 h-full bg-amber-400' />
                        <div className='flex justify-between items-start gap-3 pl-2'>
                          <h4 className='font-bold text-slate-800 line-clamp-1 leading-tight'>
                            {item.nama_lengkap}
                          </h4>
                          <Badge className='bg-amber-100 text-amber-700 hover:bg-amber-100 border-none shrink-0 text-[10px] uppercase tracking-wider px-2 py-0.5'>
                            Baru
                          </Badge>
                        </div>
                        <div className='pl-2 text-sm text-slate-600 space-y-2'>
                          <p className='flex items-center gap-2.5 font-medium'>
                            <Calendar className='size-4 text-slate-400 shrink-0' />{' '}
                            {formatDateStr(item.tanggal)}
                          </p>
                          <p className='flex items-start gap-2.5'>
                            <ClipboardList className='size-4 text-slate-400 shrink-0 mt-0.5' />
                            <span className='line-clamp-2 leading-snug'>
                              {item.judul_kegiatan}
                            </span>
                          </p>
                        </div>
                        <Button
                          variant='outline'
                          className='w-full mt-2 h-11 border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100 font-bold'
                          onClick={() => openDetailModal(item)}>
                          <Eye className='size-4 mr-2' /> Lihat Detail
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* VIEW DESKTOP */}
                  <div className='hidden md:block overflow-x-auto'>
                    <Table>
                      <TableHeader className='bg-slate-50/80'>
                        <TableRow className='border-slate-100'>
                          <TableHead className='font-bold text-slate-700 h-12 px-6'>
                            Tanggal
                          </TableHead>
                          <TableHead className='font-bold text-slate-700 h-12'>
                            Nama Lengkap
                          </TableHead>
                          <TableHead className='font-bold text-slate-700 h-12'>
                            Kegiatan
                          </TableHead>
                          <TableHead className='font-bold text-slate-700 h-12 text-center'>
                            Aksi
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dataMenunggu.map((item) => (
                          <TableRow
                            key={item.id}
                            className='hover:bg-blue-50/30 transition-colors border-slate-100 group'>
                            <TableCell className='font-medium text-slate-600 px-6 py-4'>
                              <div className='flex items-center gap-2'>
                                <Calendar className='size-4 text-slate-400' />{' '}
                                {formatDateStr(item.tanggal)}
                              </div>
                            </TableCell>
                            <TableCell className='font-bold text-slate-900 py-4'>
                              {item.nama_lengkap}
                            </TableCell>
                            <TableCell className='py-4'>
                              <span
                                className='truncate block max-w-[250px] text-slate-600 font-medium'
                                title={item.judul_kegiatan}>
                                {item.judul_kegiatan}
                              </span>
                            </TableCell>
                            <TableCell className='text-center py-4'>
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() => openDetailModal(item)}
                                className='font-bold text-blue-600 border-blue-200 hover:bg-blue-50 transition-colors'>
                                <Eye className='size-4 mr-1.5' /> Periksa
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          {/* =========================================================
              TAB: RIWAYAT SEMUA PENGAJUAN (SERVER PAGINATION)
             ========================================================= */}
          <TabsContent
            value='riwayat'
            className='mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500'>
            <div className='bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden'>
              <div className='p-5 md:p-6 border-b border-slate-100'>
                <h3 className='text-lg md:text-xl font-bold flex items-center gap-2 text-slate-800'>
                  <ClipboardList className='size-5 text-blue-600' /> Riwayat
                  Peminjaman
                </h3>
                <p className='text-sm md:text-base text-slate-500 mt-1 md:ml-7'>
                  Arsip lengkap transaksi & pengajuan lab.
                </p>
              </div>

              {loadingRiwayat ? (
                <div className='flex flex-col items-center justify-center py-24 text-blue-500 bg-slate-50/50'>
                  <ClipboardList className='size-12 mb-4 text-blue-400' />
                  <span className='text-3xl font-black'>{progressR}%</span>
                  <p className='text-sm font-medium text-slate-500 mt-2'>
                    Memuat riwayat arsip...
                  </p>
                </div>
              ) : dataRiwayat.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-16 px-4 text-center'>
                  <div className='size-16 bg-slate-50 rounded-full flex items-center justify-center mb-4'>
                    <Inbox className='size-8 text-slate-300' />
                  </div>
                  <p className='text-lg font-bold text-slate-700'>
                    Belum Ada Riwayat
                  </p>
                  <p className='text-slate-500 text-sm mt-1'>
                    Data pengajuan yang sudah diproses akan tampil di sini.
                  </p>
                </div>
              ) : (
                <>
                  {/* VIEW MOBILE */}
                  <div className='md:hidden flex flex-col gap-3 p-4 bg-slate-50/50'>
                    {dataRiwayat.map((item) => (
                      <div
                        key={item.id}
                        className='bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden transition-all active:scale-[0.98]'>
                        <div
                          className={`absolute top-0 left-0 w-1 h-full ${item.status === 'Selesai' ? 'bg-emerald-500' : item.status === 'Disetujui' ? 'bg-blue-500' : item.status === 'Ditolak' ? 'bg-red-500' : 'bg-slate-300'}`}
                        />
                        <div className='flex justify-between items-start gap-2 pl-2'>
                          <div className='flex flex-col min-w-0'>
                            <h4 className='font-bold text-slate-800 line-clamp-1 leading-tight'>
                              {item.nama_lengkap}
                            </h4>
                            <p className='text-xs text-slate-400 mt-0.5 flex items-center gap-1'>
                              <Clock className='size-3' />{' '}
                              {formatDateStr(item.tanggal)}
                            </p>
                          </div>
                          {item.status === 'Selesai' ? (
                            <Badge className='bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none shrink-0 text-[10px] uppercase tracking-wider px-2 py-0.5'>
                              <CheckCircle2 className='size-3 mr-1' /> Selesai
                            </Badge>
                          ) : (
                            <Badge
                              variant={
                                item.status === 'Disetujui'
                                  ? 'default'
                                  : item.status === 'Ditolak'
                                    ? 'destructive'
                                    : 'secondary'
                              }
                              className='shrink-0 text-[10px] uppercase tracking-wider px-2 py-0.5'>
                              {item.status || 'Menunggu'}
                            </Badge>
                          )}
                        </div>
                        <div className='pl-2 text-sm text-slate-600 border-t border-slate-50 pt-2 mt-1'>
                          <span className='line-clamp-2 leading-snug'>
                            {item.judul_kegiatan}
                          </span>
                        </div>
                        <Button
                          variant='ghost'
                          className='w-full mt-1 h-10 border border-slate-200 text-slate-600 font-semibold'
                          onClick={() => openDetailModal(item)}>
                          Detail Riwayat
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* VIEW DESKTOP */}
                  <div className='hidden md:block overflow-x-auto'>
                    <Table>
                      <TableHeader className='bg-slate-50/80'>
                        <TableRow className='border-slate-100'>
                          <TableHead className='font-bold text-slate-700 h-12 px-6'>
                            Nama Peminjam
                          </TableHead>
                          <TableHead className='font-bold text-slate-700 h-12'>
                            Tanggal
                          </TableHead>
                          <TableHead className='font-bold text-slate-700 h-12 max-w-[250px]'>
                            Kegiatan
                          </TableHead>
                          <TableHead className='font-bold text-slate-700 h-12 text-center'>
                            Status
                          </TableHead>
                          <TableHead className='font-bold text-slate-700 h-12 text-center'>
                            Aksi
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dataRiwayat.map((item) => (
                          <TableRow
                            key={item.id}
                            className='hover:bg-slate-50/50 transition-colors border-slate-100'>
                            <TableCell className='font-bold text-slate-900 px-6 py-4'>
                              {item.nama_lengkap}
                            </TableCell>
                            <TableCell className='font-medium text-slate-500 py-4'>
                              {formatDateStr(item.tanggal)}
                            </TableCell>
                            <TableCell className='py-4'>
                              <span
                                className='truncate block max-w-[250px] text-slate-600 font-medium'
                                title={item.judul_kegiatan}>
                                {item.judul_kegiatan}
                              </span>
                            </TableCell>
                            <TableCell className='text-center py-4'>
                              {item.status === 'Selesai' ? (
                                <Badge className='bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 shadow-sm'>
                                  <CheckCircle2 className='size-3.5 mr-1.5' />{' '}
                                  Selesai
                                </Badge>
                              ) : (
                                <Badge
                                  variant={
                                    item.status === 'Disetujui'
                                      ? 'default'
                                      : item.status === 'Ditolak'
                                        ? 'destructive'
                                        : 'secondary'
                                  }
                                  className='shadow-sm'>
                                  {item.status || 'Menunggu'}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className='text-center py-4'>
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() => openDetailModal(item)}
                                className='font-semibold text-slate-600'>
                                <Eye className='size-4 mr-1.5' /> View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}

              {/* PAGINATION SERVER-SIDE */}
              <div className='flex flex-col sm:flex-row items-center justify-between sm:justify-end gap-3 p-4 sm:p-5 bg-slate-50/80 border-t border-slate-100'>
                <span className='text-sm font-semibold text-slate-500 sm:mr-4'>
                  Total Data: {totalRiwayatCount} | Halaman {page} dari{' '}
                  {totalPages}
                </span>
                <div className='flex gap-2 w-full sm:w-auto'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || loadingRiwayat}
                    className='flex-1 sm:flex-none h-10 font-bold'>
                    <ChevronLeft className='size-4 mr-1' /> Prev
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || loadingRiwayat}
                    className='flex-1 sm:flex-none h-10 font-bold'>
                    Next <ChevronRight className='size-4 ml-1' />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* POP-UP DETAIL REDESIGN */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='w-[95vw] lg:max-w-[85vw] xl:max-w-[75vw] max-h-[85vh] overflow-hidden rounded-2xl flex flex-col p-0 bg-slate-50 border-none shadow-2xl [&>button]:hidden'>
          <div className='shrink-0 bg-white border-b border-slate-200 px-5 py-4 flex items-start justify-between z-20 shadow-sm'>
            <div className='flex flex-col'>
              <DialogTitle className='text-xl md:text-2xl font-black text-slate-800'>
                Detail Pengajuan
              </DialogTitle>
              <DialogDescription className='text-sm md:text-base text-slate-500 mt-1'>
                Periksa rincian peminjam, alat, dan tagihan dengan saksama.
              </DialogDescription>
            </div>
            <Button
              variant='ghost'
              size='icon'
              className='shrink-0 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors'
              onClick={() => setIsDialogOpen(false)}>
              <X className='size-6' />
            </Button>
          </div>

          <div className='flex-1 overflow-y-auto p-4 sm:p-6'>
            {selectedPengajuan && (
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 items-start'>
                {/* KOLOM KIRI */}
                <div className='space-y-6 w-full min-w-0'>
                  <div className='bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden'>
                    <div className='bg-slate-100/80 border-b border-slate-200 px-5 py-3.5'>
                      <h3 className='text-base md:text-lg font-bold flex items-center gap-2 text-slate-800'>
                        <UserCircle className='size-5 text-blue-600' />{' '}
                        Informasi Pemohon
                      </h3>
                    </div>
                    <div className='p-5 grid grid-cols-2 gap-y-5 gap-x-4 text-sm'>
                      <div className='col-span-2 sm:col-span-1 min-w-0'>
                        <p className='font-semibold text-slate-500 mb-1'>
                          Nama Lengkap
                        </p>
                        <p className='font-bold text-slate-900 text-base break-words'>
                          {selectedPengajuan.nama_lengkap}
                        </p>
                      </div>
                      <div className='col-span-2 sm:col-span-1 min-w-0'>
                        <p className='font-semibold text-slate-500 mb-1'>
                          Email
                        </p>
                        <p className='font-bold text-slate-900 text-base break-words'>
                          {selectedPengajuan.email_pemohon || '-'}
                        </p>
                      </div>
                      <div className='col-span-2 sm:col-span-1 min-w-0'>
                        <p className='font-semibold text-slate-500 mb-1'>
                          Kategori
                        </p>
                        <Badge
                          variant='outline'
                          className='bg-blue-50 text-blue-700 text-xs'>
                          {selectedPengajuan.kategori_pemohon}
                        </Badge>
                      </div>

                      {selectedPengajuan.kategori_pemohon?.toLowerCase() ===
                      'umum' ? (
                        <div className='col-span-2 sm:col-span-1 min-w-0'>
                          <p className='font-semibold text-slate-500 mb-1'>
                            NIK KTP
                          </p>
                          <p className='font-bold text-slate-900 break-words'>
                            {selectedPengajuan.nik || '-'}
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className='col-span-2 sm:col-span-1 min-w-0'>
                            <p className='font-semibold text-slate-500 mb-1'>
                              NPM / NIP
                            </p>
                            <p className='font-bold text-slate-900 break-words'>
                              {selectedPengajuan.npm || '-'}
                            </p>
                          </div>
                          <div className='col-span-2 sm:col-span-1 min-w-0'>
                            <p className='font-semibold text-slate-500 mb-1'>
                              Program Studi
                            </p>
                            <p className='font-bold text-slate-900 break-words'>
                              {selectedPengajuan.program_studi || '-'}
                            </p>
                          </div>
                        </>
                      )}
                      <div className='col-span-2 min-w-0'>
                        <p className='font-semibold text-slate-500 mb-1'>
                          Dosen / PIC
                        </p>
                        <p className='font-bold text-slate-900 text-base break-words'>
                          {selectedPengajuan.dosen_pembimbing || '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden'>
                    <div className='bg-slate-100/80 border-b border-slate-200 px-5 py-3.5'>
                      <h3 className='text-base md:text-lg font-bold flex items-center gap-2 text-slate-800'>
                        <ClipboardList className='size-5 text-blue-600' />{' '}
                        Rincian Kegiatan
                      </h3>
                    </div>
                    <div className='p-5 space-y-5'>
                      <div className='min-w-0'>
                        <p className='font-semibold text-slate-500 text-sm mb-1.5'>
                          Judul Kegiatan
                        </p>
                        <div className='bg-blue-50 text-blue-800 p-3 rounded-lg border border-blue-100 font-bold text-base break-words'>
                          {selectedPengajuan.judul_kegiatan}
                        </div>
                      </div>
                      <div className='grid grid-cols-2 gap-4'>
                        <div>
                          <p className='font-semibold text-slate-500 text-sm mb-1'>
                            Tanggal
                          </p>
                          <p className='font-bold text-slate-900 text-base'>
                            {selectedPengajuan.tanggal
                              ? new Date(
                                  selectedPengajuan.tanggal,
                                ).toLocaleDateString('id-ID', {
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                })
                              : '-'}
                          </p>
                        </div>
                        <div>
                          <p className='font-semibold text-slate-500 text-sm mb-1'>
                            Waktu
                          </p>
                          <p className='font-bold text-blue-600 text-base'>
                            {selectedPengajuan.jam_mulai} -{' '}
                            {selectedPengajuan.jam_selesai} WIB
                          </p>
                        </div>
                        <div className='col-span-2 pt-3 border-t border-slate-100'>
                          <p className='font-semibold text-slate-500 text-sm mb-1'>
                            Lab Target
                          </p>
                          <p className='font-black text-slate-900 text-lg'>
                            {labMap[selectedPengajuan.lab_id] ||
                              selectedPengajuan.lab_id}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* KOLOM KANAN */}
                <div className='space-y-6 w-full min-w-0 flex flex-col'>
                  <div className='bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden flex-1'>
                    <div className='bg-slate-100/80 border-b border-slate-200 px-5 py-3.5'>
                      <h3 className='text-base md:text-lg font-bold flex items-center gap-2 text-slate-800'>
                        <FlaskConical className='size-5 text-blue-600' />{' '}
                        Logistik Alat & Bahan
                      </h3>
                    </div>
                    <div className='p-0 sm:p-0'>
                      <div className='max-h-[200px] overflow-y-auto bg-white'>
                        <Table>
                          <TableHeader className='bg-slate-50 sticky top-0 z-10'>
                            <TableRow>
                              <TableHead className='font-semibold text-slate-700 px-5'>
                                Nama Alat
                              </TableHead>
                              <TableHead className='font-semibold text-slate-700 text-center w-24'>
                                Qty
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedItems.map((itm) => (
                              <TableRow
                                key={itm.id}
                                className='hover:bg-slate-50'>
                                <TableCell className='py-3 px-5 font-medium text-slate-800 break-words'>
                                  {itm.nama_alat_bahan}
                                </TableCell>
                                <TableCell className='py-3 text-center'>
                                  <Badge
                                    variant='outline'
                                    className='text-sm px-2'>
                                    {itm.jumlah}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                            {selectedItems.length === 0 && (
                              <TableRow>
                                <TableCell
                                  colSpan={2}
                                  className='text-center text-slate-500 py-6 italic'>
                                  Hanya meminjam ruangan (Tidak ada alat).
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>

                  <div className='bg-gradient-to-br from-white to-blue-50/30 border border-slate-200 shadow-sm rounded-xl overflow-hidden'>
                    <div className='bg-slate-100/80 border-b border-slate-200 px-5 py-3.5'>
                      <h3 className='text-base md:text-lg font-bold flex items-center gap-2 text-slate-800'>
                        <FlaskConical className='size-5 text-blue-600' /> Layanan
                        Uji Lab & Tagihan
                      </h3>
                    </div>
                    <div className='p-5 space-y-4'>
                      {!selectedPengajuan.detail_layanan ||
                      selectedPengajuan.detail_layanan.length === 0 ? (
                        <div className='p-4 bg-slate-50 border border-slate-200 rounded-lg text-center text-slate-500 italic text-sm'>
                          Tidak ada layanan uji khusus yang dipilih.
                        </div>
                      ) : (
                        <div className='space-y-3'>
                          <ul className='space-y-2'>
                            {selectedPengajuan.detail_layanan.map(
                              (l: any, i: number) => {
                                const harga =
                                  selectedPengajuan.kategori_pemohon === 'Umum'
                                    ? l.harga_eksternal
                                    : l.harga_internal;
                                return (
                                  <li
                                    key={i}
                                    className='flex justify-between items-start gap-4 bg-white border border-slate-200 p-3 rounded-lg shadow-sm'>
                                    <span className='font-medium text-slate-800 text-sm leading-tight break-words'>
                                      {l.nama_layanan}
                                    </span>
                                    <Badge className='bg-blue-100 text-blue-800 hover:bg-blue-100 shrink-0 border-none'>
                                      {formatRupiah(harga)}
                                    </Badge>
                                  </li>
                                );
                              },
                            )}
                          </ul>
                          <div className='flex justify-between items-center bg-blue-600 text-white p-4 rounded-xl shadow-md mt-4'>
                            <span className='font-bold text-blue-50'>
                              Total Tagihan
                            </span>
                            <span className='text-xl md:text-2xl font-black'>
                              {formatRupiah(selectedPengajuan.total_biaya)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {(selectedPengajuan.kategori_pemohon?.toLowerCase() ===
                    'umum' ||
                    (selectedPengajuan.total_biaya &&
                      selectedPengajuan.total_biaya > 0)) && (
                    <div className='bg-white border border-blue-200 shadow-md shadow-blue-900/5 rounded-xl overflow-hidden'>
                      <div className='bg-blue-600 border-b border-blue-700 px-5 py-3.5'>
                        <h3 className='text-base md:text-lg font-bold flex items-center gap-2 text-white'>
                          <CreditCard className='size-5 text-blue-200' /> Bukti
                          Pembayaran
                        </h3>
                      </div>
                      <div className='p-5 bg-blue-50/50'>
                        {selectedPengajuan.bukti_pembayaran ? (
                          <div className='flex flex-col items-center justify-center p-5 border-2 border-dashed border-blue-300 rounded-xl bg-white'>
                            <ImageIcon className='size-10 text-blue-500 mb-3' />
                            <p className='text-sm font-semibold text-slate-700 mb-4'>
                              Struk transfer telah diunggah pemohon
                            </p>
                            <Button
                              className='w-full bg-blue-600 hover:bg-blue-700 shadow-md font-semibold gap-2'
                              asChild>
                              <a
                                href={selectedPengajuan.bukti_pembayaran}
                                target='_blank'
                                rel='noopener noreferrer'>
                                Buka Dokumen Bukti{' '}
                                <ExternalLink className='size-4' />
                              </a>
                            </Button>
                          </div>
                        ) : (
                          <div className='flex flex-col items-center justify-center p-6 border-2 border-dashed border-red-200 rounded-xl bg-red-50'>
                            <AlertCircle className='size-8 text-red-500 mb-2' />
                            <p className='text-red-700 font-bold text-center'>
                              Bukti transfer belum diunggah
                            </p>
                            <p className='text-red-500 text-sm text-center mt-1'>
                              Pengajuan berbayar wajib melampirkan bukti.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedPengajuan.status === 'Menunggu validasi' ? (
                    <div className='space-y-2 pt-2'>
                      <Label
                        htmlFor='pesanFeedback'
                        className='text-base font-bold text-slate-800'>
                        Pesan / Alasan Keputusan (Opsional)
                      </Label>
                      <Textarea
                        id='pesanFeedback'
                        placeholder='Tulis alasan jika ditolak, atau pesan untuk peminjam jika diterima...'
                        className='resize-none h-24 text-base bg-white border-slate-300 shadow-sm'
                        value={pesanFeedback}
                        onChange={(e) => setPesanFeedback(e.target.value)}
                      />
                    </div>
                  ) : selectedPengajuan.pesan_feedback ? (
                    <div className='space-y-2 pt-2'>
                      <Label className='text-base font-bold text-slate-800'>
                        Pesan Feedback Admin
                      </Label>
                      <div className='bg-white border border-slate-200 shadow-sm p-4 rounded-xl text-base text-slate-800 font-medium break-words'>
                        {selectedPengajuan.pesan_feedback}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          {selectedPengajuan?.status === 'Menunggu validasi' && (
            <div className='shrink-0 bg-white border-t border-slate-200 p-4 sm:px-6 flex gap-3 flex-col sm:flex-row sm:justify-end z-20'>
              <Button
                type='button'
                variant='destructive'
                className='w-full sm:w-auto h-12 text-base font-bold px-8 shadow-sm'
                disabled={isProcessing}
                onClick={() => handleVerifikasi('Ditolak')}>
                <XCircle className='size-5 mr-2' /> Tolak Pengajuan
              </Button>
              <Button
                type='button'
                className='w-full sm:w-auto h-12 text-base font-bold bg-green-600 hover:bg-green-700 text-white px-8 shadow-sm'
                disabled={isProcessing}
                onClick={() => handleVerifikasi('Disetujui')}>
                <CheckCircle className='size-5 mr-2' /> Terima Pengajuan
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
