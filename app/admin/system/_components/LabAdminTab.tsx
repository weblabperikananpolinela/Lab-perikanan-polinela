'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type MouseEvent,
} from 'react';
import Swal from 'sweetalert2';
import {
  Building2,
  Plus,
  Pencil,
  Power,
  PowerOff,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { JENIS_LAB, KATEGORI_LAB, type LabRow } from '@/lib/labs';

const EMPTY_FORM = {
  nama_lab: '',
  jenis: 'Laboratorium',
  kategori: 'Lab Perikanan',
  pj_nama: '',
  pj_email: '',
};

type FormState = typeof EMPTY_FORM;

export default function LabAdminTab({
  supabase,
  onOpen,
}: {
  supabase: any;
  onOpen?: (labId: number) => void;
}) {
  const [labs, setLabs] = useState<LabRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LabRow | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('laboratorium')
      .select(
        'id, nama_lab, jenis, kategori, pj_nama, pj_email, pj_foto_url, is_active',
      )
      .order('id', { ascending: true });
    if (error) {
      Swal.fire({ text: 'Gagal memuat lab: ' + error.message, icon: 'error' });
      setLabs([]);
    } else {
      setLabs(data || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const activeCount = useMemo(
    () => labs.filter((l) => l.is_active).length,
    [labs],
  );

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (lab: LabRow) => {
    setEditing(lab);
    setForm({
      nama_lab: lab.nama_lab,
      jenis: lab.jenis || 'Laboratorium',
      kategori: lab.kategori || 'Lab Perikanan',
      pj_nama: lab.pj_nama || '',
      pj_email: lab.pj_email || '',
    });
    setModalOpen(true);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.nama_lab.trim()) return;
    setBusy(true);

    const payload = {
      nama_lab: form.nama_lab.trim(),
      jenis: form.jenis,
      kategori: form.kategori,
      pj_nama: form.pj_nama.trim() || null,
      pj_email: form.pj_email.trim() || null,
    };

    let error: any = null;
    if (editing) {
      ({ error } = await supabase
        .from('laboratorium')
        .update(payload)
        .eq('id', editing.id));
    } else {
      ({ error } = await supabase.from('laboratorium').insert(payload));
    }
    setBusy(false);

    if (error) {
      Swal.fire({
        text: 'Gagal menyimpan lab: ' + error.message,
        icon: 'error',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3500,
        timerProgressBar: true,
      });
      return;
    }

    setModalOpen(false);
    fetchAll();
    Swal.fire({
      text: editing ? 'Lab berhasil diperbarui.' : 'Lab berhasil ditambahkan.',
      icon: 'success',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
    });
  };

  /** Hitung jumlah data terkait lab untuk dialog nonaktifkan. */
  const countRelatedData = async (lab: LabRow) => {
    const [pinjamanRes, kategoriRes, adminRes] = await Promise.all([
      supabase
        .from('peminjaman')
        .select('id', { count: 'exact', head: true })
        .eq('lab_id', lab.id),
      supabase
        .from('kategori_inventaris')
        .select('id', { count: 'exact', head: true })
        .eq('lab_id', lab.id),
      supabase
        .from('whitelist_admin')
        .select('id', { count: 'exact', head: true })
        .eq('lab_id', lab.id)
        .eq('role', 'admin'),
    ]);
    const nPinjaman = pinjamanRes.count ?? 0;
    const nKategori = kategoriRes.count ?? 0;
    const nAdmin = adminRes.count ?? 0;

    // Item inventaris lewat kategori lab tsb (tanpa join — cukup via .in()).
    let nItem = 0;
    if (nKategori > 0) {
      const { data: katIds } = await supabase
        .from('kategori_inventaris')
        .select('id')
        .eq('lab_id', lab.id);
      if (katIds && katIds.length > 0) {
        const { count } = await supabase
          .from('inventaris')
          .select('id', { count: 'exact', head: true })
          .in(
            'kategori_id',
            katIds.map((k: any) => k.id),
          );
        nItem = count ?? 0;
      }
    }
    return { nPinjaman, nKategori, nItem, nAdmin };
  };

  const toggleActive = async (lab: LabRow, e?: MouseEvent) => {
    e?.stopPropagation();

    if (lab.is_active) {
      const { nPinjaman, nKategori, nItem, nAdmin } =
        await countRelatedData(lab);
      const result = await Swal.fire({
        title: `Nonaktifkan ${lab.nama_lab}?`,
        html: `
          <div style="text-align:left;font-size:14px;line-height:1.65">
            <p class="mb-3" style="font-weight:600">Yang terpengaruh:</p>
            <ul style="list-style:none;padding:0;margin:0 0 12px">
              <li>– Tidak muncul di halaman Organisasi</li>
              <li>– Tidak bisa dipilih di form pengajuan baru</li>
              <li>– Tidak tampil di jadwal &amp; katalog inventaris publik</li>
            </ul>
            <p class="mb-2" style="font-weight:600">Yang TIDAK terpengaruh:</p>
            <ul style="list-style:none;padding:0;margin:0">
              <li>+ Peminjaman, inventaris &amp; riwayat <b>tetap ada</b></li>
              <li>+ Akun di Manajemen Akun <b>tetap ada</b></li>
              <li>+ Dashboard lab masih bisa dibuka</li>
            </ul>
            <hr class="my-3" style="border:none;border-top:1px solid #e2e8f0"/>
            Ringkasan data terkait: <b>${nPinjaman}</b> peminjaman ·
            <b>${nKategori}</b> kategori inventaris · <b>${nItem}</b> item ·
            <b>${nAdmin}</b> akun terkait
          </div>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, Nonaktifkan',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#b91c1c',
        cancelButtonColor: '#64748b',
      });
      if (!result.isConfirmed) return;
      setBusy(true);
      const { error } = await supabase
        .from('laboratorium')
        .update({ is_active: false })
        .eq('id', lab.id);
      setBusy(false);
      if (error) {
        Swal.fire({
          text: 'Gagal menonaktifkan: ' + error.message,
          icon: 'error',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3500,
          timerProgressBar: true,
        });
        return;
      }
      fetchAll();
      Swal.fire({
        text: `${lab.nama_lab} dinonaktifkan.`,
        icon: 'success',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
      });
    } else {
      const result = await Swal.fire({
        title: `Aktifkan ${lab.nama_lab} kembali?`,
        text: 'Lab akan tampil kembali di halaman publik dan bisa dipilih di pengajuan.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Ya, Aktifkan',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#64748b',
      });
      if (!result.isConfirmed) return;
      setBusy(true);
      const { error } = await supabase
        .from('laboratorium')
        .update({ is_active: true })
        .eq('id', lab.id);
      setBusy(false);
      if (error) {
        Swal.fire({
          text: 'Gagal mengaktifkan: ' + error.message,
          icon: 'error',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3500,
          timerProgressBar: true,
        });
        return;
      }
      fetchAll();
    }
  };

  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center py-16 text-purple-600 gap-3'>
        <Loader2 className='size-8 animate-spin' />
        <p className='text-sm font-medium text-slate-500'>
          Memuat laboratorium &amp; teaching factory...
        </p>
      </div>
    );
  }

  return (
    <Card className='border-slate-200 shadow-sm border-t-4 border-t-purple-500'>
      <CardHeader className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4'>
        <div>
          <CardTitle className='text-xl flex items-center gap-2'>
            <Building2 className='size-5 text-purple-600' />
            Semua Laboratorium &amp; TEFA
          </CardTitle>
          <p className='text-sm text-slate-500 mt-1'>
            {activeCount} aktif · {labs.length - activeCount} nonaktif ·
            {labs.length} total
          </p>
        </div>
        <Button
          onClick={openAdd}
          className='bg-purple-600 hover:bg-purple-700 font-bold shadow-md text-base py-5'>
          <Plus className='size-4 mr-2' /> Tambah Lab / TEFA
        </Button>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {labs.map((lab) => (
            <div
              key={lab.id}
              className={`rounded-2xl border p-5 flex flex-col gap-3 transition-all ${
                lab.is_active
                  ? 'bg-white border-slate-200 shadow-sm'
                  : 'bg-slate-50 border-slate-200 opacity-75'
              }`}>
              <div className='flex items-start justify-between gap-2'>
                <div>
                  <h3 className='font-bold text-slate-800 flex items-center gap-2 flex-wrap'>
                    {lab.nama_lab}
                    {!lab.is_active && <Badge variant='secondary'>Nonaktif</Badge>}
                  </h3>
                  <p className='text-sm text-slate-500 mt-0.5'>
                    {lab.jenis || 'Laboratorium'} · {lab.kategori}
                  </p>
                </div>
                <div className='flex flex-col gap-1 shrink-0'>
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-8 px-2 text-slate-600'
                    title='Edit'
                    onClick={() => openEdit(lab)}>
                    <Pencil className='size-3.5' />
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    className={`h-8 px-2 ${
                      lab.is_active
                        ? 'text-red-600 border-red-200 hover:bg-red-50'
                        : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                    }`}
                    title={lab.is_active ? 'Nonaktifkan' : 'Aktifkan kembali'}
                    onClick={(e) => toggleActive(lab, e)}
                    disabled={busy}>
                    {lab.is_active ? (
                      <PowerOff className='size-3.5' />
                    ) : (
                      <Power className='size-3.5' />
                    )}
                  </Button>
                </div>
              </div>

              {(lab.pj_nama || lab.pj_email) && (
                <div className='text-sm text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-100'>
                  <p className='font-semibold'>{lab.pj_nama || '-'}</p>
                  <p className='text-xs text-slate-500 truncate'>
                    {lab.pj_email || 'Tanpa email'}
                  </p>
                </div>
              )}

              {onOpen && (
                <Button
                  variant='ghost'
                  size='sm'
                  className='mt-auto justify-between text-purple-600 hover:text-purple-700 hover:bg-purple-50 font-semibold px-3'
                  onClick={() => onOpen(lab.id)}>
                  Buka Dashboard
                  <ChevronRight className='size-4' />
                </Button>
              )}
            </div>
          ))}
          {labs.length === 0 && (
            <p className='col-span-full text-center py-16 text-slate-500'>
              Belum ada laboratorium. Tambahkan lewat tombol di atas.
            </p>
          )}
        </div>
      </CardContent>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='text-xl'>
              {editing ? 'Edit Lab / TEFA' : 'Tambah Lab / TEFA'}
            </DialogTitle>
            <DialogDescription className='text-base'>
              Nama lab harus unik. Penanggung jawab diisi manual — tidak
              membuat akun login baru.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className='space-y-4 pt-2'>
            <div className='space-y-2'>
              <Label htmlFor='l_nama' className='text-base'>
                Nama Lab / TEFA <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='l_nama'
                required
                value={form.nama_lab}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nama_lab: e.target.value }))
                }
                placeholder='Contoh: Lab Budidaya'
                className='text-base h-11'
              />
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-2'>
                <Label className='text-base'>Jenis</Label>
                <Select
                  value={form.jenis}
                  onValueChange={(v) => setForm((f) => ({ ...f, jenis: v }))}>
                  <SelectTrigger className='text-base h-11'>
                    <SelectValue placeholder='Jenis' />
                  </SelectTrigger>
                  <SelectContent>
                    {JENIS_LAB.map((j) => (
                      <SelectItem key={j} value={j}>
                        {j}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label className='text-base'>Kategori</Label>
                <Select
                  value={form.kategori}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, kategori: v }))
                  }>
                  <SelectTrigger className='text-base h-11'>
                    <SelectValue placeholder='Kategori' />
                  </SelectTrigger>
                  <SelectContent>
                    {KATEGORI_LAB.map((k) => (
                      <SelectItem key={k} value={k}>
                        {k}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='l_pj_nama' className='text-base'>
                Nama Penanggung Jawab
              </Label>
              <Input
                id='l_pj_nama'
                value={form.pj_nama}
                onChange={(e) =>
                  setForm((f) => ({ ...f, pj_nama: e.target.value }))
                }
                placeholder='Contoh: Budi Santoso, S.Pi'
                className='text-base h-11'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='l_pj_email' className='text-base'>
                Email Penanggung Jawab
              </Label>
              <Input
                id='l_pj_email'
                type='email'
                value={form.pj_email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, pj_email: e.target.value }))
                }
                placeholder='budi@polinela.ac.id'
                className='text-base h-11'
              />
            </div>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setModalOpen(false)}>
                Batal
              </Button>
              <Button
                type='submit'
                className='bg-purple-600 hover:bg-purple-700 font-bold'
                disabled={busy}>
                {busy ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Tambah'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}