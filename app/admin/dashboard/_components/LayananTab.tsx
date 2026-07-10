'use client';

import { useEffect, useState } from 'react';
import { Activity, Plus, Trash2, Edit, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Swal from 'sweetalert2';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

// Helper function to format currency
const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka || 0);
};

export default function LayananTab({
  adminProfile,
  supabase,
}: {
  adminProfile: any;
  supabase: any;
}) {
  const [dataLayanan, setDataLayanan] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const rowsPerPage = 10;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [namaLayanan, setNamaLayanan] = useState('');
  const [hargaInternal, setHargaInternal] = useState('');
  const [hargaEksternal, setHargaEksternal] = useState('');
  const [editId, setEditId] = useState<number | null>(null);

  const fetchLayanan = async () => {
    setLoading(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((old) => (old < 90 ? old + 15 : old));
    }, 50);

    const from = (page - 1) * rowsPerPage;
    const to = from + rowsPerPage - 1;

    const { data: res, error, count } = await supabase
      .from('layanan_lab')
      .select('*', { count: 'exact' })
      .eq('lab_id', adminProfile.lab_id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (res) setDataLayanan(res);
    if (count !== null) setTotalCount(count);

    clearInterval(interval);
    setProgress(100);
    setTimeout(() => {
      setLoading(false);
    }, 300);
  };

  useEffect(() => {
    if (adminProfile?.lab_id) {
      fetchLayanan();
    }
  }, [adminProfile, page]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaLayanan.trim()) return;

    setIsSubmitting(true);

    try {
      const payload = {
        nama_layanan: namaLayanan,
        harga_internal: parseInt(hargaInternal) || 0,
        harga_eksternal: parseInt(hargaEksternal) || 0,
      };

      if (editId) {
        // Update
        const { error } = await supabase
          .from('layanan_lab')
          .update(payload)
          .eq('id', editId)
          .eq('lab_id', adminProfile.lab_id);

        if (error) throw error;

        Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: 'Layanan berhasil diperbarui.',
          confirmButtonColor: '#10b981',
        });
      } else {
        // Create
        const { error } = await supabase.from('layanan_lab').insert({
          lab_id: adminProfile.lab_id,
          ...payload,
        });

        if (error) throw error;

        Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: 'Layanan baru ditambahkan.',
          confirmButtonColor: '#10b981',
        });
      }

      setIsFormOpen(false);
      setNamaLayanan('');
      setHargaInternal('');
      setHargaEksternal('');
      setEditId(null);
      fetchLayanan();
    } catch (error: any) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: error.message || 'Gagal menyimpan data layanan.',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditId(item.id);
    setNamaLayanan(item.nama_layanan);
    setHargaInternal(item.harga_internal?.toString() || '0');
    setHargaEksternal(item.harga_eksternal?.toString() || '0');
    setIsFormOpen(true);
  };

  const handleDelete = async (item: any) => {
    const result = await Swal.fire({
      title: 'Hapus Layanan?',
      text: `Anda yakin ingin menghapus layanan "${item.nama_layanan}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    });

    if (result.isConfirmed) {
      try {
        const { error } = await supabase
          .from('layanan_lab')
          .delete()
          .eq('id', item.id)
          .eq('lab_id', adminProfile.lab_id);

        if (error) throw error;

        Swal.fire('Terhapus!', 'Layanan berhasil dihapus.', 'success');
        fetchLayanan();
      } catch (error: any) {
        Swal.fire('Error', 'Gagal menghapus: ' + error.message, 'error');
      }
    }
  };

  const openNewForm = () => {
    setEditId(null);
    setNamaLayanan('');
    setHargaInternal('');
    setHargaEksternal('');
    setIsFormOpen(true);
  };

  if (loading)
    return (
      <div className='flex flex-col items-center justify-center py-20 text-purple-600'>
        <Activity className='size-10 mb-4' />
        <span className='text-2xl font-black'>{progress}%</span>
        <p className='text-sm font-medium text-slate-500 mt-2'>Memuat data layanan...</p>
      </div>
    );

  return (
    <Card className='border-slate-200 shadow-sm border-t-4 border-t-purple-600'>
      <CardHeader className='flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-4'>
        <div>
          <CardTitle className='text-xl flex items-center gap-2'>
            <Activity className='size-5 text-purple-600' />
            Manajemen Layanan & Tarif Lab
          </CardTitle>
          <CardDescription className='text-base text-slate-600 mt-1'>
            Kelola daftar layanan/pengujian beserta tarif internal dan eksternal.
          </CardDescription>
        </div>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openNewForm}
              className='bg-purple-600 hover:bg-purple-700 font-bold shadow-md text-base py-5'>
              <Plus className='size-4 mr-2' /> Tambah Layanan
            </Button>
          </DialogTrigger>
          <DialogContent className='w-[95vw] lg:max-w-[85vw] xl:max-w-[75vw] max-h-[85vh] overflow-hidden rounded-2xl flex flex-col p-0 bg-slate-50 border-none shadow-2xl [&>button]:hidden'>
            <div className='shrink-0 bg-white border-b border-slate-200 px-5 py-4 flex items-start justify-between z-20 shadow-sm'>
              <div className='flex flex-col'>
                <DialogTitle className='text-xl md:text-2xl font-black text-slate-800'>
                  {editId ? 'Edit Layanan' : 'Tambah Layanan Baru'}
                </DialogTitle>
                <DialogDescription className='text-sm md:text-base text-slate-500 mt-1'>
                  Masukkan nama layanan dan tarif (hanya angka) untuk lab ini.
                </DialogDescription>
              </div>
              <Button type='button' variant='ghost' size='icon' className='shrink-0 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors' onClick={() => setIsFormOpen(false)}>
                <X className='size-6' />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className='flex flex-col h-full overflow-hidden'>
              <div className='flex-1 overflow-y-auto p-4 sm:p-6 space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='nama_layanan' className='text-base'>
                  Jenis Uji / Layanan
                </Label>
                <Input
                  id='nama_layanan'
                  required
                  value={namaLayanan}
                  onChange={(e) => setNamaLayanan(e.target.value)}
                  placeholder='Contoh: Uji Kualitas Air'
                  className='text-base h-11'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='harga_internal' className='text-base'>
                  Tarif Mahasiswa/Dosen (Rp)
                </Label>
                <Input
                  id='harga_internal'
                  type='number'
                  required
                  value={hargaInternal}
                  onChange={(e) => setHargaInternal(e.target.value)}
                  placeholder='Contoh: 10000'
                  className='text-base h-11'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='harga_eksternal' className='text-base'>
                  Tarif Eksternal (Rp)
                </Label>
                <Input
                  id='harga_eksternal'
                  type='number'
                  required
                  value={hargaEksternal}
                  onChange={(e) => setHargaEksternal(e.target.value)}
                  placeholder='Contoh: 15000'
                  className='text-base h-11'
                />
              </div>
              </div>
              <div className='shrink-0 bg-white border-t border-slate-200 p-4 sm:px-6 flex justify-end z-20'>
                <Button
                  type='submit'
                  className='w-full font-bold bg-purple-600 hover:bg-purple-700 text-base py-6'
                  disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Layanan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        <>
          {/* MOBILE VIEW */}
          <div className='md:hidden flex flex-col gap-3 p-4 bg-slate-50/50'>
            {dataLayanan.map((item, idx) => (
              <div key={item.id} className='bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex flex-col gap-3'>
                <h4 className='font-bold text-slate-800 line-clamp-2'>{item.nama_layanan}</h4>
                <div className='grid grid-cols-2 gap-2 text-sm'>
                  <div>
                    <p className='text-xs text-slate-500 font-medium mb-1'>Tarif Internal</p>
                    <p className='font-semibold text-slate-700 bg-slate-100 p-2 rounded'>{formatRupiah(item.harga_internal)}</p>
                  </div>
                  <div>
                    <p className='text-xs text-slate-500 font-medium mb-1'>Tarif Eksternal</p>
                    <p className='font-semibold text-slate-700 bg-slate-100 p-2 rounded'>{formatRupiah(item.harga_eksternal)}</p>
                  </div>
                </div>
                <div className='flex items-center justify-end gap-2 mt-2 pt-2 border-t border-slate-100'>
                  <Button size='sm' variant='outline' onClick={() => handleEdit(item)} className='text-blue-600 hover:text-blue-800 hover:bg-blue-50 flex-1 font-bold'>
                    <Edit className='size-4 mr-2' /> Edit
                  </Button>
                  <Button size='sm' variant='outline' onClick={() => handleDelete(item)} className='text-red-500 hover:text-red-700 hover:bg-red-50 flex-1 font-bold'>
                    <Trash2 className='size-4 mr-2' /> Hapus
                  </Button>
                </div>
              </div>
            ))}
            {dataLayanan.length === 0 && (
              <div className='text-center py-10 text-slate-500 text-lg'>
                Belum ada layanan yang ditambahkan.
              </div>
            )}
          </div>
          {/* DESKTOP VIEW */}
          <div className='hidden md:block rounded-md border overflow-x-auto'>
          <Table>
            <TableHeader className='bg-slate-50'>
              <TableRow>
                <TableHead className='font-semibold text-slate-800 text-sm w-16 text-center'>
                  No
                </TableHead>
                <TableHead className='font-semibold text-slate-800 text-sm'>
                  Jenis Uji / Layanan
                </TableHead>
                <TableHead className='font-semibold text-slate-800 text-sm'>
                  Tarif Internal
                </TableHead>
                <TableHead className='font-semibold text-slate-800 text-sm'>
                  Tarif Eksternal
                </TableHead>
                <TableHead className='font-semibold text-slate-800 text-center text-sm w-32'>
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataLayanan.map((item, idx) => (
                <TableRow key={item.id}>
                  <TableCell className='text-center text-sm font-medium'>
                    {idx + 1}
                  </TableCell>
                  <TableCell className='text-slate-900 font-semibold text-base'>
                    {item.nama_layanan}
                  </TableCell>
                  <TableCell className='text-slate-600 font-medium text-sm'>
                    {formatRupiah(item.harga_internal)}
                  </TableCell>
                  <TableCell className='text-slate-600 font-medium text-sm'>
                    {formatRupiah(item.harga_eksternal)}
                  </TableCell>
                  <TableCell className='text-center'>
                    <div className='flex items-center justify-center gap-2'>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleEdit(item)}
                        className='text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                      >
                        <Edit className='size-4' />
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleDelete(item)}
                        className='text-red-500 hover:text-red-700 hover:bg-red-50'
                      >
                        <Trash2 className='size-4' />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {dataLayanan.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className='text-center py-10 text-slate-500 text-lg'>
                    Belum ada layanan yang ditambahkan.
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
              <Button variant='outline' size='sm' onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || loading} className='flex-1 sm:flex-none h-10 font-bold'>
                <ChevronLeft className='size-4 mr-1' /> Prev
              </Button>
              <Button variant='outline' size='sm' onClick={() => setPage((p) => Math.min(Math.ceil(totalCount / rowsPerPage), p + 1))} disabled={page === Math.ceil(totalCount / rowsPerPage) || loading} className='flex-1 sm:flex-none h-10 font-bold'>
                Next <ChevronRight className='size-4 ml-1' />
              </Button>
            </div>
          </div>
        )}
        </>
      </CardContent>
    </Card>
  );
}
