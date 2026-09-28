'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Swal from 'sweetalert2';
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  deleteCloudinaryFile,
  uploadImageToCloudinary,
} from '@/lib/cloudinary-upload';
import {
  FALLBACK_PIMPINAN,
  parseHeroBanners,
  parsePimpinan,
  type HeroBanner,
  type Pimpinan,
} from '@/lib/site-media';

type LabRow = {
  id: number;
  nama_lab: string;
  jenis: string | null;
  pj_nama: string | null;
  pj_email: string | null;
  pj_foto_url: string | null;
};

const MAX_HERO = 4;
const PIMPINAN_SLOTS = [
  { key: 0, label: 'Ketua Jurusan', color: 'bg-slate-900' },
  { key: 1, label: 'Kepala Lab. Perikanan', color: 'bg-blue-600' },
  { key: 2, label: 'Kepala Lab. Perikanan Tangkap', color: 'bg-cyan-600' },
];

export default function HeroOrganisasiTab({ supabase }: { supabase: any }) {
  const [heroes, setHeroes] = useState<HeroBanner[]>([]);
  const [pimpinan, setPimpinan] = useState<Pimpinan[]>([]);
  const [labs, setLabs] = useState<LabRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const [{ data: settings }, { data: labRows }] = await Promise.all([
      supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['hero_banners', 'organisasi_pimpinan']),
      supabase
        .from('laboratorium')
        .select('id, nama_lab, jenis, pj_nama, pj_email, pj_foto_url')
        .order('id'),
    ]);

    const heroRow = (settings || []).find((row: any) => row.key === 'hero_banners');
    const pimpinanRow = (settings || []).find(
      (row: any) => row.key === 'organisasi_pimpinan',
    );
    const parsedHero = parseHeroBanners(heroRow?.value);
    const parsedPimpinan = parsePimpinan(pimpinanRow?.value);

    setHeroes(parsedHero.length > 0 ? parsedHero : []);
    setPimpinan(parsedPimpinan.length > 0 ? parsedPimpinan : FALLBACK_PIMPINAN);
    setLabs(labRows || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const saveHeroes = async (next: HeroBanner[]) => {
    setBusy('hero');
    const { error } = await supabase
      .from('app_settings')
      .upsert(
        { key: 'hero_banners', value: next, updated_at: new Date().toISOString() },
        { onConflict: 'key' },
      );
    setBusy(null);
    if (error) {
      Swal.fire('Gagal', error.message, 'error');
      return false;
    }
    setHeroes(next);
    return true;
  };

  const savePimpinan = async (next: Pimpinan[]) => {
    setBusy('pimpinan');
    const { error } = await supabase
      .from('app_settings')
      .upsert(
        { key: 'organisasi_pimpinan', value: next, updated_at: new Date().toISOString() },
        { onConflict: 'key' },
      );
    setBusy(null);
    if (error) {
      Swal.fire('Gagal', error.message, 'error');
      return false;
    }
    setPimpinan(next);
    return true;
  };

  const handleUploadHero = async (file: File) => {
    if (heroes.length >= MAX_HERO) {
      Swal.fire('Batas tercapai', `Maksimal ${MAX_HERO} foto hero.`, 'warning');
      return;
    }
    setBusy('hero-upload');
    try {
      const { url } = await uploadImageToCloudinary(file, 'dolphin_hero');
      await saveHeroes([...heroes, { url, alt: 'Banner DOLPHIN' }]);
      Swal.fire({ icon: 'success', title: 'Foto hero ditambahkan', timer: 1400, showConfirmButton: false });
    } catch (err: any) {
      Swal.fire('Gagal unggah', err.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  const removeHero = async (index: number) => {
    const target = heroes[index];
    const confirm = await Swal.fire({
      title: 'Hapus foto hero?',
      text: 'Foto akan dilepas dari carousel beranda dan dihapus dari Cloudinary.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
    });
    if (!confirm.isConfirmed) return;
    const next = heroes.filter((_, i) => i !== index);
    await saveHeroes(next);
    await deleteCloudinaryFile(target.url, 'webp');
  };

  const moveHero = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= heroes.length) return;
    const next = [...heroes];
    [next[index], next[target]] = [next[target], next[index]];
    await saveHeroes(next);
  };

  const handleUploadPimpinan = async (slot: number, file: File) => {
    setBusy(`pimpinan-${slot}`);
    try {
      const { url } = await uploadImageToCloudinary(file, 'dolphin_organisasi');
      const next = PIMPINAN_SLOTS.map((s) => {
        const current = pimpinan[s.key] || {
          jabatan: s.label,
          nama: '',
          email: '',
          foto_url: '',
        };
        return s.key === slot ? { ...current, foto_url: url } : current;
      });
      await savePimpinan(next);
      Swal.fire({ icon: 'success', title: 'Foto diperbarui', timer: 1200, showConfirmButton: false });
    } catch (err: any) {
      Swal.fire('Gagal unggah', err.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  const updatePimpinanField = (slot: number, field: 'nama' | 'email', value: string) => {
    const next = PIMPINAN_SLOTS.map((s) => {
      const current = pimpinan[s.key] || {
        jabatan: s.label,
        nama: '',
        email: '',
        foto_url: '',
      };
      return s.key === slot ? { ...current, [field]: value } : current;
    });
    setPimpinan(next);
  };

  const commitPimpinan = async () => {
    const next = PIMPINAN_SLOTS.map((s) => {
      const current = pimpinan[s.key] || {
        jabatan: s.label,
        nama: '',
        email: '',
        foto_url: '',
      };
      return {
        jabatan: current.jabatan || s.label,
        nama: current.nama,
        email: current.email,
        foto_url: current.foto_url,
      };
    });
    const ok = await savePimpinan(next);
    if (ok) Swal.fire({ icon: 'success', title: 'Tersimpan', timer: 1200, showConfirmButton: false });
  };

  const updateLabPj = (labId: number, field: keyof LabRow, value: string) => {
    setLabs((prev) =>
      prev.map((lab) => (lab.id === labId ? { ...lab, [field]: value } : lab)),
    );
  };

  const saveLabPj = async (lab: LabRow) => {
    const cleanName = ((lab.pj_nama || '').trim());
    const cleanEmail = ((lab.pj_email || '').trim());
    if (!cleanName || !cleanEmail) {
      Swal.fire({
        icon: 'warning',
        title: 'Nama dan email PJ wajib diisi',
        text: 'Kosongkankan hanya jika memang belum ada penanggung jawab.',
        confirmButtonColor: '#f59e0b',
      });
      return;
    }
    setBusy(`lab-${lab.id}`);
    const { error } = await supabase
      .from('laboratorium')
      .update({
        pj_nama: cleanName,
        pj_email: cleanEmail,
        pj_foto_url: lab.pj_foto_url,
      })
      .eq('id', lab.id);
    setBusy(null);
    if (error) {
      Swal.fire('Gagal', error.message, 'error');
      return;
    }
    Swal.fire({ icon: 'success', title: 'Data PJ tersimpan', timer: 1200, showConfirmButton: false });
  };

  const handleUploadLabPj = async (lab: LabRow, file: File) => {
    setBusy(`lab-foto-${lab.id}`);
    try {
      const { url } = await uploadImageToCloudinary(file, 'dolphin_organisasi');
      const updated = { ...lab, pj_foto_url: url };
      setLabs((prev) => prev.map((row) => (row.id === lab.id ? updated : row)));
      await supabase
        .from('laboratorium')
        .update({ pj_foto_url: url })
        .eq('id', lab.id);
      Swal.fire({ icon: 'success', title: 'Foto PJ diperbarui', timer: 1200, showConfirmButton: false });
    } catch (err: any) {
      Swal.fire('Gagal unggah', err.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <p className='text-slate-500 animate-pulse'>Memuat pengaturan tampilan…</p>
    );
  }

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>Foto Beranda</CardTitle>
          <CardDescription>
            Maksimal {MAX_HERO} foto untuk slide besar halaman utama.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
            {heroes.map((hero, index) => (
              <div
                key={`${hero.url}-${index}`}
                className='group relative overflow-hidden rounded-xl border border-slate-200'>
                <div className='relative aspect-video'>
                  <Image src={hero.url} alt={hero.alt} fill className='object-cover' sizes='240px' />
                </div>
                <div className='absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-slate-900/60 p-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100'>
                  <Button
                    size='icon'
                    variant='secondary'
                    className='size-7'
                    disabled={index === 0}
                    onClick={() => moveHero(index, -1)}
                    aria-label='Geser ke kiri'>
                    <ArrowUp className='size-3.5 -rotate-90' />
                  </Button>
                  <Button
                    size='icon'
                    variant='secondary'
                    className='size-7'
                    disabled={index === heroes.length - 1}
                    onClick={() => moveHero(index, 1)}
                    aria-label='Geser ke kanan'>
                    <ArrowDown className='size-3.5 -rotate-90' />
                  </Button>
                  <Button
                    size='icon'
                    variant='destructive'
                    className='size-7'
                    onClick={() => removeHero(index)}
                    aria-label='Hapus foto'>
                    <Trash2 className='size-3.5' />
                  </Button>
                </div>
              </div>
            ))}

            {heroes.length < MAX_HERO && (
              <label className='flex aspect-video cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 transition-colors hover:border-purple-400 hover:text-purple-600'>
                {busy === 'hero-upload' ? (
                  <Loader2 className='size-6 animate-spin' />
                ) : (
                  <>
                    <ImagePlus className='size-6' />
                    <span className='text-xs font-semibold'>Tambah foto</span>
                  </>
                )}
                <input
                  type='file'
                  className='hidden'
                  accept='image/jpeg,image/png,image/webp'
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (file) handleUploadHero(file);
                  }}
                />
              </label>
            )}
          </div>

          {heroes.length === 0 && (
            <p className='text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3'>
              Belum ada foto kustom — beranda memakai 4 banner bawaan sampai Anda
              mengunggah foto baru.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pimpinan Jurusan</CardTitle>
          <CardDescription>
            Nama, email, dan foto tiga jabatan pimpinan pada halaman struktur
            organisasi.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-5'>
          {PIMPINAN_SLOTS.map((slot) => {
            const row = pimpinan[slot.key] || {
              jabatan: slot.label,
              nama: '',
              email: '',
              foto_url: '',
            };
            return (
              <div
                key={slot.label}
                className='flex flex-col gap-4 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center'>
                <div className='relative size-20 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100'>
                  {row.foto_url ? (
                    <Image src={row.foto_url} alt={row.nama || slot.label} fill className='object-cover' sizes='80px' />
                  ) : null}
                </div>
                <div className='grid flex-1 gap-3 md:grid-cols-2'>
                  <div>
                    <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>
                      {slot.label}
                    </p>
                    <Input
                      className='mt-1'
                      value={row.nama}
                      placeholder='Nama lengkap & gelar'
                      onChange={(e) => updatePimpinanField(slot.key, 'nama', e.target.value)}
                    />
                  </div>
                  <div>
                    <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>
                      Email
                    </p>
                    <Input
                      className='mt-1'
                      value={row.email}
                      placeholder='nama@polinela.ac.id'
                      onChange={(e) => updatePimpinanField(slot.key, 'email', e.target.value)}
                    />
                  </div>
                </div>
                <label className='inline-flex cursor-pointer items-center gap-2 self-start rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-purple-400 hover:text-purple-600 md:self-center'>
                  {busy === `pimpinan-${slot.key}` ? (
                    <Loader2 className='size-4 animate-spin' />
                  ) : (
                    <ImagePlus className='size-4' />
                  )}
                  Ganti foto
                  <input
                    type='file'
                    className='hidden'
                    accept='image/jpeg,image/png,image/webp'
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (file) handleUploadPimpinan(slot.key, file);
                    }}
                  />
                </label>
              </div>
            );
          })}
          <Button onClick={commitPimpinan} disabled={busy === 'pimpinan'}>
            {busy === 'pimpinan' && <Loader2 className='mr-2 size-4 animate-spin' />}
            Simpan nama & email pimpinan
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Penanggung Jawab Lab & TEFA</CardTitle>
          <CardDescription>
            Nama, email, dan foto PJ untuk masing-masing dari 18 fasilitas.
          </CardDescription>
        </CardHeader>
        <CardContent className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Laboratorium</TableHead>
                <TableHead>Nama PJ</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Foto</TableHead>
                <TableHead className='text-right'>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {labs.map((lab) => (
                <TableRow key={lab.id}>
                  <TableCell className='font-medium text-slate-700'>
                    {lab.nama_lab}
                    <span className='ml-2 text-xs text-slate-400'>{lab.jenis}</span>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={lab.pj_nama || ''}
                      onChange={(e) => updateLabPj(lab.id, 'pj_nama', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={lab.pj_email || ''}
                      onChange={(e) => updateLabPj(lab.id, 'pj_email', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <label className='inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600 hover:text-purple-600'>
                      {busy === `lab-foto-${lab.id}` ? (
                        <Loader2 className='size-4 animate-spin' />
                      ) : (
                        <ImagePlus className='size-4' />
                      )}
                      <span className='max-w-[120px] truncate'>
                        {lab.pj_foto_url ? 'Ganti' : 'Unggah'}
                      </span>
                      <input
                        type='file'
                        className='hidden'
                        accept='image/jpeg,image/png,image/webp'
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = '';
                          if (file) handleUploadLabPj(lab, file);
                        }}
                      />
                    </label>
                  </TableCell>
                  <TableCell className='text-right'>
                    <Button
                      size='sm'
                      variant='outline'
                      disabled={busy === `lab-${lab.id}`}
                      onClick={() => saveLabPj(lab)}>
                      {busy === `lab-${lab.id}` && (
                        <Loader2 className='mr-2 size-3.5 animate-spin' />
                      )}
                      Simpan
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
