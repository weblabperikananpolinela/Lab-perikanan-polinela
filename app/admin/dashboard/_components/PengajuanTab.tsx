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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// 1. Daftar 18 Lab/TEFA Terbaru
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

// Fungsi applyLabFilter lama SUDAH DIHAPUS karena logika Multi-tenant berubah.

// 2. LIHAT PENGAJUAN TAB
export default function PengajuanTab({
  adminProfile,
  supabase,
}: {
  adminProfile: any;
  supabase: any;
}) {
  const [dataMenunggu, setDataMenunggu] = useState<any[]>([]);
  const [dataRiwayat, setDataRiwayat] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination State for Riwayat
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Detail Modal State
  const [selectedPengajuan, setSelectedPengajuan] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [pesanFeedback, setPesanFeedback] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchPengajuan = async () => {
    setLoading(true);

    // Fetch Menunggu (Hanya untuk lab admin yang aktif)
    const { data: res1 } = await supabase
      .from('peminjaman')
      .select('*')
      .eq('status', 'Menunggu validasi')
      .eq('lab_id', adminProfile.lab_id)
      .order('created_at', { ascending: false });
    
    if (res1) setDataMenunggu(res1);

    // Fetch All Riwayat (termasuk yang tidak menunggu, hanya untuk lab ini)
    const { data: res2 } = await supabase
      .from('peminjaman')
      .select('*')
      .eq('lab_id', adminProfile.lab_id)
      .order('created_at', { ascending: false });
      
    if (res2) setDataRiwayat(res2);

    setLoading(false);
  };

  useEffect(() => {
    fetchPengajuan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDetailModal = async (pengajuan: any) => {
    setSelectedPengajuan(pengajuan);
    setPesanFeedback(pengajuan.pesan_feedback || '');

    // Fetch items
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
        admin_checker: adminProfile.email
      })
      .eq('id', selectedPengajuan.id);

    setIsProcessing(false);

    // Menggunakan SweetAlert2 agar lebih elegan
    if (error) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Gagal memproses validasi pengajuan: ' + error.message,
        confirmButtonColor: '#ef4444'
      });
    } else {
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: `Pengajuan berhasil di-${newStatus.toLowerCase()}!`,
        confirmButtonColor: '#10b981'
      });
      setIsDialogOpen(false);
      fetchPengajuan(); // Refresh
    }
  };

  const totalPages = Math.ceil(dataRiwayat.length / rowsPerPage);
  const paginatedRiwayat = dataRiwayat.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  if (loading)
    return (
      <div className='animate-pulse text-lg text-slate-500 font-medium'>
        Memuat data pengajuan...
      </div>
    );

  return (
    <div className='space-y-8'>
      <Tabs defaultValue="tindakan" className="w-full">
        <TabsList className="h-auto w-full mb-6 grid lg:w-[500px] grid-cols-2 p-1.5 bg-slate-200/60 rounded-xl">
          <TabsTrigger value="tindakan" className="rounded-lg text-base font-semibold data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-md transition-all duration-300 py-2.5 px-4">
            Perlu Tindakan
          </TabsTrigger>
          <TabsTrigger value="riwayat" className="rounded-lg text-base font-semibold data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-md transition-all duration-300 py-2.5 px-4">
            Riwayat Pengajuan
          </TabsTrigger>
        </TabsList>

        <div className="relative w-full min-h-[400px]">
          {/* BAGIAN ATAS: Menunggu Validasi */}
          <TabsContent value="tindakan" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both focus-visible:ring-0">
            <Card className='border-slate-200 shadow-sm border-t-4 border-t-amber-400'>
              <CardHeader>
                <CardTitle className='text-xl flex items-center gap-2'>
                  <AlertCircle className='size-5 text-amber-500' />
                  Perlu Tindakan (Menunggu Validasi)
                </CardTitle>
                <CardDescription className='text-base text-slate-600'>
                  Daftar pengajuan yang masuk dan memerlukan persetujuan dari lab
                  Anda.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='rounded-md border overflow-x-auto'>
                  <Table>
                    <TableHeader className='bg-slate-50'>
                      <TableRow>
                        <TableHead className='font-semibold text-slate-800 text-base'>
                          Tanggal
                        </TableHead>
                        <TableHead className='font-semibold text-slate-800 text-base'>
                          Nama Lengkap
                        </TableHead>
                        <TableHead className='font-semibold text-slate-800 text-base'>
                          Kegiatan
                        </TableHead>
                        <TableHead className='font-semibold text-slate-800 text-center text-base'>
                          Aksi
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dataMenunggu.map((item) => (
                        <TableRow key={item.id} className='hover:bg-slate-50/50'>
                          <TableCell className='font-medium text-slate-600 text-base'>
                            {item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                          </TableCell>
                          <TableCell className='font-semibold text-slate-900 text-base'>
                            {item.nama_lengkap}
                          </TableCell>
                          <TableCell
                            className='truncate max-w-[200px] text-base'
                            title={item.judul_kegiatan}>
                            {item.judul_kegiatan}
                          </TableCell>
                          <TableCell className='text-center'>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() => openDetailModal(item)}
                              className='font-medium text-base py-4'>
                              <Eye className='size-4 mr-1' /> Detail
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {dataMenunggu.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className='text-center py-10 text-slate-500 text-lg'>
                            Tidak ada antrean validasi pengajuan saat ini.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* BAGIAN BAWAH: Riwayat Lengkap */}
          <TabsContent value="riwayat" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both focus-visible:ring-0">
            <Card className='border-slate-200 shadow-sm'>
              <CardHeader>
                <CardTitle className='text-xl flex items-center gap-2'>
                  <ClipboardList className='size-5 text-slate-600' />
                  Riwayat Semua Pengajuan
                </CardTitle>
                <CardDescription className='text-base text-slate-600'>
                  Daftar arsip penuh seluruh transaksi peminjaman.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='rounded-md border overflow-x-auto'>
                  <Table>
                    <TableHeader className='bg-slate-50'>
                      <TableRow>
                        <TableHead className='font-semibold text-slate-800 text-base'>
                          Nama
                        </TableHead>
                        <TableHead className='font-semibold text-slate-800 text-base'>
                          Tanggal
                        </TableHead>
                        <TableHead className='font-semibold text-slate-800 max-w-[200px] text-base'>
                          Kegiatan
                        </TableHead>
                        <TableHead className='font-semibold text-slate-800 text-right text-base'>
                          Status
                        </TableHead>
                        <TableHead className='font-semibold text-slate-800 text-center text-base'>
                          Aksi
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedRiwayat.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className='font-medium text-slate-900 text-base'>
                            {item.nama_lengkap}
                          </TableCell>
                          <TableCell className='text-slate-600 text-base'>
                            {item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                          </TableCell>
                          <TableCell
                            className='text-slate-600 truncate max-w-[200px] text-base'
                            title={item.judul_kegiatan}>
                            {item.judul_kegiatan}
                          </TableCell>
                          <TableCell className='text-right'>
                            <Badge
                              variant={
                                item.status === 'Disetujui'
                                  ? 'default'
                                  : item.status === 'Ditolak'
                                    ? 'destructive'
                                    : 'secondary'
                              }
                              className='text-sm px-2 py-1'>
                              {item.status || 'Menunggu validasi'}
                            </Badge>
                          </TableCell>
                          <TableCell className='text-center'>
                            <Button size='sm' variant='outline' onClick={() => openDetailModal(item)}>
                              <Eye className="size-4 mr-1"/> Detail
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {paginatedRiwayat.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className='text-center py-10 text-slate-500 text-lg'>
                            Belum ada riwayat pengajuan.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className='flex items-center justify-end space-x-2 mt-4'>
                    <span className='text-base text-slate-500 mr-4'>
                      Halaman {page} dari {totalPages}
                    </span>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="text-base"
                    >
                      <ChevronLeft className='size-4 mr-1' /> Prev
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="text-base"
                    >
                      Next <ChevronRight className='size-4 ml-1' />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      {/* POP-UP DETAIL */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='sm:max-w-xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='text-2xl font-bold'>
              Detail Pengajuan
            </DialogTitle>
            <DialogDescription className='text-base'>
              Periksa rincian peminjam dan alat dengan saksama sebelum mengambil
              keputusan.
            </DialogDescription>
          </DialogHeader>

          {selectedPengajuan && (
            <div className='space-y-6 mt-4'>
              <div className='grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100'>
                <div className="col-span-2 md:col-span-1">
                  <p className='font-semibold text-slate-500'>Nama Lengkap</p>
                  <p className='font-bold text-slate-900 text-base'>
                    {selectedPengajuan.nama_lengkap}
                  </p>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <p className='font-semibold text-slate-500'>Email</p>
                  <p className='font-bold text-slate-900 text-base'>
                    {selectedPengajuan.email_pemohon || '-'}
                  </p>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <p className='font-semibold text-slate-500'>Kategori</p>
                  <p className='font-bold text-slate-900 text-base'>
                    {selectedPengajuan.kategori_pemohon}
                  </p>
                </div>

                {selectedPengajuan.kategori_pemohon?.toLowerCase().includes('umum') || selectedPengajuan.kategori_pemohon?.toLowerCase().includes('eksternal') ? (
                  <div className="col-span-2 md:col-span-1">
                    <p className='font-semibold text-slate-500'>NIK</p>
                    <p className='font-bold text-slate-900'>
                      {selectedPengajuan.nik || '-'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="col-span-2 md:col-span-1">
                      <p className='font-semibold text-slate-500'>NPM / NIP</p>
                      <p className='font-bold text-slate-900'>
                        {selectedPengajuan.npm || '-'}
                      </p>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <p className='font-semibold text-slate-500'>Program Studi</p>
                      <p className='font-bold text-slate-900'>
                        {selectedPengajuan.program_studi || '-'}
                      </p>
                    </div>
                  </>
                )}
                
                <div className="col-span-2 md:col-span-1">
                  <p className='font-semibold text-slate-500'>Dosen / PIC</p>
                  <p className='font-bold text-slate-900 text-base'>
                    {selectedPengajuan.dosen_pembimbing || '-'}
                  </p>
                </div>
              </div>

              <div className='space-y-1'>
                <p className='font-semibold text-slate-500 text-sm'>
                  Judul Kegiatan
                </p>
                <p className='text-base font-medium'>
                  {selectedPengajuan.judul_kegiatan}
                </p>
              </div>

              <div className='space-y-1'>
                <p className='font-semibold text-slate-500 text-sm'>
                  Waktu &amp; Tempat
                </p>
                <div className='bg-white border rounded-lg p-3'>
                  <p className='font-medium text-base'>
                    Tanggal:{' '}
                    <span className='font-bold text-slate-800'>
                      {selectedPengajuan.tanggal ? new Date(selectedPengajuan.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                    </span>
                  </p>
                  <p className='font-medium text-base mt-0.5'>
                    Waktu:{' '}
                    <span className='font-bold text-blue-700'>
                      {selectedPengajuan.jam_mulai} - {selectedPengajuan.jam_selesai} WIB
                    </span>
                  </p>
                  <p className='text-slate-500 mt-2 text-base font-medium'>
                    Lab Target: <span className="text-slate-700">{labMap[selectedPengajuan.lab_id] || selectedPengajuan.lab_id}</span>
                  </p>
                </div>
              </div>

              <div className='space-y-1'>
                <p className='font-semibold text-slate-500 text-sm'>
                  Alat yang Dipinjam
                </p>
                <div className='border rounded-md'>
                  <Table>
                    <TableHeader className='bg-slate-50'>
                      <TableRow>
                        <TableHead className='h-8 py-1'>Nama Alat</TableHead>
                        <TableHead className='h-8 py-1 text-center'>
                          Jml
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedItems.map((itm) => (
                        <TableRow key={itm.id} className='h-8'>
                          <TableCell className='py-2 text-sm font-medium'>
                            {itm.nama_alat_bahan}
                          </TableCell>
                          <TableCell className='py-2 text-sm text-center'>
                            {itm.jumlah}
                          </TableCell>
                        </TableRow>
                      ))}
                      {selectedItems.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={2}
                            className='text-center text-xs py-2'>
                            Tidak ada data alat.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {selectedPengajuan.status === 'Menunggu validasi' ? (
                <div className='space-y-2 pt-2 border-t'>
                  <Label htmlFor='pesanFeedback' className='text-base font-semibold'>
                    Pesan Feedback / Alasan (Opsional)
                  </Label>
                  <Textarea
                    id='pesanFeedback'
                    placeholder='Misal: Harap kembalikan bersih, atau Alasan penolakan terperinci.'
                    className='resize-none text-base'
                    rows={3}
                    value={pesanFeedback}
                    onChange={(e) => setPesanFeedback(e.target.value)}
                  />
                </div>
              ) : selectedPengajuan.pesan_feedback ? (
                <div className='space-y-1 pt-2 border-t'>
                  <p className='font-semibold text-slate-500 text-sm'>
                    Pesan Feedback / Alasan
                  </p>
                  <div className="bg-slate-100 p-3 rounded-md text-base text-slate-800 font-medium">
                     {selectedPengajuan.pesan_feedback}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {selectedPengajuan?.status === 'Menunggu validasi' && (
            <DialogFooter className='mt-6 flex gap-3 sm:justify-between w-full'>
              <Button
                type='button'
                variant='destructive'
                className='w-full sm:w-1/2 py-6 text-base font-bold shadow-sm'
                disabled={isProcessing}
                onClick={() => handleVerifikasi('Ditolak')}>
                <XCircle className='size-5 mr-2' /> Tolak Pengajuan
              </Button>
              <Button
                type='button'
                className='w-full sm:w-1/2 py-6 text-base font-bold bg-green-600 hover:bg-green-700 shadow-sm text-white'
                disabled={isProcessing}
                onClick={() => handleVerifikasi('Disetujui')}>
                <CheckCircle className='size-5 mr-2' /> Terima Pengajuan
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}