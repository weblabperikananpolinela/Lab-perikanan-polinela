'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Swal from 'sweetalert2';
import { CheckSquare, Eye, EyeOff, Loader2, Square, Trash2 } from 'lucide-react';
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
  nama_kegiatan: string | null;
  deskripsi: string | null;
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
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);

  const fetchAll = useCallback(async () => {
    const { data } = await supabase
      .from('dokumentasi_foto')
      .select(
        'id, lab_id, file_url, file_type, is_visible, uploaded_by, created_at, nama_kegiatan, deskripsi',
      )
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

  const allIds = useMemo(() => fotos.map((f) => f.id), [fotos]);
  const allSelected = fotos.length > 0 && selected.size === fotos.length;
  const selectedCount = selected.size;
  const selectedFotos = useMemo(
    () => fotos.filter((f) => selected.has(f.id)),
    [fotos, selected],
  );

  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(allIds));
  const clearSelection = () => setSelected(new Set());

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

  const bulkSetVisible = async (visible: boolean) => {
    if (selectedCount === 0) return;
    setBusy(true);
    const ids = Array.from(selected);
    const { error } = await supabase
      .from('dokumentasi_foto')
      .update({ is_visible: visible })
      .in('id', ids);
    setBusy(false);
    if (error) {
      Swal.fire('Gagal', error.message, 'error');
      return;
    }
    setFotos((prev) =>
      prev.map((row) => (selected.has(row.id) ? { ...row, is_visible: visible } : row)),
    );
    Swal.fire({
      icon: 'success',
      title: visible ? 'Foto ditampilkan' : 'Foto disembunyikan',
      text: `${ids.length} foto diperbarui.`,
      timer: 1400,
      showConfirmButton: false,
    });
    clearSelection();
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
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(foto.id);
      return next;
    });
  };

  const bulkDelete = async () => {
    if (selectedCount === 0) return;
    const confirm = await Swal.fire({
      title: `Hapus ${selectedCount} foto?`,
      text: 'Foto terpilih hilang dari beranda dan dihapus dari Cloudinary.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
    });
    if (!confirm.isConfirmed) return;
    setBusy(true);
    const ids = Array.from(selected);
    const targets = selectedFotos;
    const { error } = await supabase.from('dokumentasi_foto').delete().in('id', ids);
    let cloudFail = 0;
    await Promise.all(
      targets.map(async (foto) => {
        try {
          await deleteCloudinaryFile(foto.file_url, foto.file_type || 'webp');
        } catch {
          cloudFail += 1;
        }
      }),
    );
    setBusy(false);
    if (error) {
      Swal.fire('Gagal hapus', error.message, 'error');
      return;
    }
    setFotos((prev) => prev.filter((row) => !selected.has(row.id)));
    clearSelection();
    Swal.fire({
      icon: cloudFail > 0 ? 'warning' : 'success',
      title: `${ids.length} foto dihapus`,
      text:
        cloudFail > 0
          ? `${cloudFail} file gagal dihapus dari penyimpanan; baris database sudah dihapus.`
          : undefined,
      timer: 1800,
      showConfirmButton: false,
    });
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
          dikurasi di sini. Pilih beberapa foto untuk aksi massal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {fotos.length === 0 ? (
          <p className='py-10 text-center text-sm text-slate-500'>
            Belum ada foto dokumentasi. Mintalah PJ lab mengunggah lewat tab
            Dokumentasi di dashboard lab.
          </p>
        ) : (
          <>
            <div className='mb-4 flex flex-wrap items-center gap-2'>
              <Button
                size='sm'
                variant='outline'
                onClick={allSelected ? clearSelection : selectAll}
                aria-pressed={allSelected}>
                {allSelected ? (
                  <>
                    <CheckSquare className='mr-1.5 size-4' /> Batal pilih
                  </>
                ) : (
                  <>
                    <Square className='mr-1.5 size-4' /> Pilih semua
                  </>
                )}
              </Button>
              {selectedCount > 0 && (
                <span className='text-sm font-medium text-slate-600'>
                  {selectedCount} foto dipilih
                </span>
              )}
            </div>

            {selectedCount > 0 && (
              <div
                className='sticky top-0 z-10 mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 shadow-sm'
                role='toolbar'
                aria-label='Aksi foto terpilih'>
                <Button
                  size='sm'
                  disabled={busy}
                  onClick={() => bulkSetVisible(true)}>
                  <Eye className='mr-1.5 size-4' /> Tampilkan
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  disabled={busy}
                  onClick={() => bulkSetVisible(false)}>
                  <EyeOff className='mr-1.5 size-4' /> Sembunyikan
                </Button>
                <Button
                  size='sm'
                  variant='destructive'
                  disabled={busy}
                  onClick={bulkDelete}>
                  {busy ? (
                    <Loader2 className='mr-1.5 size-4 animate-spin' />
                  ) : (
                    <Trash2 className='mr-1.5 size-4' />
                  )}
                  Hapus
                </Button>
                <Button size='sm' variant='ghost' onClick={clearSelection}>
                  Batal
                </Button>
              </div>
            )}

            <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
              {fotos.map((foto) => {
                const isOn = selected.has(foto.id);
                return (
                  <div
                    key={foto.id}
                    className={`group overflow-hidden rounded-xl border bg-white ${
                      isOn
                        ? 'border-purple-500 ring-2 ring-purple-300'
                        : foto.is_visible
                          ? 'border-slate-200'
                          : 'border-dashed border-slate-300 opacity-60'
                    }`}>
                    <div className='relative aspect-[4/3]'>
                      <button
                        type='button'
                        onClick={() => toggleOne(foto.id)}
                        className='absolute inset-0 z-10'
                        aria-pressed={isOn}
                        aria-label={`${isOn ? 'Batalkan pilih' : 'Pilih'} ${foto.nama_kegiatan || 'foto dokumentasi'}`}>
                        <span className='sr-only'>Pilih foto</span>
                      </button>
                      <Image
                        src={foto.file_url}
                        alt={foto.nama_kegiatan || `Dokumentasi ${foto.labName}`}
                        fill
                        className='object-cover'
                        sizes='200px'
                      />
                      <span
                        className={`pointer-events-none absolute left-2 top-2 z-20 flex size-6 items-center justify-center rounded-md border ${
                          isOn
                            ? 'border-purple-600 bg-purple-600 text-white'
                            : 'border-white/80 bg-white/80 text-slate-500'
                        }`}
                        aria-hidden>
                        {isOn ? (
                          <CheckSquare className='size-4' />
                        ) : (
                          <Square className='size-4' />
                        )}
                      </span>
                    </div>
                    <div className='relative z-20 space-y-1 bg-white p-3'>
                      <p className='truncate text-xs font-semibold text-slate-800'>
                        {foto.nama_kegiatan || 'Tanpa nama'}
                      </p>
                      <p className='truncate text-[11px] text-slate-500'>
                        {foto.labName}
                        {foto.deskripsi ? ` · ${foto.deskripsi}` : ''}
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
                        <Button
                          size='sm'
                          variant='destructive'
                          onClick={() => removeFoto(foto)}
                          aria-label='Hapus foto'>
                          <Trash2 className='size-3.5' />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
