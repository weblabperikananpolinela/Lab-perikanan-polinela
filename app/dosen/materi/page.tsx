'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowLeft,
  UploadCloud,
  FileText,
  Link as LinkIcon,
  QrCode,
  Trash2,
  CheckCircle2,
  FileUp,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// --- KONFIGURASI CLOUDINARY DARI .ENV ---
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET =
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export default function MateriDosenPage() {
  const [session, setSession] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  // States Form
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [fileTitle, setFileTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [copiedId, setCopiedId] = useState<number | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const initData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);

      // PERBAIKAN: Cek spesifik apakah user dan emailnya ada
      if (session?.user?.email) {
        fetchHistory(session.user.email);
      } else {
        setIsLoadingHistory(false);
      }
    };
    initData();
  }, [supabase]);

  // FUNGSI: Ambil data riwayat dari Supabase
  const fetchHistory = async (email: string) => {
    setIsLoadingHistory(true);
    const { data, error } = await supabase
      .from('materi_dosen')
      .select('*')
      .eq('dosen_email', email)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setHistory(data);
    }
    setIsLoadingHistory(false);
  };

  // FUNGSI: Upload ke Cloudinary -> Simpan ke Supabase
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !session?.user?.email) return;

    // Pastikan ENV sudah terbaca
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      alert('Error Konfigurasi: Variabel Cloudinary di .env belum diatur.');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      // PERBAIKAN: Gunakan endpoint khusus "raw" agar link file dokumen (PDF/DOCX) tidak rusak
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`;

      const res = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: formData,
      });

      const cloudData = await res.json();

      if (!res.ok)
        throw new Error(
          cloudData.error?.message || 'Gagal upload ke Cloudinary',
        );

      // Menggunakan secure_url dari respons Cloudinary
      const fileUrl = cloudData.secure_url;

      const fileExt =
        selectedFile.name.split('.').pop()?.toUpperCase() || 'FILE';

      // Simpan ke Supabase
      const { error: dbError } = await supabase.from('materi_dosen').insert({
        dosen_email: session.user.email,
        title: fileTitle,
        file_url: fileUrl,
        file_type: fileExt,
      });

      if (dbError) throw dbError;

      // Bersihkan form
      setFileTitle('');
      setSelectedFile(null);

      const fileInput = document.getElementById(
        'file-upload',
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      fetchHistory(session.user.email as string);
      alert('Materi berhasil diunggah dan disimpan!');
    } catch (error: any) {
      console.error(error);
      alert(`Terjadi kesalahan: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = (url: string, id: number) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteMateri = async (id: number) => {
    if (!confirm('Yakin ingin menghapus riwayat materi ini?')) return;

    const { error } = await supabase.from('materi_dosen').delete().eq('id', id);
    if (!error) {
      setHistory(history.filter((item) => item.id !== id));
    } else {
      alert('Gagal menghapus data.');
    }
  };

  return (
    <div className='min-h-screen bg-slate-50 pt-24 pb-20 px-4 md:px-8'>
      <div className='mx-auto max-w-6xl'>
        {/* Header Section */}
        <div className='mb-8'>
          <Link
            href='/'
            className='inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 font-medium transition-colors'>
            <ArrowLeft size={18} /> Kembali ke Beranda
          </Link>
          <div className='flex items-center gap-4'>
            <div className='p-3 bg-blue-600 text-white rounded-xl shadow-md'>
              <FileUp size={28} />
            </div>
            <div>
              <h1 className='text-2xl md:text-3xl font-extrabold text-slate-900'>
                Manajemen Materi
              </h1>
              <p className='text-slate-500'>
                Unggah dokumen perkuliahan dan bagikan tautan/QR ke mahasiswa.
              </p>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
          {/* KOLOM KIRI: Form Upload (Lebar: 4 Kolom) */}
          <div className='lg:col-span-4'>
            <Card className='border border-slate-200 shadow-xl shadow-slate-200/40 sticky top-28 overflow-hidden bg-white'>
              {/* PERBAIKAN UI: Header bersih tanpa background hitam */}
              <CardHeader className='border-b border-slate-100 bg-slate-50/50 pb-5'>
                <CardTitle className='flex items-center gap-2 text-xl font-extrabold text-slate-800'>
                  <UploadCloud className='size-5 text-blue-600' />
                  Unggah Baru
                </CardTitle>
                <CardDescription className='text-slate-500 font-medium mt-1'>
                  File akan tersimpan secara terpusat di Cloud.
                </CardDescription>
              </CardHeader>
              <CardContent className='pt-6'>
                <form onSubmit={handleUpload} className='space-y-6'>
                  <div className='space-y-2'>
                    <label className='text-sm font-bold text-slate-700'>
                      Nama/Judul Materi
                    </label>
                    <Input
                      placeholder='Contoh: Modul Pertemuan 1...'
                      value={fileTitle}
                      onChange={(e) => setFileTitle(e.target.value)}
                      required
                      className='bg-white shadow-sm focus-visible:ring-blue-600 border-slate-300'
                    />
                  </div>

                  <div className='space-y-2'>
                    <label className='text-sm font-bold text-slate-700'>
                      Pilih File (PDF, PPTX, DOCX)
                    </label>
                    <div
                      className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer group relative ${selectedFile ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:bg-slate-50'}`}>
                      <input
                        id='file-upload'
                        type='file'
                        required
                        onChange={(e) =>
                          setSelectedFile(e.target.files?.[0] || null)
                        }
                        className='absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10'
                        accept='.pdf,.doc,.docx,.ppt,.pptx,.zip'
                      />

                      {selectedFile ? (
                        <div className='flex flex-col items-center'>
                          <FileText className='size-8 text-blue-600 mb-2' />
                          <p className='text-sm font-bold text-blue-700 truncate w-full px-4'>
                            {selectedFile.name}
                          </p>
                          <p className='text-xs text-blue-500 mt-1'>
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      ) : (
                        <>
                          <UploadCloud className='size-8 text-slate-400 mx-auto mb-2 group-hover:text-blue-500 transition-colors' />
                          <p className='text-sm text-slate-600 font-medium'>
                            Klik atau seret file ke sini
                          </p>
                          <p className='text-xs text-slate-400 mt-1'>
                            Maksimal ukuran file: 10MB
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <Button
                    type='submit'
                    disabled={isUploading || !selectedFile}
                    className='w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 shadow-md transition-all active:scale-[0.98]'>
                    {isUploading ? (
                      <>
                        <Loader2 className='mr-2 size-5 animate-spin' />{' '}
                        Mengunggah...
                      </>
                    ) : (
                      'Unggah & Buat Tautan'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* KOLOM KANAN: Riwayat Materi (Lebar: 8 Kolom) */}
          <div className='lg:col-span-8'>
            <Card className='border border-slate-200 shadow-xl shadow-slate-200/40 bg-white'>
              <CardHeader className='border-b border-slate-100 bg-slate-50/50 rounded-t-xl pb-5'>
                <CardTitle className='text-xl font-extrabold text-slate-800'>
                  Riwayat Unggahan Anda
                </CardTitle>
                <CardDescription className='text-slate-500 font-medium mt-1'>
                  Materi yang ada di bawah ini dapat diakses publik melalui
                  tautan.
                </CardDescription>
              </CardHeader>
              <CardContent className='p-0'>
                {isLoadingHistory ? (
                  <div className='p-12 text-center text-slate-500 flex flex-col items-center'>
                    <Loader2 className='size-8 animate-spin text-blue-500 mb-4' />
                    <p>Memuat riwayat materi...</p>
                  </div>
                ) : history.length === 0 ? (
                  <div className='p-12 text-center text-slate-500'>
                    <FileUp className='size-12 text-slate-300 mx-auto mb-4' />
                    <p className='font-medium text-slate-600'>
                      Belum ada materi yang diunggah.
                    </p>
                    <p className='text-sm mt-1'>
                      Gunakan panel di sebelah kiri untuk mulai mengunggah file.
                    </p>
                  </div>
                ) : (
                  <div className='divide-y divide-slate-100'>
                    {history.map((item) => {
                      // Formatting Tanggal
                      const dateObj = new Date(item.created_at);
                      const formattedDate = dateObj.toLocaleDateString(
                        'id-ID',
                        { day: 'numeric', month: 'long', year: 'numeric' },
                      );

                      return (
                        <div
                          key={item.id}
                          className='p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group'>
                          {/* Info File */}
                          <div className='flex items-start gap-4 flex-1 min-w-0'>
                            <div className='size-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:border-blue-600 transition-colors'>
                              <FileText className='size-6 text-blue-600 group-hover:text-white transition-colors' />
                            </div>
                            <div className='min-w-0'>
                              <h4 className='font-bold text-slate-800 text-base md:text-lg truncate'>
                                {item.title}
                              </h4>
                              <div className='flex items-center gap-3 mt-1.5 text-xs font-semibold text-slate-500'>
                                <span className='bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-md'>
                                  {item.file_type}
                                </span>
                                <span>{formattedDate}</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className='flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap'>
                            {/* Tombol Buka File (Baru ditambahkan) */}
                            <Button
                              variant='outline'
                              size='sm'
                              asChild
                              className='gap-2 h-9 font-medium text-slate-700 border-slate-300 hover:bg-slate-100'>
                              <a
                                href={item.file_url}
                                target='_blank'
                                rel='noopener noreferrer'>
                                <ExternalLink className='size-4 text-slate-500' />
                                <span className='hidden xl:inline'>Buka</span>
                              </a>
                            </Button>

                            {/* Tombol Salin */}
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() =>
                                copyToClipboard(item.file_url, item.id)
                              }
                              className={`gap-2 h-9 font-medium transition-all ${copiedId === item.id ? 'bg-emerald-50 text-emerald-600 border-emerald-300' : 'text-slate-700 border-slate-300 hover:bg-slate-100'}`}>
                              {copiedId === item.id ? (
                                <CheckCircle2 className='size-4' />
                              ) : (
                                <LinkIcon className='size-4 text-slate-500' />
                              )}
                              <span className='hidden sm:inline'>
                                {copiedId === item.id ? 'Tersalin' : 'Salin'}
                              </span>
                            </Button>

                            {/* Tombol QR */}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant='outline'
                                  size='sm'
                                  className='gap-2 h-9 font-medium text-blue-700 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all'>
                                  <QrCode className='size-4 text-blue-500' />
                                  <span className='hidden sm:inline'>
                                    QR Code
                                  </span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent className='sm:max-w-md text-center p-8'>
                                <DialogHeader>
                                  <DialogTitle className='text-center text-xl font-bold'>
                                    QR Code Akses Materi
                                  </DialogTitle>
                                </DialogHeader>
                                <div className='flex flex-col items-center justify-center pt-4'>
                                  <div className='bg-white p-4 rounded-2xl shadow-md border border-slate-200 mb-6'>
                                    <img
                                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(item.file_url)}&margin=10`}
                                      alt='QR Code'
                                      className='w-52 h-52'
                                    />
                                  </div>
                                  <p className='text-base font-bold text-slate-800 mb-2'>
                                    {item.title}
                                  </p>
                                  <p className='text-sm text-slate-500 mb-8 px-4'>
                                    Minta mahasiswa untuk memindai kode QR ini
                                    menggunakan kamera ponsel mereka.
                                  </p>

                                  <Button
                                    onClick={() =>
                                      copyToClipboard(item.file_url, item.id)
                                    }
                                    className='w-full sm:w-auto bg-blue-600 hover:bg-blue-700 h-11 px-8 font-bold'>
                                    {copiedId === item.id
                                      ? 'Link Berhasil Disalin!'
                                      : 'Salin Tautan Cadangan'}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={() => deleteMateri(item.id)}
                              className='h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 border border-transparent transition-all'
                              title='Hapus File'>
                              <Trash2 className='size-4' />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
