'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
  UploadCloud,
  FileText,
  Trash2,
  Loader2,
  ExternalLink,
  Plus,
  FolderOpen,
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
} from '@/components/ui/dialog';

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export default function MateriTab({ adminProfile, supabase }: { adminProfile: any; supabase: any }) {
  const [adminCategories, setAdminCategories] = useState<any[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [fileTitle, setFileTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [categoryFiles, setCategoryFiles] = useState<any[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const fetchAdminCategories = async () => {
    const { data, error } = await supabase
      .from('kategori_materi')
      .select('*, materi_dosen(count)')
      .eq('created_by', adminProfile.email)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAdminCategories(data);
    }
  };

  useEffect(() => {
    fetchAdminCategories();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminProfile.email]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim() || !adminProfile.email) return;
    setIsCreatingCategory(true);

    let pin = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      pin = Math.floor(100000 + Math.random() * 900000).toString();
      const { data } = await supabase
        .from('kategori_materi')
        .select('id')
        .eq('pin_akses', pin);
      if (!data || data.length === 0) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      Swal.fire({ text: 'Sistem sibuk, gagal membuat PIN unik. Silakan coba lagi.', icon: 'error', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
      setIsCreatingCategory(false);
      return;
    }

    const { error } = await supabase.from('kategori_materi').insert({
      nama_kategori: newCategoryName,
      pin_akses: pin,
      created_by: adminProfile.email,
    });

    if (!error) {
      Swal.fire({ text: `Kategori berhasil dibuat! PIN: ${pin}`, icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 4000, timerProgressBar: true });
      setNewCategoryName('');
      fetchAdminCategories();
    } else {
      Swal.fire({ text: 'Gagal membuat mata kuliah.', icon: 'error', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
    }
    setIsCreatingCategory(false);
  };

  const openUploadModal = (category: any) => {
    setSelectedCategory(category);
    setIsUploadModalOpen(true);
    fetchCategoryFiles(category.id);
  };

  const fetchCategoryFiles = async (categoryId: number) => {
    setIsLoadingFiles(true);
    const { data, error } = await supabase
      .from('materi_dosen')
      .select('*')
      .eq('kategori_id', categoryId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCategoryFiles(data);
    }
    setIsLoadingFiles(false);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !adminProfile.email || !selectedCategory) return;

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      Swal.fire({ text: 'Error Konfigurasi Cloudinary.', icon: 'error', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`;
      const res = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: formData,
      });
      const cloudData = await res.json();

      if (!res.ok) throw new Error(cloudData.error?.message || 'Gagal upload ke Cloudinary');

      const fileUrl = cloudData.secure_url;
      const fileExt = selectedFile.name.split('.').pop()?.toUpperCase() || 'FILE';

      const { error: dbError } = await supabase.from('materi_dosen').insert({
        dosen_email: adminProfile.email,
        title: fileTitle,
        file_url: fileUrl,
        file_type: fileExt,
        kategori_id: selectedCategory.id,
      });

      if (dbError) throw dbError;

      setFileTitle('');
      setSelectedFile(null);
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      fetchCategoryFiles(selectedCategory.id);
      fetchAdminCategories();
      Swal.fire({ text: 'Materi berhasil diunggah', icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
    } catch (error: any) {
      Swal.fire({ text: `Terjadi kesalahan: ${error.message}`, icon: 'error', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
    } finally {
      setIsUploading(false);
    }
  };

  const deleteMateri = async (file: any) => {
    if (!confirm(`Yakin ingin menghapus dokumen "${file.title}"?`)) return;
    
    try {
      // 1. DELETE from Cloudinary
      await fetch('/api/delete-cloudinary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl: file.file_url, fileType: file.file_type }),
      });

      // 2. DELETE from Supabase
      const { error } = await supabase.from('materi_dosen').delete().eq('id', file.id);
      if (error) throw error;

      setCategoryFiles(categoryFiles.filter((item: any) => item.id !== file.id));
      if (selectedCategory?.id) fetchAdminCategories();
      
      Swal.fire({ text: 'Materi dihapus!', icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
    } catch (error: any) {
      Swal.fire({ text: 'Gagal menghapus materi.', icon: 'error', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
    }
  };

  const deleteKategori = async (id: number, nama: string) => {
    if (!confirm(`Yakin ingin HAPUS MATA KULIAH "${nama}"? Semua file di dalamnya akan terhapus juga!`)) return;
    
    try {
      // 1. Ambil file di dalam kategori
      const { data: files } = await supabase.from('materi_dosen').select('*').eq('kategori_id', id);
      
      // 2. Hapus file fisik di Cloudinary
      if (files && files.length > 0) {
         await Promise.all(
           files.map((file: any) => fetch('/api/delete-cloudinary', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ fileUrl: file.file_url, fileType: file.file_type }),
           }))
         );
      }

      // 3. Hapus kategori dari Supabase
      const { error } = await supabase.from('kategori_materi').delete().eq('id', id);
      if (error) throw error;

      setAdminCategories(adminCategories.filter((item: any) => item.id !== id));
      Swal.fire({ text: 'Kategori dihapus!', icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
    } catch (error: any) {
      Swal.fire({ text: 'Gagal menghapus kategori.', icon: 'error', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
    }
  };

  const copyToClipboard = (url: string, id: number) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
            <div className='lg:col-span-4'>
              <Card className='border-slate-200 shadow-xl shadow-slate-200/40 sticky top-28'>
                <CardHeader className='border-b border-slate-100 bg-slate-50/50 pb-5'>
                  <CardTitle className='flex items-center gap-2 text-xl font-extrabold text-slate-800'>
                    <Plus className='size-5 text-blue-600' />
                    Mata Kuliah Baru
                  </CardTitle>
                  <CardDescription>
                    Buat tempat penyimpanan baru dengan PIN akses otomatis.
                  </CardDescription>
                </CardHeader>
                <CardContent className='pt-6'>
                  <form onSubmit={handleCreateCategory} className='space-y-4'>
                    <div className='space-y-2'>
                      <label className='text-sm font-bold text-slate-700'>
                        Nama Mata Kuliah
                      </label>
                      <Input
                        placeholder='Contoh: Fisiologi Hewan Air...'
                        value={newCategoryName}
                        onChange={(e: any) => setNewCategoryName(e.target.value)}
                        required
                      />
                    </div>
                    <Button
                      type='submit'
                      disabled={isCreatingCategory}
                      className='w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11'>
                      {isCreatingCategory ? (
                        <Loader2 className='mr-2 size-5 animate-spin' />
                      ) : (
                        'Tambahkan Kelas'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className='lg:col-span-8'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                {adminCategories.length === 0 ? (
                  <div className='col-span-full p-12 bg-white rounded-xl border border-slate-200 shadow-sm text-center'>
                    <FolderOpen className='size-12 text-slate-300 mx-auto mb-4' />
                    <h3 className='font-bold text-slate-700 mb-1'>
                      Belum ada Kelas
                    </h3>
                    <p className='text-sm text-slate-500'>
                      Buat mata kuliah di panel samping untuk memulai menyimpan
                      file.
                    </p>
                  </div>
                ) : (
                  adminCategories.map((cat: any) => (
                    <Card
                      key={cat.id}
                      className='relative overflow-hidden group hover:border-blue-300 transition-colors'>
                      <CardHeader className='pb-3'>
                        <div className='flex justify-between items-start gap-4'>
                          <div>
                            <CardTitle
                              className='text-lg flex-1 mb-1 line-clamp-1'
                              title={cat.nama_kategori}>
                              {cat.nama_kategori}
                            </CardTitle>
                            <CardDescription className='text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md inline-block'>
                              {cat.materi_dosen[0]?.count || 0} File Terunggah
                            </CardDescription>
                          </div>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 -mt-2 -mr-2'
                            onClick={() =>
                              deleteKategori(cat.id, cat.nama_kategori)
                            }>
                            <Trash2 className='size-4' />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className='bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between mb-4'>
                          <div>
                            <p className='text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-0.5'>
                              PIN AKSES
                            </p>
                            <p className='text-2xl font-mono tracking-widest font-extrabold text-slate-800'>
                              {cat.pin_akses}
                            </p>
                          </div>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() =>
                              copyToClipboard(cat.pin_akses, cat.id)
                            }
                            className={`hover:bg-slate-200 ${copiedId === cat.id ? 'border-emerald-500 text-emerald-600' : ''}`}>
                            {copiedId === cat.id ? 'Tersalin' : 'Salin PIN'}
                          </Button>
                        </div>
                        <Button
                          className='w-full gap-2 bg-blue-600 hover:bg-blue-700'
                          onClick={() => openUploadModal(cat)}>
                          <FolderOpen className='size-4' /> Kelola File
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>

        {/* --- MODAL UPLOAD ADMIN --- */}
        <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
          <DialogContent className='max-w-[95vw] sm:max-w-[95vw] lg:max-w-4xl !w-full h-[95vh] sm:h-auto sm:max-h-[85vh] p-0 overflow-hidden sm:rounded-2xl'>
            <div className='flex flex-col md:flex-row h-full max-h-[95vh] sm:max-h-[85vh]'>
              <div className='w-full md:w-1/3 bg-slate-50 border-r border-slate-200 p-6 overflow-y-auto hidden-scrollbar flex-shrink-0'>
                <DialogHeader className='mb-6'>
                  <DialogTitle className='text-xl'>Unggah Baru</DialogTitle>
                  <p className='text-sm text-slate-500 font-medium'>
                    Untuk {selectedCategory?.nama_kategori}
                  </p>
                </DialogHeader>

                <form onSubmit={handleUpload} className='space-y-6'>
                  <div className='space-y-2'>
                    <label className='text-sm font-bold text-slate-700'>
                      Judul Materi
                    </label>
                    <Input
                      placeholder='Contoh: Modul...'
                      value={fileTitle}
                      onChange={(e: any) => setFileTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm font-bold text-slate-700'>
                      Pilih File
                    </label>
                    <div
                      className={`border-2 border-dashed rounded-xl p-6 text-center group relative ${selectedFile ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:bg-slate-100'}`}>
                      <input
                        id='file-upload'
                        type='file'
                        required
                        onChange={(e: any) =>
                          setSelectedFile(e.target.files?.[0] || null)
                        }
                        className='absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10'
                        accept='.pdf,.doc,.docx,.ppt,.pptx,.zip'
                      />
                      {selectedFile ? (
                        <div className='flex flex-col items-center'>
                          <FileText className='size-8 text-blue-600 mb-2' />
                          <p className='text-sm font-bold text-blue-700 truncate w-full px-2'>
                            {selectedFile.name}
                          </p>
                        </div>
                      ) : (
                        <>
                          <UploadCloud className='size-8 text-slate-400 mx-auto mb-2 group-hover:text-blue-500' />
                          <p className='text-sm text-slate-600 font-medium'>
                            Klik / seret file
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <Button
                    type='submit'
                    disabled={isUploading || !selectedFile}
                    className='w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6'>
                    {isUploading ? (
                      <Loader2 className='animate-spin size-5' />
                    ) : (
                      'Unggah File Sekarang'
                    )}
                  </Button>
                </form>
              </div>

              <div className='w-full md:w-2/3 p-6 bg-white overflow-y-auto hidden-scrollbar h-full max-h-[95vh] sm:max-h-[85vh]'>
                <h3 className='font-bold text-lg text-slate-800 mb-4 flex flex-col sm:flex-row sm:items-center gap-2'>
                  <span className='flex items-center gap-2'>
                    <FileText className='size-5 text-slate-500' /> Daftar Materi Terunggah
                  </span>
                  {selectedCategory?.nama_kategori && (
                    <>
                      <span className='hidden sm:inline text-slate-300'>•</span>
                      <span className='text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-sm w-fit border border-blue-100'>
                        {selectedCategory.nama_kategori}
                      </span>
                    </>
                  )}
                </h3>
                {isLoadingFiles ? (
                  <div className='py-12 flex justify-center'>
                    <Loader2 className='size-8 text-slate-300 animate-spin' />
                  </div>
                ) : categoryFiles.length === 0 ? (
                  <div className='py-12 text-center text-slate-500 border border-slate-100 bg-slate-50/50 rounded-xl'>
                    <FileText className='size-12 mx-auto text-slate-300 mb-3' />
                    <p className='font-medium'>Materi masih kosong</p>
                    <Button
                      className='mt-4 gap-2'
                      variant='outline'
                      onClick={() =>
                        document.getElementById('file-upload')?.click()
                      }>
                      Unggah Materi Pertama
                    </Button>
                  </div>
                ) : (
                  <div className='space-y-3'>
                    {categoryFiles.map((file: any) => (
                      <div
                        key={file.id}
                        className='p-4 border border-slate-200 rounded-xl flex items-center justify-between gap-4'>
                        <div className='min-w-0 flex-1'>
                          <p className='font-bold text-slate-800 truncate'>
                            {file.title}
                          </p>
                          <span className='px-2 py-0.5 mt-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md'>
                            {file.file_type}
                          </span>
                        </div>
                        <div className='flex gap-2 shrink-0'>
                          <Button
                            variant='outline'
                            size='icon'
                            asChild
                            className='h-8 w-8'
                            title='Buka File'>
                            <a
                              href={file.file_url}
                              target='_blank'
                              rel='noreferrer'>
                              <ExternalLink className='size-4' />
                            </a>
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() => deleteMateri(file)}
                            className='h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700'>
                            <Trash2 className='size-4' />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
    </>
  );
}
