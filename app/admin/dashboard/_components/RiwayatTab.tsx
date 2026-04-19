'use client';

import { useEffect, useState } from 'react';
import {
  CheckSquare,
  Eye,
  Plus,
  PackageCheck,
  RotateCcw,
  XCircle,
  ExternalLink,
  Image as ImageIcon,
} from 'lucide-react';
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
  16: 'Polyfish',
  17: 'Lab Simulator',
  18: 'Lab Radar',
};

// --- Tipe untuk form pengembalian per-item ---
interface ReturnItemForm {
  id: string; // FIX: Diubah menjadi string karena Supabase menggunakan UUID
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
      .in('status', ['Disetujui', 'Dibatalkan'])
      .eq('lab_id', adminProfile.lab_id)
      .order('created_at', { ascending: false }); // FIX: Sorting by created_at terbaru

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
        const { data, error } = await supabase
          .from('peminjaman_item')
          .update({
            jumlah_kembali_baik: item.jumlah_kembali_baik,
            jumlah_kembali_rusak_ringan: item.jumlah_kembali_rusak_ringan,
            jumlah_kembali_rusak_berat: item.jumlah_kembali_rusak_berat,
            catatan_pengembalian: item.catatan_pengembalian || null,
          })
          .eq('id', item.id)
          .select(); // FIX: Radar Anti-Gagal (Silent Failure)

        if (error)
          throw new Error(
            `Gagal update item "${item.nama_alat_bahan}": ${error.message}`,
          );
        if (!data || data.length === 0)
          throw new Error(
            `Update ditolak! Pastikan RLS Supabase untuk tabel peminjaman_item mengizinkan proses UPDATE.`,
          );
      }

      // 2. Update inventaris
      for (const item of returnForms) {
        const { data: invRows } = await supabase
          .from('inventaris')
          .select(
            'id, jumlah_baik, jumlah_rusak_ringan, jumlah_rusak_berat, kategori_inventaris(is_bisa_berkurang)',
          )
          .eq('jenis_alat', item.nama_alat_bahan)
          .maybeSingle();

        if (invRows) {
          if (invRows.kategori_inventaris?.is_bisa_berkurang === false) {
            // LOGIKA ASET (Biarkan tetap seperti sebelumnya)
            const selisihRusakAtauHilang =
              item.jumlah - item.jumlah_kembali_baik;
            const { error: invErr } = await supabase
              .from('inventaris')
              .update({
                jumlah_baik:
                  (invRows.jumlah_baik ?? 0) - selisihRusakAtauHilang,
                jumlah_rusak_ringan:
                  (invRows.jumlah_rusak_ringan ?? 0) +
                  item.jumlah_kembali_rusak_ringan,
                jumlah_rusak_berat:
                  (invRows.jumlah_rusak_berat ?? 0) +
                  item.jumlah_kembali_rusak_berat,
              })
              .eq('id', invRows.id);
            if (invErr)
              console.warn(`Gagal update inventaris aset:`, invErr.message);
          } else if (invRows.kategori_inventaris?.is_bisa_berkurang === true) {
            // LOGIKA BARU: BAHAN HABIS PAKAI (Pengembalian Sisa)
            // Jika ada yang dikembalikan dalam kondisi 'baik', berarti itu sisa yang tidak terpakai
            if (item.jumlah_kembali_baik > 0) {
              const { error: invErr } = await supabase
                .from('inventaris')
                .update({
                  // Tambahkan kembali sisa bahan ke stok inventaris
                  jumlah_baik:
                    (invRows.jumlah_baik ?? 0) + item.jumlah_kembali_baik,
                })
                .eq('id', invRows.id);
              if (invErr)
                console.warn(`Gagal mengembalikan sisa bahan:`, invErr.message);
            }
          }
        }
      }

      // 3. Set peminjaman.is_dikembalikan = true
      const { error: pError } = await supabase
        .from('peminjaman')
        .update({ is_dikembalikan: true })
        .eq('id', selectedRiwayat.id);

      if (pError)
        throw new Error('Gagal menandai peminjaman selesai: ' + pError.message);

      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Pengembalian berhasil dicatat! Stok inventaris telah diperbarui.',
        confirmButtonColor: '#10b981',
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
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  // ===================================================================
  //  BATALKAN PEMINJAMAN
  // ===================================================================
  const handleBatalkanPeminjaman = async (item: any) => {
    // 1. TUTUP MODAL DULU agar Radix UI melepas kuncian layarnya
    setIsDetailOpen(false);

    // 2. Beri jeda 200ms agar animasi modal benar-benar selesai
    setTimeout(async () => {
      const { value: alasan, isConfirmed } = await Swal.fire({
        title: 'Batalkan Peminjaman?',
        text: 'Stok bahan habis pakai akan otomatis dikembalikan ke sistem.',
        input: 'textarea',
        inputPlaceholder: 'Tuliskan alasan pembatalan (Wajib diisi)...',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Ya, Batalkan',
        cancelButtonText: 'Kembali',
        inputValidator: (value) => {
          if (!value) return 'Alasan pembatalan wajib diisi!';
        },
      });

      if (isConfirmed) {
        setIsSubmittingReturn(true); // Manfaatkan state loading yang ada
        try {
          // A. Kembalikan Stok Konsumsi (Hanya jika is_bisa_berkurang === true)
          const { data: items } = await supabase
            .from('peminjaman_item')
            .select('*')
            .eq('peminjaman_id', item.id);
          if (items) {
            for (const pi of items) {
              const { data: invRows } = await supabase
                .from('inventaris')
                .select(
                  'id, jumlah_baik, kategori_inventaris(is_bisa_berkurang)',
                )
                .eq('jenis_alat', pi.nama_alat_bahan)
                .maybeSingle();

              if (
                invRows &&
                invRows.kategori_inventaris?.is_bisa_berkurang === true
              ) {
                await supabase
                  .from('inventaris')
                  .update({
                    jumlah_baik: (invRows.jumlah_baik ?? 0) + pi.jumlah,
                  })
                  .eq('id', invRows.id);
              }
            }
          }

          // B. Update Status Utama
          const { error: cancelError } = await supabase
            .from('peminjaman')
            .update({
              status: 'Dibatalkan',
              pesan_pembatalan: alasan, // Pastikan kolom ini sudah ada di database
            })
            .eq('id', item.id);

          if (cancelError) {
            // Fallback for UX safety if the column strictly doesn't exist
            const { error: fallbackErr } = await supabase
              .from('peminjaman')
              .update({ status: 'Dibatalkan', pesan_feedback: alasan })
              .eq('id', item.id);
            if (fallbackErr) throw new Error(cancelError.message);
          }

          Swal.fire({
            title: 'Dibatalkan!',
            text: 'Peminjaman telah dibatalkan.',
            icon: 'success',
          });
          setSelectedRiwayat(null);
          fetchRiwayat();
        } catch (error: any) {
          Swal.fire('Error', 'Gagal membatalkan: ' + error.message, 'error');
          // Jika error, boleh buka lagi modalnya
          setIsDetailOpen(true);
        } finally {
          setIsSubmittingReturn(false);
        }
      } else {
        // 3. JIKA BATAL MENGISI SWAL: Buka kembali modal detailnya
        setIsDetailOpen(true);
      }
    }, 200);
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
        confirmButtonColor: '#ef4444',
      });
    } else {
      Swal.fire({
        icon: 'success',
        title: 'Tersimpan!',
        text: 'Riwayat manual berhasil ditambahkan!',
        confirmButtonColor: '#10b981',
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
              <DialogTitle className='text-xl'>
                Input Pemakaian Manual
              </DialogTitle>
              <DialogDescription className='text-base'>
                Gunakan ini jika ada dosen/kegiatan internal yang memakai lab
                tanpa form aplikasi luar.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={submitManual} className='space-y-4 pt-4'>
              <div className='space-y-2'>
                <Label htmlFor='m_nama' className='text-base'>
                  Nama Penanggung Jawab
                </Label>
                <Input
                  id='m_nama'
                  required
                  value={formData.nama_lengkap}
                  onChange={(e) =>
                    setFormData({ ...formData, nama_lengkap: e.target.value })
                  }
                  placeholder='Contoh: Dosen A'
                  className='text-base h-11'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='m_kegiatan' className='text-base'>
                  Judul Kegiatan
                </Label>
                <Input
                  id='m_kegiatan'
                  required
                  value={formData.judul_kegiatan}
                  onChange={(e) =>
                    setFormData({ ...formData, judul_kegiatan: e.target.value })
                  }
                  placeholder='Contoh: Praktikum Kelas Siang'
                  className='text-base h-11'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='m_tgl' className='text-base'>
                  Tanggal
                </Label>
                <Input
                  id='m_tgl'
                  type='date'
                  required
                  value={formData.tanggal}
                  onChange={(e) =>
                    setFormData({ ...formData, tanggal: e.target.value })
                  }
                  className='text-base h-11'
                />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='m_jamMulai' className='text-base'>
                    Jam Mulai
                  </Label>
                  <Input
                    id='m_jamMulai'
                    type='time'
                    required
                    value={formData.jam_mulai}
                    onChange={(e) =>
                      setFormData({ ...formData, jam_mulai: e.target.value })
                    }
                    className='text-base h-11'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='m_jamSelesai' className='text-base'>
                    Jam Selesai
                  </Label>
                  <Input
                    id='m_jamSelesai'
                    type='time'
                    required
                    value={formData.jam_selesai}
                    onChange={(e) =>
                      setFormData({ ...formData, jam_selesai: e.target.value })
                    }
                    className='text-base h-11'
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
                    {item.tanggal
                      ? new Date(item.tanggal).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : '-'}
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
                    {item.status === 'Dibatalkan' ? (
                      <Badge className='bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-100 font-semibold'>
                        <XCircle className='size-3 mr-1' />
                        Dibatalkan
                      </Badge>
                    ) : item.is_dikembalikan ? (
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
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => openDetail(item)}>
                      <Eye className='size-4 mr-1' /> Detail
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
        <DialogContent className='sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[70vw] w-full h-[100dvh] sm:h-auto overflow-y-auto rounded-none sm:rounded-lg m-0 p-4 sm:p-6'>
          <DialogHeader>
            <DialogTitle className='text-xl font-bold'>
              Detail Pemakaian Lab
            </DialogTitle>
            {selectedRiwayat &&
              !selectedRiwayat.is_dikembalikan &&
              selectedRiwayat.status !== 'Dibatalkan' && (
                <DialogDescription className='text-base'>
                  Barang belum dikembalikan. Isi form di bawah untuk mencatat
                  pengembalian.
                </DialogDescription>
              )}
          </DialogHeader>
          {selectedRiwayat && (
            <div className='flex flex-col md:flex-row gap-6 mt-4'>
              {/* SISI KIRI: Info Peminjaman & Pembayaran */}
              <div className='flex-1 space-y-5'>
                <div className='bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-3'>
                  <div>
                    <p className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>
                      Penanggung Jawab
                    </p>
                    <p className='font-bold text-slate-900 text-base'>
                      {selectedRiwayat.nama_lengkap}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>
                      Kegiatan
                    </p>
                    <p className='font-bold text-slate-900 text-base'>
                      {selectedRiwayat.judul_kegiatan}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>
                      Laboratorium
                    </p>
                    <p className='font-bold text-slate-900 text-base'>
                      {labMap[selectedRiwayat.lab_id] ||
                        `Lab ${selectedRiwayat.lab_id}`}
                    </p>
                  </div>
                  <div className='grid grid-cols-2 gap-3'>
                    <div>
                      <p className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>
                        Tanggal
                      </p>
                      <p className='font-bold text-slate-900 text-sm'>
                        {selectedRiwayat.tanggal
                          ? new Date(
                              selectedRiwayat.tanggal,
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
                      <p className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>
                        Waktu
                      </p>
                      <p className='font-bold text-slate-900 text-sm'>
                        {selectedRiwayat.jam_mulai} -{' '}
                        {selectedRiwayat.jam_selesai} WIB
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <p className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>
                      Status:
                    </p>
                    {selectedRiwayat.status === 'Dibatalkan' ? (
                      <Badge className='bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-100 font-semibold text-xs'>
                        <XCircle className='size-3 mr-1' />
                        Dibatalkan
                      </Badge>
                    ) : selectedRiwayat.is_dikembalikan ? (
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

                {/* --- Pembayaran Khusus Umum --- */}
                {selectedRiwayat.kategori_pemohon?.toLowerCase() === 'umum' && (
                  <div className='space-y-2 pt-2 border-t'>
                    <p className='font-semibold text-slate-500 text-sm'>
                      Informasi Pembayaran (Pemohon Umum)
                    </p>
                    <div className='bg-blue-50/50 p-4 rounded-xl border border-blue-100'>
                      <Label className='font-bold block mb-3 text-slate-800 text-base'>
                        Bukti Transfer
                      </Label>
                      {selectedRiwayat.bukti_pembayaran ? (
                        <Button
                          variant='outline'
                          className='w-full justify-between bg-white h-12 shadow-sm border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-colors'
                          asChild>
                          <a
                            href={selectedRiwayat.bukti_pembayaran}
                            target='_blank'
                            rel='noopener noreferrer'>
                            <span className='flex items-center gap-2 text-blue-700 font-semibold text-base'>
                              <ImageIcon className='size-5' /> Lihat Bukti
                              Unggahan
                            </span>
                            <ExternalLink className='size-5 text-slate-400' />
                          </a>
                        </Button>
                      ) : (
                        <p className='text-red-500 text-base font-semibold py-2 bg-red-50 px-3 rounded-md border border-red-100 italic'>
                          Bukti transfer belum diunggah
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* SISI KANAN: Daftar Barang & Pengembalian */}
              <div className='flex-1 space-y-5'>
                {/* --- Daftar Barang --- */}
                {loadingDetail ? (
                  <p className='text-slate-500 animate-pulse text-center py-4'>
                    Memuat data barang...
                  </p>
                ) : detailItems.length === 0 ? (
                  <p className='text-slate-400 text-center py-4 text-sm'>
                    Tidak ada data barang untuk peminjaman ini.
                  </p>
                ) : selectedRiwayat.is_dikembalikan ||
                  selectedRiwayat.status === 'Dibatalkan' ? (
                  /* ==================== MODE READ-ONLY ==================== */
                  <div className='space-y-6'>
                    {selectedRiwayat.status === 'Dibatalkan' && (
                      <div className='bg-red-50 text-red-700 p-4 rounded-xl border border-red-200'>
                        <p className='text-sm'>
                          <strong>Peminjaman Dibatalkan:</strong>{' '}
                          {selectedRiwayat.pesan_pembatalan ||
                            selectedRiwayat.pesan_feedback ||
                            '-'}
                        </p>
                      </div>
                    )}

                    {/* BAGIAN 1: DAFTAR BARANG DIPINJAM */}
                    <div className='space-y-3'>
                      <h3 className='font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2'>
                        1. Daftar Barang Dipinjam
                      </h3>
                      <div className='rounded-md border overflow-x-auto'>
                        <Table>
                          <TableHeader className='bg-slate-50'>
                            <TableRow>
                              <TableHead className='text-xs font-semibold'>
                                Nama Alat
                              </TableHead>
                              <TableHead className='text-xs font-semibold text-center'>
                                Jumlah Awal (Qty)
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {detailItems.map((it: any) => (
                              <TableRow key={`pinjam-${it.id}`}>
                                <TableCell className='font-semibold text-sm text-slate-900'>
                                  {it.nama_alat_bahan}
                                </TableCell>
                                <TableCell className='text-center'>
                                  <Badge
                                    variant='secondary'
                                    className='text-xs font-bold'>
                                    {it.jumlah ?? 0}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {selectedRiwayat.status !== 'Dibatalkan' && (
                      <>
                        <hr className='my-6 border-slate-200' />

                        {/* BAGIAN 2: DETAIL KONDISI PENGEMBALIAN */}
                        <div className='space-y-3'>
                          <h3 className='font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2'>
                            2. Detail Kondisi Pengembalian
                          </h3>
                          <div className='rounded-md border overflow-x-auto'>
                            <Table>
                              <TableHeader className='bg-slate-50'>
                                <TableRow>
                                  <TableHead className='text-xs font-semibold'>
                                    Nama Alat
                                  </TableHead>
                                  <TableHead className='text-xs font-semibold text-center text-green-600'>
                                    Baik
                                  </TableHead>
                                  <TableHead className='text-xs font-semibold text-center text-amber-600'>
                                    R. Ringan
                                  </TableHead>
                                  <TableHead className='text-xs font-semibold text-center text-red-600'>
                                    R. Berat
                                  </TableHead>
                                  <TableHead className='text-xs font-semibold'>
                                    Catatan
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {detailItems.map((it: any) => {
                                  const totalKembali =
                                    (it.jumlah_kembali_baik ?? 0) +
                                    (it.jumlah_kembali_rusak_ringan ?? 0) +
                                    (it.jumlah_kembali_rusak_berat ?? 0);
                                  const isSelisih =
                                    totalKembali !== (it.jumlah ?? 0);

                                  return (
                                    <TableRow
                                      key={`kembali-${it.id}`}
                                      className={
                                        isSelisih ? 'bg-red-50/50' : ''
                                      }>
                                      <TableCell
                                        className={`font-semibold text-sm ${isSelisih ? 'text-red-600' : 'text-slate-900'}`}>
                                        <div className='flex items-center gap-1'>
                                          {it.nama_alat_bahan}
                                          {isSelisih && (
                                            <span
                                              className='text-red-500 font-bold ml-1 text-sm'
                                              title='Terdapat selisih jumlah barang'>
                                              ⚠️
                                            </span>
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell className='text-center'>
                                        <Badge
                                          variant='outline'
                                          className='text-xs text-green-700 border-green-200 bg-green-50 font-bold'>
                                          {it.jumlah_kembali_baik ?? 0}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className='text-center'>
                                        <Badge
                                          variant='outline'
                                          className='text-xs text-amber-700 border-amber-200 bg-amber-50 font-bold'>
                                          {it.jumlah_kembali_rusak_ringan ?? 0}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className='text-center'>
                                        <Badge
                                          variant='outline'
                                          className='text-xs text-red-700 border-red-200 bg-red-50 font-bold'>
                                          {it.jumlah_kembali_rusak_berat ?? 0}
                                        </Badge>
                                      </TableCell>
                                      <TableCell
                                        className='text-xs text-slate-600 max-w-[150px] truncate'
                                        title={it.catatan_pengembalian || ''}>
                                        {it.catatan_pengembalian || '-'}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  /* ==================== MODE PENGEMBALIAN ==================== */
                  <div className='space-y-4'>
                    <h3 className='font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2'>
                      <RotateCcw className='size-4 text-amber-600' />
                      Form Penerimaan Pengembalian
                    </h3>
                    <p className='text-xs text-slate-500'>
                      Isi jumlah barang yang dikembalikan berdasarkan kondisi
                      fisik saat diterima oleh Anda.
                    </p>

                    <p className='text-xs text-blue-600 bg-blue-50 border border-blue-200 p-2 rounded-md font-medium'>
                      💡 Info: Untuk Bahan Habis Pakai, sisa bahan yang tidak
                      termakan/digunakan dapat dikembalikan ke sistem dengan
                      mengisinya pada kolom <strong>Kembali Baik</strong>.
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
                            <Badge
                              variant='outline'
                              className='text-xs font-medium'>
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
                                  updateReturnForm(
                                    index,
                                    'jumlah_kembali_baik',
                                    parseInt(e.target.value) || 0,
                                  )
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
                                  updateReturnForm(
                                    index,
                                    'jumlah_kembali_rusak_ringan',
                                    parseInt(e.target.value) || 0,
                                  )
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
                                  updateReturnForm(
                                    index,
                                    'jumlah_kembali_rusak_berat',
                                    parseInt(e.target.value) || 0,
                                  )
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
                              updateReturnForm(
                                index,
                                'catatan_pengembalian',
                                e.target.value,
                              )
                            }
                            className='text-sm resize-none'
                            rows={2}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Tombol Submit Pengembalian */}
                    <div className='space-y-3 mt-4'>
                      <Button
                        onClick={handleSelesaikanPeminjaman}
                        disabled={isSubmittingReturn}
                        className='w-full font-bold bg-green-600 hover:bg-green-700 text-white text-base py-6 shadow-lg'>
                        <PackageCheck className='size-5 mr-2' />
                        {isSubmittingReturn
                          ? 'Memproses Pengembalian...'
                          : 'Selesaikan Peminjaman'}
                      </Button>

                      <Button
                        variant='destructive'
                        onClick={() =>
                          handleBatalkanPeminjaman(selectedRiwayat)
                        }
                        className='w-full mt-2 font-bold py-6'>
                        Batalkan Peminjaman
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
