'use client';

import { useEffect, useState, useCallback } from 'react';
import { PackageSearch, Plus, Pencil, FolderPlus, Trash2, X, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import Swal from 'sweetalert2';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

// Daftar 18 Lab & TEFA terbaru
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

// --- Tipe Data ---
interface Kategori {
  id: number;
  lab_id: number;
  nama_kategori: string;
  is_bisa_berkurang: boolean; // Field Baru
}

interface InventarisItem {
  id: number;
  kategori_id: number;
  jenis_alat: string;
  spesifikasi: string | null;
  jumlah_baik: number;
  jumlah_rusak_ringan: number;
  jumlah_rusak_berat: number;
  keterangan: string | null;
}

const defaultFormData = {
  jenis_alat: '',
  spesifikasi: '',
  jumlah_baik: 0,
  jumlah_rusak_ringan: 0,
  jumlah_rusak_berat: 0,
  keterangan: '',
};

export default function InventarisTab({
  adminProfile,
  supabase,
}: {
  adminProfile: any;
  supabase: any;
}) {
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [activeKategoriId, setActiveKategoriId] = useState<number | null>(null);
  const [loadingKategori, setLoadingKategori] = useState(true);

  const [dataInventaris, setDataInventaris] = useState<InventarisItem[]>([]);
  const [loadingInventaris, setLoadingInventaris] = useState(false);
  const [progressInventaris, setProgressInventaris] = useState(0);
  const [progressKategori, setProgressKategori] = useState(0);
  
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const rowsPerPage = 10;

  // --- Modal Tambah Kategori ---
  const [isKategoriModalOpen, setIsKategoriModalOpen] = useState(false);
  const [newKategoriName, setNewKategoriName] = useState('');
  const [newKategoriIsBerkurang, setNewKategoriIsBerkurang] = useState(false); // State Baru
  const [isSubmittingKategori, setIsSubmittingKategori] = useState(false);

  // --- Modal Tambah/Edit Alat ---
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(defaultFormData);
  const [editItemId, setEditItemId] = useState<number | null>(null);

  // FETCH KATEGORI
  const fetchKategori = useCallback(async () => {
    setLoadingKategori(true);
    setProgressKategori(0);
    const interval = setInterval(() => {
      setProgressKategori((old) => (old < 90 ? old + 15 : old));
    }, 50);

    // Hanya kolom yang dipakai tab ini (id untuk key/relasi, sisanya
    // untuk render + form edit). created_at tidak dirender.
    const { data } = await supabase
      .from('kategori_inventaris')
      .select('id, lab_id, nama_kategori, is_bisa_berkurang')
      .eq('lab_id', adminProfile.lab_id)
      .order('nama_kategori', { ascending: true });

    if (data && data.length > 0) {
      setKategoriList(data);
      setActiveKategoriId((prev) => {
        const stillExists = data.some((k: Kategori) => k.id === prev);
        return stillExists ? prev : data[0].id;
      });
    } else {
      setKategoriList([]);
      setActiveKategoriId(null);
    }
    clearInterval(interval);
    setProgressKategori(100);
    setTimeout(() => {
      setLoadingKategori(false);
    }, 300);
  }, [supabase, adminProfile.lab_id]);

  useEffect(() => {
    fetchKategori();
  }, [fetchKategori]);

  // FETCH INVENTARIS
  const fetchInventaris = useCallback(async () => {
    if (activeKategoriId === null) {
      setDataInventaris([]);
      return;
    }
    setLoadingInventaris(true);
    setProgressInventaris(0);
    const interval = setInterval(() => {
      setProgressInventaris((old) => (old < 90 ? old + 15 : old));
    }, 50);

    const from = (page - 1) * rowsPerPage;
    const to = from + rowsPerPage - 1;

    // created_at tidak dirender tab ini — tidak diambil.
    const { data, count } = await supabase
      .from('inventaris')
      .select(
        'id, kategori_id, jenis_alat, spesifikasi, jumlah_baik, jumlah_rusak_ringan, jumlah_rusak_berat, keterangan',
        { count: 'exact' },
      )
      .eq('kategori_id', activeKategoriId)
      .order('jenis_alat', { ascending: true })
      .range(from, to);

    if (data) setDataInventaris(data);
    else setDataInventaris([]);
    if (count !== null) setTotalCount(count);

    clearInterval(interval);
    setProgressInventaris(100);
    setTimeout(() => {
      setLoadingInventaris(false);
    }, 300);
  }, [supabase, activeKategoriId, page]);

  useEffect(() => {
    fetchInventaris();
  }, [fetchInventaris]);

  useEffect(() => {
    setPage(1);
  }, [activeKategoriId]);

  // SUBMIT KATEGORI BARU
  const submitKategori = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKategoriName.trim()) return;
    setIsSubmittingKategori(true);

    const { error } = await supabase.from('kategori_inventaris').insert({
      lab_id: adminProfile.lab_id,
      nama_kategori: newKategoriName.trim(),
      is_bisa_berkurang: newKategoriIsBerkurang, // Simpan status habis pakai
    });

    setIsSubmittingKategori(false);

    if (error) {
      Swal.fire({
        text: 'Gagal menambahkan kategori: ' + error.message,
        icon: 'error',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } else {
      setNewKategoriName('');
      setNewKategoriIsBerkurang(false);
      setIsKategoriModalOpen(false);
      fetchKategori();
      Swal.fire({
        text: 'Kategori berhasil ditambahkan!',
        icon: 'success',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    }
  };

  // SUBMIT INVENTARIS
  const submitInventaris = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeKategoriId === null) return;
    setIsSubmitting(true);

    const payload = {
      kategori_id: activeKategoriId,
      jenis_alat: formData.jenis_alat,
      spesifikasi: formData.spesifikasi || null,
      jumlah_baik: formData.jumlah_baik,
      jumlah_rusak_ringan: formData.jumlah_rusak_ringan,
      jumlah_rusak_berat: formData.jumlah_rusak_berat,
      keterangan: formData.keterangan || null,
    };

    let error;
    if (editItemId) {
      const { error: updateError } = await supabase
        .from('inventaris')
        .update(payload)
        .eq('id', editItemId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('inventaris')
        .insert(payload);
      error = insertError;
    }

    setIsSubmitting(false);

    if (error) {
      Swal.fire({
        text: `Gagal ${editItemId ? 'mengupdate' : 'menambahkan'} alat.`,
        icon: 'error',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } else {
      setIsFormOpen(false);
      setEditItemId(null);
      setFormData(defaultFormData);
      fetchInventaris();
      Swal.fire({
        text: `Alat berhasil ${editItemId ? 'diperbarui' : 'ditambahkan'}!`,
        icon: 'success',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    }
  };

  // FUNGSI HAPUS KATEGORI
  const deleteKategori = async (e: React.MouseEvent, kat: Kategori) => {
    e.stopPropagation();

    // 1. Cek apakah ada barang
    const { count, error: countError } = await supabase
      .from('inventaris')
      .select('*', { count: 'exact', head: true })
      .eq('kategori_id', kat.id);

    if (countError) {
      Swal.fire({
        text: 'Gagal memvalidasi kategori: ' + countError.message,
        icon: 'error',
        toast: true,
        position: 'top-end',
      });
      return;
    }

    if (count && count > 0) {
      Swal.fire({
        title: 'Gagal!',
        text: 'Kategori tidak bisa dihapus karena masih berisi barang. Hapus atau pindahkan barangnya terlebih dahulu.',
        icon: 'error',
        confirmButtonColor: '#ef4444',
      });
      return;
    }

    // 2. Jika kosong, tampilkan konfirmasi
    const result = await Swal.fire({
      title: `Yakin ingin menghapus kategori ${kat.nama_kategori}?`,
      text: 'Kategori yang dihapus tidak dapat dikembalikan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
    });

    if (result.isConfirmed) {
      const { error } = await supabase
        .from('kategori_inventaris')
        .delete()
        .eq('id', kat.id);

      if (error) {
        Swal.fire({
          text: 'Gagal menghapus: ' + error.message,
          icon: 'error',
          toast: true,
          position: 'top-end',
        });
      } else {
        Swal.fire({
          text: 'Kategori berhasil dihapus!',
          icon: 'success',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
        });
        if (activeKategoriId === kat.id) {
          setActiveKategoriId(null);
        }
        fetchKategori();
      }
    }
  };

  // FUNGSI HAPUS INVENTARIS
  const deleteInventaris = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!editItemId) return;

    // Simpan ID ke variabel lokal agar tidak hilang saat state modal di-reset
    const currentId = editItemId;

    // 1. TUTUP MODAL DULU agar Radix UI melepas kuncian layarnya
    setIsFormOpen(false);

    // 2. Beri jeda 200ms agar animasi modal benar-benar selesai tertutup
    setTimeout(async () => {
      const result = await Swal.fire({
        title: 'Yakin hapus alat ini?',
        text: 'Data yang dihapus tidak bisa dikembalikan!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Ya, Hapus!',
        cancelButtonText: 'Batal',
      });

      if (result.isConfirmed) {
        setIsSubmitting(true);
        const { error } = await supabase
          .from('inventaris')
          .delete()
          .eq('id', currentId);
        setIsSubmitting(false);

        if (error) {
          Swal.fire({
            text: 'Gagal menghapus: ' + error.message,
            icon: 'error',
            toast: true,
            position: 'top-end',
          });
        } else {
          Swal.fire({
            text: 'Data alat berhasil dihapus!',
            icon: 'success',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
          });
          setEditItemId(null);
          fetchInventaris();
        }
      } else {
        // 3. JIKA BATAL: Buka kembali modal form editnya
        setIsFormOpen(true);
      }
    }, 200);
  };

  const openEdit = (item: InventarisItem) => {
    setFormData({
      jenis_alat: item.jenis_alat,
      spesifikasi: item.spesifikasi || '',
      jumlah_baik: item.jumlah_baik,
      jumlah_rusak_ringan: item.jumlah_rusak_ringan,
      jumlah_rusak_berat: item.jumlah_rusak_berat,
      keterangan: item.keterangan || '',
    });
    setEditItemId(item.id);
    setIsFormOpen(true);
  };

  const openAdd = () => {
    setFormData(defaultFormData);
    setEditItemId(null);
    setIsFormOpen(true);
  };

  if (loadingKategori) {
    return (
      <div className='flex flex-col items-center justify-center py-20 text-purple-600'>
        <PackageSearch className='size-10 mb-4' />
        <span className='text-2xl font-black'>{progressKategori}%</span>
        <p className='text-sm font-medium text-slate-500 mt-2'>Memuat data kategori...</p>
      </div>
    );
  }

  return (
    <Card className='border-slate-200 shadow-sm border-t-4 border-t-purple-500'>
      <CardHeader className='flex flex-col gap-4 pb-4'>
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
          <div>
            <CardTitle className='text-xl flex items-center gap-2'>
              <PackageSearch className='size-5 text-purple-600' />
              Inventaris {labMap[adminProfile.lab_id] || 'Laboratorium'}
            </CardTitle>
            <CardDescription className='text-base text-slate-600 mt-1'>
              Kelola daftar aset, alat tangkap, atau perlengkapan lab di sini.
            </CardDescription>
          </div>

          <Button
            onClick={openAdd}
            disabled={activeKategoriId === null}
            className='bg-purple-600 hover:bg-purple-700 font-bold shadow-md text-base py-5'>
            <Plus className='size-4 mr-2' /> Tambah Alat &amp; Bahan
          </Button>
        </div>

        <div className='flex items-center gap-2 overflow-x-auto pb-1 -mb-2 scrollbar-thin'>
          {kategoriList.map((kat) => (
            <button
              key={kat.id}
              onClick={() => setActiveKategoriId(kat.id)}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-all border flex items-center gap-2 group ${
                activeKategoriId === kat.id
                  ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}>
              {kat.nama_kategori}
              {kat.is_bisa_berkurang && (
                <span
                  className={`size-2 rounded-full ${activeKategoriId === kat.id ? 'bg-amber-300' : 'bg-amber-500'}`}
                  title='Stok Berkurang Otomatis (Bahan Habis Pakai)'
                />
              )}
              {activeKategoriId === kat.id && (
                <div
                  onClick={(e) => deleteKategori(e, kat)}
                  className='ml-1 p-1 rounded-md bg-red-500 hover:bg-red-600 text-white transition-colors'
                  title='Hapus Kategori'>
                  <Trash2 className='size-3.5' />
                </div>
              )}
            </button>
          ))}

          <button
            onClick={() => {
              setNewKategoriName('');
              setNewKategoriIsBerkurang(false);
              setIsKategoriModalOpen(true);
            }}
            className='shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border-2 border-dashed border-slate-300 text-slate-500 hover:border-purple-400 hover:text-purple-600 transition-all'>
            <FolderPlus className='size-4' />
            Tambah Kategori
          </button>
        </div>
      </CardHeader>

      <CardContent>
        {activeKategoriId === null ? (
          <div className='text-center py-16 text-slate-500 text-lg'>
            Belum ada kategori. Klik{' '}
            <strong className='text-purple-600'>"+ Tambah Kategori"</strong> di
            atas untuk memulai.
          </div>
        ) : loadingInventaris ? (
          <div className='flex flex-col items-center justify-center py-20 text-purple-600'>
            <Activity className='size-10 mb-4' />
            <span className='text-2xl font-black'>{progressInventaris}%</span>
            <p className='text-sm font-medium text-slate-500 mt-2'>Memuat inventaris...</p>
          </div>
        ) : (
          <>
            {/* MOBILE VIEW */}
            <div className='md:hidden flex flex-col gap-3 p-4 bg-slate-50/50'>
              {dataInventaris.map((item) => {
                const total = (item.jumlah_baik ?? 0) + (item.jumlah_rusak_ringan ?? 0) + (item.jumlah_rusak_berat ?? 0);
                return (
                  <div key={item.id} className='bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex flex-col gap-3'>
                    <div className='flex justify-between items-start gap-2'>
                      <h4 className='font-bold text-slate-800 line-clamp-2'>{item.jenis_alat}</h4>
                    </div>
                    <p className='text-sm text-slate-500 line-clamp-2'>{item.spesifikasi || '-'}</p>
                    <div className='grid grid-cols-2 gap-2 text-xs font-semibold'>
                      <span className='bg-green-50 text-green-700 px-2 py-1.5 rounded-lg border border-green-200 text-center'>Baik: {item.jumlah_baik ?? 0}</span>
                      <span className='bg-amber-50 text-amber-700 px-2 py-1.5 rounded-lg border border-amber-200 text-center'>RR: {item.jumlah_rusak_ringan ?? 0}</span>
                      <span className='bg-red-50 text-red-700 px-2 py-1.5 rounded-lg border border-red-200 text-center'>RB: {item.jumlah_rusak_berat ?? 0}</span>
                      <span className='bg-slate-100 text-slate-700 px-2 py-1.5 rounded-lg border border-slate-200 text-center font-bold text-sm'>Total: {total}</span>
                    </div>
                    {item.keterangan && <p className='text-xs text-slate-400 italic line-clamp-1 mt-1'>{item.keterangan}</p>}
                    <Button variant='outline' className='w-full mt-2 h-11 border-purple-200 text-purple-700 bg-purple-50/50 hover:bg-purple-100 font-bold' onClick={() => openEdit(item)}>
                      <Pencil className='size-4 mr-2' /> Edit Alat
                    </Button>
                  </div>
                );
              })}
            </div>
            {/* DESKTOP VIEW */}
            <div className='hidden md:block rounded-md border overflow-x-auto'>
            <Table>
              <TableHeader className='bg-slate-50'>
                <TableRow>
                  <TableHead className='font-semibold text-slate-800 text-sm w-12 text-center'>
                    No
                  </TableHead>
                  <TableHead className='font-semibold text-slate-800 text-sm'>
                    Jenis Alat
                  </TableHead>
                  <TableHead className='font-semibold text-slate-800 text-sm'>
                    Spesifikasi
                  </TableHead>
                  <TableHead className='font-semibold text-slate-800 text-sm text-center'>
                    <span className='text-green-600'>Baik</span>
                  </TableHead>
                  <TableHead className='font-semibold text-slate-800 text-sm text-center'>
                    <span className='text-amber-600'>R. Ringan</span>
                  </TableHead>
                  <TableHead className='font-semibold text-slate-800 text-sm text-center'>
                    <span className='text-red-600'>R. Berat</span>
                  </TableHead>
                  <TableHead className='font-semibold text-slate-800 text-sm text-center'>
                    Total
                  </TableHead>
                  <TableHead className='font-semibold text-slate-800 text-sm'>
                    Keterangan
                  </TableHead>
                  <TableHead className='font-semibold text-slate-800 text-sm text-center'>
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataInventaris.map((item, index) => {
                  const total =
                    (item.jumlah_baik ?? 0) +
                    (item.jumlah_rusak_ringan ?? 0) +
                    (item.jumlah_rusak_berat ?? 0);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className='text-slate-700 text-sm text-center font-medium'>
                        {index + 1}
                      </TableCell>
                      <TableCell className='font-semibold text-slate-900 text-sm'>
                        {item.jenis_alat}
                      </TableCell>
                      <TableCell
                        className='text-slate-600 text-sm max-w-[200px] truncate'
                        title={item.spesifikasi || ''}>
                        {item.spesifikasi || '-'}
                      </TableCell>
                      <TableCell className='text-center'>
                        <Badge
                          variant='outline'
                          className='text-sm text-green-700 border-green-200 bg-green-50 font-bold'>
                          {item.jumlah_baik ?? 0}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-center'>
                        <Badge
                          variant='outline'
                          className='text-sm text-amber-700 border-amber-200 bg-amber-50 font-bold'>
                          {item.jumlah_rusak_ringan ?? 0}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-center'>
                        <Badge
                          variant='outline'
                          className='text-sm text-red-700 border-red-200 bg-red-50 font-bold'>
                          {item.jumlah_rusak_berat ?? 0}
                        </Badge>
                      </TableCell>
                      <TableCell className='font-bold text-slate-900 text-sm text-center'>
                        {total}
                      </TableCell>
                      <TableCell
                        className='text-slate-600 text-sm truncate max-w-[120px]'
                        title={item.keterangan || ''}>
                        {item.keterangan || '-'}
                      </TableCell>
                      <TableCell className='text-center'>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => openEdit(item)}>
                          <Pencil className='size-3.5 mr-1.5' /> Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {dataInventaris.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className='text-center py-10 text-slate-500 text-lg'>
                      Belum ada data inventaris di kategori ini.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {totalCount > rowsPerPage && (
            <div className='flex flex-col sm:flex-row items-center justify-between sm:justify-end gap-3 p-4 bg-slate-50 border-t border-slate-200'>
              <span className='text-sm font-semibold text-slate-500 sm:mr-4 text-center sm:text-left'>
                Total Data: {totalCount} | Halaman {page} dari {Math.ceil(totalCount / rowsPerPage)}
              </span>
              <div className='flex gap-2 w-full sm:w-auto'>
                <Button variant='outline' size='sm' onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || loadingInventaris} className='flex-1 sm:flex-none h-10 font-bold'>
                  <ChevronLeft className='size-4 mr-1' /> Prev
                </Button>
                <Button variant='outline' size='sm' onClick={() => setPage((p) => Math.min(Math.ceil(totalCount / rowsPerPage), p + 1))} disabled={page === Math.ceil(totalCount / rowsPerPage) || loadingInventaris} className='flex-1 sm:flex-none h-10 font-bold'>
                  Next <ChevronRight className='size-4 ml-1' />
                </Button>
              </div>
            </div>
          )}
          </>
        )}
      </CardContent>

      {/* MODAL — TAMBAH KATEGORI */}
      <Dialog open={isKategoriModalOpen} onOpenChange={setIsKategoriModalOpen}>
        <DialogContent className='w-[95vw] lg:max-w-[85vw] xl:max-w-[75vw] max-h-[85vh] overflow-hidden rounded-2xl flex flex-col p-0 bg-slate-50 border-none shadow-2xl [&>button]:hidden'>
          <div className='shrink-0 bg-white border-b border-slate-200 px-5 py-4 flex items-start justify-between z-20 shadow-sm'>
            <div className='flex flex-col'>
              <DialogTitle className='text-xl md:text-2xl font-black text-slate-800'>Tambah Kategori Baru</DialogTitle>
              <DialogDescription className='text-sm md:text-base text-slate-500 mt-1'>
                Buat kategori untuk mengelompokkan alat/bahan inventaris.
              </DialogDescription>
            </div>
            <Button type='button' variant='ghost' size='icon' className='shrink-0 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors' onClick={() => setIsKategoriModalOpen(false)}>
              <X className='size-6' />
            </Button>
          </div>
          <form onSubmit={submitKategori} className='flex flex-col h-full overflow-hidden'>
            <div className='flex-1 overflow-y-auto p-4 sm:p-6 space-y-4'>
              <div className='space-y-2'>
              <Label htmlFor='kat_nama' className='text-base'>
                Nama Kategori
              </Label>
              <Input
                id='kat_nama'
                required
                value={newKategoriName}
                onChange={(e) => setNewKategoriName(e.target.value)}
                placeholder='Contoh: Alat Tangkap, Bahan Kimia, dll.'
                className='text-base h-11'
              />
            </div>

            {/* OPSI BAHAN HABIS PAKAI */}
            <div className='flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg mt-2'>
              <input
                type='checkbox'
                id='is_berkurang'
                className='mt-1 size-4 rounded border-amber-300 text-amber-600 focus:ring-amber-600 cursor-pointer'
                checked={newKategoriIsBerkurang}
                onChange={(e) => setNewKategoriIsBerkurang(e.target.checked)}
              />
              <div className='flex flex-col'>
                <Label
                  htmlFor='is_berkurang'
                  className='font-bold text-amber-900 cursor-pointer text-sm'>
                  Ini adalah Bahan Habis Pakai
                </Label>
                <span className='text-xs text-amber-700 mt-0.5 leading-tight'>
                  Centang jika stok alat/bahan dalam kategori ini harus otomatis
                  berkurang secara permanen saat disetujui peminjamannya (Cth:
                  Pakan ikan, Bahan kimia).
                </span>
              </div>
            </div>

            </div>
            <div className='shrink-0 bg-white border-t border-slate-200 p-4 sm:px-6 flex justify-end z-20'>
              <Button
                type='submit'
                className='w-full font-bold bg-purple-600 hover:bg-purple-700 text-base py-6'
                disabled={isSubmittingKategori}>
                {isSubmittingKategori ? 'Menyimpan...' : 'Simpan Kategori'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL — TAMBAH / EDIT ALAT */}
      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditItemId(null);
            setIsFormOpen(false);
          } else setIsFormOpen(true);
        }}>
        <DialogContent
          className='w-[95vw] lg:max-w-[85vw] xl:max-w-[75vw] max-h-[85vh] overflow-hidden rounded-2xl flex flex-col p-0 bg-slate-50 border-none shadow-2xl [&>button]:hidden'
          onInteractOutside={(e) => {
            const isSwalOpen = document.querySelector('.swal2-container');
            if (isSwalOpen) e.preventDefault();
          }}>
          <div className='shrink-0 bg-white border-b border-slate-200 px-5 py-4 flex items-start justify-between z-20 shadow-sm'>
            <div className='flex flex-col'>
              <DialogTitle className='text-xl md:text-2xl font-black text-slate-800'>
                {editItemId ? 'Edit Data Alat' : 'Tambah Alat Baru'}
              </DialogTitle>
              <DialogDescription className='text-sm md:text-base text-slate-500 mt-1'>
                {editItemId
                  ? 'Ubah informasi inventaris ini sesuai keadaan terbaru.'
                  : 'Registrasi data aset baru ke dalam inventaris laboratorium Anda.'}
              </DialogDescription>
            </div>
            <Button type='button' variant='ghost' size='icon' className='shrink-0 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors' onClick={() => { setIsFormOpen(false); setEditItemId(null); }}>
              <X className='size-6' />
            </Button>
          </div>
          <form onSubmit={submitInventaris} className='flex flex-col h-full overflow-hidden'>
            <div className='flex-1 overflow-y-auto p-4 sm:p-6 space-y-4'>
              <div className='space-y-2'>
              <Label className='text-base'>Kategori</Label>
              <Input
                value={
                  kategoriList.find((k) => k.id === activeKategoriId)
                    ?.nama_kategori || '-'
                }
                readOnly
                className='bg-slate-100 text-base h-11 text-slate-500 font-medium'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='i_nama' className='text-base'>
                Jenis Alat
              </Label>
              <Input
                id='i_nama'
                required
                value={formData.jenis_alat}
                onChange={(e) =>
                  setFormData({ ...formData, jenis_alat: e.target.value })
                }
                placeholder='Contoh: Mikroskop Digital'
                className='text-base h-11'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='i_spec' className='text-base'>
                Spesifikasi (Opsional)
              </Label>
              <Textarea
                id='i_spec'
                value={formData.spesifikasi}
                onChange={(e) =>
                  setFormData({ ...formData, spesifikasi: e.target.value })
                }
                placeholder='Contoh: Lensa 1000x Zoom'
                className='text-base resize-none'
                rows={2}
              />
            </div>

            <div className='space-y-2'>
              <Label className='text-base'>Jumlah per Kondisi</Label>
              <div className='grid grid-cols-3 gap-3'>
                <div className='space-y-1.5'>
                  <span className='text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full'>
                    Baik
                  </span>
                  <Input
                    type='number'
                    min='0'
                    required
                    value={formData.jumlah_baik}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        jumlah_baik: parseInt(e.target.value) || 0,
                      })
                    }
                    className='text-base h-11 text-center font-semibold'
                  />
                </div>
                <div className='space-y-1.5'>
                  <span className='text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full'>
                    Rusak Ringan
                  </span>
                  <Input
                    type='number'
                    min='0'
                    required
                    value={formData.jumlah_rusak_ringan}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        jumlah_rusak_ringan: parseInt(e.target.value) || 0,
                      })
                    }
                    className='text-base h-11 text-center font-semibold'
                  />
                </div>
                <div className='space-y-1.5'>
                  <span className='text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full'>
                    Rusak Berat
                  </span>
                  <Input
                    type='number'
                    min='0'
                    required
                    value={formData.jumlah_rusak_berat}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        jumlah_rusak_berat: parseInt(e.target.value) || 0,
                      })
                    }
                    className='text-base h-11 text-center font-semibold'
                  />
                </div>
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='i_ket' className='text-base'>
                Keterangan (Asal Pengadaan)
              </Label>
              <Input
                id='i_ket'
                className='flex h-11 w-full text-base'
                placeholder='Contoh: Hibah, Pembelian 2024'
                value={formData.keterangan}
                onChange={(e) =>
                  setFormData({ ...formData, keterangan: e.target.value })
                }
              />
            </div>

            </div>
            <div className='shrink-0 bg-white border-t border-slate-200 p-4 sm:px-6 flex flex-col sm:flex-row gap-3 justify-end z-20'>
              {/* TOMBOL HAPUS (Hanya muncul jika sedang edit barang) */}
              {editItemId && (
                <Button
                  type='button'
                  onClick={(e) => deleteInventaris(e)}
                  variant='outline'
                  className='w-full sm:w-auto font-bold text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 h-11'
                  disabled={isSubmitting}>
                  <Trash2 className='size-4 mr-2' /> Hapus Alat
                </Button>
              )}

              <Button
                type='submit'
                className='w-full sm:flex-1 font-bold bg-purple-600 hover:bg-purple-700 text-base h-11'
                disabled={isSubmitting}>
                {isSubmitting
                  ? 'Menyimpan...'
                  : editItemId
                    ? 'Simpan Perubahan'
                    : 'Simpan Alat'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
