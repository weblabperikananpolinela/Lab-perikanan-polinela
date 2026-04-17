'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  CalendarDays,
  UploadCloud,
  Loader2,
  FileImage,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET =
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_JADWAL;

export default function KelolaJadwal({
  labId,
  userEmail,
}: {
  labId: number;
  userEmail: string;
}) {
  const [currentSchedule, setCurrentSchedule] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const supabase = createClient();

  const fetchJadwal = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('jadwal_lab')
      .select('*')
      .eq('lab_id', labId)
      .maybeSingle();

    setCurrentSchedule(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchJadwal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labId]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      Swal.fire(
        'Error',
        'Konfigurasi Cloudinary tidak ditemukan pada server.',
        'error',
      );
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      // Gunakan auto upload endpoint untuk support PDF / RAW / Image
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
        {
          method: 'POST',
          body: formData,
        },
      );

      const cloudData = await res.json();
      if (!res.ok)
        throw new Error(
          cloudData.error?.message || 'Gagal upload ke server Cloudinary',
        );

      const ext = selectedFile.name.split('.').pop() || 'unknown';

      const payload = {
        lab_id: labId,
        file_url: cloudData.secure_url,
        file_type: ext,
        uploaded_by: userEmail,
      };

      const { error } = await supabase
        .from('jadwal_lab')
        .upsert(payload, { onConflict: 'lab_id' });
      if (error) throw error;

      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Jadwal lab terbaru telah diunggah dan disimpan.',
        confirmButtonColor: '#10b981',
      });
      setSelectedFile(null);
      fetchJadwal();
    } catch (err: any) {
      Swal.fire('Gagal Unggah', err.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteJadwal = async () => {
    if (!currentSchedule || !currentSchedule.file_url) return;

    const result = await Swal.fire({
      title: 'Hapus Jadwal?',
      text: 'File ini beserta data jadwal akan dihapus secara permanen dari server.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
    });

    if (!result.isConfirmed) return;

    setIsDeleting(true);

    try {
      // 1. Hapus dari Cloudinary
      const res = await fetch('/api/delete-cloudinary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl: currentSchedule.file_url,
          fileType: currentSchedule.file_type || 'unknown',
        }),
      });

      const cloudData = await res.json();
      if (!res.ok && cloudData.error) {
         console.warn("Cloudinary Notice:", cloudData.error);
         // Tetap lanjutkan krn ada kemungkinan file sdh tak bersisa namun tercatat di DB.
      }
      
      // 2. Hapus referensi dari Supabase
      const { error } = await supabase
        .from('jadwal_lab')
        .delete()
        .eq('lab_id', labId);

      if (error) throw error;

      Swal.fire({
        icon: 'success',
        title: 'Berhasil Dihapus',
        text: 'File dan pengaturan jadwal telah dihapus.',
        confirmButtonColor: '#10b981',
      });
      
      setCurrentSchedule(null);
      fetchJadwal();
    } catch (error: any) {
      Swal.fire('Gagal Menghapus', error.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading)
    return (
      <div className='animate-pulse p-4 text-slate-500 font-medium'>
        Memuat data jadwal...
      </div>
    );

  return (
    <Card className='border-slate-200 border-t-4 border-t-blue-600 shadow-sm mt-6'>
      <CardHeader>
        <CardTitle className='text-xl flex items-center gap-2 text-slate-900'>
          <CalendarDays className='size-5 text-blue-600' /> Kelola Jadwal Lab
        </CardTitle>
        <CardDescription className='text-base text-slate-600'>
          Unggah file visual jadwal terbaru untuk laboratorium ini (seperti PDF,
          JPG, PNG). Pengaturan ini akan langsung tersinkronisasi ke menu publik
          "Jadwal Praktikum".
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Status Saat Ini */}
        <div className='bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-inner'>
          <p className='font-bold text-slate-800 mb-3 text-base'>
            Status Jadwal Saat Ini:
          </p>
          {currentSchedule && currentSchedule.file_url ? (
            <div className='flex flex-col sm:flex-row sm:items-center gap-4 justify-between bg-white p-3 rounded-lg border border-slate-200'>
              <span className='text-sm font-bold text-green-700 bg-green-100 px-4 py-2 rounded-lg border border-green-200 flex items-center gap-2'>
                <FileImage className='size-5' /> File Jadwal Tersedia
              </span>
              <div className='flex gap-2 w-full sm:w-auto'>
                <Button
                  variant='outline'
                  size='sm'
                  asChild
                  className='flex-1 sm:flex-none font-semibold text-blue-700 hover:bg-blue-50 border-blue-200 h-10'>
                  <a
                    href={currentSchedule.file_url}
                    target='_blank'
                    rel='noopener noreferrer'>
                    Lihat Berkas <ExternalLink className='size-4 ml-2' />
                  </a>
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleDeleteJadwal}
                  disabled={isDeleting}
                  title="Hapus Jadwal (Permanen)"
                  className='font-semibold text-red-600 hover:text-white hover:bg-red-600 border-red-200 h-10 px-3 w-12 sm:w-auto shrink-0'>
                  {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                </Button>
              </div>
            </div>
          ) : (
            <div className='flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-100'>
              <CalendarDays className='size-5' />
              <p className='text-sm font-semibold'>
                Jadwal belum tersedia / Kosong.
              </p>
            </div>
          )}
        </div>

        {/* Form Upload */}
        <form onSubmit={handleUpload} className='space-y-4 pt-2'>
          <div className='space-y-2'>
            <Label className='font-semibold text-slate-800 text-base'>
              Perbarui File Jadwal Baru
            </Label>
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center group relative transition-all duration-200 ${selectedFile ? 'border-blue-500 bg-blue-50 shadow-inner' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50 bg-white'}`}>
              <input
                type='file'
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className='absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10'
                accept='image/*,.pdf'
              />
              <div className='flex flex-col items-center justify-center space-y-3'>
                <UploadCloud
                  className={`size-10 ${selectedFile ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-500'} transition-colors`}
                />
                <div className='text-base'>
                  {selectedFile ? (
                    <span className='font-bold text-blue-700'>
                      {selectedFile.name}
                    </span>
                  ) : (
                    <span className='text-slate-500 font-medium'>
                      Klik kotak ini atau Drag & Drop file ke sini untuk
                      mengunggah
                    </span>
                  )}
                </div>
                {selectedFile && (
                  <p className='text-xs text-blue-600 font-semibold'>
                    {Number(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
              </div>
            </div>
          </div>
          <Button
            type='submit'
            disabled={!selectedFile || isUploading}
            className='w-full sm:w-auto bg-blue-600 hover:bg-blue-700 py-6 font-bold px-8 shadow-md'>
            {isUploading ? (
              <span className='flex items-center gap-2'>
                <Loader2 className='size-5 animate-spin' /> Mengunggah File...
              </span>
            ) : (
              'Simpan Jadwal ke Sistem'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
