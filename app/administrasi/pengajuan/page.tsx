'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Trash,
  Plus,
  ChevronDown,
  ArrowLeft,
  Info,
  UploadCloud,
  FileText,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import NotifButton from '@/app/_components/NotifButton';
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
    // FIX: Email dibuat opsional di tingkat dasar
    email: z.string().optional().or(z.literal('')),
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
          namaAlat: z.string().min(1, 'Nama alat wajib dipilih'),
          jumlah: z.string().min(1, 'Jumlah wajib diisi'),
        }),
      )
      .optional()
      .default([]),
  })
  .superRefine((data, ctx) => {
    // Validasi Dinamis untuk Email
    if (data.kategori_pemohon === 'Umum') {
      if (!data.email || data.email.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Email wajib diisi untuk kategori Umum',
          path: ['email'],
        });
      } else {
        const isEmail = z.string().email().safeParse(data.email).success;
        if (!isEmail) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Format email tidak valid',
            path: ['email'],
          });
        }
      }
    } else {
      // Jika Dosen/Mahasiswa mengisi email (tidak kosong), pastikan formatnya benar
      if (data.email && data.email.trim() !== '') {
        const isEmail = z.string().email().safeParse(data.email).success;
        if (!isEmail) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Format email tidak valid',
            path: ['email'],
          });
        }
      }
    }

    // Validasi Identitas
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

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET =
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_PAYMENT;

export default function PengajuanForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [isUploadingPayment, setIsUploadingPayment] = useState(false);
  const [bankInfo, setBankInfo] = useState<any>(null);
  const [isFetchingBank, setIsFetchingBank] = useState(false);
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
      items: [],
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

  useEffect(() => {
    if (!labTargetValue) {
      setBankInfo(null);
      return;
    }

    const lab_id = labMap[labTargetValue as keyof typeof labMap];
    if (!lab_id) return;

    const fetchBankInfo = async () => {
      setIsFetchingBank(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('rekening_admin')
        .select('*')
        .eq('lab_id', lab_id)
        .maybeSingle();

      if (!error && data) {
        setBankInfo(data);
      } else {
        setBankInfo(null);
      }
      setIsFetchingBank(false);
    };

    fetchBankInfo();
  }, [labTargetValue]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      if (data.kategori_pemohon === 'Umum' && !paymentFile) {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Bukti pembayaran wajib diunggah!',
          confirmButtonColor: '#ef4444',
        });
        setIsSubmitting(false);
        return;
      }

      let finalPaymentUrl = null;
      if (data.kategori_pemohon === 'Umum' && paymentFile) {
        if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
          Swal.fire({
            text: 'Error Konfigurasi Cloudinary.',
            icon: 'error',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
          });
          setIsSubmitting(false);
          return;
        }

        setIsUploadingPayment(true);
        const formData = new FormData();
        formData.append('file', paymentFile);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;
        const res = await fetch(cloudinaryUrl, {
          method: 'POST',
          body: formData,
        });
        const cloudData = await res.json();
        setIsUploadingPayment(false);

        if (!res.ok) {
          throw new Error(
            cloudData.error?.message || 'Gagal upload bukti pembayaran',
          );
        }

        finalPaymentUrl = cloudData.secure_url;
      }

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
        email_pemohon: data.email || null, // FIX: simpan sebagai null jika kosong
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
        bukti_pembayaran: finalPaymentUrl,
      };

      const { data: insertedPeminjaman, error: errorPeminjaman } =
        await supabase
          .from('peminjaman')
          .insert(peminjamanData)
          .select('id')
          .single();

      if (errorPeminjaman) throw new Error(errorPeminjaman.message);

      if (data.items && data.items.length > 0) {
        const itemData = data.items.map((item) => ({
          peminjaman_id: insertedPeminjaman.id,
          nama_alat_bahan: item.namaAlat,
          jumlah: parseInt(item.jumlah, 10),
        }));

        const { error: errorItem } = await supabase
          .from('peminjaman_item')
          .insert(itemData);

        if (errorItem) throw new Error(errorItem.message);
      }

      // --- SEND EMAILS ---
      try {
        // Ambil email pengelola lab berdasarkan resolvedLabId di tabel whitelist_admin
        const { data: adminData } = await supabase
          .from('whitelist_admin')
          .select('email')
          .eq('lab_id', resolvedLabId)
          .single();

        const targetEmailAdmin =
          adminData?.email || 'admin_pusat@polinela.ac.id';

        // Email ke Admin (Selalu terkirim)
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
              kategori_pemohon: data.kategori_pemohon,
              is_berbayar: data.kategori_pemohon === 'Umum',
            },
          }),
        });

        // FIX: Email ke Pemohon (Hanya jalan jika user mengisi email)
        if (data.email && data.email.trim() !== '') {
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'USER_CONFIRMATION',
              to: data.email,
              data: {
                judul_kegiatan: data.judulPenelitian,
                nama_pengaju: data.nama,
                kategori_pemohon: data.kategori_pemohon,
                is_berbayar: data.kategori_pemohon === 'Umum',
              },
            }),
          });
        }
      } catch (emailErr) {
        console.error('Gagal mengirim email:', emailErr);
      }

      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Pengajuan Anda berhasil dikirim!',
        confirmButtonColor: '#10b981', // Warna hijau
      }).then(() => {
        setSubmittedEmail(data.email || '');
        setIsSuccess(true);
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

  if (isSuccess) {
    return (
      <div className='min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center'>
         <div className='bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-100 animate-in zoom-in-95 duration-300'>
            <div className='w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6'>
               <CheckCircle size={32} />
            </div>
            <h2 className='text-2xl font-bold text-slate-800 mb-2'>Pengajuan Terkirim!</h2>
            <p className='text-slate-600 mb-8 leading-relaxed'>
              Terima kasih, pengajuan Anda sedang diproses. <br/><br/>
              <strong>Aktifkan Notifikasi</strong> agar kami bisa memberitahu Anda secara real-time saat pengajuan ini disetujui!
            </p>
            <div className='flex justify-center mb-6'>
               <NotifButton role="pemohon" userEmail={submittedEmail} />
            </div>
            <Button onClick={() => router.push('/')} variant='ghost' className='text-slate-500 hover:text-slate-700 w-full'>
               Kembali ke Beranda
            </Button>
         </div>
      </div>
    );
  }

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
            <div className='space-y-1'>
              <Label className='md:text-base font-semibold flex items-center'>
                Email address
                {/* Menampilkan tag opsional jika bukan kategori UMUM */}
                {kategoriPemohon !== 'Umum' && (
                  <span className='text-sm font-normal text-slate-400 ml-1.5'>
                    (Opsional)
                  </span>
                )}
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
                  {/* FIX: Link diubah mengarah ke /jadwal */}
                  <Link
                    href='/jadwal'
                    target='_blank'
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
              {fields.length === 0 && (
                <div className='p-6 border-2 border-dashed border-slate-200 bg-slate-50 rounded-xl text-center'>
                  <p className='text-slate-500 font-medium md:text-lg'>
                    Anda hanya meminjam ruangan.
                  </p>
                  <p className='text-sm text-slate-400 mt-1'>
                    Klik tombol <b>Tambah Alat</b> di bawah jika Anda
                    membutuhkan perlengkapan lab.
                  </p>
                </div>
              )}
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
                      onClick={() => remove(index)}>
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

          {kategoriPemohon === 'Umum' && (
            <div className='mt-8 p-6 bg-blue-50/80 border border-blue-200 rounded-xl space-y-4'>
              <h3 className='text-lg font-bold text-blue-900'>
                Informasi Pembayaran
              </h3>
              
              {isFetchingBank ? (
                 <p className="text-blue-800 text-sm flex items-center gap-2"><Loader2 className="size-4 animate-spin"/> Mengambil data rekening...</p>
              ) : bankInfo ? (
                <>
                  <p className='text-sm text-blue-800'>
                    Kategori Umum dikenakan tarif penggunaan laboratorium. Silakan
                    transfer sesuai nominal tarif ke rekening di bawah ini:
                  </p>
                  <div className='bg-white p-4 rounded-lg border border-blue-200 inline-block font-mono text-lg font-bold text-slate-800 shadow-sm'>
                    {bankInfo.nama_bank} {bankInfo.nomor_rekening} <br className='md:hidden' />{' '}
                    <span className='text-sm font-normal text-slate-500 font-sans'>
                      a.n. {bankInfo.atas_nama}
                    </span>
                  </div>
                  <p className='text-sm text-blue-800'>
                    <Link
                      href='/#sop-prosedur'
                      target='_blank'
                      className='underline font-bold hover:text-blue-900 transition-colors'>
                      Periksa detail tarif dan SOP penggunaan di sini
                    </Link>
                  </p>
                </>
              ) : (
                <p className="text-amber-700 bg-amber-100 border border-amber-200 p-3 rounded-lg text-sm font-medium leading-relaxed">
                  Informasi rekening untuk {labTargetValue || 'lab ini'} belum diatur. Silakan hubungi admin bersangkutan.
                </p>
              )}

              <div className='pt-4'>
                <Label className='font-semibold text-blue-900 mb-2 block'>
                  Unggah Bukti Pembayaran{' '}
                  <span className='text-red-500'>*</span>
                </Label>
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center group relative transition-colors ${paymentFile ? 'border-blue-500 bg-blue-100/50' : 'border-blue-300 hover:bg-blue-100 bg-white'}`}>
                  <input
                    type='file'
                    onChange={(e) =>
                      setPaymentFile(e.target.files?.[0] || null)
                    }
                    className='absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10'
                    accept='image/*,.pdf'
                  />
                  {paymentFile ? (
                    <div className='flex flex-col items-center'>
                      <FileText className='size-8 text-blue-600 mb-2' />
                      <p className='text-sm font-bold text-blue-700 truncate w-full px-2 max-w-[250px] mx-auto'>
                        {paymentFile.name}
                      </p>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className='size-8 text-blue-400 mx-auto mb-2 group-hover:text-blue-500 transition-colors' />
                      <p className='text-sm text-blue-600 font-medium'>
                        Klik atau seret file ke sini (*.jpg, *.png, *.pdf)
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className='pt-8 flex justify-end'>
            <Button
              type='submit'
              size='lg'
              disabled={isSubmitting || isUploadingPayment}
              className='w-full md:w-auto bg-blue-600 hover:bg-blue-700 md:text-lg md:h-14 font-bold md:px-10 shadow-lg shadow-blue-600/30'>
              {isSubmitting || isUploadingPayment ? (
                <span className='flex items-center gap-2'>
                  <Loader2 className='size-5 animate-spin' />{' '}
                  {isUploadingPayment ? 'Mengunggah...' : 'Mengirim...'}
                </span>
              ) : (
                'Kirim Pengajuan'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
