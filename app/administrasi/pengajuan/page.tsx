'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Trash, Plus, ChevronDown, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { createClient } from '@/lib/supabase/client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const formSchema = z
  .object({
    nama: z.string().min(1, 'Nama wajib diisi'),
    email: z.string().email('Format email tidak valid'),
    kategori_pemohon: z.enum(['Mahasiswa', 'Umum'], {
      required_error: 'Kategori wajib dipilih',
    }),
    npm: z.string().regex(/^\d*$/, 'Hanya boleh berisi angka').optional(),
    programStudi: z.string().optional(),
    nik: z.string().regex(/^\d*$/, 'Hanya boleh berisi angka').optional(),
    judulPenelitian: z.string().min(1, 'Judul PM/Penelitian wajib diisi'),
    dosenPembimbing: z.string().min(1, 'Dosen Pembimbing wajib diisi'),
    labTarget: z.string().min(1, 'Lab target wajib dipilih'),
    tanggal: z.string().min(1, 'Tanggal peminjaman wajib diisi'),
    jam_mulai: z.string().min(1, 'Jam mulai wajib diisi'),
    jam_selesai: z.string().min(1, 'Jam selesai wajib diisi'),
    items: z
      .array(
        z.object({
          namaAlat: z.string().min(1, 'Nama alat wajib diisi'),
          jumlah: z.string().min(1, 'Jumlah wajib diisi'),
        }),
      )
      .min(1, 'Minimal pilih 1 alat'),
  })
  .superRefine((data, ctx) => {
    if (data.kategori_pemohon === 'Mahasiswa') {
      if (!data.npm || data.npm.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'NPM wajib diisi untuk Mahasiswa',
          path: ['npm'],
        });
      }
      if (!data.programStudi || data.programStudi.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Program studi wajib diisi untuk Mahasiswa',
          path: ['programStudi'],
        });
      }
    } else if (data.kategori_pemohon === 'Umum') {
      if (!data.nik || data.nik.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'NIK wajib diisi untuk Umum',
          path: ['nik'],
        });
      }
    }
  });

type FormData = z.infer<typeof formSchema>;

export default function PengajuanForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      items: [{ namaAlat: '', jumlah: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const kategoriPemohon = watch('kategori_pemohon');
  const labTargetValue = watch('labTarget');

  const [availableItems, setAvailableItems] = useState<any[]>([]);

  useEffect(() => {
    if (!labTargetValue) {
      setAvailableItems([]);
      return;
    }

    const labMap: Record<string, number> = {
      'Lab SFS budidaya perikanan': 1,
      'Lab A (lab pembenihan ikan)': 2,
      'Lab pengolahan perikanan': 3,
      'Lab perikanan bawah': 4,
      'Tefa polifishfarm': 5,
      'Tefa POFF': 6,
      'Tefa polifeed': 7,
      'Lab Simulator': 8,
      'Lab Tangkap': 9,
      'Lab Radar': 10,
    };

    const lab_id = labMap[labTargetValue];
    if (!lab_id) return;

    const fetchInventaris = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('inventaris')
        .select('jenis_alat, jumlah_baik, kategori_inventaris!inner(lab_id)')
        .eq('kategori_inventaris.lab_id', lab_id);

      if (!error && data) {
        // Map ke format yang dibutuhkan dropdown: jenis_alat + jumlah (dari jumlah_baik)
        const mapped = data.map((item: any) => ({
          jenis_alat: item.jenis_alat,
          jumlah: item.jumlah_baik ?? 0,
        }));
        setAvailableItems(mapped);
      } else {
        setAvailableItems([]);
      }
    };

    fetchInventaris();
  }, [labTargetValue]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const supabase = createClient();

      const labMap: Record<string, number> = {
        'Lab SFS budidaya perikanan': 1,
        'Lab A (lab pembenihan ikan)': 2,
        'Lab pengolahan perikanan': 3,
        'Lab perikanan bawah': 4,
        'Tefa polifishfarm': 5,
        'Tefa POFF': 6,
        'Tefa polifeed': 7,
        'Lab Simulator': 8,
        'Lab Tangkap': 9,
        'Lab Radar': 10,
      };

      const resolvedLabId = labMap[data.labTarget] || 1;

      // --- Cek Jadwal Bentrok ---
      const { data: existingSchedules, error: existingError } = await supabase
        .from('peminjaman')
        .select('jam_mulai, jam_selesai, nama_lengkap')
        .eq('lab_id', resolvedLabId)
        .eq('tanggal', data.tanggal)
        .eq('status', 'Disetujui');

      if (existingError) {
        throw new Error(
          'Gagal memeriksa ketersediaan jadwal: ' + existingError.message,
        );
      }

      let conflictFound = null;
      if (existingSchedules) {
        const newMulai = data.jam_mulai;
        const newSelesai = data.jam_selesai;

        for (const schedule of existingSchedules) {
          const oldMulai = schedule.jam_mulai;
          const oldSelesai = schedule.jam_selesai;

          // Logika overlap: (Mulai Baru < Selesai Lama) && (Selesai Baru > Mulai Lama)
          if (newMulai < oldSelesai && newSelesai > oldMulai) {
            conflictFound = schedule;
            break;
          }
        }
      }

      if (conflictFound) {
        alert(
          `Maaf, Lab ${data.labTarget} sudah dipesan pada jam tersebut oleh ${conflictFound.nama_lengkap}. Silakan pilih jam lain.`,
        );
        setIsSubmitting(false);
        return;
      }
      // --- Akhir Cek Jadwal ---

      const peminjamanData = {
        kategori_pemohon: data.kategori_pemohon,
        nama_lengkap: data.nama,
        email_pemohon: data.email,
        npm: data.npm || null,
        nik: data.nik || null,
        program_studi: data.programStudi || null,
        judul_kegiatan: data.judulPenelitian,
        dosen_pembimbing: data.dosenPembimbing,
        lab_id: resolvedLabId,
        tanggal: data.tanggal,
        jam_mulai: data.jam_mulai,
        jam_selesai: data.jam_selesai,
        status: 'Menunggu validasi',
      };

      const { data: insertedPeminjaman, error: errorPeminjaman } =
        await supabase
          .from('peminjaman')
          .insert(peminjamanData)
          .select('id')
          .single();

      if (errorPeminjaman) throw new Error(errorPeminjaman.message);

      const peminjamanId = insertedPeminjaman.id;

      const itemData = data.items.map((item) => ({
        peminjaman_id: peminjamanId,
        nama_alat_bahan: item.namaAlat,
        jumlah: parseInt(item.jumlah, 10),
      }));

      const { error: errorItem } = await supabase
        .from('peminjaman_item')
        .insert(itemData);

      if (errorItem) throw new Error(errorItem.message);

      alert('Pengajuan berhasil dikirim!');
      reset();
      router.push('/');
    } catch (error: any) {
      console.error(error);
      alert('Gagal mengirim pengajuan: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='relative min-h-screen bg-gradient-to-br from-cyan-500 via-blue-600 to-blue-900 pt-20 md:pt-24 flex flex-col'>
      {/* Tombol Kembali (Absolute di kiri atas) */}
      <div className='absolute top-6 left-6 md:top-10 md:left-10 z-10'>
        <Link
          href='/'
          className='flex items-center gap-2 text-white/80 hover:text-white transition-colors'>
          <ArrowLeft size={20} />
          <span className='font-medium text-sm md:text-base'>Kembali</span>
        </Link>
      </div>

      {/* Konten Utama */}
      <div className='w-full flex-1'>
        <div className='px-6 md:px-0 mb-6 text-white text-center md:text-left md:max-w-5xl md:mx-auto w-full'>
          <h1 className='text-3xl md:text-4xl font-bold drop-shadow-md'>
            Formulir Pengajuan
          </h1>
          <p className='mt-2 text-blue-50 font-medium drop-shadow-sm md:text-lg'>
            Isi data identitas dan alat/bahan yang akan dipinjam untuk kebutuhan
            laboratorium.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className='space-y-8 w-full bg-white/95 backdrop-blur-md shadow-2xl rounded-t-[2rem] md:rounded-2xl md:max-w-5xl mx-auto p-6 md:p-8 min-h-[80vh] md:border md:border-white/20 md:mb-8 pb-12'>
          {/* Identitas Section */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-2'>
              <Label htmlFor='nama' className='md:text-base font-semibold'>
                Nama Lengkap
              </Label>
              <Input
                id='nama'
                className='md:text-lg md:h-14'
                placeholder='Masukkan nama lengkap'
                {...register('nama')}
              />
              {errors.nama && (
                <span className='text-sm font-medium md:text-base text-red-500'>
                  {errors.nama.message}
                </span>
              )}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='email' className='md:text-base font-semibold'>
                Email address
              </Label>
              <Input
                id='email'
                className='md:text-lg md:h-14'
                type='email'
                placeholder='contoh@email.com'
                {...register('email')}
              />
              {errors.email && (
                <span className='text-sm font-medium md:text-base text-red-500'>
                  {errors.email.message}
                </span>
              )}
            </div>

            <div className='space-y-2 col-span-1 md:col-span-2'>
              <Label className='md:text-base font-semibold'>
                Kategori Pemohon
              </Label>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='outline'
                    className='w-full justify-between font-normal text-slate-700 bg-transparent border-slate-200 hover:bg-slate-50 md:text-lg md:h-14'>
                    {kategoriPemohon || '-- Pilih Kategori Anda --'}
                    <ChevronDown className='h-4 w-4 opacity-50' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className='w-[--radix-dropdown-menu-trigger-width] min-w-[var(--radix-dropdown-menu-trigger-width)]'
                  align='start'>
                  <DropdownMenuItem
                    className='md:text-base py-2.5 cursor-pointer'
                    onClick={() =>
                      setValue('kategori_pemohon', 'Mahasiswa', {
                        shouldValidate: true,
                      })
                    }>
                    Mahasiswa
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className='md:text-base py-2.5 cursor-pointer'
                    onClick={() =>
                      setValue('kategori_pemohon', 'Umum', {
                        shouldValidate: true,
                      })
                    }>
                    Umum
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {errors.kategori_pemohon && (
                <span className='text-sm font-medium md:text-base text-red-500'>
                  {errors.kategori_pemohon.message}
                </span>
              )}
            </div>

            {/* Conditional Rendering Animasi untuk Mahasiswa */}
            {kategoriPemohon === 'Mahasiswa' && (
              <div className='col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-300 ease-out'>
                <div className='space-y-2'>
                  <Label htmlFor='npm' className='md:text-base font-semibold'>
                    NPM
                  </Label>
                  <Input
                    id='npm'
                    className='md:text-lg md:h-14'
                    placeholder='Masukkan NPM Anda'
                    {...register('npm')}
                  />
                  {errors.npm && (
                    <span className='text-sm font-medium md:text-base text-red-500'>
                      {errors.npm.message}
                    </span>
                  )}
                </div>
                <div className='space-y-2'>
                  <Label
                    htmlFor='programStudi'
                    className='md:text-base font-semibold'>
                    Program Studi
                  </Label>
                  <Input
                    id='programStudi'
                    className='md:text-lg md:h-14'
                    placeholder='Cth: Budidaya Perikanan'
                    {...register('programStudi')}
                  />
                  {errors.programStudi && (
                    <span className='text-sm font-medium md:text-base text-red-500'>
                      {errors.programStudi.message}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Conditional Rendering Animasi untuk Umum */}
            {kategoriPemohon === 'Umum' && (
              <div className='col-span-1 md:col-span-2 animate-in fade-in slide-in-from-top-4 duration-300 ease-out'>
                <div className='space-y-2'>
                  <Label htmlFor='nik' className='md:text-base font-semibold'>
                    NIK (Nomor Induk Kependudukan)
                  </Label>
                  <Input
                    id='nik'
                    className='md:text-lg md:h-14'
                    placeholder='Masukkan 16 digit NIK KTP Anda'
                    {...register('nik')}
                  />
                  {errors.nik && (
                    <span className='text-sm font-medium md:text-base text-red-500'>
                      {errors.nik.message}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className='space-y-2'>
              <Label
                htmlFor='judulPenelitian'
                className='md:text-base font-semibold'>
                Judul PM / Penelitian
              </Label>
              <Input
                id='judulPenelitian'
                className='md:text-lg md:h-14'
                placeholder='Judul penelitian/tugas akhir'
                {...register('judulPenelitian')}
              />
              {errors.judulPenelitian && (
                <span className='text-sm font-medium md:text-base text-red-500'>
                  {errors.judulPenelitian.message}
                </span>
              )}
            </div>
            <div className='space-y-2'>
              <Label
                htmlFor='dosenPembimbing'
                className='md:text-base font-semibold'>
                Dosen Pembimbing / Penanggung Jawab
              </Label>
              <Input
                id='dosenPembimbing'
                className='md:text-lg md:h-14'
                placeholder='Nama dosen atau PIC'
                {...register('dosenPembimbing')}
              />
              {errors.dosenPembimbing && (
                <span className='text-sm font-medium md:text-base text-red-500'>
                  {errors.dosenPembimbing.message}
                </span>
              )}
            </div>

            <div className='space-y-2 col-span-1 md:col-span-2'>
              <Label className='md:text-base font-semibold'>Lab Target</Label>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='outline'
                    className='w-full justify-between font-normal text-slate-700 bg-transparent border-slate-200 hover:bg-slate-50 md:text-lg md:h-14'>
                    {labTargetValue || 'Pilih laboratorium...'}
                    <ChevronDown className='h-4 w-4 opacity-50' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className='w-[--radix-dropdown-menu-trigger-width] min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-72 overflow-y-auto'
                  align='start'>
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Lab Perikanan</DropdownMenuLabel>
                    <DropdownMenuItem
                      className='text-base md:text-sm py-2.5 cursor-pointer'
                      onClick={() =>
                        setValue('labTarget', 'Lab SFS budidaya perikanan', {
                          shouldValidate: true,
                        })
                      }>
                      Lab SFS budidaya perikanan
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className='text-base md:text-sm py-2.5 cursor-pointer'
                      onClick={() =>
                        setValue('labTarget', 'Lab A (lab pembenihan ikan)', {
                          shouldValidate: true,
                        })
                      }>
                      Lab A (lab pembenihan ikan)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className='text-base md:text-sm py-2.5 cursor-pointer'
                      onClick={() =>
                        setValue('labTarget', 'Lab pengolahan perikanan', {
                          shouldValidate: true,
                        })
                      }>
                      Lab pengolahan perikanan
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className='text-base md:text-sm py-2.5 cursor-pointer'
                      onClick={() =>
                        setValue('labTarget', 'Lab perikanan bawah', {
                          shouldValidate: true,
                        })
                      }>
                      Lab perikanan bawah
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className='text-base md:text-sm py-2.5 cursor-pointer'
                      onClick={() =>
                        setValue('labTarget', 'Tefa polifishfarm', {
                          shouldValidate: true,
                        })
                      }>
                      Tefa polifishfarm
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className='text-base md:text-sm py-2.5 cursor-pointer'
                      onClick={() =>
                        setValue('labTarget', 'Tefa POFF', {
                          shouldValidate: true,
                        })
                      }>
                      Tefa POFF
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className='text-base md:text-sm py-2.5 cursor-pointer'
                      onClick={() =>
                        setValue('labTarget', 'Tefa polifeed', {
                          shouldValidate: true,
                        })
                      }>
                      Tefa polifeed
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Lab Perikanan Tangkap</DropdownMenuLabel>
                    <DropdownMenuItem
                      className='text-base md:text-sm py-2.5 cursor-pointer'
                      onClick={() =>
                        setValue('labTarget', 'Lab Simulator', {
                          shouldValidate: true,
                        })
                      }>
                      Lab Simulator
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className='text-base md:text-sm py-2.5 cursor-pointer'
                      onClick={() =>
                        setValue('labTarget', 'Lab Tangkap', {
                          shouldValidate: true,
                        })
                      }>
                      Lab Tangkap
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className='text-base md:text-sm py-2.5 cursor-pointer'
                      onClick={() =>
                        setValue('labTarget', 'Lab Radar', {
                          shouldValidate: true,
                        })
                      }>
                      Lab Radar
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              {errors.labTarget && (
                <span className='text-sm font-medium md:text-base text-red-500'>
                  {errors.labTarget.message}
                </span>
              )}
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 col-span-1 md:col-span-2'>
              <div className='space-y-2'>
                <Label
                  htmlFor='tanggal'
                  className='md:text-base font-semibold whitespace-nowrap'>
                  Tanggal Peminjaman
                </Label>
                <Input
                  id='tanggal'
                  className='md:text-lg md:h-14'
                  type='date'
                  {...register('tanggal')}
                />
                {errors.tanggal && (
                  <span className='text-sm font-medium md:text-base text-red-500'>
                    {errors.tanggal.message}
                  </span>
                )}
              </div>
              <div className='space-y-2'>
                <Label
                  htmlFor='jam_mulai'
                  className='md:text-base font-semibold'>
                  Jam Mulai
                </Label>
                <Input
                  id='jam_mulai'
                  className='md:text-lg md:h-14'
                  type='time'
                  {...register('jam_mulai')}
                />
                {errors.jam_mulai && (
                  <span className='text-sm font-medium md:text-base text-red-500'>
                    {errors.jam_mulai.message}
                  </span>
                )}
              </div>
              <div className='space-y-2'>
                <Label
                  htmlFor='jam_selesai'
                  className='md:text-base font-semibold'>
                  Jam Selesai
                </Label>
                <Input
                  id='jam_selesai'
                  className='md:text-lg md:h-14'
                  type='time'
                  {...register('jam_selesai')}
                />
                {errors.jam_selesai && (
                  <span className='text-sm font-medium md:text-base text-red-500'>
                    {errors.jam_selesai.message}
                  </span>
                )}
              </div>
            </div>
          </div>

          <hr className='border-slate-200' />

          {/* Barang Section */}
          <div className='space-y-4'>
            <div>
              <h2 className='text-xl md:text-2xl font-semibold text-slate-900'>
                Alat dan bahan yang ingin dipakai
              </h2>
              <p className='text-sm md:text-base text-slate-500'>
                Pilih alat/bahan dari inventaris lab yang tersedia.
              </p>
            </div>

            <div className='space-y-4'>
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className='flex flex-col md:flex-row gap-3 items-start md:items-center mb-4 pb-4 md:pb-0 border-b border-slate-100 md:border-none'>
                  <div className='w-full md:flex-1 space-y-1'>
                    <select
                      className='w-full h-10 md:h-14 md:text-lg rounded-md border border-slate-200 bg-transparent px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      {...register(`items.${index}.namaAlat`)}
                      defaultValue=''>
                      <option value='' disabled>
                        {availableItems.length > 0
                          ? '-- Pilih Alat/Bahan --'
                          : '-- Pilih Lab Target terlebih dahulu --'}
                      </option>
                      {availableItems.map((item, i) => (
                        <option key={i} value={item.jenis_alat}>
                          {item.jenis_alat} (Tersedia: {item.jumlah})
                        </option>
                      ))}
                    </select>
                    {errors.items?.[index]?.namaAlat && (
                      <span className='text-sm font-medium md:text-base text-red-500'>
                        {errors.items[index]?.namaAlat?.message}
                      </span>
                    )}
                  </div>
                  <div className='w-full grid grid-cols-[1fr_auto] md:flex md:w-auto gap-3 items-start md:items-center'>
                    <div className='w-full md:w-24 space-y-1'>
                      <Input
                        className='w-full md:text-lg md:h-14'
                        type='number'
                        placeholder='Jumlah'
                        {...register(`items.${index}.jumlah`)}
                      />
                      {errors.items?.[index]?.jumlah && (
                        <span className='text-sm font-medium md:text-base text-red-500'>
                          {errors.items[index]?.jumlah?.message}
                        </span>
                      )}
                    </div>
                    <Button
                      type='button'
                      variant='destructive'
                      size='icon'
                      className='shrink-0 md:h-14 md:w-14'
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}>
                      <Trash className='size-4 md:size-5' />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Button
              type='button'
              variant='outline'
              className='w-full border-dashed border-2 border-slate-300 text-slate-500 hover:text-slate-800 hover:border-slate-400 focus:ring-slate-100 md:text-lg md:h-14'
              onClick={() => append({ namaAlat: '', jumlah: '' })}>
              <Plus className='size-4 mr-2 md:size-5 md:mr-3' />
              Tambah Alat
            </Button>
          </div>

          <div className='pt-4 flex justify-end'>
            <Button
              type='submit'
              size='lg'
              disabled={isSubmitting}
              className='w-full md:w-auto bg-blue-600 hover:bg-blue-700 md:text-lg md:h-14 font-bold md:px-10'>
              {isSubmitting ? 'Mengirim...' : 'Kirim Pengajuan'}
            </Button>
          </div>
        </form>
      </div>

      {/* Footer Minimalis Internal */}
      <footer className='w-full text-center py-6 text-white/90 text-sm md:text-base mt-auto'>
        &copy; {new Date().getFullYear()} Sistem Administrasi Lab Perikanan.
      </footer>
    </div>
  );
}
