'use client';

import { useEffect, useState } from 'react';
import { CheckSquare, Eye, Plus, PackageCheck, RotateCcw } from 'lucide-react';
import Swal from 'sweetalert2';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Daftar 18 Lab/TEFA Terbaru
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

// --- Tipe untuk form pengembalian per-item ---
interface ReturnItemForm {
  id: number;
  nama_alat_bahan: string;
  jumlah: number;
  jumlah_kembali_baik: number;
  jumlah_kembali_rusak_ringan: number;
  jumlah_kembali_rusak_berat: number;
  catatan_pengembalian: string;
}

// 3. RIWAYAT PEMAKAIAN TAB
export default function RiwayatTab({
  adminProfile,
  supabase,
}: {
  adminProfile: any;
  supabase: any;
}) {
  const [dataRiwayat, setDataRiwayat] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail Modal State
  const [selectedRiwayat, setSelectedRiwayat] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailItems, setDetailItems] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Pengembalian Form State
  const [returnForms, setReturnForms] = useState<ReturnItemForm[]>([]);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  const [formData, setFormData] = useState({
    nama_lengkap: '',
    judul_kegiatan: '',
    tanggal: '',
    jam_mulai: '',
    jam_selesai: '',
  });

  const fetchRiwayat = async () => {
    setLoading(true);
    // Menggunakan langsung .eq('lab_id') sesuai lab admin yang sedang aktif
    const { data: res } = await supabase
      .from('peminjaman')
      .select('*')
      .eq('status', 'Disetujui')
      .eq('lab_id', adminProfile.lab_id)
      .order('tanggal', { ascending: false });
      
    if (res) setDataRiwayat(res);
    setLoading(false);
  };

  useEffect(() => {
    fetchRiwayat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getDayName = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { weekday: 'long' });
  };

  // ===================================================================
  //  BUKA DETAIL — fetch items peminjaman
  // ===================================================================
  const openDetail = async (item: any) => {
    setSelectedRiwayat(item);
    setIsDetailOpen(true);
    setLoadingDetail(true);

    const { data: items } = await supabase
      .from('peminjaman_item')
      .select('*')
      .eq('peminjaman_id', item.id);

    const fetchedItems = items || [];
    setDetailItems(fetchedItems);

    // Jika belum dikembalikan, siapkan form pengembalian
    if (!item.is_dikembalikan) {
      setReturnForms(
        fetchedItems.map((it: any) => ({
          id: it.id,
          nama_alat_bahan: it.nama_alat_bahan,
          jumlah: it.jumlah,
          jumlah_kembali_baik: it.jumlah_kembali_baik ?? it.jumlah ?? 0,
          jumlah_kembali_rusak_ringan: it.jumlah_kembali_rusak_ringan ?? 0,
          jumlah_kembali_rusak_berat: it.jumlah_kembali_rusak_berat ?? 0,
          catatan_pengembalian: it.catatan_pengembalian ?? '',
        })),
      );
    }

    setLoadingDetail(false);
  };

  // ===================================================================
  //  UPDATE RETURN FORM per item
  // ===================================================================
  const updateReturnForm = (
    index: number,
    field: keyof ReturnItemForm,
    value: string | number,
  ) => {
    setReturnForms((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // ===================================================================
  //  SELESAIKAN PEMINJAMAN
  // ===================================================================
  const handleSelesaikanPeminjaman = async () => {
    if (!selectedRiwayat) return;
    setIsSubmittingReturn(true);

    try {
      // 1. Update setiap peminjaman_item
      for (const item of returnForms) {
        const { error } = await supabase
          .from('peminjaman_item')
          .update({
            jumlah_kembali_baik: item.jumlah_kembali_baik,
            jumlah_kembali_rusak_ringan: item.jumlah_kembali_rusak_ringan,
            jumlah_kembali_rusak_berat: item.jumlah_kembali_rusak_berat,
            catatan_pengembalian: item.catatan_pengembalian || null,
          })
          .eq('id', item.id);

        if (error) throw new Error(`Gagal update item "${item.nama_alat_bahan}": ${error.message}`);
      }

      // 2. Update inventaris — increment stok berdasarkan pengembalian
      for (const item of returnForms) {
        // Cari inventaris berdasarkan nama alat (karena tidak ada foreign key langsung ke inventaris.id)
        const { data: invRows } = await supabase
          .from('inventaris')
          .select('id, jumlah_baik, jumlah_rusak_ringan, jumlah_rusak_berat')
          .eq('jenis_alat', item.nama_alat_bahan);

        if (invRows && invRows.length > 0) {
          const inv = invRows[0];
          const { error: invErr } = await supabase
            .from('inventaris')
            .update({
              jumlah_baik: (inv.jumlah_baik ?? 0) + item.jumlah_kembali_baik,
              jumlah_rusak_ringan: (inv.jumlah_rusak_ringan ?? 0) + item.jumlah_kembali_rusak_ringan,
              jumlah_rusak_berat: (inv.jumlah_rusak_berat ?? 0) + item.jumlah_kembali_rusak_berat,
            })
            .eq('id', inv.id);

          if (invErr) {
            console.warn(`Gagal update inventaris untuk "${item.nama_alat_bahan}":`, invErr.message);
          }
        }
      }

      // 3. Set peminjaman.is_dikembalikan = true
      const { error: pError } = await supabase
        .from('peminjaman')
        .update({ is_dikembalikan: true })
        .eq('id', selectedRiwayat.id);

      if (pError) throw new Error('Gagal menandai peminjaman selesai: ' + pError.message);

      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Pengembalian berhasil dicatat! Stok inventaris telah diperbarui.',
        confirmButtonColor: '#10b981'
      });
      
      setIsDetailOpen(false);
      setSelectedRiwayat(null);
      fetchRiwayat();
    } catch (error: any) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Terjadi Kesalahan',
        text: error.message || 'Gagal memproses pengembalian.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  // ===================================================================
  //  SUBMIT MANUAL
  // ===================================================================
  const submitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      ...formData,
      kategori_pemohon: 'Dosen/Internal', // Identifikasi input manual
      lab_id: adminProfile.lab_id, // Hardcoded sesuai lab aktif
      status: 'Disetujui', // Auto-approved
    };

    const { error } = await supabase.from('peminjaman').insert(payload);
    setIsSubmitting(false);

    if (error) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Gagal menambahkan riwayat manual!',
        confirmButtonColor: '#ef4444'
      });
    } else {
      Swal.fire({
        icon: 'success',
        title: 'Tersimpan!',
        text: 'Riwayat manual berhasil ditambahkan!',
        confirmButtonColor: '#10b981'
      });
      setIsFormOpen(false);
      setFormData({
        nama_lengkap: '',
        judul_kegiatan: '',
        tanggal: '',
        jam_mulai: '',
        jam_selesai: '',
      });
      fetchRiwayat();
    }
  };

  if (loading)
    return (
      <div className='animate-pulse text-lg text-slate-500 font-medium'>
        Memuat data log pemakaian...
      </div>
    );

  return (
    <Card className='border-slate-200 shadow-sm border-t-4 border-t-blue-600'>
      <CardHeader className='flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-4'>
        <div>
          <CardTitle className='text-xl flex items-center gap-2'>
            <CheckSquare className='size-5 text-blue-600' />
            Riwayat Pemakaian Lab (Sah)
          </CardTitle>
          <CardDescription className='text-base text-slate-600 mt-1'>
            Daftar semua kegiatan yang telah disetujui untuk menggunakan
            laboratorium.
          </CardDescription>
        </div>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className='bg-blue-600 hover:bg-blue-700 font-bold shadow-md text-base py-5'>
              <Plus className='size-4 mr-2' /> Tambah Riwayat Manual
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle className="text-xl">Input Pemakaian Manual</DialogTitle>
              <DialogDescription className="text-base">
                Gunakan ini jika ada dosen/kegiatan internal yang memakai lab
                tanpa form aplikasi luar.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={submitManual} className='space-y-4 pt-4'>
              <div className='space-y-2'>
                <Label htmlFor='m_nama' className="text-base">Nama Penanggung Jawab</Label>
                <Input
                  id='m_nama'
                  required
                  value={formData.nama_lengkap}
                  onChange={(e) =>
                    setFormData({ ...formData, nama_lengkap: e.target.value })
                  }
                  placeholder='Contoh: Dosen A'
                  className="text-base h-11"
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='m_kegiatan' className="text-base">Judul Kegiatan</Label>
                <Input
                  id='m_kegiatan'
                  required
                  value={formData.judul_kegiatan}
                  onChange={(e) =>
                    setFormData({ ...formData, judul_kegiatan: e.target.value })
                  }
                  placeholder='Contoh: Praktikum Kelas Siang'
                  className="text-base h-11"
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='m_tgl' className="text-base">Tanggal</Label>
                <Input
                  id='m_tgl'
                  type='date'
                  required
                  value={formData.tanggal}
                  onChange={(e) =>
                    setFormData({ ...formData, tanggal: e.target.value })
                  }
                  className="text-base h-11"
                />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='m_jamMulai' className="text-base">Jam Mulai</Label>
                  <Input
                    id='m_jamMulai'
                    type='time'
                    required
                    value={formData.jam_mulai}
                    onChange={(e) =>
                      setFormData({ ...formData, jam_mulai: e.target.value })
                    }
                    className="text-base h-11"
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='m_jamSelesai' className="text-base">Jam Selesai</Label>
                  <Input
                    id='m_jamSelesai'
                    type='time'
                    required
                    value={formData.jam_selesai}
                    onChange={(e) =>
                      setFormData({ ...formData, jam_selesai: e.target.value })
                    }
                    className="text-base h-11"
                  />
                </div>
              </div>
              <DialogFooter className='mt-6 pt-4'>
                <Button
                  type='submit'
                  className='w-full font-bold bg-blue-600 hover:bg-blue-700 text-base py-6'
                  disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan ke Riwayat'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {/* ============================================================= */}
        {/* TABEL UTAMA RIWAYAT                                          */}
        {/* ============================================================= */}
        <div className='rounded-md border overflow-x-auto'>
          <Table>
            <TableHeader className='bg-slate-50'>
              <TableRow>
                <TableHead className='font-semibold text-slate-800 text-sm'>
                  Hari
                </TableHead>
                <TableHead className='font-semibold text-slate-800 text-sm'>
                  Tanggal
                </TableHead>
                <TableHead className='font-semibold text-slate-800 text-sm'>
                  Waktu
                </TableHead>
                <TableHead className='font-semibold text-slate-800 text-sm'>
                  Nama Peminjam
                </TableHead>
                <TableHead className='font-semibold text-slate-800 max-w-[200px] text-sm'>
                  Kegiatan
                </TableHead>
                <TableHead className='font-semibold text-slate-800 text-sm'>
                  Lab
                </TableHead>
                <TableHead className='font-semibold text-slate-800 text-sm text-center'>
                  Status
                </TableHead>
                <TableHead className='font-semibold text-slate-800 text-center text-sm'>
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataRiwayat.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className='font-medium text-slate-700 text-sm'>
                    {getDayName(item.tanggal)}
                  </TableCell>
                  <TableCell className='text-slate-700 text-sm'>
                    {item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                  </TableCell>
                  <TableCell className='text-slate-700 min-w-24 font-medium text-blue-700 text-sm'>
                    {item.jam_mulai} - {item.jam_selesai}
                  </TableCell>
                  <TableCell className='font-semibold text-slate-900 text-sm'>
                    {item.nama_lengkap}
                  </TableCell>
                  <TableCell
                    className='text-slate-600 truncate max-w-[250px] text-sm'
                    title={item.judul_kegiatan}>
                    {item.judul_kegiatan}
                  </TableCell>
                  <TableCell className='text-slate-600 text-xs'>
                    {labMap[item.lab_id]}
                  </TableCell>
                  <TableCell className='text-center'>
                    {item.is_dikembalikan ? (
                      <Badge className='bg-green-100 text-green-700 border border-green-200 hover:bg-green-100 font-semibold'>
                        <PackageCheck className='size-3 mr-1' />
                        Selesai
                      </Badge>
                    ) : (
                      <Badge className='bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-100 font-semibold'>
                        <RotateCcw className='size-3 mr-1' />
                        Berjalan
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className='text-center'>
                    <Button size="sm" variant="outline" onClick={() => openDetail(item)}>
                       <Eye className="size-4 mr-1"/> Detail
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {dataRiwayat.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className='text-center py-10 text-slate-500 text-lg'>
                    Belum ada riwayat lab yang berjalan (status sah).
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* ================================================================= */}
      {/* MODAL DETAIL + FORM PENGEMBALIAN                                 */}
      {/* ================================================================= */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className='sm:max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='text-xl font-bold'>
              Detail Pemakaian Lab
            </DialogTitle>
            {selectedRiwayat && !selectedRiwayat.is_dikembalikan && (
              <DialogDescription className='text-base'>
                Barang belum dikembalikan. Isi form di bawah untuk mencatat pengembalian.
              </DialogDescription>
            )}
          </DialogHeader>
          {selectedRiwayat && (
            <div className='space-y-5 mt-2'>
              {/* --- Info Peminjaman --- */}
              <div className='bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-3'>
                <div>
                  <p className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Penanggung Jawab</p>
                  <p className='font-bold text-slate-900 text-base'>{selectedRiwayat.nama_lengkap}</p>
                </div>
                <div>
                  <p className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Kegiatan</p>
                  <p className='font-bold text-slate-900 text-base'>{selectedRiwayat.judul_kegiatan}</p>
                </div>
                <div>
                  <p className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Laboratorium</p>
                  <p className='font-bold text-slate-900 text-base'>
                    {labMap[selectedRiwayat.lab_id] || `Lab ${selectedRiwayat.lab_id}`}
                  </p>
                </div>
                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <p className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Tanggal</p>
                    <p className='font-bold text-slate-900 text-sm'>
                      {selectedRiwayat.tanggal ? new Date(selectedRiwayat.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Waktu</p>
                    <p className='font-bold text-slate-900 text-sm'>{selectedRiwayat.jam_mulai} - {selectedRiwayat.jam_selesai} WIB</p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <p className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Status:</p>
                  {selectedRiwayat.is_dikembalikan ? (
                    <Badge className='bg-green-100 text-green-700 border border-green-200 hover:bg-green-100 font-semibold text-xs'>
                      <PackageCheck className='size-3 mr-1' />
                      Sudah Dikembalikan
                    </Badge>
                  ) : (
                    <Badge className='bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-100 font-semibold text-xs'>
                      <RotateCcw className='size-3 mr-1' />
                      Masih Berjalan
                    </Badge>
                  )}
                </div>
              </div>

              {/* --- Daftar Barang --- */}
              {loadingDetail ? (
                <p className='text-slate-500 animate-pulse text-center py-4'>Memuat data barang...</p>
              ) : detailItems.length === 0 ? (
                <p className='text-slate-400 text-center py-4 text-sm'>Tidak ada data barang untuk peminjaman ini.</p>
              ) : selectedRiwayat.is_dikembalikan ? (
                /* ==================== MODE READ-ONLY ==================== */
                <div className='space-y-3'>
                  <h3 className='font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2'>
                    <PackageCheck className='size-4 text-green-600' />
                    Data Pengembalian
                  </h3>
                  <div className='rounded-md border overflow-x-auto'>
                    <Table>
                      <TableHeader className='bg-slate-50'>
                        <TableRow>
                          <TableHead className='text-xs font-semibold'>Nama Alat</TableHead>
                          <TableHead className='text-xs font-semibold text-center text-green-600'>Baik</TableHead>
                          <TableHead className='text-xs font-semibold text-center text-amber-600'>R. Ringan</TableHead>
                          <TableHead className='text-xs font-semibold text-center text-red-600'>R. Berat</TableHead>
                          <TableHead className='text-xs font-semibold'>Catatan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailItems.map((it: any) => (
                          <TableRow key={it.id}>
                            <TableCell className='font-semibold text-sm text-slate-900'>{it.nama_alat_bahan}</TableCell>
                            <TableCell className='text-center'>
                              <Badge variant='outline' className='text-xs text-green-700 border-green-200 bg-green-50 font-bold'>
                                {it.jumlah_kembali_baik ?? 0}
                              </Badge>
                            </TableCell>
                            <TableCell className='text-center'>
                              <Badge variant='outline' className='text-xs text-amber-700 border-amber-200 bg-amber-50 font-bold'>
                                {it.jumlah_kembali_rusak_ringan ?? 0}
                              </Badge>
                            </TableCell>
                            <TableCell className='text-center'>
                              <Badge variant='outline' className='text-xs text-red-700 border-red-200 bg-red-50 font-bold'>
                                {it.jumlah_kembali_rusak_berat ?? 0}
                              </Badge>
                            </TableCell>
                            <TableCell className='text-xs text-slate-600 max-w-[150px] truncate' title={it.catatan_pengembalian || ''}>
                              {it.catatan_pengembalian || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                /* ==================== MODE PENGEMBALIAN ==================== */
                <div className='space-y-4'>
                  <h3 className='font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2'>
                    <RotateCcw className='size-4 text-amber-600' />
                    Form Penerimaan Pengembalian
                  </h3>
                  <p className='text-xs text-slate-500'>
                    Isi jumlah barang yang dikembalikan berdasarkan kondisi fisik saat diterima oleh Anda.
                  </p>

                  <div className='space-y-4'>
                    {returnForms.map((rf, index) => (
                      <div
                        key={rf.id}
                        className='bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3'>
                        {/* Header item */}
                        <div className='flex items-center justify-between'>
                          <p className='font-bold text-slate-900 text-sm'>
                            {index + 1}. {rf.nama_alat_bahan}
                          </p>
                          <Badge variant='outline' className='text-xs font-medium'>
                            Dipinjam: {rf.jumlah} unit
                          </Badge>
                        </div>

                        {/* 3 Input Kondisi */}
                        <div className='grid grid-cols-3 gap-2'>
                          <div className='space-y-1'>
                            <span className='text-[10px] font-semibold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full'>
                              Kembali Baik
                            </span>
                            <Input
                              type='number'
                              min='0'
                              value={rf.jumlah_kembali_baik}
                              onChange={(e) =>
                                updateReturnForm(index, 'jumlah_kembali_baik', parseInt(e.target.value) || 0)
                              }
                              className='h-9 text-sm text-center font-semibold'
                            />
                          </div>
                          <div className='space-y-1'>
                            <span className='text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full'>
                              R. Ringan
                            </span>
                            <Input
                              type='number'
                              min='0'
                              value={rf.jumlah_kembali_rusak_ringan}
                              onChange={(e) =>
                                updateReturnForm(index, 'jumlah_kembali_rusak_ringan', parseInt(e.target.value) || 0)
                              }
                              className='h-9 text-sm text-center font-semibold'
                            />
                          </div>
                          <div className='space-y-1'>
                            <span className='text-[10px] font-semibold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full'>
                              R. Berat
                            </span>
                            <Input
                              type='number'
                              min='0'
                              value={rf.jumlah_kembali_rusak_berat}
                              onChange={(e) =>
                                updateReturnForm(index, 'jumlah_kembali_rusak_berat', parseInt(e.target.value) || 0)
                              }
                              className='h-9 text-sm text-center font-semibold'
                            />
                          </div>
                        </div>

                        {/* Catatan */}
                        <Textarea
                          placeholder='Catatan / feedback kondisi barang (opsional)'
                          value={rf.catatan_pengembalian}
                          onChange={(e) =>
                            updateReturnForm(index, 'catatan_pengembalian', e.target.value)
                          }
                          className='text-sm resize-none'
                          rows={2}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Tombol Submit Pengembalian */}
                  <Button
                    onClick={handleSelesaikanPeminjaman}
                    disabled={isSubmittingReturn}
                    className='w-full font-bold bg-green-600 hover:bg-green-700 text-white text-base py-6 shadow-lg'>
                    <PackageCheck className='size-5 mr-2' />
                    {isSubmittingReturn ? 'Memproses Pengembalian...' : 'Selesaikan Peminjaman'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}