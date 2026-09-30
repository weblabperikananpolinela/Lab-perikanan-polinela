'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  FileText,
  FileUp,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  DOC_ACCEPT,
  deleteCloudinaryFile,
  isAllowedPdf,
  uploadPdfToCloudinary,
} from '@/lib/cloudinary-upload';
import {
  KATEGORI_DOKUMEN,
  KATEGORI_LABEL,
  type DokumenRow,
  type KategoriDokumen,
} from '@/lib/dokumen';

const JUDUL_MAX = 150;
const NOMOR_MAX = 50;
const DESKRIPSI_MAX = 300;

type FormState = {
  judul: string;
  nomor: string;
  tanggal: string;
  deskripsi: string;
};

const EMPTY_FORM: FormState = {
  judul: '',
  nomor: '',
  tanggal: '',
  deskripsi: '',
};

export default function DokumenAdminTab({
  supabase,
  userEmail,
}: {
  supabase: any;
  userEmail: string;
}) {
  const [kategori, setKategori] = useState<KategoriDokumen>('sop-perikanan');
  const [rows, setRows] = useState<DokumenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DokumenRow | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('dokumen')
      .select(
        'id, kategori, judul, nomor, tanggal, deskripsi, file_url, file_type, is_visible, sort_order, uploaded_by, created_at',
      )
      .eq('kategori', kategori)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) {
      Swal.fire('Gagal memuat', error.message, 'error');
      setRows([]);
    } else {
      setRows((data || []) as DokumenRow[]);
    }
    setLoading(false);
  }, [supabase, kategori]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openTambah = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFile(null);
    setModalOpen(true);
  };

  const openEdit = (row: DokumenRow) => {
    setEditing(row);
    setForm({
      judul: row.judul,
      nomor: row.nomor || '',
      tanggal: row.tanggal || '',
      deskripsi: row.deskripsi || '',
    });
    setFile(null);
    setModalOpen(true);
  };

  const simpan = async (e: React.FormEvent) => {
    e.preventDefault();
    const judul = form.judul.trim();
    if (!judul) {
      Swal.fire('Oops', 'Judul dokumen wajib diisi.', 'warning');
      return;
    }
    if (!editing && !file) {
      Swal.fire('Oops', 'Pilih berkas PDF yang ingin diunggah.', 'warning');
      return;
    }
    if (file) {
      const typeError = isAllowedPdf(file);
      if (typeError) {
        Swal.fire('Berkas tidak valid', typeError, 'warning');
        return;
      }
    }

    setBusy(true);
    try {
      let fileUrl = editing?.file_url || '';
      if (file) {
        const uploaded = await uploadPdfToCloudinary(file);
        fileUrl = uploaded.url;
      }

      const payload = {
        kategori,
        judul,
        nomor: form.nomor.trim() || null,
        tanggal: form.tanggal || null,
        deskripsi: form.deskripsi.trim() || null,
        file_url: fileUrl,
        file_type: 'pdf',
        uploaded_by: userEmail || null,
      };

      if (editing) {
        const { error } = await supabase
          .from('dokumen')
          .update(payload)
          .eq('id', editing.id);
        if (error) throw error;
      } else {
        const nextSort =
          rows.reduce((max, r) => Math.max(max, r.sort_order || 0), 0) + 1;
        const { error } = await supabase
          .from('dokumen')
          .insert({ ...payload, is_visible: true, sort_order: nextSort });
        if (error) throw error;
      }

      setModalOpen(false);
      await fetchAll();
      Swal.fire({
        icon: 'success',
        title: editing ? 'Dokumen diperbarui' : 'Dokumen ditambahkan',
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire('Gagal menyimpan', err?.message || 'Terjadi kesalahan.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const toggleVisible = async (row: DokumenRow) => {
    const { error } = await supabase
      .from('dokumen')
      .update({ is_visible: !row.is_visible })
      .eq('id', row.id);
    if (error) {
      Swal.fire('Gagal', error.message, 'error');
      return;
    }
    setRows((prev) =>
      prev.map((r) => (r.id === row.id ? { ...r, is_visible: !r.is_visible } : r)),
    );
  };

  const geser = async (row: DokumenRow, arah: -1 | 1) => {
    const idx = rows.findIndex((r) => r.id === row.id);
    const target = rows[idx + arah];
    if (!target) return;
    setBusy(true);
    const a = row.sort_order || idx + 1;
    const b = target.sort_order || idx + arah + 1;
    const [r1, r2] = await Promise.all([
      supabase.from('dokumen').update({ sort_order: b }).eq('id', row.id),
      supabase.from('dokumen').update({ sort_order: a }).eq('id', target.id),
    ]);
    setBusy(false);
    if (r1.error || r2.error) {
      Swal.fire('Gagal', (r1.error || r2.error).message, 'error');
      return;
    }
    await fetchAll();
  };

  const hapus = async (row: DokumenRow) => {
    const confirm = await Swal.fire({
      title: 'Hapus dokumen ini?',
      html: `<b>${row.judul}</b><br/>Dokumen akan hilang dari halaman publik.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
    });
    if (!confirm.isConfirmed) return;

    const { error } = await supabase.from('dokumen').delete().eq('id', row.id);
    if (error) {
      Swal.fire('Gagal', error.message, 'error');
      return;
    }
    let cloudFail = false;
    if (row.file_url.startsWith('http')) {
      try {
        await deleteCloudinaryFile(row.file_url, 'pdf');
      } catch {
        cloudFail = true;
      }
    }
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    Swal.fire({
      icon: cloudFail ? 'warning' : 'success',
      title: 'Dokumen dihapus',
      text: cloudFail
        ? 'Baris database terhapus, tetapi berkas di penyimpanan gagal dihapus.'
        : undefined,
      timer: 1800,
      showConfirmButton: false,
    });
  };

  const jumlahTampil = useMemo(
    () => rows.filter((r) => r.is_visible).length,
    [rows],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dokumen Publik</CardTitle>
        <CardDescription>
          Kelola SOP Lab. Perikanan, SOP Lab. Perikanan Tangkap, dan SK Lab
          yang tampil di halaman publik. Berkas PDF maksimal 10 MB.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex flex-wrap items-center gap-2'>
          {KATEGORI_DOKUMEN.map((kat) => (
            <button
              key={kat}
              type='button'
              onClick={() => setKategori(kat)}
              aria-pressed={kategori === kat}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                kategori === kat
                  ? 'border-purple-600 bg-purple-600 text-white shadow-sm'
                  : 'border-slate-300 bg-white text-slate-600 hover:border-purple-400 hover:text-purple-700'
              }`}>
              {KATEGORI_LABEL[kat]}
            </button>
          ))}
        </div>

        <div className='flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3'>
          <p className='text-sm text-slate-600'>
            <span className='font-semibold text-slate-800'>{rows.length}</span>{' '}
            dokumen · <span className='font-semibold text-slate-800'>{jumlahTampil}</span>{' '}
            tampil di publik
          </p>
          <Button size='sm' onClick={openTambah}>
            <Plus className='mr-1.5 size-4' /> Tambah dokumen
          </Button>
        </div>

        {loading ? (
          <p className='flex items-center gap-2 py-6 text-slate-500 animate-pulse'>
            <Loader2 className='size-4 animate-spin' /> Memuat dokumen…
          </p>
        ) : rows.length === 0 ? (
          <p className='py-10 text-center text-sm text-slate-500'>
            Belum ada dokumen untuk kategori ini. Klik “Tambah dokumen” untuk
            mengunggah PDF pertama.
          </p>
        ) : (
          <ul className='space-y-3'>
            {rows.map((row, index) => (
              <li
                key={row.id}
                className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-start ${
                  row.is_visible
                    ? 'border-slate-200 bg-white'
                    : 'border-dashed border-slate-300 bg-slate-50 opacity-75'
                }`}>
                <div className='flex size-11 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500'>
                  <FileText className='size-5' />
                </div>

                <div className='min-w-0 flex-1'>
                  <p className='font-semibold leading-snug text-slate-800'>
                    {row.judul}
                  </p>
                  <p className='mt-1 text-xs font-medium text-slate-500'>
                    {row.nomor ? `Nomor: ${row.nomor}` : 'Tanpa nomor'}
                    {row.tanggal
                      ? ` · ${new Date(row.tanggal).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}`
                      : ''}
                  </p>
                  {row.deskripsi && (
                    <p className='mt-1.5 text-sm text-slate-600'>
                      {row.deskripsi}
                    </p>
                  )}
                  {!row.is_visible && (
                    <p className='mt-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700'>
                      Disembunyikan dari publik
                    </p>
                  )}
                </div>

                <div className='flex shrink-0 flex-wrap items-center gap-1.5'>
                  <Button
                    size='icon'
                    variant='outline'
                    className='size-8'
                    disabled={busy || index === 0}
                    onClick={() => geser(row, -1)}
                    aria-label='Naikkan urutan'>
                    <ArrowUp className='size-3.5' />
                  </Button>
                  <Button
                    size='icon'
                    variant='outline'
                    className='size-8'
                    disabled={busy || index === rows.length - 1}
                    onClick={() => geser(row, 1)}
                    aria-label='Turunkan urutan'>
                    <ArrowDown className='size-3.5' />
                  </Button>
                  <Button
                    size='icon'
                    variant={row.is_visible ? 'default' : 'outline'}
                    className='size-8'
                    onClick={() => toggleVisible(row)}
                    aria-label={row.is_visible ? 'Sembunyikan' : 'Tampilkan'}>
                    {row.is_visible ? (
                      <Eye className='size-3.5' />
                    ) : (
                      <EyeOff className='size-3.5' />
                    )}
                  </Button>
                  <Button
                    size='icon'
                    variant='outline'
                    className='size-8'
                    onClick={() => openEdit(row)}
                    aria-label='Ubah dokumen'>
                    <Pencil className='size-3.5' />
                  </Button>
                  <Button
                    size='icon'
                    variant='destructive'
                    className='size-8'
                    onClick={() => hapus(row)}
                    aria-label='Hapus dokumen'>
                    <Trash2 className='size-3.5' />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Ubah dokumen' : 'Tambah dokumen'}
            </DialogTitle>
            <DialogDescription>
              {KATEGORI_LABEL[kategori]} · berkas PDF maksimal 10 MB.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={simpan} className='space-y-4'>
            <div className='space-y-1.5'>
              <Label htmlFor='doc-file'>
                Berkas PDF {editing ? '(kosongkan bila tidak diganti)' : '*'}
              </Label>
              <label
                htmlFor='doc-file'
                className='flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500 transition-colors hover:border-purple-400 hover:text-purple-600'>
                <FileUp className='size-5 shrink-0' />
                <span className='min-w-0 truncate'>
                  {file ? file.name : 'Pilih berkas PDF…'}
                </span>
              </label>
              <input
                id='doc-file'
                type='file'
                accept={DOC_ACCEPT}
                className='sr-only'
                onChange={(e) => {
                  const picked = e.target.files?.[0] || null;
                  if (picked) {
                    const err = isAllowedPdf(picked);
                    if (err) {
                      Swal.fire('Berkas tidak valid', err, 'warning');
                      e.target.value = '';
                      return;
                    }
                  }
                  setFile(picked);
                }}
              />
              {editing && !file && (
                <p className='text-xs text-slate-500'>
                  Berkas saat ini:{' '}
                  <a
                    href={editing.file_url}
                    target='_blank'
                    rel='noreferrer'
                    className='font-medium text-purple-600 hover:underline'>
                    lihat PDF
                  </a>
                </p>
              )}
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='doc-judul'>Judul dokumen *</Label>
              <Input
                id='doc-judul'
                value={form.judul}
                maxLength={JUDUL_MAX}
                required
                placeholder='Contoh: SOP Pengelolaan Limbah'
                onChange={(e) => setForm((p) => ({ ...p, judul: e.target.value }))}
              />
              <p className='text-right text-xs text-slate-400'>
                {form.judul.length}/{JUDUL_MAX}
              </p>
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-1.5'>
                <Label htmlFor='doc-nomor'>Nomor dokumen</Label>
                <Input
                  id='doc-nomor'
                  value={form.nomor}
                  maxLength={NOMOR_MAX}
                  placeholder='Contoh: SK 01/LAB/2026'
                  onChange={(e) =>
                    setForm((p) => ({ ...p, nomor: e.target.value }))
                  }
                />
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor='doc-tanggal'>Tanggal penetapan</Label>
                <Input
                  id='doc-tanggal'
                  type='date'
                  value={form.tanggal}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, tanggal: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='doc-deskripsi'>Deskripsi singkat</Label>
              <Textarea
                id='doc-deskripsi'
                value={form.deskripsi}
                maxLength={DESKRIPSI_MAX}
                rows={3}
                placeholder='Keterangan singkat isi dokumen (opsional).'
                onChange={(e) =>
                  setForm((p) => ({ ...p, deskripsi: e.target.value }))
                }
              />
              <p className='text-right text-xs text-slate-400'>
                {form.deskripsi.length}/{DESKRIPSI_MAX}
              </p>
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                disabled={busy}
                onClick={() => setModalOpen(false)}>
                Batal
              </Button>
              <Button type='submit' disabled={busy}>
                {busy && <Loader2 className='mr-1.5 size-4 animate-spin' />}
                {editing ? 'Simpan perubahan' : 'Unggah dokumen'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
