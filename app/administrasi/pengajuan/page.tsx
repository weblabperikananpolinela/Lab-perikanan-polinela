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
  FlaskConical,
  CreditCard,
  UserCircle,
} from 'lucide-react';
import NotifButton from '@/app/_components/NotifButton';
import { getOrCreateDeviceId } from '@/lib/push-utils';
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
    email: z.string().optional().or(z.literal('')),
    kategori_pemohon: z.enum(['Mahasiswa Polinela', 'Dosen Polinela', 'Umum'], {
      required_error: 'Kategori wajib dipilih',
    }),
    npm_nip: z.string().regex(/^\d*$/, 'Hanya boleh berisi angka').optional(),
    programStudi: z.string().optional(),
    nik: z.string().regex(/^\d*$/, 'Hanya boleh berisi angka').optional(),
    judulPenelitian: z.string().min(1, 'Judul Kegiatan wajib diisi'),
    dosenPembimbing: z.string().optional(),
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
    if (data.kategori_pemohon === 'Umum') {
      if (!data.email || data.email.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Email wajib diisi untuk kategori Umum',
          path: ['email'],
        });
      } else {
        const isEmail = z.string().email().safeParse(data.email).success;
        if (!isEmail)
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Format email tidak valid',
            path: ['email'],
          });
      }
    } else {
      if (data.email && data.email.trim() !== '') {
        const isEmail = z.string().email().safeParse(data.email).success;
        if (!isEmail)
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Format email tidak valid',
            path: ['email'],
          });
      }
    }

    if (data.kategori_pemohon === 'Mahasiswa Polinela') {
      if (!data.npm_nip || data.npm_nip.trim() === '')
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'NPM wajib diisi',
          path: ['npm_nip'],
        });
      if (!data.programStudi || data.programStudi.trim() === '')
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Prodi wajib diisi',
          path: ['programStudi'],
        });
      if (!data.dosenPembimbing || data.dosenPembimbing.trim() === '')
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Dosen Pembimbing wajib diisi',
          path: ['dosenPembimbing'],
        });
    } else if (data.kategori_pemohon === 'Dosen Polinela') {
      if (!data.npm_nip || data.npm_nip.trim() === '')
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'NIP wajib diisi',
          path: ['npm_nip'],
        });
    } else if (data.kategori_pemohon === 'Umum') {
      if (!data.nik || data.nik.trim() === '')
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'NIK wajib diisi',
          path: ['nik'],
        });
    }
  });

type FormData = z.infer<typeof formSchema>;

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
  Polyfish: 16,
  'Lab Simulator': 17,
  'Lab Radar': 18,
};

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
    { nama: 'Polyfish', jenis: 'TEFA' },
  ],
  'Lab Perikanan Tangkap': [
    { nama: 'Lab Simulator', jenis: 'TEFA' },
    { nama: 'Lab Radar', jenis: 'TEFA' },
  ],
};

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

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka || 0);
};

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
    defaultValues: { items: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const kategoriPemohon = watch('kategori_pemohon');
  const labTargetValue = watch('labTarget');
  const judulPenelitianValue = watch('judulPenelitian');

  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [availableLayanan, setAvailableLayanan] = useState<any[]>([]);
  const [selectedLayanan, setSelectedLayanan] = useState<number[]>([]);
  const [totalBiaya, setTotalBiaya] = useState<number>(0);

  const isRestrictedUmum =
    kategoriPemohon === 'Umum' &&
    labTargetValue &&
    !freeUmumLabs.includes(labTargetValue);

  // LOGIKA BARU: Tentukan apakah user Wajib Bayar (Hanya muncul jika ada layanan uji yang dipilih)
  const requirePayment = selectedLayanan.length > 0;

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
        .select(
          'jenis_alat, jumlah_baik, spesifikasi, keterangan, kategori_inventaris!inner(lab_id)',
        )
        .eq('kategori_inventaris.lab_id', lab_id);

      if (!error && data) {
        const mapped = data
          .filter((item: any) => item.jumlah_baik > 0)
          .map((item: any) => ({
            jenis_alat: item.jenis_alat,
            jumlah: item.jumlah_baik ?? 0,
            spesifikasi: item.spesifikasi || item.keterangan || null,
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
      if (!error && data) setBankInfo(data);
      else setBankInfo(null);
      setIsFetchingBank(false);
    };
    fetchBankInfo();
  }, [labTargetValue]);

  useEffect(() => {
    if (!labTargetValue) {
      setAvailableLayanan([]);
      setSelectedLayanan([]);
      return;
    }
    const lab_id = labMap[labTargetValue as keyof typeof labMap];
    if (!lab_id) return;

    const fetchLayanan = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('layanan_lab')
        .select('*')
        .eq('lab_id', lab_id);
      if (!error && data) setAvailableLayanan(data);
      else setAvailableLayanan([]);
      setSelectedLayanan([]);
    };
    fetchLayanan();
  }, [labTargetValue]);

  useEffect(() => {
    let total = 0;
    selectedLayanan.forEach((id) => {
      const layanan = availableLayanan.find((s) => s.id === id);
      if (layanan) {
        if (kategoriPemohon === 'Umum') total += layanan.harga_eksternal || 0;
        else total += layanan.harga_internal || 0;
      }
    });
    setTotalBiaya(total);
  }, [selectedLayanan, kategoriPemohon, availableLayanan]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // FIX LOGIKA PEMBAYARAN: Wajib file jika requirePayment = true
      if (requirePayment && !paymentFile) {
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
      if (requirePayment && paymentFile) {
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

        if (!res.ok)
          throw new Error(
            cloudData.error?.message || 'Gagal upload bukti pembayaran',
          );
        finalPaymentUrl = cloudData.secure_url;
      }

      const supabase = createClient();
      const resolvedLabId = labMap[data.labTarget] || 1;

      const { data: existingSchedules, error: existingError } = await supabase
        .from('peminjaman')
        .select('jam_mulai, jam_selesai, nama_lengkap')
        .eq('lab_id', resolvedLabId)
        .eq('tanggal', data.tanggal)
        .eq('status', 'Disetujui');

      if (existingError)
        throw new Error('Gagal memeriksa jadwal: ' + existingError.message);

      let conflictFound = null;
      if (existingSchedules) {
        for (const schedule of existingSchedules) {
          if (
            data.jam_mulai < schedule.jam_selesai &&
            data.jam_selesai > schedule.jam_mulai
          ) {
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

      const currentDeviceId = getOrCreateDeviceId();

      const peminjamanData = {
        kategori_pemohon: data.kategori_pemohon,
        nama_lengkap: data.nama,
        email_pemohon: data.email || null,
        device_id: currentDeviceId || null,
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
        total_biaya: totalBiaya,
        detail_layanan:
          selectedLayanan.length > 0
            ? selectedLayanan
                .map((id) => availableLayanan.find((s) => s.id === id))
                .filter(Boolean)
            : null,
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
        const { data: adminData } = await supabase
          .from('whitelist_admin')
          .select('email')
          .eq('lab_id', resolvedLabId)
          .single();
        const targetEmailAdmin =
          adminData?.email || 'admin_pusat@polinela.ac.id';

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
              is_berbayar: requirePayment,
            },
          }),
        });

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
                is_berbayar: requirePayment,
              },
            }),
          });
        }
      } catch (emailErr) {
        console.error('Gagal mengirim email:', emailErr);
      }

      try {
        await fetch('/api/send-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetRole: 'admin',
            targetLabId: resolvedLabId,
            title: 'Pengajuan Baru!',
            message: `Ada pengajuan lab baru dari ${data.nama} yang menunggu persetujuan Anda.`,
            url: `/admin/dashboard?lab_id=${resolvedLabId}`,
          }),
        });
      } catch (pushErr) {
        console.error('Gagal mengirim push notification:', pushErr);
      }

      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Pengajuan Anda berhasil dikirim!',
        confirmButtonColor: '#10b981',
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
        confirmButtonColor: '#ef4444',
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
          <h2 className='text-2xl font-bold text-slate-800 mb-2'>
            Pengajuan Terkirim!
          </h2>
          <p className='text-slate-600 mb-8 leading-relaxed'>
            Terima kasih, pengajuan Anda sedang diproses. <br />
            <br />
            <strong>Aktifkan Notifikasi</strong> agar kami bisa memberitahu Anda
            secara real-time saat pengajuan ini disetujui!
          </p>
          <div className='flex justify-center mb-6'>
            <NotifButton role='pemohon' userEmail={submittedEmail} />
          </div>
          <Button
            onClick={() => router.push('/')}
            variant='ghost'
            className='text-slate-500 hover:text-slate-700 w-full'>
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='relative min-h-screen bg-slate-100 pb-20'>
      {/* Header Background */}
      <div className='absolute top-0 left-0 w-full h-[40vh] bg-gradient-to-br from-cyan-600 to-blue-900 z-0' />

      <div className='relative z-10 pt-20 px-4 md:px-8 max-w-5xl mx-auto'>
        {/* Tombol Kembali */}
        <Link
          href='/'
          className='inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-6'>
          <ArrowLeft size={20} />
          <span className='font-medium'>Kembali</span>
        </Link>

        <div className='mb-8 text-white'>
          <h1 className='text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-sm'>
            Formulir Pengajuan Lab
          </h1>
          <p className='mt-2 text-blue-100 font-medium md:text-lg'>
            Isi detail kegiatan dan kebutuhan alat/bahan Anda dengan lengkap.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className='bg-white shadow-2xl rounded-2xl md:rounded-3xl border border-slate-200 overflow-hidden'>
          {/* SEKSI 1: IDENTITAS PEMOHON */}
          <div className='p-6 md:p-10 border-b border-slate-100'>
            <div className='flex items-center gap-3 mb-6 pb-2 border-b-2 border-blue-50'>
              <UserCircle className='text-blue-600 size-6' />
              <h2 className='text-xl font-bold text-slate-800'>
                Informasi Pemohon
              </h2>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label className='md:text-base font-semibold text-slate-700'>
                  Kategori Pemohon
                </Label>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='outline'
                      className='w-full justify-between font-normal text-slate-700 md:h-12 bg-slate-50'>
                      {kategoriPemohon || '-- Pilih Kategori --'}
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
                          className='py-2.5 cursor-pointer'
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

              <div className='space-y-2'>
                <Label className='md:text-base font-semibold text-slate-700'>
                  Nama Lengkap
                </Label>
                <Input
                  className='md:h-12 bg-slate-50'
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
                <Label className='md:text-base font-semibold text-slate-700 flex items-center'>
                  Alamat Email{' '}
                  {kategoriPemohon !== 'Umum' && (
                    <span className='text-sm font-normal text-slate-400 ml-1.5'>
                      (Opsional)
                    </span>
                  )}
                </Label>
                <Input
                  className='md:h-12 bg-slate-50'
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

              {(kategoriPemohon === 'Mahasiswa Polinela' ||
                kategoriPemohon === 'Dosen Polinela') && (
                <div className='space-y-2 animate-in fade-in'>
                  <Label className='md:text-base font-semibold text-slate-700'>
                    {kategoriPemohon === 'Mahasiswa Polinela' ? 'NPM' : 'NIP'}
                  </Label>
                  <Input
                    className='md:h-12 bg-slate-50'
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
                <div className='space-y-2 animate-in fade-in'>
                  <Label className='md:text-base font-semibold text-slate-700'>
                    Program Studi
                  </Label>
                  <Input
                    className='md:h-12 bg-slate-50'
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
                <div className='space-y-2 animate-in fade-in'>
                  <Label className='md:text-base font-semibold text-slate-700'>
                    NIK KTP
                  </Label>
                  <Input
                    className='md:h-12 bg-slate-50'
                    placeholder='Masukkan 16 digit NIK'
                    {...register('nik')}
                  />
                  {errors.nik && (
                    <span className='text-sm text-red-500'>
                      {errors.nik.message}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SEKSI 2: DETAIL KEGIATAN & WAKTU */}
          <div className='p-6 md:p-10 border-b border-slate-100 bg-slate-50/50'>
            <div className='flex items-center gap-3 mb-6 pb-2 border-b-2 border-blue-50'>
              <FileText className='text-blue-600 size-6' />
              <h2 className='text-xl font-bold text-slate-800'>
                Detail Kegiatan
              </h2>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2 col-span-1 md:col-span-2'>
                <Label className='md:text-base font-semibold text-slate-700'>
                  Lab Target
                </Label>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='outline'
                      className='w-full justify-between font-normal text-slate-700 md:h-12 bg-white'>
                      {labTargetValue || 'Pilih laboratorium...'}
                      <ChevronDown className='h-4 w-4 opacity-50' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className='w-[--radix-dropdown-menu-trigger-width] max-h-80 overflow-y-auto'
                    align='start'>
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className='font-bold text-blue-700 bg-slate-50'>
                        Lab Perikanan
                      </DropdownMenuLabel>
                      {labKategoriData['Lab Perikanan'].map((lab) => (
                        <DropdownMenuItem
                          key={lab.nama}
                          className='py-2.5 cursor-pointer ml-1'
                          onClick={() =>
                            setValue('labTarget', lab.nama, {
                              shouldValidate: true,
                            })
                          }>
                          <div className='flex items-center justify-between w-full'>
                            <span>{lab.nama}</span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ml-2 shrink-0 ${lab.jenis === 'TEFA' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                              {lab.jenis}
                            </span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className='font-bold text-blue-700 bg-slate-50 mt-2 border-t pt-2'>
                        Lab Perikanan Tangkap
                      </DropdownMenuLabel>
                      {labKategoriData['Lab Perikanan Tangkap'].map((lab) => (
                        <DropdownMenuItem
                          key={lab.nama}
                          className='py-2.5 cursor-pointer ml-1'
                          onClick={() =>
                            setValue('labTarget', lab.nama, {
                              shouldValidate: true,
                            })
                          }>
                          <div className='flex items-center justify-between w-full'>
                            <span>{lab.nama}</span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ml-2 shrink-0 ${lab.jenis === 'TEFA' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
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

              <div className='space-y-2 col-span-1 md:col-span-2'>
                <Label className='md:text-base font-semibold text-slate-700'>
                  Kegiatan / Tujuan
                </Label>
                {isRestrictedUmum ? (
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant='outline'
                        className='w-full justify-between font-normal text-slate-700 md:h-12 bg-white'>
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
                          className='py-2.5 cursor-pointer'
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
                    className='md:h-12 bg-white'
                    placeholder='Tuliskan detail kegiatan...'
                    {...register('judulPenelitian')}
                  />
                )}
                {errors.judulPenelitian && (
                  <span className='text-sm text-red-500'>
                    {errors.judulPenelitian.message}
                  </span>
                )}
              </div>

              {kategoriPemohon !== 'Umum' && (
                <div className='space-y-2 col-span-1 md:col-span-2'>
                  <Label className='md:text-base font-semibold text-slate-700'>
                    Dosen Pembimbing / PIC
                  </Label>
                  <Input
                    className='md:h-12 bg-white'
                    placeholder='Nama dosen'
                    {...register('dosenPembimbing')}
                  />
                  {errors.dosenPembimbing && (
                    <span className='text-sm text-red-500'>
                      {errors.dosenPembimbing.message}
                    </span>
                  )}
                </div>
              )}

              <div className='col-span-1 md:col-span-2 mt-2 bg-blue-50/50 border border-blue-100 rounded-xl p-5'>
                <div className='flex items-start gap-3 mb-5'>
                  <Info className='size-5 text-blue-600 shrink-0 mt-0.5' />
                  <p className='text-sm text-blue-800 font-medium leading-relaxed'>
                    Pastikan Anda telah{' '}
                    <Link
                      href='/jadwal'
                      target='_blank'
                      className='underline font-bold hover:text-blue-900'>
                      melihat jadwal ketersediaan lab
                    </Link>{' '}
                    terlebih dahulu untuk menghindari bentrok jadwal.
                  </p>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div className='space-y-2'>
                    <Label className='text-slate-700 font-semibold'>
                      Tanggal
                    </Label>
                    <Input
                      className='md:h-12 bg-white'
                      type='date'
                      {...register('tanggal')}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-slate-700 font-semibold'>
                      Jam Mulai
                    </Label>
                    <Input
                      className='md:h-12 bg-white'
                      type='time'
                      {...register('jam_mulai')}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-slate-700 font-semibold'>
                      Jam Selesai
                    </Label>
                    <Input
                      className='md:h-12 bg-white'
                      type='time'
                      {...register('jam_selesai')}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SEKSI 3: KEBUTUHAN ALAT & LAYANAN */}
          <div className='p-6 md:p-10'>
            <div className='flex items-center gap-3 mb-6 pb-2 border-b-2 border-blue-50'>
              <FlaskConical className='text-blue-600 size-6' />
              <h2 className='text-xl font-bold text-slate-800'>
                Kebutuhan Logistik & Uji Lab
              </h2>
            </div>

            <div className='space-y-4'>
              <Label className='md:text-base font-semibold text-slate-700'>
                Daftar Alat & Bahan
              </Label>
              {fields.length === 0 && (
                <div className='p-8 border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-xl text-center transition-colors hover:bg-slate-50'>
                  <p className='text-slate-600 font-medium md:text-lg'>
                    Anda hanya meminjam ruangan.
                  </p>
                  <p className='text-sm text-slate-400 mt-1'>
                    Klik tombol di bawah jika Anda membutuhkan perlengkapan lab.
                  </p>
                </div>
              )}
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className='flex flex-col md:flex-row gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100'>
                  <div className='w-full md:flex-1'>
                    <select
                      className='w-full h-12 rounded-lg border border-slate-300 bg-white px-3 text-slate-700 focus:ring-2 focus:ring-blue-500'
                      {...register(`items.${index}.namaAlat`)}
                      defaultValue=''>
                      <option value='' disabled>
                        {availableItems.length > 0
                          ? '-- Pilih Alat/Bahan --'
                          : '-- Lab belum dipilih/Kosong --'}
                      </option>
                      {availableItems.map((item, i) => (
                        <option key={i} value={item.jenis_alat}>
                          {item.jenis_alat}{' '}
                          {item.spesifikasi ? `— ${item.spesifikasi}` : ''}{' '}
                          (Sisa: {item.jumlah})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className='w-full flex md:w-auto gap-3'>
                    <Input
                      className='w-full md:w-24 h-12 bg-white'
                      type='number'
                      placeholder='Qty'
                      {...register(`items.${index}.jumlah`)}
                    />
                    <Button
                      type='button'
                      variant='destructive'
                      className='h-12 w-12 shrink-0'
                      onClick={() => remove(index)}>
                      <Trash className='size-5' />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type='button'
                variant='outline'
                className='w-full border-dashed border-2 h-12 mt-2 text-blue-600 border-blue-200 hover:bg-blue-50'
                onClick={() => append({ namaAlat: '', jumlah: '' })}>
                <Plus className='size-5 mr-2' /> Tambah Alat
              </Button>
            </div>

            {/* SEKSI LAYANAN UJI LAB */}
            <div className='mt-10 pt-6 border-t border-slate-100'>
              <Label className='md:text-base font-semibold text-slate-700'>
                Layanan Uji Lab (Opsional)
              </Label>
              <div className='mt-4'>
                {availableLayanan.length === 0 ? (
                  <p className='text-sm text-slate-500 italic bg-slate-50 p-4 rounded-xl text-center border border-slate-100'>
                    Tidak ada layanan uji khusus terdaftar untuk lab ini.
                  </p>
                ) : (
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {availableLayanan.map((layanan) => {
                      const price =
                        kategoriPemohon === 'Umum'
                          ? layanan.harga_eksternal
                          : layanan.harga_internal;
                      const isSelected = selectedLayanan.includes(layanan.id);
                      return (
                        <label
                          key={layanan.id}
                          className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all duration-200 shadow-sm ${isSelected ? 'bg-blue-50 border-blue-400 shadow-blue-100' : 'bg-white hover:bg-slate-50 hover:border-slate-300'}`}>
                          <input
                            type='checkbox'
                            className='mt-1 size-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500'
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked)
                                setSelectedLayanan([
                                  ...selectedLayanan,
                                  layanan.id,
                                ]);
                              else
                                setSelectedLayanan(
                                  selectedLayanan.filter(
                                    (id) => id !== layanan.id,
                                  ),
                                );
                            }}
                          />
                          <div className='flex flex-col'>
                            <span className='font-bold text-slate-800 text-base leading-tight'>
                              {layanan.nama_layanan}
                            </span>
                            <span className='text-sm text-blue-700 font-bold mt-1.5 bg-blue-100/50 w-fit px-2 py-0.5 rounded-md'>
                              {formatRupiah(price)}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SEKSI 4: PEMBAYARAN (MUNCUL JIKA UMUM ATAU ADA TAGIHAN) */}
          {requirePayment && (
            <div className='p-6 md:p-10 bg-slate-50/50 border-t border-slate-100'>
              <div className='flex items-center gap-3 mb-6 pb-2 border-b-2 border-blue-50'>
                <CreditCard className='text-blue-600 size-6' />
                <h2 className='text-xl font-bold text-slate-800'>
                  Pembayaran Administrasi
                </h2>
              </div>

              {totalBiaya > 0 && (
                <div className='mb-8 bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-lg shadow-blue-900/20 text-white'>
                  <div className='flex flex-col md:flex-row justify-between items-start md:items-center'>
                    <div>
                      <h3 className='text-lg font-bold text-blue-50'>
                        Total Tagihan
                      </h3>
                      <p className='text-sm text-blue-200 mt-1'>
                        Akumulasi biaya layanan/uji lab yang Anda pilih.
                      </p>
                    </div>
                    <div className='mt-4 md:mt-0 text-3xl md:text-4xl font-black drop-shadow-md'>
                      {formatRupiah(totalBiaya)}
                    </div>
                  </div>
                </div>
              )}

              <div className='bg-white p-6 md:p-8 border border-slate-200 rounded-2xl shadow-sm space-y-6'>
                {isFetchingBank ? (
                  <div className='flex justify-center p-6'>
                    <Loader2 className='size-6 animate-spin text-blue-500' />
                  </div>
                ) : bankInfo ? (
                  <div>
                    <Label className='font-bold text-slate-700 text-base mb-3 block'>
                      Tujuan Transfer Bank
                    </Label>
                    <div className='bg-slate-50 p-5 rounded-xl border border-slate-200 font-mono text-xl md:text-2xl font-bold text-slate-800 tracking-wider flex flex-col md:flex-row md:items-center justify-between gap-4'>
                      <div>
                        <span className='text-blue-600 mr-3'>
                          {bankInfo.nama_bank}
                        </span>
                        {bankInfo.nomor_rekening}
                        <div className='text-sm font-normal text-slate-500 font-sans tracking-normal mt-2'>
                          a.n. {bankInfo.atas_nama}
                        </div>
                      </div>
                    </div>
                    <p className='text-sm text-slate-500 mt-4'>
                      Silakan transfer sejumlah nominal tagihan atau sesuai
                      ketentuan SOP ke rekening di atas.{' '}
                      <Link
                        href='/#sop-prosedur'
                        target='_blank'
                        className='text-blue-600 font-bold hover:underline'>
                        Lihat Panduan & SOP
                      </Link>
                      .
                    </p>
                  </div>
                ) : (
                  <p className='text-amber-700 bg-amber-50 p-4 rounded-xl text-sm font-medium border border-amber-200'>
                    Informasi rekening untuk lab ini belum diatur. Silakan
                    berkoordinasi dengan admin.
                  </p>
                )}

                <div className='pt-6 border-t border-slate-100'>
                  <Label className='font-bold text-slate-700 text-base mb-3 block'>
                    Unggah Bukti Pembayaran{' '}
                    <span className='text-red-500'>*</span>
                  </Label>
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${paymentFile ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:bg-slate-50 bg-white'}`}>
                    <div className='relative'>
                      <input
                        type='file'
                        onChange={(e) =>
                          setPaymentFile(e.target.files?.[0] || null)
                        }
                        className='absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10'
                        accept='image/*,.pdf'
                      />
                      {paymentFile ? (
                        <div className='flex flex-col items-center animate-in zoom-in-95'>
                          <div className='size-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3'>
                            <CheckCircle className='size-6 text-emerald-600' />
                          </div>
                          <p className='text-sm font-bold text-emerald-800 truncate w-full px-2 max-w-[250px]'>
                            {paymentFile.name}
                          </p>
                          <p className='text-xs text-emerald-600 mt-1'>
                            File siap diunggah
                          </p>
                        </div>
                      ) : (
                        <div className='flex flex-col items-center'>
                          <div className='size-12 bg-blue-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors'>
                            <UploadCloud className='size-6 text-blue-600' />
                          </div>
                          <p className='text-sm text-slate-600 font-semibold'>
                            Klik atau seret struk transfer ke sini
                          </p>
                          <p className='text-xs text-slate-400 mt-1'>
                            Format yang didukung: JPG, PNG, PDF
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TOMBOL SUBMIT FINAL */}
          <div className='p-6 md:p-10 pt-4 bg-white flex justify-end border-t border-slate-100'>
            <Button
              type='submit'
              size='lg'
              disabled={isSubmitting || isUploadingPayment}
              className='w-full md:w-auto h-14 bg-slate-900 hover:bg-blue-700 text-white md:text-lg font-bold md:px-12 rounded-xl shadow-xl shadow-slate-900/20 transition-all hover:-translate-y-1'>
              {isSubmitting || isUploadingPayment ? (
                <span className='flex items-center gap-2'>
                  <Loader2 className='size-5 animate-spin' /> Memproses...
                </span>
              ) : (
                'Kirim Pengajuan Sekarang'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
