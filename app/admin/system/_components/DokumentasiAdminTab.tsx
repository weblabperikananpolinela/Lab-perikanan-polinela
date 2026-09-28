'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Swal from 'sweetalert2';
import { Eye, EyeOff, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { deleteCloudinaryFile } from '@/lib/cloudinary-upload';

type FotoRow = {
  id: number;
  lab_id: number | null;
  file_url: string;
  file_type: string | null;
  is_visible: boolean;
  uploaded_by: string | null;
  created_at: string;
  labName?: string;
};

export default function DokumentasiAdminTab({
  supabase,
  labMap,
}: {
  supabase: any;
  labMap: Record<number, string>;
}) {
  const [fotos, setFotos] = useState<FotoRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const { data } = await supabase
      .from('dokumentasi_foto')
      .select('id, lab_id, file_url, file_type, is_visible, uploaded_by, created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    setFotos(
      (data || []).map((row: FotoRow) => ({
        ...row,
        labName: row.lab_id ? labMap[row.lab_id] || `Lab ${row.lab_id}` : 'Umum',
      })),
    );
    setLoading(false);
  }, [supabase, labMap]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const toggleVisible = async (foto: FotoRow) => {
    const { error } = await supabase
      .from('dokumentasi_foto')
      .update({ is_visible: !foto.is_visible })
      .eq('id', foto.id);
    if (error) {
      Swal.fire('Gagal', error.message, 'error');
      return;
    }
    setFotos((prev) =>
      prev.map((row) =>
        row.id === foto.id ? { ...row, is_visible: !row.is_visible } : row,
      ),
    );
  };

  const removeFoto = async (foto: FotoRow) => {
    const confirm = await Swal.fire({
      title: 'Hapus foto dokumentasi?',
      text: 'Foto hilang dari beranda dan dihapus dari Cloudinary.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
    });
    if (!confirm.isConfirmed) return;
    const { error } = await supabase.from('dokumentasi_foto').delete().eq('id', foto.id);
    if (error) {
      Swal.fire('Gagal', error.message, 'error');
      return;
    }
    await deleteCloudinaryFile(foto.file_url, foto.file_type || 'webp');
    setFotos((prev) => prev.filter((row) => row.id !== foto.id));
  };

  if (loading) {
    return (
      <p className='text-slate-500 animate-pulse flex items-center gap-2'>
        <Loader2 className='size-4 animate-spin' /> Memuat dokumentasi…
      </p>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dokumentasi Kegiatan</CardTitle>
        <CardDescription>
          Foto yang tampil di marquee beranda — diunggah admin lab/PJ,
          dikurasi di sini. Matikan saklar untuk menyembunyikan tanpa menghapus.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {fotos.length === 0 ? (
          <p className='py-10 text-center text-sm text-slate-500'>
            Belum ada foto dokumentasi. Mintalah PJ lab mengunggah lewat tab
            Dokumentasi di dashboard lab.
          </p>
        ) : (
          <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
            {fotos.map((foto) => (
              <div
                key={foto.id}
                className={`group overflow-hidden rounded-xl border bg-white ${
                  foto.is_visible ? 'border-slate-200' : 'border-dashed border-slate-300 opacity-60'
                }`}>
                <div className='relative aspect-[4/3]'>
                  <Image
                    src={foto.file_url}
                    alt={`Dokumentasi ${foto.labName}`}
                    fill
                    className='object-cover'
                    sizes='200px'
                  />
                </div>
                <div className='space-y-1 p-3'>
                  <p className='truncate text-xs font-semibold text-slate-700'>
                    {foto.labName}
                  </p>
                  <p className='truncate text-[11px] text-slate-400'>
                    {foto.uploaded_by || '—'}
                  </p>
                  <div className='flex gap-2 pt-1'>
                    <Button
                      size='sm'
                      variant={foto.is_visible ? 'default' : 'outline'}
                      className='flex-1'
                      onClick={() => toggleVisible(foto)}>
                      {foto.is_visible ? (
                        <>
                          <Eye className='mr-1 size-3.5' /> Tampil
                        </>
                      ) : (
                        <>
                          <EyeOff className='mr-1 size-3.5' /> Sembunyi
                        </>
                      )}
                    </Button>
                    <Button size='sm' variant='destructive' onClick={() => removeFoto(foto)}>
                      <Trash2 className='size-3.5' />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
