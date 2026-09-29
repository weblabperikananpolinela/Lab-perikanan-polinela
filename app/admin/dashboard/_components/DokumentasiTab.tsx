'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Swal from 'sweetalert2';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isAllowedImage, uploadImageToCloudinary, deleteCloudinaryFile } from '@/lib/cloudinary-upload';

type FotoRow = {
  id: number;
  lab_id: number | null;
  file_url: string;
  file_type: string | null;
  is_visible: boolean;
  uploaded_by: string | null;
  created_at: string;
  nama_kegiatan: string | null;
  deskripsi: string | null;
};

const NAMA_MAX = 120;
const DESKRIPSI_MAX = 500;

export default function DokumentasiTab({
  adminProfile,
  supabase,
}: {
  adminProfile: any;
  supabase: any;
}) {
  const [fotos, setFotos] = useState<FotoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [namaKegiatan, setNamaKegiatan] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const userEmail = adminProfile.email || '';

  const fetchAll = useCallback(async () => {
    const { data } = await supabase
      .from('dokumentasi_foto')
      .select(
        'id, lab_id, file_url, file_type, is_visible, uploaded_by, created_at, nama_kegiatan, deskripsi',
      )
      .eq('lab_id', adminProfile.lab_id)
      .order('created_at', { ascending: false });
    setFotos(data || []);
    setLoading(false);
  }, [supabase, adminProfile.lab_id]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const canDelete = (foto: FotoRow) =>
    foto.uploaded_by === userEmail || foto.lab_id === adminProfile.lab_id;

  const resetModal = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setNamaKegiatan('');
    setDeskripsi('');
  };

  const openModal = () => {
    resetModal();
    setModalOpen(true);
  };

  const pickFile = (file: File) => {
    const err = isAllowedImage(file);
    if (err) {
      Swal.fire('File tidak valid', err, 'warning');
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const canSubmit =
    Boolean(selectedFile) && namaKegiatan.trim().length > 0 && !uploading;

  const handleUpload = async () => {
    const nama = namaKegiatan.trim();
    if (!selectedFile || !nama) return;
    if (nama.length > NAMA_MAX) {
      Swal.fire('Nama terlalu panjang', `Maksimal ${NAMA_MAX} karakter.`, 'warning');
      return;
    }
    if (deskripsi.trim().length > DESKRIPSI_MAX) {
      Swal.fire(
        'Deskripsi terlalu panjang',
        `Maksimal ${DESKRIPSI_MAX} karakter.`,
        'warning',
      );
      return;
    }
    setUploading(true);
    try {
      const { url, fileType } = await uploadImageToCloudinary(
        selectedFile,
        'dolphin_dokumentasi',
      );
      const { error } = await supabase.from('dokumentasi_foto').insert({
        lab_id: adminProfile.lab_id,
        file_url: url,
        file_type: fileType,
        is_visible: true,
        uploaded_by: userEmail,
        nama_kegiatan: nama,
        deskripsi: deskripsi.trim() || null,
      });
      if (error) throw error;
      await fetchAll();
      setModalOpen(false);
      resetModal();
      Swal.fire({
        icon: 'success',
        title: 'Foto dokumentasi diunggah',
        text: 'Foto tampil di beranda dan bisa dikelola di System Admin.',
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire('Gagal unggah', err.message || 'Terjadi kesalahan', 'error');
    } finally {
      setUploading(false);
    }
  };

  const removeFoto = async (foto: FotoRow) => {
    const confirm = await Swal.fire({
      title: 'Hapus foto?',
      text: 'Foto hilang dari beranda dan dihapus dari Cloudinary.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
    });
    if (!confirm.isConfirmed) return;
    await supabase.from('dokumentasi_foto').delete().eq('id', foto.id);
    await deleteCloudinaryFile(foto.file_url, foto.file_type || 'webp');
    setFotos((prev) => prev.filter((row) => row.id !== foto.id));
  };

  return (
    <Card>
      <CardHeader className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <CardTitle>Dokumentasi Kegiatan</CardTitle>
          <CardDescription>
            Unggah foto kegiatan lab — foto langsung tampil di marquee beranda.
          </CardDescription>
        </div>
        <Button onClick={openModal} className='bg-blue-600 hover:bg-blue-700'>
          <ImagePlus className='mr-2 size-4' /> Unggah Foto
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className='flex items-center gap-2 text-slate-500 animate-pulse'>
            <Loader2 className='size-4 animate-spin' /> Memuat dokumentasi…
          </p>
        ) : fotos.length === 0 ? (
          <p className='py-10 text-center text-sm text-slate-500'>
            Belum ada foto. Unggah dokumentasi kegiatan lab Anda.
          </p>
        ) : (
          <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'>
            {fotos.map((foto) => (
              <div
                key={foto.id}
                className='group overflow-hidden rounded-xl border border-slate-200 bg-white'>
                <div className='relative aspect-[4/3]'>
                  <Image
                    src={foto.file_url}
                    alt={foto.nama_kegiatan || 'Dokumentasi kegiatan'}
                    fill
                    className='object-cover'
                    sizes='200px'
                  />
                </div>
                <div className='space-y-1 p-3'>
                  <p className='truncate text-sm font-semibold text-slate-800'>
                    {foto.nama_kegiatan || 'Tanpa nama'}
                  </p>
                  <div className='flex items-center justify-between gap-2'>
                    <span className='truncate text-xs text-slate-500'>
                      {new Date(foto.created_at).toLocaleDateString('id-ID')}
                    </span>
                    {canDelete(foto) ? (
                      <Button
                        size='sm'
                        variant='ghost'
                        className='text-red-500 hover:bg-red-50 hover:text-red-600'
                        onClick={() => removeFoto(foto)}
                        aria-label='Hapus foto'>
                        <Trash2 className='size-4' />
                      </Button>
                    ) : (
                      <span className='text-[10px] text-slate-400'>
                        {foto.is_visible ? 'Tampil' : 'Tersembunyi'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          if (!open && !uploading) {
            setModalOpen(false);
            resetModal();
          }
        }}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Unggah Dokumentasi</DialogTitle>
            <DialogDescription>
              Isi nama kegiatan lalu pilih foto. Deskripsi boleh dikosongkan.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div>
              <Label htmlFor='dok-file'>Foto</Label>
              <label
                htmlFor='dok-file'
                className='mt-1 flex aspect-video cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 transition-colors hover:border-blue-400 hover:text-blue-600'>
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt='Pratinjau foto'
                    className='h-full w-full object-cover'
                  />
                ) : (
                  <>
                    <ImagePlus className='size-8' />
                    <span className='mt-2 text-xs font-semibold'>Pilih foto</span>
                    <span className='text-[11px]'>JPG, PNG, atau WebP · maks 5 MB</span>
                  </>
                )}
              </label>
              <input
                id='dok-file'
                type='file'
                className='sr-only'
                accept='image/jpeg,image/png,image/webp'
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file) pickFile(file);
                }}
              />
            </div>

            <div>
              <Label htmlFor='dok-nama'>
                Nama kegiatan <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='dok-nama'
                className='mt-1'
                value={namaKegiatan}
                maxLength={NAMA_MAX}
                placeholder='Contoh: Praktikum kualitas air'
                onChange={(e) => setNamaKegiatan(e.target.value)}
              />
              <p className='mt-1 text-[11px] text-slate-400'>
                {namaKegiatan.trim().length}/{NAMA_MAX}
              </p>
            </div>

            <div>
              <Label htmlFor='dok-deskripsi'>Deskripsi (opsional)</Label>
              <textarea
                id='dok-deskripsi'
                value={deskripsi}
                maxLength={DESKRIPSI_MAX}
                rows={3}
                placeholder='Keterangan singkat kegiatan'
                onChange={(e) => setDeskripsi(e.target.value)}
                className='mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500'
              />
              <p className='mt-1 text-[11px] text-slate-400'>
                {deskripsi.trim().length}/{DESKRIPSI_MAX}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              disabled={uploading}
              onClick={() => {
                setModalOpen(false);
                resetModal();
              }}>
              Batal
            </Button>
            <Button onClick={handleUpload} disabled={!canSubmit}>
              {uploading ? (
                <>
                  <Loader2 className='mr-2 size-4 animate-spin' /> Mengunggah…
                </>
              ) : (
                'Unggah'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
