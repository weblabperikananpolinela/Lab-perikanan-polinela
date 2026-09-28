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
  deleteCloudinaryFile,
  uploadImageToCloudinary,
} from '@/lib/cloudinary-upload';

type FotoRow = {
  id: number;
  lab_id: number | null;
  file_url: string;
  file_type: string | null;
  is_visible: boolean;
  uploaded_by: string | null;
  created_at: string;
};

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
  const userEmail = adminProfile.email || '';

  const fetchAll = useCallback(async () => {
    const { data } = await supabase
      .from('dokumentasi_foto')
      .select(
        'id, lab_id, file_url, file_type, is_visible, uploaded_by, created_at',
      )
      .eq('lab_id', adminProfile.lab_id)
      .order('created_at', { ascending: false });
    setFotos(data || []);
    setLoading(false);
  }, [supabase, adminProfile.lab_id]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const canDelete = (foto: FotoRow) =>
    foto.uploaded_by === userEmail || foto.lab_id === adminProfile.lab_id;

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const { url, fileType } = await uploadImageToCloudinary(
        file,
        'dolphin_dokumentasi',
      );
      const { error } = await supabase.from('dokumentasi_foto').insert({
        lab_id: adminProfile.lab_id,
        file_url: url,
        file_type: fileType,
        is_visible: true,
        uploaded_by: userEmail,
      });
      if (error) throw error;
      await fetchAll();
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
            Unggah foto kegiatan {adminProfile.lab_id} — foto langsung tampil di
            marquee beranda.
          </CardDescription>
        </div>
        <label className='inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700'>
          {uploading ? (
            <>
              <Loader2 className='size-4 animate-spin' /> Mengunggah…
            </>
          ) : (
            <>
              <ImagePlus className='size-4' /> Unggah Foto
            </>
          )}
          <input
            type='file'
            className='hidden'
            accept='image/jpeg,image/png,image/webp'
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) handleUpload(file);
            }}
          />
        </label>
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
                    alt='Dokumentasi kegiatan'
                    fill
                    className='object-cover'
                    sizes='200px'
                  />
                </div>
                <div className='flex items-center justify-between p-3'>
                  <span className='truncate text-xs text-slate-500'>
                    {new Date(foto.created_at).toLocaleDateString('id-ID')}
                  </span>
                  {canDelete(foto) ? (
                    <Button
                      size='sm'
                      variant='ghost'
                      className='text-red-500 hover:bg-red-50 hover:text-red-600'
                      onClick={() => removeFoto(foto)}>
                      <Trash2 className='size-4' />
                    </Button>
                  ) : (
                    <span className='text-[10px] text-slate-400'>
                      {foto.is_visible ? 'Tampil' : 'Tersembunyi'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
