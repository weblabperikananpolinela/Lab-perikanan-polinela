'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Trash, Plus, ChevronDown, ArrowLeft, Info } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
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
    kategori_pemohon: z.enum(['Mahasiswa Polinela', 'Dosen Polinela', 'Umum'], {
      required_error: 'Kategori wajib dipilih',
    }),
    npm_nip: z.string().regex(/^\d*$/, 'Hanya boleh berisi angka').optional(),
    programStudi: z.string().optional(),
    nik: z.string().regex(/^\d*$/, 'Hanya boleh berisi angka').optional(),
    judulPenelitian: z.string().min(1, 'Judul Kegiatan/Penelitian wajib diisi'),
    dosenPembimbing: z.string().optional(), // Opsional karena Umum tidak selalu ada dosen
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
    if (data.kategori_pemohon === 'Mahasiswa Polinela') {
      if (!data.npm_nip || data.npm_nip.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'NPM wajib diisi untuk Mahasiswa',
          path: ['npm_nip'],
        });
      }
      if (!data.programStudi || data.programStudi.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Program studi wajib diisi',
          path: ['programStudi'],
        });
      }
      if (!data.dosenPembimbing || data.dosenPembimbing.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Dosen Pembimbing wajib diisi',
          path: ['dosenPembimbing'],
        });
      }
    } else if (data.kategori_pemohon === 'Dosen Polinela') {
      if (!data.npm_nip || data.npm_nip.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'NIP wajib diisi untuk Dosen',
          path: ['npm_nip'],
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

// DAFTAR LAB BARU (Sesuai List)
const labMap: Record<string, number> = {
  'Lab. Kesehatan Ikan': 1,
  'Lab. Kualitas Air': 2,
  'Lab. Pengolahan': 3,
  'Bangsal Pakan Alami': 4,
  'Lab. Perikanan (SFS)': 5,
  'Lab. Pembenihan': 6,
  'Lab. Ikan Hias': 7,
  'Lab. Nutrisi': 8,
  Polyfeed: 9,
  'Politeknik Ornamental Fish Farm (POFA)': 10,
  'Galangan Kapal': 11,
  'Alat Tangkap Ikan': 12,
  KJA: 13,
  FISHTECH: 14,
  'FISH MARKET': 15,
  polyfish: 16,
  'Lab Simulator': 17,
  'Lab Radar': 18,
};

// Data terstruktur untuk Dropdown Lab
const labKategoriData = {
  'Lab Perikanan': [
    { nama: 'Lab. Kesehatan Ikan', jenis: 'Laboratorium' },
    { nama: 'Lab. Kualitas Air', jenis: 'Laboratorium' },
    { nama: 'Lab. Pengolahan', jenis: 'Laboratorium' },
    { nama: 'Bangsal Pakan Alami', jenis: 'Laboratorium' },
    { nama: 'Lab. Perikanan (SFS)', jenis: 'Laboratorium' },
    { nama: 'Lab. Pembenihan', jenis: 'Laboratorium' },
    { nama: 'Lab. Ikan Hias', jenis: 'Laboratorium' },
    { nama: 'Lab. Nutrisi', jenis: 'Laboratorium' },
    { nama: 'Polyfeed', jenis: 'TEFA' },
    { nama: 'Politeknik Ornamental Fish Farm (POFA)', jenis: 'TEFA' },
    { nama: 'Galangan Kapal', jenis: 'TEFA' },
    { nama: 'Alat Tangkap Ikan', jenis: 'TEFA' },
    { nama: 'KJA', jenis: 'TEFA' },
    { nama: 'FISHTECH', jenis: 'TEFA' },
    { nama: 'FISH MARKET', jenis: 'TEFA' },
    { nama: 'polyfish', jenis: 'TEFA' },
  ],
  'Lab Perikanan Tangkap': [
    { nama: 'Lab Simulator', jenis: 'TEFA' },
    { nama: 'Lab Radar', jenis: 'TEFA' },
  ],
};

// Lab yang bebas dipinjam oleh Umum
const freeUmumLabs = [
  'Lab. Perikanan (SFS)',
  'Lab. Pengolahan',
  'Lab. Kualitas Air',
  'Lab. Kesehatan Ikan',
  'Lab. Nutrisi',
];

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
  const judulPenelitianValue = watch('judulPenelitian');

  const [availableItems, setAvailableItems] = useState<any[]>([]);

  // Cek apakah Umum memilih lab yang di-restrict
  const isRestrictedUmum =
    kategoriPemohon === 'Umum' &&
    labTargetValue &&
    !freeUmumLabs.includes(labTargetValue);

  // Reset text kegiatan jika berubah status restricted
  useEffect(() => {
    setValue('judulPenelitian', '', { shouldValidate: false });
  }, [isRestrictedUmum, setValue]);

  useEffect(() => {
    if (!labTargetValue) {
      setAvailableItems([]);
      return;
    }

    const lab_id = labMap[labTargetValue];
    if (!lab_id) return;

    const fetchInventaris = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('inventaris')
        .select('jenis_alat, jumlah_baik, kategori_inventaris!inner(lab_id)')
        .eq('kategori_inventaris.lab_id', lab_id);

      if (!error && data) {
        const mapped = data
          .filter((item: any) => item.jumlah_baik > 0)
          .map((item: any) => ({
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
      const resolvedLabId = labMap[data.labTarget] || 1;

      // --- Cek Jadwal Bentrok ---
      const { data: existingSchedules, error: existingError } = await supabase
        .from('peminjaman')
        .select('jam_mulai, jam_selesai, nama_lengkap')
        .eq('lab_id', resolvedLabId)
        .eq('tanggal', data.tanggal)
        .eq('status', 'Disetujui');

      if (existingError) {
        throw new Error('Gagal memeriksa jadwal: ' + existingError.message);
      }

      let conflictFound = null;
      if (existingSchedules) {
        const newMulai = data.jam_mulai;
        const newSelesai = data.jam_selesai;

        for (const schedule of existingSchedules) {
          const oldMulai = schedule.jam_mulai;
          const oldSelesai = schedule.jam_selesai;
          if (newMulai < oldSelesai && newSelesai > oldMulai) {
            conflictFound = schedule;
            break;
          }
        }
      }

      if (conflictFound) {
        Swal.fire({
          icon: 'warning',
          title: 'Jadwal Bentrok!',
          text: `Maaf, Lab ${data.labTarget} sudah dipesan pada jam tersebut oleh ${conflictFound.nama_lengkap}. Silakan pilih jam lain.`,
          confirmButtonColor: '#3085d6',
        });
        setIsSubmitting(false);
        return;
      }

      // Pastikan NPM atau NIK masuk ke field yang tepat
      const peminjamanData = {
        kategori_pemohon: data.kategori_pemohon,
        nama_lengkap: data.nama,
        email_pemohon: data.email,
        npm: data.kategori_pemohon !== 'Umum' ? data.npm_nip : null,
        nik: data.kategori_pemohon === 'Umum' ? data.nik : null,
        program_studi: data.programStudi || null,
        judul_kegiatan: data.judulPenelitian,
        dosen_pembimbing: data.dosenPembimbing || '-',
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

      const itemData = data.items.map((item) => ({
        peminjaman_id: insertedPeminjaman.id,
        nama_alat_bahan: item.namaAlat,
        jumlah: parseInt(item.jumlah, 10),
      }));

      const { error: errorItem } = await supabase
        .from('peminjaman_item')
        .insert(itemData);

      if (errorItem) throw new Error(errorItem.message);

      // --- SEND EMAILS ---
      try {
        // Ambil email pengelola lab berdasarkan resolvedLabId di tabel whitelist_admin
        const { data: adminData } = await supabase
          .from('whitelist_admin')
          .select('email')
          .eq('lab_id', resolvedLabId)
          .single();
          
        const targetEmailAdmin = adminData?.email || 'admin_pusat@polinela.ac.id';

        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'ADMIN_NOTIFICATION',
            to: targetEmailAdmin,
            data: {
              judul_kegiatan: data.judulPenelitian,
              nama_pengaju: data.nama,
              tanggal: data.tanggal,
              lab_id: resolvedLabId,
            },
          }),
        });

        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'USER_CONFIRMATION',
            to: data.email,
            data: {
              judul_kegiatan: data.judulPenelitian,
              nama_pengaju: data.nama,
            },
          }),
        });
      } catch (emailErr) {
        console.error('Gagal mengirim email:', emailErr);
        // Tetap lanjut tampilkan Swal sukses karena data sudah masuk db
      }

      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Pengajuan Anda berhasil dikirim dan notifikasi email telah terkirim.',
        confirmButtonColor: '#10b981', // Warna hijau
      }).then(() => {
        reset();
        router.push('/');
      });
    } catch (error: any) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Gagal mengirim pengajuan: ' + error.message,
        confirmButtonColor: '#ef4444', // Warna merah
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='relative min-h-screen bg-gradient-to-br from-cyan-500 via-blue-600 to-blue-900 pt-20 md:pt-24 flex flex-col'>
      {/* Tombol Kembali */}
      <div className='absolute top-6 left-6 md:top-10 md:left-10 z-10'>
        <Link
          href='/'
          className='flex items-center gap-2 text-white/80 hover:text-white transition-colors'>
          <ArrowLeft size={20} />
          <span className='font-medium text-sm md:text-base'>Kembali</span>
        </Link>
      </div>

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
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Nama & Email */}
            <div className='space-y-2'>
              <Label className='md:text-base font-semibold'>Nama Lengkap</Label>
              <Input
                className='md:text-lg md:h-14'
                placeholder='Masukkan nama lengkap'
                {...register('nama')}
              />
              {errors.nama && (
                <span className='text-sm text-red-500'>
                  {errors.nama.message}
                </span>
              )}
            </div>
            <div className='space-y-2'>
              <Label className='md:text-base font-semibold'>
                Email address
              </Label>
              <Input
                className='md:text-lg md:h-14'
                type='email'
                placeholder='contoh@email.com'
                {...register('email')}
              />
              {errors.email && (
                <span className='text-sm text-red-500'>
                  {errors.email.message}
                </span>
              )}
            </div>

            {/* Kategori Pemohon */}
            <div className='space-y-2 col-span-1 md:col-span-2'>
              <Label className='md:text-base font-semibold'>
                Kategori Pemohon
              </Label>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='outline'
                    className='w-full justify-between font-normal text-slate-700 md:text-lg md:h-14'>
                    {kategoriPemohon || '-- Pilih Kategori Anda --'}
                    <ChevronDown className='h-4 w-4 opacity-50' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className='w-[--radix-dropdown-menu-trigger-width]'
                  align='start'>
                  {['Mahasiswa Polinela', 'Dosen Polinela', 'Umum'].map(
                    (kat) => (
                      <DropdownMenuItem
                        key={kat}
                        className='md:text-base py-2.5 cursor-pointer'
                        onClick={() =>
                          setValue('kategori_pemohon', kat as any, {
                            shouldValidate: true,
                          })
                        }>
                        {kat}
                      </DropdownMenuItem>
                    ),
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              {errors.kategori_pemohon && (
                <span className='text-sm text-red-500'>
                  {errors.kategori_pemohon.message}
                </span>
              )}
            </div>

            {/* Conditional Input Kategori */}
            {(kategoriPemohon === 'Mahasiswa Polinela' ||
              kategoriPemohon === 'Dosen Polinela') && (
              <div className='space-y-2 animate-in fade-in slide-in-from-top-4 duration-300'>
                <Label className='md:text-base font-semibold'>
                  {kategoriPemohon === 'Mahasiswa Polinela' ? 'NPM' : 'NIP'}
                </Label>
                <Input
                  className='md:text-lg md:h-14'
                  placeholder={`Masukkan ${kategoriPemohon === 'Mahasiswa Polinela' ? 'NPM' : 'NIP'} Anda`}
                  {...register('npm_nip')}
                />
                {errors.npm_nip && (
                  <span className='text-sm text-red-500'>
                    {errors.npm_nip.message}
                  </span>
                )}
              </div>
            )}

            {kategoriPemohon === 'Mahasiswa Polinela' && (
              <div className='space-y-2 animate-in fade-in slide-in-from-top-4 duration-300'>
                <Label className='md:text-base font-semibold'>
                  Program Studi
                </Label>
                <Input
                  className='md:text-lg md:h-14'
                  placeholder='Cth: Budidaya Perikanan'
                  {...register('programStudi')}
                />
                {errors.programStudi && (
                  <span className='text-sm text-red-500'>
                    {errors.programStudi.message}
                  </span>
                )}
              </div>
            )}

            {kategoriPemohon === 'Umum' && (
              <div className='space-y-2 col-span-1 md:col-span-2 animate-in fade-in slide-in-from-top-4 duration-300'>
                <Label className='md:text-base font-semibold'>NIK KTP</Label>
                <Input
                  className='md:text-lg md:h-14'
                  placeholder='Masukkan 16 digit NIK KTP'
                  {...register('nik')}
                />
                {errors.nik && (
                  <span className='text-sm text-red-500'>
                    {errors.nik.message}
                  </span>
                )}
              </div>
            )}

            {/* Lab Target dengan Grouping Baru & Badge Jenis */}
            <div className='space-y-2 col-span-1 md:col-span-2 mt-2'>
              <Label className='md:text-base font-semibold'>Lab Target</Label>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='outline'
                    className='w-full justify-between font-normal text-slate-700 md:text-lg md:h-14'>
                    {labTargetValue || 'Pilih laboratorium...'}
                    <ChevronDown className='h-4 w-4 opacity-50' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className='w-[--radix-dropdown-menu-trigger-width] max-h-80 overflow-y-auto'
                  align='start'>
                  {/* Grup Lab Perikanan */}
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className='font-bold text-blue-700 bg-slate-50'>
                      Lab Perikanan
                    </DropdownMenuLabel>
                    {labKategoriData['Lab Perikanan'].map((lab) => (
                      <DropdownMenuItem
                        key={lab.nama}
                        className='text-base md:text-sm py-2.5 cursor-pointer ml-1'
                        onClick={() =>
                          setValue('labTarget', lab.nama, {
                            shouldValidate: true,
                          })
                        }>
                        <div className='flex items-center justify-between w-full'>
                          <span>{lab.nama}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ml-2 shrink-0 ${
                              lab.jenis === 'TEFA'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                            {lab.jenis}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>

                  {/* Grup Lab Perikanan Tangkap */}
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className='font-bold text-blue-700 bg-slate-50 mt-2 border-t pt-2'>
                      Lab Perikanan Tangkap
                    </DropdownMenuLabel>
                    {labKategoriData['Lab Perikanan Tangkap'].map((lab) => (
                      <DropdownMenuItem
                        key={lab.nama}
                        className='text-base md:text-sm py-2.5 cursor-pointer ml-1'
                        onClick={() =>
                          setValue('labTarget', lab.nama, {
                            shouldValidate: true,
                          })
                        }>
                        <div className='flex items-center justify-between w-full'>
                          <span>{lab.nama}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ml-2 shrink-0 ${
                              lab.jenis === 'TEFA'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                            {lab.jenis}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              {errors.labTarget && (
                <span className='text-sm text-red-500'>
                  {errors.labTarget.message}
                </span>
              )}
            </div>

            {/* Judul Kegiatan (Dinamis untuk UMUM) */}
            <div className='space-y-2 col-span-1 md:col-span-2'>
              <Label className='md:text-base font-semibold'>
                Kegiatan / Tujuan
              </Label>
              {isRestrictedUmum ? (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='outline'
                      className='w-full justify-between font-normal text-slate-700 md:text-lg md:h-14'>
                      {judulPenelitianValue || '-- Pilih Jenis Kegiatan --'}
                      <ChevronDown className='h-4 w-4 opacity-50' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className='w-[--radix-dropdown-menu-trigger-width]'
                    align='start'>
                    {['Kunjungan edukasi', 'PKL', 'Pelatihan'].map((keg) => (
                      <DropdownMenuItem
                        key={keg}
                        className='md:text-base py-2.5 cursor-pointer'
                        onClick={() =>
                          setValue('judulPenelitian', keg, {
                            shouldValidate: true,
                          })
                        }>
                        {keg}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Input
                  className='md:text-lg md:h-14'
                  placeholder='Tuliskan detail kegiatan / judul penelitian...'
                  {...register('judulPenelitian')}
                />
              )}
              {errors.judulPenelitian && (
                <span className='text-sm text-red-500'>
                  {errors.judulPenelitian.message}
                </span>
              )}
            </div>

            {/* Dosen Pembimbing (Sembunyikan untuk UMUM) */}
            {kategoriPemohon !== 'Umum' && (
              <div className='space-y-2 col-span-1 md:col-span-2 animate-in fade-in'>
                <Label className='md:text-base font-semibold'>
                  Dosen Pembimbing / PIC
                </Label>
                <Input
                  className='md:text-lg md:h-14'
                  placeholder='Nama dosen pembimbing'
                  {...register('dosenPembimbing')}
                />
                {errors.dosenPembimbing && (
                  <span className='text-sm text-red-500'>
                    {errors.dosenPembimbing.message}
                  </span>
                )}
              </div>
            )}

            {/* Waktu dengan Helper Text */}
            <div className='col-span-1 md:col-span-2 mt-2 border border-amber-200 bg-amber-50 rounded-lg p-4'>
              <div className='flex items-start gap-2 mb-4'>
                <Info className='size-5 text-amber-600 shrink-0 mt-0.5' />
                <p className='text-sm text-amber-800 font-medium leading-relaxed'>
                  Pastikan Anda telah{' '}
                  <Link
                    href='/#jadwal'
                    className='underline font-bold hover:text-amber-900'>
                    melihat jadwal ketersediaan lab
                  </Link>{' '}
                  terlebih dahulu sebelum menentukan waktu peminjaman untuk
                  menghindari bentrok.
                </p>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='space-y-2'>
                  <Label className='md:text-base font-semibold text-slate-800'>
                    Tanggal
                  </Label>
                  <Input
                    className='md:text-lg md:h-14 bg-white'
                    type='date'
                    {...register('tanggal')}
                  />
                </div>
                <div className='space-y-2'>
                  <Label className='md:text-base font-semibold text-slate-800'>
                    Mulai
                  </Label>
                  <Input
                    className='md:text-lg md:h-14 bg-white'
                    type='time'
                    {...register('jam_mulai')}
                  />
                </div>
                <div className='space-y-2'>
                  <Label className='md:text-base font-semibold text-slate-800'>
                    Selesai
                  </Label>
                  <Input
                    className='md:text-lg md:h-14 bg-white'
                    type='time'
                    {...register('jam_selesai')}
                  />
                </div>
              </div>
            </div>
          </div>

          <hr className='border-slate-200 my-8' />

          {/* Item Inventaris dengan Helper Text */}
          <div className='space-y-4'>
            <div>
              <h2 className='text-xl md:text-2xl font-semibold text-slate-900'>
                Alat dan bahan
              </h2>
              <p className='text-sm md:text-base text-slate-500 mt-1'>
                Pilih dari inventaris yang tersedia di lab tujuan.{' '}
                <Link
                  href='/inventaris'
                  target='_blank'
                  className='text-blue-600 font-medium hover:underline underline-offset-2 inline-flex items-center'>
                  Sebaiknya periksa daftar ketersediaan di Katalog Inventaris
                  terlebih dahulu.
                </Link>
              </p>
            </div>

            <div className='space-y-4 mt-4'>
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className='flex flex-col md:flex-row gap-3 md:items-center'>
                  <div className='w-full md:flex-1'>
                    <select
                      className='w-full h-10 md:h-14 md:text-lg rounded-md border border-slate-200 bg-transparent px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                      {...register(`items.${index}.namaAlat`)}
                      defaultValue=''>
                      <option value='' disabled>
                        {availableItems.length > 0
                          ? '-- Pilih Alat/Bahan --'
                          : '-- Lab belum dipilih/Kosong --'}
                      </option>
                      {availableItems.map((item, i) => (
                        <option key={i} value={item.jenis_alat}>
                          {item.jenis_alat} (Tersedia: {item.jumlah})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className='w-full grid grid-cols-[1fr_auto] md:flex md:w-auto gap-3'>
                    <Input
                      className='w-full md:w-24 md:text-lg md:h-14'
                      type='number'
                      placeholder='Qty'
                      {...register(`items.${index}.jumlah`)}
                    />
                    <Button
                      type='button'
                      variant='destructive'
                      size='icon'
                      className='md:h-14 md:w-14 shrink-0'
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
              className='w-full border-dashed border-2 md:text-lg md:h-14 mt-2'
              onClick={() => append({ namaAlat: '', jumlah: '' })}>
              <Plus className='size-4 mr-2 md:size-5 md:mr-3' /> Tambah Alat
            </Button>
          </div>

          <div className='pt-8 flex justify-end'>
            <Button
              type='submit'
              size='lg'
              disabled={isSubmitting}
              className='w-full md:w-auto bg-blue-600 hover:bg-blue-700 md:text-lg md:h-14 font-bold md:px-10 shadow-lg shadow-blue-600/30'>
              {isSubmitting ? 'Mengirim...' : 'Kirim Pengajuan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
