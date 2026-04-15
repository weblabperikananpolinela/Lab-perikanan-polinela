'use client';

import { useEffect, useState, useCallback } from 'react';
import { PackageSearch, Plus, Pencil, FolderPlus } from 'lucide-react';
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
  16: 'polyfish',
  17: 'Lab Simulator',
  18: 'Lab Radar',
};

// --- Tipe Data ---
interface Kategori {
  id: number;
  lab_id: number;
  nama_kategori: string;
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

// 4. INVENTARIS TAB
export default function InventarisTab({
  adminProfile,
  supabase,
}: {
  adminProfile: any;
  supabase: any;
}) {
  // --- Kategori State ---
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [activeKategoriId, setActiveKategoriId] = useState<number | null>(null);
  const [loadingKategori, setLoadingKategori] = useState(true);

  // --- Inventaris State ---
  const [dataInventaris, setDataInventaris] = useState<InventarisItem[]>([]);
  const [loadingInventaris, setLoadingInventaris] = useState(false);

  // --- Modal Tambah Kategori ---
  const [isKategoriModalOpen, setIsKategoriModalOpen] = useState(false);
  const [newKategoriName, setNewKategoriName] = useState('');
  const [isSubmittingKategori, setIsSubmittingKategori] = useState(false);

  // --- Modal Tambah/Edit Alat ---
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(defaultFormData);
  const [editItemId, setEditItemId] = useState<number | null>(null);

  // ===================================================================
  //  FETCH KATEGORI — Hanya tarik kategori untuk lab yang sedang aktif
  // ===================================================================
  const fetchKategori = useCallback(async () => {
    setLoadingKategori(true);
    const { data } = await supabase
      .from('kategori_inventaris')
      .select('*')
      .eq('lab_id', adminProfile.lab_id) // LOGIKA MULTI-TENANT LAMA DIHAPUS, GANTI JADI INI
      .order('nama_kategori', { ascending: true });

    if (data && data.length > 0) {
      setKategoriList(data);
      // Pilih kategori pertama secara default jika belum ada yang aktif
      setActiveKategoriId((prev) => {
        const stillExists = data.some((k: Kategori) => k.id === prev);
        return stillExists ? prev : data[0].id;
      });
    } else {
      setKategoriList([]);
      setActiveKategoriId(null);
    }
    setLoadingKategori(false);
  }, [supabase, adminProfile.lab_id]);

  useEffect(() => {
    fetchKategori();
  }, [fetchKategori]);

  // ===================================================================
  //  FETCH INVENTARIS — Dipicu saat kategori aktif berubah
  // ===================================================================
  const fetchInventaris = useCallback(async () => {
    if (activeKategoriId === null) {
      setDataInventaris([]);
      return;
    }
    setLoadingInventaris(true);
    const { data } = await supabase
      .from('inventaris')
      .select('*')
      .eq('kategori_id', activeKategoriId)
      .order('jenis_alat', { ascending: true });

    if (data) setDataInventaris(data);
    else setDataInventaris([]);
    setLoadingInventaris(false);
  }, [supabase, activeKategoriId]);

  useEffect(() => {
    fetchInventaris();
  }, [fetchInventaris]);

  // ===================================================================
  //  SUBMIT KATEGORI BARU
  // ===================================================================
  const submitKategori = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKategoriName.trim()) return;
    setIsSubmittingKategori(true);

    const { error } = await supabase.from('kategori_inventaris').insert({
      lab_id: adminProfile.lab_id, // Langsung insert ke lab_id milik admin saat ini
      nama_kategori: newKategoriName.trim(),
    });

    setIsSubmittingKategori(false);

    if (error) {
      Swal.fire({ text: 'Gagal menambahkan kategori: ' + error.message, icon: 'error', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true });
    } else {
      setNewKategoriName('');
      setIsKategoriModalOpen(false);
      fetchKategori();
      Swal.fire({ text: 'Kategori berhasil ditambahkan!', icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true });
    }
  };

  // ===================================================================
  //  SUBMIT INVENTARIS (INSERT / UPDATE)
  // ===================================================================
  const submitInventaris = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeKategoriId === null) {
      Swal.fire({ text: 'Pilih atau buat kategori terlebih dahulu.', icon: 'warning', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true });
      return;
    }
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
      Swal.fire({ text: `Gagal ${editItemId ? 'mengupdate' : 'menambahkan'} alat: ${error.message}`, icon: 'error', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true });
    } else {
      setIsFormOpen(false);
      setEditItemId(null);
      setFormData(defaultFormData);
      fetchInventaris();
      Swal.fire({ text: `Alat berhasil ${editItemId ? 'diperbarui' : 'ditambahkan'}!`, icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true });
    }
  };

  // ===================================================================
  //  OPEN HELPERS
  // ===================================================================
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

  // ===================================================================
  //  LOADING STATE
  // ===================================================================
  if (loadingKategori) {
    return (
      <div className='animate-pulse text-lg text-slate-500 font-medium'>
        Memuat data inventaris...
      </div>
    );
  }

  // ===================================================================
  //  RENDER
  // ===================================================================
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

        {/* ============================================================= */}
        {/* NAVIGATION BAR KATEGORI                                      */}
        {/* ============================================================= */}
        <div className='flex items-center gap-2 overflow-x-auto pb-1 -mb-2 scrollbar-thin'>
          {kategoriList.map((kat) => (
            <button
              key={kat.id}
              onClick={() => setActiveKategoriId(kat.id)}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${
                activeKategoriId === kat.id
                  ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}>
              {kat.nama_kategori}
            </button>
          ))}

          <button
            onClick={() => {
              setNewKategoriName('');
              setIsKategoriModalOpen(true);
            }}
            className='shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border-2 border-dashed border-slate-300 text-slate-500 hover:border-purple-400 hover:text-purple-600 transition-all'>
            <FolderPlus className='size-4' />
            Tambah Kategori
          </button>
        </div>
      </CardHeader>

      <CardContent>
        {/* ============================================================= */}
        {/* TABEL INVENTARIS                                              */}
        {/* ============================================================= */}
        {activeKategoriId === null ? (
          <div className='text-center py-16 text-slate-500 text-lg'>
            Belum ada kategori. Klik <strong className="text-purple-600">"+ Tambah Kategori"</strong> di atas untuk memulai.
          </div>
        ) : loadingInventaris ? (
          <div className='animate-pulse text-center py-16 text-slate-500 text-lg font-medium'>
            Memuat data inventaris...
          </div>
        ) : (
          <div className='rounded-md border overflow-x-auto'>
            <Table>
              <TableHeader className='bg-slate-50'>
                <TableRow>
                  <TableHead className='font-semibold text-slate-800 text-sm w-12 text-center'>No</TableHead>
                  <TableHead className='font-semibold text-slate-800 text-sm'>Jenis Alat</TableHead>
                  <TableHead className='font-semibold text-slate-800 text-sm'>Spesifikasi</TableHead>
                  <TableHead className='font-semibold text-slate-800 text-sm text-center'>
                    <span className='text-green-600'>Baik</span>
                  </TableHead>
                  <TableHead className='font-semibold text-slate-800 text-sm text-center'>
                    <span className='text-amber-600'>R. Ringan</span>
                  </TableHead>
                  <TableHead className='font-semibold text-slate-800 text-sm text-center'>
                    <span className='text-red-600'>R. Berat</span>
                  </TableHead>
                  <TableHead className='font-semibold text-slate-800 text-sm text-center'>Total</TableHead>
                  <TableHead className='font-semibold text-slate-800 text-sm'>Keterangan</TableHead>
                  <TableHead className='font-semibold text-slate-800 text-sm text-center'>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataInventaris.map((item, index) => {
                  const total = (item.jumlah_baik ?? 0) + (item.jumlah_rusak_ringan ?? 0) + (item.jumlah_rusak_berat ?? 0);
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
                        <Badge variant='outline' className='text-sm text-green-700 border-green-200 bg-green-50 font-bold'>
                          {item.jumlah_baik ?? 0}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-center'>
                        <Badge variant='outline' className='text-sm text-amber-700 border-amber-200 bg-amber-50 font-bold'>
                          {item.jumlah_rusak_ringan ?? 0}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-center'>
                        <Badge variant='outline' className='text-sm text-red-700 border-red-200 bg-red-50 font-bold'>
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
                        <Button size='sm' variant='outline' onClick={() => openEdit(item)}>
                          <Pencil className='size-3.5 mr-1.5' />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {dataInventaris.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className='text-center py-10 text-slate-500 text-lg'>
                      Belum ada data inventaris di kategori ini.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* ================================================================= */}
      {/* MODAL — TAMBAH KATEGORI                                          */}
      {/* ================================================================= */}
      <Dialog open={isKategoriModalOpen} onOpenChange={setIsKategoriModalOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='text-xl'>Tambah Kategori Baru</DialogTitle>
            <DialogDescription className='text-base'>
              Buat kategori untuk mengelompokkan alat/bahan inventaris.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitKategori} className='space-y-4 pt-4'>
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
            <DialogFooter className='mt-6 pt-4'>
              <Button
                type='submit'
                className='w-full font-bold bg-purple-600 hover:bg-purple-700 text-base py-6'
                disabled={isSubmittingKategori}>
                {isSubmittingKategori ? 'Menyimpan...' : 'Simpan Kategori'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================================================================= */}
      {/* MODAL — TAMBAH / EDIT ALAT                                       */}
      {/* ================================================================= */}
      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditItemId(null);
            setIsFormOpen(false);
          } else {
            setIsFormOpen(true);
          }
        }}>
        <DialogContent className='sm:max-w-lg max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='text-xl'>
              {editItemId ? 'Edit Data Alat' : 'Tambah Alat Baru'}
            </DialogTitle>
            <DialogDescription className='text-base'>
              {editItemId
                ? 'Ubah informasi inventaris ini sesuai keadaan terbaru.'
                : 'Registrasi data aset baru ke dalam inventaris laboratorium Anda.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitInventaris} className='space-y-4 pt-4'>
            {/* Kategori (read-only indicator) */}
            <div className='space-y-2'>
              <Label className='text-base'>Kategori</Label>
              <Input
                value={
                  kategoriList.find((k) => k.id === activeKategoriId)?.nama_kategori || '-'
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

            {/* 3 Input Kondisi Sejajar */}
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
              <p className='text-xs text-slate-400 mt-1'>
                Total:{' '}
                <span className='font-bold text-slate-600'>
                  {formData.jumlah_baik + formData.jumlah_rusak_ringan + formData.jumlah_rusak_berat}
                </span>{' '}
                unit
              </p>
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

            <DialogFooter className='mt-6 pt-4'>
              <Button
                type='submit'
                className='w-full font-bold bg-purple-600 hover:bg-purple-700 text-base py-6'
                disabled={isSubmitting}>
                {isSubmitting
                  ? 'Menyimpan...'
                  : editItemId
                    ? 'Simpan Perubahan'
                    : 'Simpan Alat'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}